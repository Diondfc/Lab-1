# Root Module Outputs

# Backend Outputs
output "state_bucket_name" {
  description = "S3 bucket name for Terraform state"
  value       = module.backend.state_bucket_name
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for state locking"
  value       = module.backend.dynamodb_table_name
}

# Network Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.network.private_subnet_ids
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = module.network.database_subnet_ids
}

# IAM Outputs
output "ecs_task_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = module.iam.ecs_task_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = module.iam.ecs_task_role_arn
}

# Data Outputs
output "rds_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = module.data.rds_instance_endpoint
}

output "rds_password_secret_arn" {
  description = "Secrets Manager ARN for RDS password"
  value       = module.data.rds_password_secret_arn
  sensitive   = true
}

output "elasticache_primary_endpoint_address" {
  description = "Elasticache primary endpoint address"
  value       = module.data.elasticache_primary_endpoint_address
}

output "elasticache_auth_token_secret_arn" {
  description = "Secrets Manager ARN for Elasticache auth token"
  value       = module.data.elasticache_auth_token_secret_arn
  sensitive   = true
}

# Compute Outputs
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.compute.ecs_cluster_name
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "ecr_api_repository_url" {
  description = "URL of the API ECR repository"
  value       = module.compute.ecr_api_repository_url
}

output "web_s3_bucket_name" {
  description = "Name of the S3 bucket for web static hosting"
  value       = module.compute.web_s3_bucket_name
}

# Edge Outputs
output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.edge.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.edge.cloudfront_distribution_id
}

# Observability Outputs
output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = module.observability.sns_topic_arn
}

output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = module.observability.dashboard_url
}

# Outputs for Pipeline Infrastructure

# Web Pipeline Outputs
output "web_pipeline_id" {
  description = "ID of the web pipeline"
  value       = module.web_pipeline.pipeline_id
}

output "web_pipeline_name" {
  description = "Name of the web pipeline"
  value       = module.web_pipeline.pipeline_name
}

output "web_codebuild_project" {
  description = "CodeBuild project name for web"
  value       = module.web_pipeline.codebuild_project_name
}

output "web_artifact_bucket" {
  description = "S3 bucket for web pipeline artifacts"
  value       = module.web_pipeline.artifact_bucket_name
}

output "web_sns_topic_arn" {
  description = "SNS topic ARN for web pipeline notifications"
  value       = module.web_pipeline.sns_topic_arn
}

# API Pipeline Outputs
output "api_pipeline_id" {
  description = "ID of the API pipeline"
  value       = module.api_pipeline.pipeline_id
}

output "api_pipeline_name" {
  description = "Name of the API pipeline"
  value       = module.api_pipeline.pipeline_name
}

output "api_codebuild_project" {
  description = "CodeBuild project name for API"
  value       = module.api_pipeline.codebuild_project_name
}

output "api_artifact_bucket" {
  description = "S3 bucket for API pipeline artifacts"
  value       = module.api_pipeline.artifact_bucket_name
}

output "api_sns_topic_arn" {
  description = "SNS topic ARN for API pipeline notifications"
  value       = module.api_pipeline.sns_topic_arn
}

# Infrastructure Pipeline Outputs
output "infrastructure_pipeline_id" {
  description = "ID of the infrastructure pipeline"
  value       = module.infrastructure_pipeline.pipeline_id
}

output "infrastructure_pipeline_name" {
  description = "Name of the infrastructure pipeline"
  value       = module.infrastructure_pipeline.pipeline_name
}

output "infrastructure_codebuild_project" {
  description = "CodeBuild project name for infrastructure"
  value       = module.infrastructure_pipeline.codebuild_project_name
}

output "infrastructure_artifact_bucket" {
  description = "S3 bucket for infrastructure pipeline artifacts"
  value       = module.infrastructure_pipeline.artifact_bucket_name
}

output "infrastructure_sns_topic_arn" {
  description = "SNS topic ARN for infrastructure pipeline notifications"
  value       = module.infrastructure_pipeline.sns_topic_arn
}



