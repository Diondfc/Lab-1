# CodePipeline Module
# Creates a CodePipeline with CodeBuild for CI/CD

# S3 Bucket for Pipeline Artifacts
resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket = "${var.pipeline_name}-artifacts-${var.environment}"

  tags = merge(
    var.tags,
    {
      Name = "${var.pipeline_name}-artifacts"
    }
  )
}

resource "aws_s3_bucket_versioning" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# IAM Role for CodePipeline
resource "aws_iam_role" "codepipeline_role" {
  name = "${var.pipeline_name}-pipeline-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Policy for CodePipeline
resource "aws_iam_role_policy" "codepipeline_policy" {
  name = "${var.pipeline_name}-pipeline-policy"
  role = aws_iam_role.codepipeline_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Effect = "Allow"
          Action = [
            "s3:GetObject",
            "s3:GetObjectVersion",
            "s3:PutObject",
            "s3:GetBucketLocation",
            "s3:ListBucket"
          ]
          Resource = [
            aws_s3_bucket.pipeline_artifacts.arn,
            "${aws_s3_bucket.pipeline_artifacts.arn}/*"
          ]
        },
        {
          Effect = "Allow"
          Action = [
            "codebuild:BatchGetBuilds",
            "codebuild:StartBuild"
          ]
          Resource = concat(
            [aws_codebuild_project.build_project.arn],
            var.deploy_buildspec_path != "" ? [aws_codebuild_project.deploy_project[0].arn] : [],
            var.test_buildspec_path != "" ? [aws_codebuild_project.test_project[0].arn] : [],
            var.apply_buildspec_path != "" ? [aws_codebuild_project.apply_project[0].arn] : []
          )
        }
      ],
      var.codestar_connection_arn != "" ? [
        {
          Effect = "Allow"
          Action = [
            "codestar-connections:UseConnection"
          ]
          Resource = var.codestar_connection_arn
        }
      ] : []
    )
  })
}

