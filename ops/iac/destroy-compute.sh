#!/bin/bash
# Script to destroy compute module resources

cd "$(dirname "$0")"

echo "Destroying compute module resources..."
echo "This will destroy:"
echo "  - ECS Cluster and Services (API and Web)"
echo "  - ALB and Target Groups"
echo "  - ECR Repositories"
echo "  - Auto Scaling configurations"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

echo "Initializing Terraform..."
terraform init

echo "Destroying compute module..."
terraform destroy -target=module.compute \
  -var="owner=${TF_VAR_owner:-}" \
  -var="codestar_connection_arn=${TF_VAR_codestar_connection_arn:-}" \
  -var="repository_id=${TF_VAR_repository_id:-}" \
  -auto-approve

echo "Compute module destruction complete!"

