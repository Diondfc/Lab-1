# Main Terraform Configuration
# Orchestrates all infrastructure module

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      Owner       = var.owner
      ManagedBy   = "Terraform"
    }
  }
}

# Provider for us-east-1 (required for CloudFront ACM certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      Owner       = var.owner
      ManagedBy   = "Terraform"
    }
  }
}

# Data source to get AWS account ID
data "aws_caller_identity" "current" {}

# Data source to get AWS region
data "aws_region" "current" {}

locals {
  aws_account_id = data.aws_caller_identity.current.account_id
  aws_region     = data.aws_region.current.name

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Owner       = var.owner
  }
}

resource "random_password" "jwt_secret" {
  length  = 32
  special = false
}

resource "random_password" "jwt_refresh_secret" {
  length  = 32
  special = false
}

# Backend Module - S3 + DynamoDB for Terraform State
# Note: This should be deployed first, then uncomment backend config in backend.tf
module "backend" {
  source = "./modules/backend"

  project_name = var.project_name
  environment  = var.environment
  tags         = local.common_tags
}

# Network Module - VPC, Subnets, NAT, IGW
module "network" {
  source = "./modules/network"

  project_name          = var.project_name
  environment           = var.environment
  vpc_cidr              = var.vpc_cidr
  availability_zones    = var.availability_zones
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs
  enable_nat_gateway    = true
  enable_flow_logs      = false
  tags                  = local.common_tags
}

# IAM Module - ECS Roles and Policies
module "iam" {
  source = "./modules/iam"

  project_name   = var.project_name
  environment    = var.environment
  aws_region     = local.aws_region
  aws_account_id = local.aws_account_id
  tags           = local.common_tags

  # Allow ECS to read the database password injected into the API task.
  secrets_manager_arns = [module.data.rds_password_secret_arn]
  ssm_parameter_arns   = []
  enable_rds_access    = false
  enable_lambda_role   = false
}

# Compute Module - ECS Cluster, Services, ALB
module "compute" {
  source = "./modules/compute"

  project_name                = var.project_name
  environment                 = var.environment
  aws_region                  = local.aws_region
  vpc_id                      = module.network.vpc_id
  public_subnet_ids           = module.network.public_subnet_ids
  private_subnet_ids          = module.network.private_subnet_ids
  ecs_task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  ecs_task_role_arn           = module.iam.ecs_task_role_arn
  alb_certificate_arn         = var.alb_certificate_arn

  # API Configuration
  api_port              = var.api_port
  api_cpu               = var.api_cpu
  api_memory            = var.api_memory
  api_desired_count     = var.api_desired_count
  api_min_capacity      = var.api_min_capacity
  api_max_capacity      = var.api_max_capacity
  api_health_check_path    = var.api_health_check_path
  api_health_check_command = "curl -f http://localhost:${var.api_port}/api/health || exit 1"
  api_environment_variables = [
    {
      name  = "NODE_ENV"
      value = "production"
    },
    {
      name  = "PORT"
      value = tostring(var.api_port)
    },
    {
      name = "CLIENT_ORIGIN"
      value = join(",", compact([
        "http://${lower(var.project_name)}-web-${var.environment}-${local.aws_account_id}.s3-website-${local.aws_region}.amazonaws.com",
        var.domain_name != "" ? "https://${var.domain_name}" : ""
      ]))
    },
    {
      name  = "DB_HOST"
      value = module.data.rds_instance_address
    },
    {
      name  = "DB_PORT"
      value = tostring(module.data.rds_instance_port)
    },
    {
      name  = "DB_NAME"
      value = module.data.rds_database_name
    },
    {
      name  = "DB_USER"
      value = module.data.rds_username
    },
    {
      name  = "JWT_SECRET"
      value = random_password.jwt_secret.result
    },
    {
      name  = "JWT_REFRESH_SECRET"
      value = random_password.jwt_refresh_secret.result
    }
  ]
  api_secrets = [
    {
      name      = "DB_PASSWORD"
      valueFrom = "${module.data.rds_password_secret_arn}:password::"
    }
  ]


  enable_container_insights = true
  log_retention_days        = 7

  tags = local.common_tags

  depends_on = [module.iam, module.network]
}

# Data Module - RDS + Elasticache
module "data" {
  source = "./modules/data"

  project_name                  = var.project_name
  environment                   = var.environment
  vpc_id                        = module.network.vpc_id
  database_subnet_group_name    = module.network.database_subnet_group_name
  elasticache_subnet_group_name = module.network.elasticache_subnet_group_name
  # Use private subnet CIDRs instead of the ECS security group here so the data
  # module can be created before compute and avoid a Terraform module cycle.
  ecs_security_group_ids        = []
  allowed_cidr_blocks          = var.private_subnet_cidrs

  # RDS Configuration
  rds_engine         = var.rds_engine
  rds_engine_version = var.rds_engine_version
  rds_instance_class = var.rds_instance_class
  rds_database_name  = var.rds_database_name
  rds_username       = var.rds_username
  rds_password       = var.rds_password
  rds_multi_az       = var.rds_multi_az

  # Elasticache Configuration
  elasticache_node_type          = var.elasticache_node_type
  elasticache_num_cache_nodes    = var.elasticache_num_cache_nodes
  elasticache_automatic_failover = var.environment == "production"
  elasticache_multi_az           = var.environment == "production"

  tags = local.common_tags
}

# Edge Module - CloudFront, WAF, Route53, ACM
module "edge" {
  source = "./modules/edge"

  providers = {
    aws.us_east_1 = aws.us_east_1
  }

