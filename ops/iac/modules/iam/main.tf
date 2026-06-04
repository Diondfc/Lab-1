# IAM Module
# Creates least-privilege IAM roles and policies for ECS, Lambda, and other services

# ECS Task Execution Role
# This role is used by ECS to pull images, write logs, etc.
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-ecs-task-execution-role-${var.environment}"
    }
  )
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
# This role is assumed by the running container (application code)
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-ecs-task-role-${var.environment}"
    }
  )
}

# Policy for ECS Task Role - Access to Secrets Manager
resource "aws_iam_role_policy" "ecs_task_secrets" {
  count = length(var.secrets_manager_arns) > 0 ? 1 : 0
  name  = "${var.project_name}-ecs-task-secrets-${var.environment}"
  role  = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = var.secrets_manager_arns
      }
    ]
  })
}

data "aws_caller_identity" "current" {}

# Give task execution role access to the RDS password secret
resource "aws_iam_role_policy" "ecs_task_execution_rds_secret" {
  name = "ecs-task-execution-rds-secret-access"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:ApprenticeFinal-rds-password-${var.environment}-*"
      }
    ]
  })
}

# Policy for ECS Task Role - Access to SSM Parameter Store
resource "aws_iam_role_policy" "ecs_task_ssm" {
  count = length(var.ssm_parameter_arns) > 0 ? 1 : 0
  name  = "${var.project_name}-ecs-task-ssm-${var.environment}"
  role  = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = var.ssm_parameter_arns
      }
    ]
  })
}

# Policy for ECS Task Role - Access to RDS (if needed)
resource "aws_iam_role_policy" "ecs_task_rds" {
  count = var.enable_rds_access ? 1 : 0
  name  = "${var.project_name}-ecs-task-rds-${var.environment}"
  role  = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = var.rds_db_instance_arns
      }
    ]
  })
}

# Policy for ECS Task Role - Access to Elasticache (if needed)
resource "aws_iam_role_policy" "ecs_task_elasticache" {
  count = var.enable_elasticache_access ? 1 : 0
  name  = "${var.project_name}-ecs-task-elasticache-${var.environment}"
  role  = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "elasticache:DescribeCacheClusters",
          "elasticache:DescribeReplicationGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Logs Policy for ECS Task Execution Role
resource "aws_iam_role_policy" "ecs_task_execution_logs" {
  name = "${var.project_name}-ecs-task-execution-logs-${var.environment}"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/ecs/${var.project_name}-${var.environment}*",
          "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/app/${var.environment}*"
        ]
      }
    ]
  })
}

# ECR Access Policy for ECS Task Execution Role
resource "aws_iam_role_policy" "ecs_task_execution_ecr" {
  name = "${var.project_name}-ecs-task-execution-ecr-${var.environment}"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Execution Role (if using Lambda)
resource "aws_iam_role" "lambda_execution" {
  count = var.enable_lambda_role ? 1 : 0
  name  = "${var.project_name}-lambda-execution-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-lambda-execution-role-${var.environment}"
    }
  )
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_execution" {
  count = var.enable_lambda_role ? 1 : 0

  role       = aws_iam_role.lambda_execution[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

