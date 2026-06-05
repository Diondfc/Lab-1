# Variables for IAM Module

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "secrets_manager_arns" {
  description = "List of Secrets Manager ARNs that ECS tasks can access"
  type        = list(string)
  default     = []
}

variable "ssm_parameter_arns" {
  description = "List of SSM Parameter Store ARNs that ECS tasks can access"
  type        = list(string)
  default     = []
}

variable "enable_rds_access" {
  description = "Enable RDS access for ECS tasks"
  type        = bool
  default     = false
}

variable "rds_db_instance_arns" {
  description = "List of RDS DB instance ARNs for IAM database authentication"
  type        = list(string)
  default     = []
}

variable "enable_elasticache_access" {
  description = "Enable Elasticache access for ECS tasks"
  type        = bool
  default     = false
}

variable "enable_lambda_role" {
  description = "Create Lambda execution role"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

