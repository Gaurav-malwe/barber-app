from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    aws_apigatewayv2 as apigwv2,
    aws_apigatewayv2_integrations as apigwv2_integrations,
    aws_certificatemanager as acm,
    aws_ec2 as ec2,
    aws_lambda as _lambda,
    aws_lambda_python_alpha as lambda_alpha,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_secretsmanager as secretsmanager,
)
from constructs import Construct


class AppStack(cdk.Stack):
    """Lambda, HTTP API, custom domain, and Amplify placeholder."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        vpc: ec2.IVpc,
        db_cluster,
        db_security_group: ec2.SecurityGroup,
        app_secret: secretsmanager.ISecret,
        api_domain_name: Optional[str] = None,
        hosted_zone_domain: Optional[str] = None,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        lambda_sg = ec2.SecurityGroup(
            self,
            "LambdaSecurityGroup",
            vpc=vpc,
            allow_all_outbound=True,
            description="Lambda egress to DB, endpoints, and HTTPS",
        )

        db_cluster.connections.allow_default_port_from(
            lambda_sg, description="App Lambda to Aurora"
        )

        lambda_env = {
            "DATABASE_URL": app_secret.secret_value_from_json("database_url").unsafe_unwrap(),
            "JWT_SECRET": app_secret.secret_value_from_json("jwt_secret").unsafe_unwrap(),
            "CORS_ORIGINS": app_secret.secret_value_from_json("cors_origins").unsafe_unwrap(),
            "ENVIRONMENT": app_secret.secret_value_from_json("environment").unsafe_unwrap(),
        }

        api_function = lambda_alpha.PythonFunction(
            self,
            "ApiFunction",
            entry="../backend",
            index="app/main.py",
            handler="handler",
            runtime=_lambda.Runtime.PYTHON_3_12,
            memory_size=512,
            timeout=Duration.seconds(10),
            vpc=vpc,
            security_groups=[lambda_sg],
            environment=lambda_env,
        )

        app_secret.grant_read(api_function)
        if db_cluster.secret is not None:
            db_cluster.secret.grant_read(api_function)

        http_api = apigwv2.HttpApi(
            self,
            "HttpApi",
            default_integration=apigwv2_integrations.HttpLambdaIntegration(
                "LambdaIntegration", handler=api_function
            ),
        )

        if api_domain_name and hosted_zone_domain:
            hosted_zone = route53.HostedZone.from_lookup(
                self, "HostedZone", domain_name=hosted_zone_domain
            )

            certificate = acm.Certificate(
                self,
                "ApiCertificate",
                domain_name=api_domain_name,
                validation=acm.CertificateValidation.from_dns(hosted_zone),
            )

            domain = apigwv2.DomainName(
                self,
                "ApiCustomDomain",
                domain_name=api_domain_name,
                certificate=certificate,
            )

            apigwv2.ApiMapping(
                self,
                "DefaultApiMapping",
                api=http_api,
                domain_name=domain,
                stage=http_api.default_stage,
            )

            route53.ARecord(
                self,
                "ApiAliasRecord",
                zone=hosted_zone,
                record_name=api_domain_name.split(".")[0],
                target=route53.RecordTarget.from_alias(
                    targets.ApiGatewayv2DomainProperties(
                        domain_name=domain.regional_domain_name,
                        regional_hosted_zone_id=domain.regional_hosted_zone_id,
                    )
                ),
            )

        cdk.CfnOutput(self, "HttpApiEndpoint", value=http_api.url)
        cdk.CfnOutput(self, "LambdaFunctionName", value=api_function.function_name)
