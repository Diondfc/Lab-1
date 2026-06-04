# Variables for Compute Module

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

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "ecs_task_execution_role_arn" {
  description = "ARN of ECS task execution role"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ARN of ECS task role"
  type        = string
}

# ALB Configuration
variable "alb_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS (optional)"
  type        = string
  default     = ""
}

# API Configuration
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

variable "api_cpu_target" {
  description = "Target CPU utilization percentage for auto-scaling"
  type        = number
  default     = 70
}

variable "api_memory_target" {
  description = "Target memory utilization percentage for auto-scaling"
  type        = number
  default     = 80
}

variable "api_health_check_path" {
  description = "Health check path for API"
  type        = string
  default     = "/api/health"
}

variable "api_health_check_command" {
  description = "Health check command for API container"
  type        = string
  default     = "curl -f http://localhost:5001/api/health || exit 1"
}

variable "api_environment_variables" {
  description = "Environment variables for API container"
  type        = list(map(string))
  default     = []
}

variable "api_secrets" {
  description = "Secrets for API container (from Secrets Manager)"
  type        = list(map(string))
  default     = []
}

# Web Configuration
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

variable "web_cpu_target" {
  description = "Target CPU utilization percentage for auto-scaling"
  type        = number
  default     = 70
}

variable "web_memory_target" {
  description = "Target memory utilization percentage for auto-scaling"
  type        = number
  default     = 80
}

variable "web_health_check_path" {
  description = "Health check path for Web"
  type        = string
  default     = "/"
}

variable "web_health_check_command" {
  description = "Health check command for Web container"
  type        = string
  default     = "curl -f http://localhost:3000/ || exit 1"
}

variable "web_environment_variables" {
  description = "Environment variables for Web container"
  type        = list(map(string))
  default     = []
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

