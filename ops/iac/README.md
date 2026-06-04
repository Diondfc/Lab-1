# Infrastructure as Code (Terraform)

This directory contains Terraform modules for provisioning AWS infrastructure for the UBT Library project.

## Application layout (CI/CD paths)

| Component | Repository path | Buildspec |
|-----------|-----------------|-----------|
| API (Node/Express) | `project/server/` | `ops/cicd/api/buildspec-*.yml` |
| Web (Vite/React) | `project/client/` | `ops/cicd/web/buildspec-*.yml` |
| Infrastructure | `ops/iac/` | `ops/cicd/infrastructure/buildspec-*.yml` |

## Module Structure

```
ops/iac/
├── modules/
│   ├── backend/      # S3 + DynamoDB for Terraform state
│   ├── network/      # VPC, subnets, NAT, IGW, routing
│   ├── iam/          # IAM roles and policies
│   ├── data/         # RDS + Elasticache
│   └── codepipeline/ # CI/CD pipelines (already created)
├── main.tf           # Root module configuration
├── variables.tf      # Root variables
├── outputs.tf        # Root outputs
├── backend.tf        # Backend configuration (commented out initially)
└── terraform.tfvars.example  # Example variables
```

## Quick Start

### 1. Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Deploy Backend First (One-Time)

The backend module creates S3 and DynamoDB for remote state. Deploy it first:

```bash
terraform apply -target=module.backend
```

After backend is created, update `backend.tf` with actual bucket/table names and uncomment it.

### 4. Migrate State to Backend

```bash
terraform init -migrate-state
```

### 5. Deploy All Infrastructure

```bash
terraform plan
terraform apply
```

## Module Details

### Backend Module

Creates:
- S3 bucket for Terraform state (encrypted, versioned)
- DynamoDB table for state locking

**Deploy first** before enabling remote state.

### Network Module

Creates:
- VPC with DNS support
- Internet Gateway
- Public subnets (for ALB)
- Private subnets (for ECS tasks)
- Database subnets (for RDS/Elasticache)
- NAT Gateways (for private subnet internet access)
- Route tables and associations
- Subnet groups for RDS and Elasticache

### IAM Module

Creates:
- ECS Task Execution Role (pulls images, writes logs)
- ECS Task Role (for application code)
- Policies for Secrets Manager, SSM, RDS, Elasticache
- Lambda execution role (optional)

### Data Module

Creates:
- RDS PostgreSQL/MySQL instance
- Elasticache Redis cluster
- Security groups
- Secrets Manager secrets for passwords
- Parameter groups

## Variables

Key variables to configure:

- `aws_region` - AWS region
- `environment` - staging or production
- `project_name` - Project name
- `owner` - Your name
- `vpc_cidr` - VPC CIDR block
- `availability_zones` - List of AZs
- Subnet CIDRs for public, private, database
- RDS and Elasticache configuration

## Outputs

Important outputs:
- `vpc_id` - VPC ID
- `public_subnet_ids` - For ALB
- `private_subnet_ids` - For ECS
- `database_subnet_ids` - For RDS/Elasticache
- `rds_instance_endpoint` - Database connection string
- `elasticache_primary_endpoint_address` - Redis endpoint
- `ecs_task_execution_role_arn` - For ECS task definitions

## Next Steps

After deploying these modules:

1. ✅ **Backend** - S3 + DynamoDB (done)
2. ✅ **Network** - VPC, subnets (done)
3. ✅ **IAM** - Roles and policies (done)
4. ✅ **Data** - RDS + Elasticache (done)
5. ⏭️ **Compute** - ECS Cluster, Services, ALB
6. ⏭️ **Edge** - CloudFront, WAF, Route53
7. ⏭️ **Observability** - CloudWatch dashboards, alarms

## Cost Considerations

- **NAT Gateways**: ~$32/month each (consider single NAT for staging)
- **RDS**: Depends on instance class (db.t3.micro ~$15/month)
- **Elasticache**: Depends on node type (cache.t3.micro ~$13/month)
- **S3 + DynamoDB**: Minimal for state storage (~$1/month)

## Security Notes

- All passwords auto-generated and stored in Secrets Manager
- RDS and Elasticache in private subnets (no public access)
- Security groups restrict access to ECS only
- Encryption enabled for RDS and Elasticache

## Troubleshooting

### State Lock Error

If you get a state lock error:
```bash
terraform force-unlock <LOCK_ID>
```

### Backend Already Exists

If backend resources already exist, import them:
```bash
terraform import module.backend.aws_s3_bucket.terraform_state <bucket-name>
terraform import module.backend.aws_dynamodb_table.terraform_locks <table-name>
```

## References

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

