# Variables for Data Module

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where resources will be created"
  type        = string
}

variable "database_subnet_group_name" {
  description = "Name of the database subnet group (from network module)"
  type        = string
}

variable "elasticache_subnet_group_name" {
  description = "Name of the Elasticache subnet group (from network module)"
  type        = string
}

variable "ecs_security_group_ids" {
  description = "List of ECS security group IDs that need database access"
  type        = list(string)
}

# RDS Variables
variable "rds_engine" {
  description = "RDS engine type (postgres or mysql)"
  type        = string
  default     = "mysql"
  validation {
    condition     = contains(["postgres", "mysql"], var.rds_engine)
    error_message = "RDS engine must be either 'postgres' or 'mysql'."
  }
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

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_max_allocated_storage" {
  description = "RDS maximum allocated storage for autoscaling"
  type        = number
  default     = 100
}

variable "rds_storage_type" {
  description = "RDS storage type"
  type        = string
  default     = "gp3"
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

variable "rds_port" {
  description = "RDS port"
  type        = number
  default     = 3306
}

variable "rds_multi_az" {
  description = "Enable RDS Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "rds_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

variable "rds_backup_window" {
  description = "RDS backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "rds_maintenance_window" {
  description = "RDS maintenance window"
  type        = string
  default     = "mon:04:00-mon:05:00"
}

variable "rds_cloudwatch_logs_exports" {
  description = "List of log types to export to CloudWatch"
  type        = list(string)
  default     = ["postgresql", "upgrade"]
}

# Elasticache Variables
variable "elasticache_engine_version" {
  description = "Elasticache Redis engine version"
  type        = string
  default     = "7.0"
}

variable "elasticache_node_type" {
  description = "Elasticache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "elasticache_port" {
  description = "Elasticache port"
  type        = number
  default     = 6379
}

variable "elasticache_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "elasticache_automatic_failover" {
  description = "Enable automatic failover"
  type        = bool
  default     = false
}

variable "elasticache_multi_az" {
  description = "Enable Multi-AZ"
  type        = bool
  default     = false
}

variable "elasticache_transit_encryption" {
  description = "Enable transit encryption"
  type        = bool
  default     = true
}

variable "elasticache_auth_token_enabled" {
  description = "Enable auth token"
  type        = bool
  default     = false
}

variable "elasticache_auth_token" {
  description = "Elasticache auth token (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "elasticache_snapshot_retention_limit" {
  description = "Number of days to retain snapshots"
  type        = number
  default     = 0
}

variable "elasticache_snapshot_window" {
  description = "Daily time range for snapshots"
  type        = string
  default     = "03:00-05:00"
}

variable "elasticache_maintenance_window" {
  description = "Maintenance window"
  type        = string
  default     = "mon:05:00-mon:07:00"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

