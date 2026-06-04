# Variables for CodePipeline Module

variable "pipeline_name" {
  description = "Name of the CodePipeline"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
  default     = "staging"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "codestar_connection_arn" {
  description = "ARN of the CodeStar connection to GitHub (required for pipelines)"
  type        = string
  validation {
    condition     = var.codestar_connection_arn != "" && length(var.codestar_connection_arn) > 0
    error_message = "codestar_connection_arn is required and cannot be empty. Provide a valid CodeStar connection ARN."
  }
}

variable "repository_id" {
  description = "GitHub repository ID (format: owner/repo) (required for pipelines)"
  type        = string
  validation {
    condition     = var.repository_id != "" && length(var.repository_id) > 0
    error_message = "repository_id is required and cannot be empty. Provide a valid GitHub repository ID (e.g., owner/repo-name)."
  }
}

variable "branch_name" {
  description = "Branch name to monitor"
  type        = string
  default     = "main"
}

variable "detect_changes" {
  description = "Automatically detect changes in the repository"
  type        = bool
  default     = true
}

variable "buildspec_path" {
  description = "Path to the buildspec file for Build stage"
  type        = string
}

variable "deploy_buildspec_path" {
  description = "Path to the buildspec file for Deploy stage (optional)"
  type        = string
  default     = ""
}

variable "test_buildspec_path" {
  description = "Path to the buildspec file for Test stage (optional)"
  type        = string
  default     = ""
}

variable "apply_buildspec_path" {
  description = "Path to the buildspec file for Apply stage (optional, for infrastructure)"
  type        = string
  default     = ""
}

variable "enable_approval_stage" {
  description = "Enable manual approval stage (for infrastructure pipeline)"
  type        = bool
  default     = false
}

variable "approval_stage_name" {
  description = "Name for the approval stage"
  type        = string
  default     = "Approval"
}

variable "ecr_repository_uri" {
  description = "ECR repository URI for deployment (for API/Web pipelines)"
  type        = string
  default     = ""
}

variable "ecs_cluster_name" {
  description = "ECS cluster name for deployment (for API/Web pipelines)"
  type        = string
  default     = ""
}

variable "ecs_service_name" {
  description = "ECS service name for deployment (for API/Web pipelines)"
  type        = string
  default     = ""
}

variable "alb_dns_name" {
  description = "ALB DNS name for testing (for API/Web pipelines)"
  type        = string
  default     = ""
}

variable "vite_api_url" {
  description = "VITE_API_URL for web builds (for Web pipeline)"
  type        = string
  default     = ""
}

variable "web_s3_bucket_name" {
  description = "S3 bucket name for web static hosting (for Web pipeline)"
  type        = string
  default     = ""
}

variable "build_compute_type" {
  description = "CodeBuild compute type"
  type        = string
  default     = "BUILD_GENERAL1_SMALL"
}

variable "build_image" {
  description = "CodeBuild Docker image"
  type        = string
  default     = "aws/codebuild/standard:7.0"
}

variable "build_timeout" {
  description = "Build timeout in minutes"
  type        = number
  default     = 30
}

variable "privileged_mode" {
  description = "Enable privileged mode for Docker builds"
  type        = bool
  default     = false
}

variable "environment_variables" {
  description = "Environment variables for CodeBuild"
  type        = map(string)
  default     = {}
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "enable_notifications" {
  description = "Enable SNS notifications for pipeline events"
  type        = bool
  default     = true
}

variable "terraform_state_bucket_arn" {
  description = "ARN of S3 bucket for Terraform state (for infrastructure pipeline)"
  type        = string
  default     = ""
}

variable "terraform_state_table_arn" {
  description = "ARN of DynamoDB table for Terraform state locking (for infrastructure pipeline)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

