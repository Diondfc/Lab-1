#!/bin/bash
# Script to remove EventBridge targets before destroying rules

echo "Removing EventBridge targets..."

# Remove target from api-pipeline rule
echo "Removing target from api-pipeline-pipeline-events-staging..."
aws events remove-targets \
  --rule api-pipeline-pipeline-events-staging \
  --ids "1" \
  2>/dev/null || echo "Target already removed or rule doesn't exist"

# Remove target from web-pipeline rule
echo "Removing target from web-pipeline-pipeline-events-staging..."
aws events remove-targets \
  --rule web-pipeline-pipeline-events-staging \
  --ids "1" \
  2>/dev/null || echo "Target already removed or rule doesn't exist"

echo "EventBridge targets removed. You can now run terraform destroy."

