# Outputs for CodePipeline Module

output "pipeline_id" {
  description = "ID of the CodePipeline"
  value       = aws_codepipeline.pipeline.id
}

output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = aws_codepipeline.pipeline.arn
}

output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.pipeline.name
}

output "codebuild_project_name" {
  description = "Name of the CodeBuild project"
  value       = aws_codebuild_project.build_project.name
}

output "codebuild_project_arn" {
  description = "ARN of the CodeBuild project"
  value       = aws_codebuild_project.build_project.arn
}

output "artifact_bucket_name" {
  description = "Name of the S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.id
}

output "artifact_bucket_arn" {
  description = "ARN of the S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.pipeline_artifacts.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = var.enable_notifications ? aws_sns_topic.pipeline_notifications[0].arn : null
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.codebuild_logs.name
}

