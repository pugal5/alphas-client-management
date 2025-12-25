#!/bin/bash
# Generate JWT secrets for Render deployment

echo "🔐 Generating JWT Secrets for Render..."
echo ""
echo "Copy these to your Render environment variables:"
echo ""
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo ""
echo "✅ Done! Paste these into Render's environment variables."

