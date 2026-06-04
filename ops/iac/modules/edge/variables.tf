# Variables for Edge Module

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  type        = string
}

variable "web_s3_bucket_name" {
  description = "Name of the S3 bucket for web static hosting"
  type        = string
  default     = ""
}

variable "enable_https" {
  description = "Enable HTTPS with custom domain"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name for CloudFront and Route53"
  type        = string
  default     = ""
}

variable "subject_alternative_names" {
  description = "Subject alternative names for ACM certificate"
  type        = list(string)
  default     = []
}

variable "hosted_zone_id" {
  description = "Existing Route53 hosted zone ID (leave empty to create new)"
  type        = string
  default     = ""
}

variable "create_hosted_zone" {
  description = "Create new Route53 hosted zone"
  type        = bool
  default     = true
}

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
  validation {
    condition     = contains(["PriceClass_All", "PriceClass_200", "PriceClass_100"], var.cloudfront_price_class)
    error_message = "Price class must be one of: PriceClass_All, PriceClass_200, PriceClass_100"
  }
}

variable "waf_rate_limit" {
  description = "WAF rate limit (requests per 5 minutes)"
  type        = number
  default     = 2000
}

variable "cloudfront_lambda_functions" {
  description = "List of Lambda@Edge function associations"
  type = list(object({
    event_type   = string
    lambda_arn   = string
    include_body = optional(bool, false)
  }))
  default = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

