# Outputs for IAM Module

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_execution_role_name" {
  description = "Name of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.name
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "ecs_task_role_name" {
  description = "Name of the ECS task role"
  value       = aws_iam_role.ecs_task.name
}

output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role (if created)"
  value       = var.enable_lambda_role ? aws_iam_role.lambda_execution[0].arn : null
}

output "lambda_execution_role_name" {
  description = "Name of the Lambda execution role (if created)"
  value       = var.enable_lambda_role ? aws_iam_role.lambda_execution[0].name : null
}

