# Observability Module
# Creates CloudWatch dashboards, alarms, and SNS topics

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${var.environment}"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-alerts-${var.environment}"
    }
  )
}

# SNS Topic Subscription (Email)
resource "aws_sns_topic_subscription" "email" {
  count     = length(var.alert_email_addresses)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email_addresses[count.index]
}

# CloudWatch Dashboard - Application Overview
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { "stat" = "Sum", "label" = "Total Requests" }],
            [".", "HTTPCode_Target_2XX_Count", { "stat" = "Sum", "label" = "2xx" }],
            [".", "HTTPCode_Target_4XX_Count", { "stat" = "Sum", "label" = "4xx" }],
            [".", "HTTPCode_Target_5XX_Count", { "stat" = "Sum", "label" = "5xx" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Request Counts (2xx / 4xx / 5xx)"
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { "stat" = "Average", "label" = "Average Latency" }],
            [".", "TargetResponseTime", { "stat" = "p99", "label" = "p99 Latency" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Latency"
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { "stat" = "Average", "label" = "CPU" }],
            [".", "MemoryUtilization", { "stat" = "Average", "label" = "Memory" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Resource Utilization"
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { "stat" = "Average", "label" = "DB Connections" }],
            [".", "CPUUtilization", { "stat" = "Average", "label" = "DB CPU" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Metrics"
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ElastiCache", "CacheHits", { "stat" = "Sum", "label" = "Cache Hits" }],
            [".", "CacheMisses", { "stat" = "Sum", "label" = "Cache Misses" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Elasticache Cache Hit Ratio"
          view   = "timeSeries"
        }
      }
    ]
  })
}

# CloudWatch Alarm - High 5xx Error Rate
resource "aws_cloudwatch_metric_alarm" "high_5xx_errors" {
  alarm_name          = "${var.project_name}-high-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = var.high_5xx_threshold
  alarm_description   = "This metric monitors high 5xx error rate"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-high-5xx-errors-${var.environment}"
    }
  )
}

# CloudWatch Alarm - High Latency
resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "${var.project_name}-high-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = var.high_latency_threshold
  alarm_description   = "This metric monitors high latency"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-high-latency-${var.environment}"
    }
  )
}

# CloudWatch Alarm - High CPU Utilization (ECS)
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-high-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.high_cpu_threshold
  alarm_description   = "This metric monitors high CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-high-cpu-${var.environment}"
    }
  )
}

# CloudWatch Alarm - RDS High Connections
resource "aws_cloudwatch_metric_alarm" "rds_high_connections" {
  count               = var.enable_rds_alarms ? 1 : 0
  alarm_name          = "${var.project_name}-rds-high-connections-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.rds_high_connections_threshold
  alarm_description   = "This metric monitors RDS database connections"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-rds-high-connections-${var.environment}"
    }
  )
}

# CloudWatch Alarm - Elasticache High Memory
resource "aws_cloudwatch_metric_alarm" "elasticache_high_memory" {
  count               = var.enable_elasticache_alarms ? 1 : 0
  alarm_name          = "${var.project_name}-elasticache-high-memory-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = var.elasticache_high_memory_threshold
  alarm_description   = "This metric monitors Elasticache memory usage"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ReplicationGroupId = var.elasticache_replication_group_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-elasticache-high-memory-${var.environment}"
    }
  )
}

# CloudWatch Log Metric Filter - Error Rate
resource "aws_cloudwatch_log_metric_filter" "error_rate" {
  name           = "${var.project_name}-error-rate-${var.environment}"
  log_group_name = var.log_group_name
  pattern        = "[timestamp, level=ERROR, ...]"

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "${var.project_name}/${var.environment}"
    value         = "1"
    default_value = 0
  }
}

# CloudWatch Alarm - Error Rate from Logs
resource "aws_cloudwatch_metric_alarm" "error_rate" {
  count               = var.log_group_name != "" ? 1 : 0
  alarm_name          = "${var.project_name}-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "${var.project_name}/${var.environment}"
  period              = 300
  statistic           = "Sum"
  threshold           = var.error_rate_threshold
  alarm_description   = "This metric monitors error rate from application logs"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-error-rate-${var.environment}"
    }
  )
}

