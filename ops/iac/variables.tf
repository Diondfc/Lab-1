# Root Module Variables

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  default     = "staging"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "ApprenticeFinal"
}

variable "owner" {
  description = "Owner of the project"
  type        = string
}

# Network Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}

# Data Module Variables
variable "rds_engine" {
  description = "RDS engine type (postgres or mysql)"
  type        = string
  default     = "mysql"
}

variable "rds_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_database_name" {
  description = "Name of the database to create"
  type        = string
  default     = "ubt_library"
}

variable "rds_username" {
  description = "RDS master username (cannot be 'admin', 'postgres', or other reserved words)"
  type        = string
  default     = "dbadmin"
}

variable "rds_password" {
  description = "RDS master password (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "rds_multi_az" {
  description = "Enable RDS Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "elasticache_node_type" {
  description = "Elasticache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "elasticache_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

# Compute Module Variables
variable "api_port" {
  description = "Port for API container"
  type        = number
  default     = 5001
}

variable "api_cpu" {
  description = "CPU units for API task (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Memory for API task in MB"
  type        = number
  default     = 1024
}

variable "api_desired_count" {
  description = "Desired number of API tasks"
  type        = number
  default     = 2
}

variable "api_min_capacity" {
  description = "Minimum number of API tasks"
  type        = number
  default     = 1
}

variable "api_max_capacity" {
  description = "Maximum number of API tasks"
  type        = number
  default     = 10
}

variable "api_health_check_path" {
  description = "Health check path for API"
  type        = string
  default     = "/api/health"
}

variable "web_port" {
  description = "Port for Web container"
  type        = number
  default     = 3000
}

variable "web_cpu" {
  description = "CPU units for Web task (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "web_memory" {
  description = "Memory for Web task in MB"
  type        = number
  default     = 512
}

variable "web_desired_count" {
  description = "Desired number of Web tasks"
  type        = number
  default     = 2
}

variable "web_min_capacity" {
  description = "Minimum number of Web tasks"
  type        = number
  default     = 1
}

variable "web_max_capacity" {
  description = "Maximum number of Web tasks"
  type        = number
  default     = 10
}

variable "web_health_check_path" {
  description = "Health check path for Web"
  type        = string
  default     = "/"
}

variable "alb_certificate_arn" {
  description = "ARN of ACM certificate for ALB HTTPS (optional)"
  type        = string
  default     = ""
}

# Edge Module Variables
variable "enable_https" {
  description = "Enable HTTPS with custom domain"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name for CloudFront and Route53"
  type        = string
  default     = ""
}

variable "subject_alternative_names" {
  description = "Subject alternative names for ACM certificate"
  type        = list(string)
  default     = []
}

variable "hosted_zone_id" {
  description = "Existing Route53 hosted zone ID (leave empty to create new)"
  type        = string
  default     = ""
}

variable "create_hosted_zone" {
  description = "Create new Route53 hosted zone"
  type        = bool
  default     = true
}

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "waf_rate_limit" {
  description = "WAF rate limit (requests per 5 minutes)"
  type        = number
  default     = 2000
}

# Observability Module Variables
variable "alert_email_addresses" {
  description = "List of email addresses to receive alerts"
  type        = list(string)
  default     = []
}

variable "high_5xx_threshold" {
  description = "Threshold for high 5xx error rate alarm"
  type        = number
  default     = 10
}

variable "high_latency_threshold" {
  description = "Threshold for high latency alarm (seconds)"
  type        = number
  default     = 2.0
}

variable "high_cpu_threshold" {
  description = "Threshold for high CPU alarm (percentage)"
  type        = number
  default     = 80
}

variable "rds_high_connections_threshold" {
  description = "Threshold for RDS high connections alarm"
  type        = number
  default     = 80
}

variable "elasticache_high_memory_threshold" {
  description = "Threshold for Elasticache high memory alarm (percentage)"
  type        = number
  default     = 80
}

variable "error_rate_threshold" {
  description = "Threshold for error rate from logs"
  type        = number
  default     = 10
}

# Variables for Pipeline Infrastructure

variable "codestar_connection_arn" {
  description = "ARN of the CodeStar connection to GitHub (required for pipelines)"
  type        = string
  default     = ""
  validation {
    condition     = var.codestar_connection_arn == "" || length(var.codestar_connection_arn) > 0
    error_message = "codestar_connection_arn cannot be empty if provided"
  }
}

variable "repository_id" {
  description = "GitHub repository ID (format: owner/repo-name) (required for pipelines)"
  type        = string
  default     = ""
  validation {
    condition     = var.repository_id == "" || length(var.repository_id) > 0
    error_message = "repository_id cannot be empty if provided"
  }
}

variable "branch_name" {
  description = "Git branch name to track"
  type        = string
  default     = "main"
}



