# Data Module
# Creates RDS (PostgreSQL/MySQL) and Elasticache (Redis)

# Random password for RDS (if not provided)
resource "random_password" "rds_password" {
  count   = var.rds_password == "" ? 1 : 0
  length  = 16
  special = true
}

# Store RDS password in Secrets Manager
resource "aws_secretsmanager_secret" "rds_password" {
  name = "${var.project_name}-rds-password-${var.environment}"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-rds-password-${var.environment}"
    }
  )
}

resource "aws_secretsmanager_secret_version" "rds_password" {
  secret_id = aws_secretsmanager_secret.rds_password.id
  secret_string = jsonencode({
    username = var.rds_username
    password = var.rds_password != "" ? var.rds_password : random_password.rds_password[0].result
  })
}


# RDS Subnet Group (passed from network module)
# Using the name directly instead of data source to avoid dependency issues

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg-${var.environment}"
  description = "Security group for RDS database"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL/MySQL from ECS"
    from_port       = var.rds_port
    to_port         = var.rds_port
    protocol        = "tcp"
    security_groups = var.ecs_security_group_ids
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-rds-sg-${var.environment}"
    }
  )
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = lower("db-${var.project_name}-${var.environment}")

  engine         = var.rds_engine
  engine_version = var.rds_engine_version
  instance_class = var.rds_instance_class

  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage
  storage_type          = var.rds_storage_type
  storage_encrypted     = true

  db_name  = var.rds_database_name
  username = var.rds_username
  password = var.rds_password != "" ? var.rds_password : random_password.rds_password[0].result
  port     = var.rds_port

  db_subnet_group_name   = var.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]
  # Using default parameter group - no custom parameters needed
  parameter_group_name = null

  multi_az                  = var.rds_multi_az
  publicly_accessible       = false
  skip_final_snapshot       = var.environment == "production" ? false : true
  final_snapshot_identifier = var.environment == "production" ? "${var.project_name}-db-final-snapshot-${var.environment}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  deletion_protection       = var.environment == "production" ? true : false

  backup_retention_period = var.rds_backup_retention_period
  backup_window           = var.rds_backup_window
  maintenance_window      = var.rds_maintenance_window

  allow_major_version_upgrade = true

  enabled_cloudwatch_logs_exports = var.rds_cloudwatch_logs_exports

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-db-${var.environment}"
    }
  )
}

# Elasticache Subnet Group (passed from network module)
# Using the name directly instead of data source to avoid dependency issues

# Elasticache Security Group
resource "aws_security_group" "elasticache" {
  name        = "${var.project_name}-elasticache-sg-${var.environment}"
  description = "Security group for Elasticache Redis"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis from ECS"
    from_port       = var.elasticache_port
    to_port         = var.elasticache_port
    protocol        = "tcp"
    security_groups = var.ecs_security_group_ids
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-elasticache-sg-${var.environment}"
    }
  )
}


# Elasticache Replication Group (Redis)
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = lower("redis-${var.project_name}-${var.environment}")
  description          = "Redis cluster for ${var.project_name} ${var.environment}"

  engine               = "redis"
  engine_version       = var.elasticache_engine_version
  node_type            = var.elasticache_node_type
  port                 = var.elasticache_port
  # Using default parameter group - no custom parameters needed
  parameter_group_name = null

  num_cache_clusters         = var.elasticache_num_cache_nodes
  automatic_failover_enabled = var.elasticache_automatic_failover
  multi_az_enabled           = var.elasticache_multi_az

  subnet_group_name  = var.elasticache_subnet_group_name
  security_group_ids = [aws_security_group.elasticache.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = var.elasticache_transit_encryption
  auth_token                 = var.elasticache_auth_token_enabled ? (var.elasticache_auth_token != "" ? var.elasticache_auth_token : random_password.elasticache_auth_token[0].result) : null

  snapshot_retention_limit = var.elasticache_snapshot_retention_limit
  snapshot_window          = var.elasticache_snapshot_window

  maintenance_window = var.elasticache_maintenance_window

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-redis-${var.environment}"
    }
  )
}

# Random password for Elasticache auth token (if enabled)
resource "random_password" "elasticache_auth_token" {
  count   = var.elasticache_auth_token_enabled && var.elasticache_auth_token == "" ? 1 : 0
  length  = 32
  special = false
}

# Store Elasticache auth token in Secrets Manager (if enabled)
resource "aws_secretsmanager_secret" "elasticache_auth_token" {
  count = var.elasticache_auth_token_enabled ? 1 : 0
  name  = "${var.project_name}-elasticache-auth-token-${var.environment}"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-elasticache-auth-token-${var.environment}"
    }
  )
}

resource "aws_secretsmanager_secret_version" "elasticache_auth_token" {
  count         = var.elasticache_auth_token_enabled ? 1 : 0
  secret_id     = aws_secretsmanager_secret.elasticache_auth_token[0].id
  secret_string = var.elasticache_auth_token != "" ? var.elasticache_auth_token : random_password.elasticache_auth_token[0].result
}

