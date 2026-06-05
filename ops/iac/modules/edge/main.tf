# Edge Module
# Creates CloudFront, WAF, Route53, and ACM certificates

# Data source for current AWS region
data "aws_region" "current" {}

# ACM Certificate (for CloudFront - must be in us-east-1)
resource "aws_acm_certificate" "cloudfront" {
  count             = var.enable_https ? 1 : 0
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = var.subject_alternative_names

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-cloudfront-cert-${var.environment}"
    }
  )
}

# ACM Certificate Validation
resource "aws_acm_certificate_validation" "cloudfront" {
  count                   = var.enable_https ? 1 : 0
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cloudfront[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name        = "${var.project_name}-waf-${var.environment}"
  description = "WAF for ${var.project_name} ${var.environment}"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf-${var.environment}"
    sampled_requests_enabled   = true
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit
        aggregate_key_type = "IP"
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-RateLimit-${var.environment}"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Common Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-CommonRuleSet-${var.environment}"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-KnownBadInputs-${var.environment}"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Linux Operating System
  rule {
    name     = "AWSManagedRulesLinuxRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesLinuxRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-LinuxRuleSet-${var.environment}"
      sampled_requests_enabled   = true
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-waf-${var.environment}"
    }
  )
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for ${var.project_name} ${var.environment}"
  default_root_object = "index.html"
  price_class         = var.cloudfront_price_class

  aliases = var.enable_https ? [var.domain_name] : []

  origin {
    domain_name         = var.alb_dns_name
    origin_id           = "alb-origin"
    connection_attempts = 3
    connection_timeout  = 10
    origin_path         = ""
    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "https-only"
      origin_ssl_protocols     = ["TLSv1.2"]
      origin_keepalive_timeout = 5
      origin_read_timeout      = 30
    }
  }

  dynamic "origin" {
    for_each = var.web_s3_bucket_name != "" ? [1] : []
    content {
      domain_name = "${var.web_s3_bucket_name}.s3-website-${data.aws_region.current.name}.amazonaws.com"
      origin_id   = "s3-origin"
      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "http-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = var.web_s3_bucket_name != "" ? "s3-origin" : "alb-origin"

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "CloudFront-Forwarded-Proto"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = var.enable_https ? "redirect-to-https" : "allow-all"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true

    dynamic "lambda_function_association" {
      for_each = var.cloudfront_lambda_functions
      content {
        event_type   = lambda_function_association.value.event_type
        lambda_arn   = lambda_function_association.value.lambda_arn
        include_body = lookup(lambda_function_association.value, "include_body", false)
      }
    }
  }

  # Cache behavior for API - route to ALB
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "alb-origin"

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "CloudFront-Forwarded-Proto"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = var.enable_https ? "redirect-to-https" : "allow-all"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.enable_https ? aws_acm_certificate.cloudfront[0].arn : null
    ssl_support_method             = var.enable_https ? "sni-only" : null
    minimum_protocol_version       = var.enable_https ? "TLSv1.2_2021" : null
    cloudfront_default_certificate = var.enable_https ? false : true
  }

  web_acl_id = aws_wafv2_web_acl.main.arn

  lifecycle {
    # Workaround for AWS provider bug with CloudFront origin configuration
    # The provider sometimes produces inconsistent plans during apply
    # This prevents Terraform from trying to update origins unnecessarily
    create_before_destroy = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-cloudfront-${var.environment}"
    }
  )
}

# Route53 Hosted Zone (if domain provided)
resource "aws_route53_zone" "main" {
  count = var.enable_https && var.create_hosted_zone ? 1 : 0
  name  = var.domain_name

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-hosted-zone-${var.environment}"
    }
  )
}

# Route53 Record for Domain (A record pointing to CloudFront)
resource "aws_route53_record" "main" {
  count   = var.enable_https ? 1 : 0
  zone_id = var.hosted_zone_id != "" ? var.hosted_zone_id : aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# Route53 Record for Certificate Validation
resource "aws_route53_record" "cert_validation" {
  for_each = var.enable_https ? {
    for dvo in aws_acm_certificate.cloudfront[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.hosted_zone_id != "" ? var.hosted_zone_id : aws_route53_zone.main[0].zone_id
}


