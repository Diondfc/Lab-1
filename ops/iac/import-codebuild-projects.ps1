# PowerShell script to import existing CodeBuild projects and CodePipelines into Terraform state
# Run this from the ops/iac directory

$ErrorActionPreference = "Stop"

# Change to the script's directory (ops/iac)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Importing existing CodeBuild projects into Terraform state..." -ForegroundColor Green
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan

# Check if state is locked
Write-Host "`nChecking for Terraform state lock..." -ForegroundColor Yellow
$lockCheck = terraform force-unlock -help 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Note: If you get a lock error, you may need to run:" -ForegroundColor Yellow
    Write-Host "  terraform force-unlock <LOCK_ID>" -ForegroundColor Yellow
    Write-Host "  (Get the LOCK_ID from the error message)" -ForegroundColor Yellow
}

# Get the environment from terraform.tfvars (assuming staging)
$environment = "staging"

Write-Host "`nAttempting to import CodeBuild projects for environment: $environment" -ForegroundColor Cyan
Write-Host "If you get 'ResourceAlreadyExistsException', the resources are already in state." -ForegroundColor Yellow
Write-Host "If you get a lock error, wait a moment or force-unlock the state." -ForegroundColor Yellow

# Import infrastructure-pipeline-build-staging
Write-Host "`n[1/3] Importing infrastructure-pipeline-build-$environment..." -ForegroundColor Yellow
terraform import "module.infrastructure_pipeline.aws_codebuild_project.build_project" "infrastructure-pipeline-build-$environment"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Successfully imported" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to import (may already be in state or locked)" -ForegroundColor Red
}

# Import web-pipeline-build-staging
Write-Host "`n[2/3] Importing web-pipeline-build-$environment..." -ForegroundColor Yellow
terraform import "module.web_pipeline.aws_codebuild_project.build_project" "web-pipeline-build-$environment"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Successfully imported" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to import (may already be in state or locked)" -ForegroundColor Red
}

# Import api-pipeline-build-staging
Write-Host "`n[3/3] Importing api-pipeline-build-$environment..." -ForegroundColor Yellow
terraform import "module.api_pipeline.aws_codebuild_project.build_project" "api-pipeline-build-$environment"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Successfully imported" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to import (may already be in state or locked)" -ForegroundColor Red
}

Write-Host "`n=== Importing CodePipeline Resources ===" -ForegroundColor Cyan

# Import infrastructure-pipeline-staging
Write-Host "`n[1/3] Importing infrastructure-pipeline-$environment..." -ForegroundColor Yellow
terraform import "module.infrastructure_pipeline.aws_codepipeline.pipeline" "infrastructure-pipeline-$environment"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Successfully imported" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to import (may already be in state or locked)" -ForegroundColor Red
}

# Import web-pipeline-staging
Write-Host "`n[2/3] Importing web-pipeline-$environment..." -ForegroundColor Yellow
terraform import "module.web_pipeline.aws_codepipeline.pipeline" "web-pipeline-$environment"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Successfully imported" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to import (may already be in state or locked)" -ForegroundColor Red
}

# Import api-pipeline-staging
Write-Host "`n[3/3] Importing api-pipeline-$environment..." -ForegroundColor Yellow
terraform import "module.api_pipeline.aws_codepipeline.pipeline" "api-pipeline-$environment"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Successfully imported" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to import (may already be in state or locked)" -ForegroundColor Red
}

Write-Host "`nImport process completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. If you had lock errors, wait a moment and try again" -ForegroundColor White
Write-Host "  2. Run 'terraform plan' to see if there are any differences" -ForegroundColor White
Write-Host "  3. If resources are already in state, you can proceed with 'terraform apply'" -ForegroundColor White

