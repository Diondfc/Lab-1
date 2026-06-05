# Outputs for Data Module

# RDS Outputs
output "rds_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "rds_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_instance_address" {
  description = "RDS instance address"
  value       = aws_db_instance.main.address
}

output "rds_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "rds_username" {
  description = "RDS master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "rds_password_secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS password"
  value       = aws_secretsmanager_secret.rds_password.arn
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

# Elasticache Outputs
output "elasticache_replication_group_id" {
  description = "Elasticache replication group ID"
  value       = aws_elasticache_replication_group.main.id
}

output "elasticache_primary_endpoint_address" {
  description = "Elasticache primary endpoint address"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "elasticache_primary_endpoint_port" {
  description = "Elasticache primary endpoint port"
  value       = aws_elasticache_replication_group.main.port
}

output "elasticache_configuration_endpoint_address" {
  description = "Elasticache configuration endpoint address (for cluster mode)"
  value       = aws_elasticache_replication_group.main.configuration_endpoint_address
}

output "elasticache_security_group_id" {
  description = "Elasticache security group ID"
  value       = aws_security_group.elasticache.id
}

output "elasticache_auth_token_secret_arn" {
  description = "ARN of the Secrets Manager secret containing Elasticache auth token (if enabled)"
  value       = var.elasticache_auth_token_enabled ? aws_secretsmanager_secret.elasticache_auth_token[0].arn : null
}

