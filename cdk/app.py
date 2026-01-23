#!/usr/bin/env python3
import os
import aws_cdk as cdk

from stacks.data_stack import DataStack
from stacks.app_stack import AppStack


app = cdk.App()

account = os.getenv("CDK_DEFAULT_ACCOUNT")
region = os.getenv("CDK_DEFAULT_REGION")

api_domain_name = app.node.try_get_context("apiDomainName")
frontend_domain_name = app.node.try_get_context("frontendDomainName")
hosted_zone_domain = app.node.try_get_context("hostedZoneDomain")

# CDK will synth ALL stacks in the app, even if you deploy only one.
# The App stack bundles a Lambda (Docker-based) which can fail on machines
# without Docker or with file-attr issues. To allow deploying the Data stack
# independently, gate AppStack creation behind a context flag.
include_app_stack = str(app.node.try_get_context("includeApp") or "false").lower() in (
    "1",
    "true",
    "yes",
)

data_stack = DataStack(
    app,
    "BarberDataStack",
    env=cdk.Environment(account=account, region=region),
)

if include_app_stack:
    app_stack = AppStack(
        app,
        "BarberAppStack",
        vpc=data_stack.vpc,
        db_cluster=data_stack.db_cluster,
        db_security_group=data_stack.db_security_group,
        app_secret=data_stack.app_secret,
        api_domain_name=api_domain_name,
        hosted_zone_domain=hosted_zone_domain,
        frontend_domain_name=frontend_domain_name,
        env=cdk.Environment(account=account, region=region),
    )
    app_stack.add_dependency(data_stack)

app.synth()
