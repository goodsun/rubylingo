#!/bin/bash

# RubyLingo Lambda Deployment Script

echo "🚀 Starting RubyLingo Lambda deployment..."

# Check if AWS credentials are configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create deployment package
echo "📦 Creating deployment package..."
rm -f rubylingo-lambda.zip

# Package the application
zip -r rubylingo-lambda.zip . \
  -x "*.git*" \
  -x "scripts/*" \
  -x "docs/*" \
  -x "tests/*" \
  -x "coverage/*" \
  -x "*.log" \
  -x "*.md" \
  -x ".env*" \
  -x "deploy.sh" \
  -x "serverless.yml" \
  -x "data/raw/*" \
  -x "dictionaries/basic.json" \
  -x "dictionaries/business.json" \
  -x "dictionaries/academic.json" \
  -x "dictionaries/comprehensive.json"

echo "📏 Package size: $(du -h rubylingo-lambda.zip | cut -f1)"

# Deploy using Serverless Framework
echo "🚀 Deploying to AWS Lambda..."
npx serverless deploy --stage production

# Get deployment info
echo ""
echo "📋 Deployment Information:"
npx serverless info --stage production

# Extract API endpoint
API_ENDPOINT=$(npx serverless info --stage production | grep "endpoint: " | head -1 | awk '{print $2}')

if [ ! -z "$API_ENDPOINT" ]; then
    echo ""
    echo "✅ Deployment complete!"
    echo "🌐 API Endpoint: $API_ENDPOINT"
    echo ""
    echo "📝 Test your deployment:"
    echo "curl -X GET $API_ENDPOINT/api/health"
    echo ""
    echo "🔍 Convert text example:"
    echo "curl -X POST $API_ENDPOINT/api/convert \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"text\":\"今日は良い天気です\",\"dictionary\":\"business\"}'"
else
    echo "⚠️  Could not extract API endpoint. Check deployment status manually."
fi