  project_name              = var.project_name
  environment               = var.environment
  alb_dns_name              = module.compute.alb_dns_name
  web_s3_bucket_name        = module.compute.web_s3_bucket_name
  enable_https              = var.enable_https
  domain_name               = var.domain_name
  subject_alternative_names = var.subject_alternative_names
  hosted_zone_id            = var.hosted_zone_id
  create_hosted_zone        = var.create_hosted_zone
  cloudfront_price_class    = var.cloudfront_price_class
  waf_rate_limit            = var.waf_rate_limit

  tags = local.common_tags

  depends_on = [module.compute]
}

# Observability Module - CloudWatch Dashboards, Alarms, SNS
module "observability" {
  source = "./modules/observability"

  project_name                     = var.project_name
  environment                      = var.environment
  aws_region                       = local.aws_region
  alb_arn_suffix                   = module.compute.alb_arn
  ecs_cluster_name                 = module.compute.ecs_cluster_name
  ecs_service_name                 = module.compute.api_service_name
  rds_instance_id                  = module.data.rds_instance_id
  elasticache_replication_group_id = module.data.elasticache_replication_group_id
  log_group_name                   = "/aws/ecs/${var.project_name}-api-${var.environment}"
  alert_email_addresses            = var.alert_email_addresses

  high_5xx_threshold                = var.high_5xx_threshold
  high_latency_threshold            = var.high_latency_threshold
  high_cpu_threshold                = var.high_cpu_threshold
  rds_high_connections_threshold    = var.rds_high_connections_threshold
  elasticache_high_memory_threshold = var.elasticache_high_memory_threshold
  error_rate_threshold              = var.error_rate_threshold

  enable_rds_alarms         = true
  enable_elasticache_alarms = true

  tags = local.common_tags

  depends_on = [module.compute, module.data]
}


# Web Pipeline
module "web_pipeline" {
  source = "./modules/codepipeline"

  pipeline_name           = "web-pipeline"
  environment             = var.environment
  aws_region              = local.aws_region
  aws_account_id          = local.aws_account_id
  codestar_connection_arn = var.codestar_connection_arn
  repository_id           = var.repository_id
  branch_name             = var.branch_name
  buildspec_path          = "ops/cicd/web/buildspec-web.yml"
  deploy_buildspec_path   = "ops/cicd/web/buildspec-deploy.yml"
  test_buildspec_path     = "ops/cicd/web/buildspec-test.yml"

  build_compute_type = "BUILD_GENERAL1_SMALL"
  build_image        = "aws/codebuild/standard:7.0"
  build_timeout      = 30
  privileged_mode    = true

  # S3 configuration for static web hosting
  web_s3_bucket_name = module.compute.web_s3_bucket_name
  alb_dns_name       = module.compute.alb_dns_name
  vite_api_url       = "http://${module.compute.alb_dns_name}"

  environment_variables = {
    ENVIRONMENT = var.environment
    NODE_ENV    = "production"
  }

  log_retention_days   = 7
  enable_notifications = true

  tags = local.common_tags

  depends_on = [module.compute]
}


# API Pipeline
module "api_pipeline" {
  source = "./modules/codepipeline"

  pipeline_name           = "api-pipeline"
  environment             = var.environment
  aws_region              = local.aws_region
  aws_account_id          = local.aws_account_id
  codestar_connection_arn = var.codestar_connection_arn
  repository_id           = var.repository_id
  branch_name             = var.branch_name
  buildspec_path          = "ops/cicd/api/buildspec-api.yml"
  deploy_buildspec_path   = "ops/cicd/api/buildspec-deploy.yml"
  test_buildspec_path     = "ops/cicd/api/buildspec-test.yml"

  build_compute_type = "BUILD_GENERAL1_SMALL"
  build_image        = "aws/codebuild/standard:7.0"
  build_timeout      = 30
  privileged_mode    = true

  # ECR and ECS configuration for deployment
  ecr_repository_uri = module.compute.ecr_api_repository_url
  ecs_cluster_name   = module.compute.ecs_cluster_name
  ecs_service_name   = module.compute.api_service_name
  alb_dns_name       = module.compute.alb_dns_name

  environment_variables = {
    ENVIRONMENT = var.environment
    NODE_ENV    = "production"
  }

  log_retention_days   = 7
  enable_notifications = true

  tags = local.common_tags

  depends_on = [module.compute]
}

# Infrastructure Pipeline
module "infrastructure_pipeline" {
  source = "./modules/codepipeline"

  pipeline_name           = "infrastructure-pipeline"
  environment             = var.environment
  aws_region              = local.aws_region
  aws_account_id          = local.aws_account_id
  codestar_connection_arn = var.codestar_connection_arn
  repository_id           = var.repository_id
  branch_name             = var.branch_name
  buildspec_path          = "ops/cicd/infrastructure/buildspec-infrastructure.yml"
  apply_buildspec_path    = "ops/cicd/infrastructure/buildspec-apply.yml"
  enable_approval_stage   = true
  approval_stage_name     = "Approval"

  # Terraform state backend permissions
  terraform_state_bucket_arn = "arn:aws:s3:::apprenticefinal-bucket"
  terraform_state_table_arn  = "arn:aws:dynamodb:${local.aws_region}:${local.aws_account_id}:table/apprenticefinal-terraform-locks-${var.environment}"

  build_compute_type = "BUILD_GENERAL1_SMALL"
  build_image        = "hashicorp/terraform:1.6"
  build_timeout      = 45
  privileged_mode    = true

  environment_variables = {
    ENVIRONMENT                    = var.environment
    TF_VERSION                     = "1.6.0"
    TF_IN_AUTOMATION               = "true"
    TF_VAR_owner                   = var.owner
    TF_VAR_codestar_connection_arn = var.codestar_connection_arn
    TF_VAR_repository_id           = var.repository_id
  }

  log_retention_days   = 7
  enable_notifications = true

  tags = local.common_tags
}