# IAM Role for CodeBuild
resource "aws_iam_role" "codebuild_role" {
  name = "${var.pipeline_name}-codebuild-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Policy for CodeBuild
resource "aws_iam_role_policy" "codebuild_policy" {
  name = "${var.pipeline_name}-codebuild-policy"
  role = aws_iam_role.codebuild_role.id

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
          "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/codebuild/${var.pipeline_name}*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.pipeline_artifacts.arn,
          "${aws_s3_bucket.pipeline_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition",
          "ecs:ListServices",
          "ecs:ListTasks"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = "*"
        Condition = {
          StringEqualsIfExists = {
            "iam:PassedToService" = "ecs-tasks.amazonaws.com"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = var.terraform_state_bucket_arn != "" ? var.terraform_state_bucket_arn : "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = var.terraform_state_bucket_arn != "" ? "${var.terraform_state_bucket_arn}/*" : "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:DescribeTable"
        ]
        Resource = var.terraform_state_table_arn != "" ? var.terraform_state_table_arn : "*"
      }
    ]
  })
}

# Local to determine if this is the web pipeline
locals {
  is_web_pipeline = startswith(var.pipeline_name, "web-pipeline")
}

# Additional IAM policy for S3 web bucket access (for web pipeline)
# Count depends only on pipeline name (known at plan time), bucket name is resolved at apply time
resource "aws_iam_role_policy" "codebuild_s3_web_policy" {
  count = local.is_web_pipeline ? 1 : 0
  name  = "${var.pipeline_name}-codebuild-s3-web-policy"
  role  = aws_iam_role.codebuild_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = var.web_s3_bucket_name != "" ? [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          "arn:aws:s3:::${var.web_s3_bucket_name}",
          "arn:aws:s3:::${var.web_s3_bucket_name}/*"
        ]
      }
    ] : []
  })
}

# Add read permissions to base policy for infrastructure pipeline (needed immediately for terraform plan)
resource "aws_iam_role_policy" "codebuild_read_permissions_base" {
  count = var.apply_buildspec_path != "" ? 1 : 0
  name  = "${var.pipeline_name}-codebuild-read-permissions-base"
  role  = aws_iam_role.codebuild_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "events:DescribeRule",
          "events:ListRules",
          "events:ListTargetsByRule",
          "events:DescribeEventBus",
          "events:ListEventBuses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:DescribeRules",
          "elasticloadbalancing:DescribeTags",
          "elasticloadbalancing:DescribeTargetHealth",
          "elasticloadbalancing:DescribeLoadBalancerAttributes"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeInternetGateways",
          "ec2:DescribeRouteTables",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBClusters",
          "rds:DescribeDBSubnetGroups",
          "rds:ListTagsForResource"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticache:DescribeCacheClusters",
          "elasticache:DescribeReplicationGroups",
          "elasticache:DescribeCacheSubnetGroups",
          "elasticache:ListTagsForResource"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:DescribeClusters",
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:ListClusters",
          "ecs:ListServices",
          "ecs:ListTaskDefinitions"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:DescribeAlarms",
          "cloudwatch:ListMetrics",
          "cloudwatch:GetDashboard",
          "cloudwatch:ListDashboards"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:ListTopics",
          "sns:GetTopicAttributes",
          "sns:ListSubscriptionsByTopic"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:ListSecrets"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:GetDistribution",
          "cloudfront:ListDistributions"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ListHostedZones",
          "route53:GetHostedZone",
          "route53:ListResourceRecordSets"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "acm:ListCertificates",
          "acm:DescribeCertificate"
        ]
        Resource = "*"
      }
    ]
  })
}

# Additional IAM Policy for Infrastructure Pipeline (broader permissions)
resource "aws_iam_role_policy" "codebuild_infrastructure_policy" {
  count = var.apply_buildspec_path != "" ? 1 : 0
  name  = "${var.pipeline_name}-codebuild-infrastructure-policy"
  role  = aws_iam_role.codebuild_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticache:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "application-autoscaling:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "route53:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "acm:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "wafv2:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "codepipeline:*",
          "codebuild:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "codestar-connections:PassConnection"
        ]
        Resource = var.codestar_connection_arn != "" ? var.codestar_connection_arn : "*"
        Condition = {
          StringEqualsIfExists = {
            "codestar-connections:PassedToService" = "codepipeline.amazonaws.com"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "events:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:*"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Group for CodeBuild
resource "aws_cloudwatch_log_group" "codebuild_logs" {
  name              = "/aws/codebuild/${var.pipeline_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# CodeBuild Project - Build Stage
resource "aws_codebuild_project" "build_project" {
  name          = "${var.pipeline_name}-build-${var.environment}"
  description   = "Build project for ${var.pipeline_name}"
  build_timeout = var.build_timeout
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = var.build_compute_type
    image                       = var.build_image
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = var.privileged_mode

    dynamic "environment_variable" {
      for_each = var.environment_variables
      content {
        name  = environment_variable.key
        value = environment_variable.value
      }
    }

    dynamic "environment_variable" {
      for_each = var.vite_api_url != "" ? [1] : []
      content {
        name  = "VITE_API_URL"
        value = var.vite_api_url
      }
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild_logs.name
      stream_name = "build"
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = var.buildspec_path
  }

  tags = var.tags
}

# CodeBuild Project - Deploy Stage
resource "aws_codebuild_project" "deploy_project" {
  count         = var.deploy_buildspec_path != "" ? 1 : 0
  name          = "${var.pipeline_name}-deploy-${var.environment}"
  description   = "Deploy project for ${var.pipeline_name}"
  build_timeout = var.build_timeout
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = var.build_compute_type
    image                       = var.build_image
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = true

    environment_variable {
      name  = "AWS_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = var.aws_account_id
    }

    dynamic "environment_variable" {
      for_each = var.environment_variables
      content {
        name  = environment_variable.key
        value = environment_variable.value
      }
    }

    dynamic "environment_variable" {
      for_each = var.ecr_repository_uri != "" ? [1] : []
      content {
        name  = "ECR_REPOSITORY_URI"
        value = var.ecr_repository_uri
      }
    }

    dynamic "environment_variable" {
      for_each = var.ecs_cluster_name != "" ? [1] : []
      content {
        name  = "ECS_CLUSTER_NAME"
        value = var.ecs_cluster_name
      }
    }

    dynamic "environment_variable" {
      for_each = var.ecs_service_name != "" ? [1] : []
      content {
        name  = "ECS_SERVICE_NAME"
        value = var.ecs_service_name
      }
    }

    dynamic "environment_variable" {
      for_each = var.vite_api_url != "" ? [1] : []
      content {
        name  = "VITE_API_URL"
        value = var.vite_api_url
      }
    }

    dynamic "environment_variable" {
      # Use pipeline name check (known at plan time) instead of bucket name
      for_each = local.is_web_pipeline ? [1] : []
      content {
        name  = "WEB_S3_BUCKET_NAME"
        value = var.web_s3_bucket_name
      }
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild_logs.name
      stream_name = "deploy"
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = var.deploy_buildspec_path
  }

  tags = var.tags
}

# CodeBuild Project - Test Stage
resource "aws_codebuild_project" "test_project" {
  count         = var.test_buildspec_path != "" ? 1 : 0
  name          = "${var.pipeline_name}-test-${var.environment}"
  description   = "Test project for ${var.pipeline_name}"
  build_timeout = 15
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = var.build_compute_type
    image                       = var.build_image
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = false

    environment_variable {
      name  = "AWS_REGION"
      value = var.aws_region
    }

    dynamic "environment_variable" {
      for_each = var.alb_dns_name != "" ? [1] : []
      content {
        name  = "ALB_DNS_NAME"
        value = var.alb_dns_name
      }
    }

    dynamic "environment_variable" {
      for_each = var.ecs_cluster_name != "" ? [1] : []
      content {
        name  = "ECS_CLUSTER_NAME"
        value = var.ecs_cluster_name
      }
    }

    dynamic "environment_variable" {
      for_each = var.ecs_service_name != "" ? [1] : []
      content {
        name  = "ECS_SERVICE_NAME"
        value = var.ecs_service_name
      }
    }

    dynamic "environment_variable" {
      # Use pipeline name check (known at plan time) instead of bucket name
      for_each = local.is_web_pipeline ? [1] : []
      content {
        name  = "WEB_S3_BUCKET_NAME"
        value = var.web_s3_bucket_name
      }
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild_logs.name
      stream_name = "test"
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = var.test_buildspec_path
  }

  tags = var.tags
}

# CodeBuild Project - Apply Stage (Infrastructure)
resource "aws_codebuild_project" "apply_project" {
  count         = var.apply_buildspec_path != "" ? 1 : 0
  name          = "${var.pipeline_name}-apply-${var.environment}"
  description   = "Apply project for ${var.pipeline_name}"
  build_timeout = 60
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = var.build_compute_type
    image                       = var.build_image
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = false

    dynamic "environment_variable" {
      for_each = var.environment_variables
      content {
        name  = environment_variable.key
        value = environment_variable.value
      }
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild_logs.name
      stream_name = "apply"
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = var.apply_buildspec_path
  }

  tags = var.tags
}

# CodePipeline
resource "aws_codepipeline" "pipeline" {
  name     = "${var.pipeline_name}-${var.environment}"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.pipeline_artifacts.bucket
    type     = "S3"
  }

  # Source Stage
  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        ConnectionArn    = var.codestar_connection_arn
        FullRepositoryId = var.repository_id
        BranchName       = var.branch_name != "" ? var.branch_name : "main"
        DetectChanges    = tostring(var.detect_changes)
      }
    }
  }

  # Build Stage
  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]

      configuration = {
        ProjectName = aws_codebuild_project.build_project.name
      }
    }
  }

  # Approval Stage (for infrastructure pipeline)
  dynamic "stage" {
    for_each = var.enable_approval_stage ? [1] : []
    content {
      name = var.approval_stage_name

      action {
        name     = "Approval"
        category = "Approval"
        owner    = "AWS"
        provider = "Manual"
        version  = "1"

        configuration = {
          CustomData = "Please review the Terraform plan and approve to proceed with infrastructure deployment."
        }
      }
    }
  }

  # Deploy Stage (for API/Web pipelines)
  dynamic "stage" {
    for_each = var.deploy_buildspec_path != "" ? [1] : []
    content {
      name = "Deploy"

      action {
        name             = "Deploy"
        category         = "Build"
        owner            = "AWS"
        provider         = "CodeBuild"
        version          = "1"
        input_artifacts  = ["build_output"]
        output_artifacts = ["deploy_output"]

        configuration = {
          ProjectName = aws_codebuild_project.deploy_project[0].name
          PrimarySource="build_output"
        }
      }
    }
  }

  # Test Stage (for API/Web pipelines)
  dynamic "stage" {
    for_each = var.test_buildspec_path != "" ? [1] : []
    content {
      name = "Test"

      action {
        name            = "Test"
        category        = "Build"
        owner           = "AWS"
        provider        = "CodeBuild"
        version         = "1"
        input_artifacts = ["source_output"]

        configuration = {
          ProjectName = aws_codebuild_project.test_project[0].name
        }
      }
    }
  }

  # Apply Stage (for infrastructure pipeline)
  dynamic "stage" {
    for_each = var.apply_buildspec_path != "" ? [1] : []
    content {
      name = "Apply"

      action {
        name            = "Apply"
        category        = "Build"
        owner           = "AWS"
        provider        = "CodeBuild"
        version         = "1"
        input_artifacts = ["source_output"]

        configuration = {
          ProjectName = aws_codebuild_project.apply_project[0].name
        }
      }
    }
  }

  tags = var.tags
}

# SNS Topic for Pipeline Notifications (Optional)
resource "aws_sns_topic" "pipeline_notifications" {
  count = var.enable_notifications ? 1 : 0
  name  = "${var.pipeline_name}-notifications-${var.environment}"

  tags = var.tags
}

# CloudWatch Event Target for SNS
resource "aws_cloudwatch_event_target" "sns" {
  count = var.enable_notifications ? 1 : 0
  rule  = aws_cloudwatch_event_rule.pipeline_event[0].name
  arn   = aws_sns_topic.pipeline_notifications[0].arn
}

# CloudWatch Event Rule for Pipeline State Changes
resource "aws_cloudwatch_event_rule" "pipeline_event" {
  count       = var.enable_notifications ? 1 : 0
  name        = "${var.pipeline_name}-pipeline-events-${var.environment}"
  description = "Capture pipeline state changes for ${var.pipeline_name}"

  event_pattern = jsonencode({
    source      = ["aws.codepipeline"]
    detail-type = ["CodePipeline Pipeline Execution State Change"]
    detail = {
      pipeline = [aws_codepipeline.pipeline.name]
    }
  })

  tags = var.tags
}

# SNS Topic Policy to allow CloudWatch Events
resource "aws_sns_topic_policy" "pipeline_notifications" {
  count = var.enable_notifications ? 1 : 0
  arn   = aws_sns_topic.pipeline_notifications[0].arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.pipeline_notifications[0].arn
      }
    ]
  })
}

