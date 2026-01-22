from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    aws_apigatewayv2 as apigwv2,
    aws_apigatewayv2_integrations as apigwv2_integrations,
    aws_certificatemanager as acm,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_ec2 as ec2,
    aws_lambda as _lambda,
    aws_s3 as s3,
    aws_s3_deployment as s3_deployment,
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
        frontend_domain_name: Optional[str] = None,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        hosted_zone = None
        if (api_domain_name or frontend_domain_name) and hosted_zone_domain:
            hosted_zone = route53.HostedZone.from_lookup(
                self, "HostedZone", domain_name=hosted_zone_domain
            )

        lambda_sg = ec2.SecurityGroup(
            self,
            "LambdaSecurityGroup",
            vpc=vpc,
            allow_all_outbound=True,
            description="Lambda egress to DB, endpoints, and HTTPS",
        )

        # IMPORTANT: db_cluster/db_security_group live in DataStack.
        # Avoid modifying them from this stack (creates cyclic dependencies).
        # Instead, create the SG ingress rule as an AppStack resource.
        ec2.CfnSecurityGroupIngress(
            self,
            "DbIngressFromLambda",
            group_id=db_security_group.security_group_id,
            ip_protocol="tcp",
            from_port=5432,
            to_port=5432,
            source_security_group_id=lambda_sg.security_group_id,
            description="Allow Lambda SG to reach Aurora (5432)",
        )

        lambda_env = {
            # These resolve as CloudFormation dynamic references, not plaintext.
            "DATABASE_URL": app_secret.secret_value_from_json("database_url").to_string(),
            "JWT_SECRET": app_secret.secret_value_from_json("jwt_secret").to_string(),
            "CORS_ORIGINS": app_secret.secret_value_from_json("cors_origins").to_string(),
            "ENVIRONMENT": app_secret.secret_value_from_json("environment").to_string(),
        }

        # Bundle backend + dependencies into a single Lambda zip.
        # This avoids aws-lambda-python-alpha's internal rsync (which can fail on macOS).
        api_code = _lambda.Code.from_asset(
            "../backend",
            bundling=cdk.BundlingOptions(
                image=_lambda.Runtime.PYTHON_3_12.bundling_image,
                command=[
                    "bash",
                    "-c",
                    "set -euo pipefail; "
                    "tar -cf - "
                    "  --exclude='alembic' "
                    "  --exclude='alembic.ini' "
                    "  --exclude='.venv' "
                    "  --exclude='__pycache__' "
                    "  --exclude='.pytest_cache' "
                    "  --exclude='.mypy_cache' "
                    "  --exclude='*.pyc' "
                    "  . | tar -xf - -C /asset-output; "
                    "cd /asset-output; "
                    "python -m pip install -r requirements.txt -t /asset-output",
                ],
            ),
        )

        api_function = _lambda.Function(
            self,
            "ApiFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="app.main.handler",
            code=api_code,
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

        if api_domain_name and hosted_zone:
            api_certificate = acm.Certificate(
                self,
                "ApiCertificate",
                domain_name=api_domain_name,
                validation=acm.CertificateValidation.from_dns(hosted_zone),
            )

            domain = apigwv2.DomainName(
                self,
                "ApiCustomDomain",
                domain_name=api_domain_name,
                certificate=api_certificate,
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
                record_name=self._relative_record_name(
                    fqdn=api_domain_name,
                    zone_name=hosted_zone_domain,
                ),
                target=route53.RecordTarget.from_alias(
                    targets.ApiGatewayv2DomainProperties(
                        domain.regional_domain_name,
                        domain.regional_hosted_zone_id,
                    )
                ),
            )

        cdk.CfnOutput(self, "HttpApiEndpoint", value=http_api.url)
        cdk.CfnOutput(self, "LambdaFunctionName", value=api_function.function_name)

        frontend_bucket = s3.Bucket(
            self,
            "FrontendBucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            versioned=True,
        )

        origin_identity = cloudfront.OriginAccessIdentity(
            self, "FrontendOAI", comment="OAI for S3-backed Next static site"
        )
        frontend_bucket.grant_read(origin_identity)

        html_cache_policy = cloudfront.CachePolicy(
            self,
            "HtmlCachePolicy",
            default_ttl=Duration.seconds(60),
            min_ttl=Duration.seconds(0),
            max_ttl=Duration.seconds(300),
            cache_policy_name=f"{self.stack_name}-html-cache",
        )

        static_cache_policy = cloudfront.CachePolicy(
            self,
            "StaticCachePolicy",
            default_ttl=Duration.days(365),
            min_ttl=Duration.days(1),
            max_ttl=Duration.days(365),
            cache_policy_name=f"{self.stack_name}-static-cache",
        )

        frontend_certificate = None
        if frontend_domain_name and hosted_zone:
            frontend_certificate = acm.DnsValidatedCertificate(
                self,
                "FrontendCertificate",
                domain_name=frontend_domain_name,
                hosted_zone=hosted_zone,
                region="us-east-1",  # CloudFront requires us-east-1 certificates
            )

        frontend_origin = origins.S3Origin(
            frontend_bucket, origin_access_identity=origin_identity
        )

        frontend_distribution = cloudfront.Distribution(
            self,
            "FrontendDistribution",
            default_root_object="index.html",
            domain_names=[frontend_domain_name] if frontend_certificate else None,
            certificate=frontend_certificate,
            default_behavior=cloudfront.BehaviorOptions(
                origin=frontend_origin,
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=html_cache_policy,
            ),
            additional_behaviors={
                "_next/static/*": cloudfront.BehaviorOptions(
                    origin=frontend_origin,
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=static_cache_policy,
                ),
                "static/*": cloudfront.BehaviorOptions(
                    origin=frontend_origin,
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=static_cache_policy,
                ),
            },
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(0),
                ),
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(0),
                ),
            ],
        )

        long_cache = [
            s3_deployment.CacheControl.from_string(
                "public,max-age=31536000,immutable"
            )
        ]
        html_cache = [
            s3_deployment.CacheControl.from_string("public,max-age=0,must-revalidate")
        ]

        s3_deployment.BucketDeployment(
            self,
            "DeployNextStatic",
            sources=[s3_deployment.Source.asset("../frontend/out/_next/static")],
            destination_bucket=frontend_bucket,
            destination_key_prefix="_next/static",
            cache_control=long_cache,
            prune=True,
        )

        s3_deployment.BucketDeployment(
            self,
            "DeployHtml",
            sources=[
                s3_deployment.Source.asset(
                    "../frontend/out",
                    exclude=[
                        "_next/static/*",
                        "_next/static/**",
                        "static/*",
                        "static/**",
                        "**/*.js",
                        "**/*.css",
                        "**/*.json",
                        "**/*.map",
                        "**/*.png",
                        "**/*.jpg",
                        "**/*.jpeg",
                        "**/*.webp",
                        "**/*.svg",
                        "**/*.ico",
                        "**/*.txt",
                    ],
                )
            ],
            destination_bucket=frontend_bucket,
            cache_control=html_cache,
            prune=True,
            distribution=frontend_distribution,
            distribution_paths=[
                "/index.html",
                "/*.html",
                "/*/index.html",
            ],
        )

        s3_deployment.BucketDeployment(
            self,
            "DeployAssets",
            sources=[
                s3_deployment.Source.asset(
                    "../frontend/out",
                    exclude=["_next/static/**", "**/*.html"],
                )
            ],
            destination_bucket=frontend_bucket,
            cache_control=long_cache,
            prune=True,
        )

        if frontend_domain_name and hosted_zone:
            route53.ARecord(
                self,
                "FrontendAliasRecord",
                zone=hosted_zone,
                record_name=self._relative_record_name(
                    fqdn=frontend_domain_name,
                    zone_name=hosted_zone_domain,
                ),
                target=route53.RecordTarget.from_alias(
                    targets.CloudFrontTarget(frontend_distribution)
                ),
            )

        cdk.CfnOutput(
            self, "FrontendDistributionDomain", value=frontend_distribution.domain_name
        )
        cdk.CfnOutput(self, "FrontendBucketName", value=frontend_bucket.bucket_name)

    @staticmethod
    def _relative_record_name(*, fqdn: str, zone_name: str) -> str:
        fqdn = fqdn.rstrip(".")
        zone_name = zone_name.rstrip(".")
        if fqdn == zone_name:
            return ""  # apex
        suffix = "." + zone_name
        if not fqdn.endswith(suffix):
            raise ValueError(
                f"apiDomainName '{fqdn}' must be within hostedZoneDomain '{zone_name}'"
            )
        return fqdn[: -len(suffix)]
