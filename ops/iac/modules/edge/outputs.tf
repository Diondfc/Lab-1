# Outputs for Edge Module

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.main.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN (if HTTPS enabled)"
  value       = var.enable_https ? aws_acm_certificate.cloudfront[0].arn : null
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID (if created)"
  value       = var.enable_https && var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : null
}

output "route53_name_servers" {
  description = "Route53 hosted zone name servers (if created)"
  value       = var.enable_https && var.create_hosted_zone ? aws_route53_zone.main[0].name_servers : null
}

