# Variables for Observability Module

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

variable "alb_arn_suffix" {
  description = "Full ARN of the Application Load Balancer (for alarms)"
  type        = string
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster (for alarms)"
  type        = string
  default     = ""
}

variable "ecs_service_name" {
  description = "Name of the ECS service (for alarms)"
  type        = string
  default     = ""
}

variable "rds_instance_id" {
  description = "RDS instance ID (for alarms)"
  type        = string
  default     = ""
}

variable "elasticache_replication_group_id" {
  description = "Elasticache replication group ID (for alarms)"
  type        = string
  default     = ""
}

variable "log_group_name" {
  description = "CloudWatch log group name for error rate monitoring"
  type        = string
  default     = ""
}

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

variable "enable_rds_alarms" {
  description = "Enable RDS alarms"
  type        = bool
  default     = true
}

variable "enable_elasticache_alarms" {
  description = "Enable Elasticache alarms"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

