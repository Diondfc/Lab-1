terraform {
  backend "s3" {
    bucket         = "apprenticefinal-bucket" # Use actual bucket name
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "apprenticefinal-terraform-locks-staging" # Use actual table name
    encrypt        = true
  }
}

