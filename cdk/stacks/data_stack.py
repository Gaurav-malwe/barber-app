import json
import aws_cdk as cdk
from aws_cdk import (
    Duration,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
)
from constructs import Construct


class DataStack(cdk.Stack):
    """Network, Aurora Serverless v2, and shared secret."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.vpc = ec2.Vpc(
            self,
            "Vpc",
            max_azs=2,
            nat_gateways=0,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        endpoint_sg = ec2.SecurityGroup(
            self,
            "EndpointSecurityGroup",
            vpc=self.vpc,
            allow_all_outbound=True,
            description="Security group for VPC interface endpoints",
        )

        for service, endpoint_id in [
            (ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER, "SecretsManagerEndpoint"),
            (ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS, "CloudWatchLogsEndpoint"),
            (ec2.InterfaceVpcEndpointAwsService.STS, "StsEndpoint"),
        ]:
            self.vpc.add_interface_endpoint(
                endpoint_id,
                service=service,
                subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
                security_groups=[endpoint_sg],
                private_dns_enabled=True,
            )

        self.db_security_group = ec2.SecurityGroup(
            self,
            "DbSecurityGroup",
            vpc=self.vpc,
            allow_all_outbound=True,
            description="Allow database access from app Lambda",
        )

        db_credentials = rds.Credentials.from_generated_secret("barber")

        self.db_cluster = rds.DatabaseCluster(
            self,
            "AuroraCluster",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.of("16.8", "16")
            ),
            writer=rds.ClusterInstance.serverless_v2(
                "Writer",
                enable_performance_insights=False,
                publicly_accessible=False,
                auto_minor_version_upgrade=True,
            ),
            credentials=db_credentials,
            default_database_name="barber_app",
            serverless_v2_min_capacity=0.5,
            serverless_v2_max_capacity=2,
            removal_policy=RemovalPolicy.SNAPSHOT,
            vpc=self.vpc,
            security_groups=[self.db_security_group],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
        )

        db_secret = self.db_cluster.secret
        if db_secret is None:
            raise ValueError("Database credentials secret not attached to cluster")

        db_username = db_secret.secret_value_from_json("username")
        db_password = db_secret.secret_value_from_json("password")
        db_hostname = self.db_cluster.cluster_endpoint.hostname
        db_port = cdk.Token.as_string(self.db_cluster.cluster_endpoint.port)

        database_url = cdk.SecretValue.unsafe_plain_text(
            cdk.Fn.join(
                "",
                [
                    "postgresql+psycopg://",
                    cdk.Token.as_string(db_username),
                    ":",
                    cdk.Token.as_string(db_password),
                    "@",
                    db_hostname,
                    ":",
                    db_port,
                    "/barber_app",
                ],
            )
        )

        self.app_secret = secretsmanager.Secret(
            self,
            "AppConfigSecret",
            description="App config (DB + JWT + CORS) for Barber API",
            secret_object_value={
                "database_url": database_url,
                "db_host": cdk.SecretValue.unsafe_plain_text(db_hostname),
                "db_port": cdk.SecretValue.unsafe_plain_text(db_port),
                "db_username": db_username,
                "db_password": db_password,
                "db_name": cdk.SecretValue.unsafe_plain_text("barber_app"),
                "jwt_secret": cdk.SecretValue.unsafe_plain_text("change-me"),
                "cors_origins": cdk.SecretValue.unsafe_plain_text("https://example.com"),
                "environment": cdk.SecretValue.unsafe_plain_text("prod"),
            },
            removal_policy=RemovalPolicy.RETAIN,
        )

        cdk.CfnOutput(self, "VpcId", value=self.vpc.vpc_id)
        cdk.CfnOutput(self, "DbClusterArn", value=self.db_cluster.cluster_arn)
        cdk.CfnOutput(self, "DbSecretArn", value=db_secret.secret_arn)
        cdk.CfnOutput(self, "AppSecretArn", value=self.app_secret.secret_arn)
        cdk.CfnOutput(self, "DbHost", value=db_hostname)
        cdk.CfnOutput(self, "DbPort", value=db_port)
