#!/bin/bash
# Render build script for backend

echo "🔨 Building backend..."

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build TypeScript
npm run build

# Run migrations (if needed)
# npx prisma migrate deploy

echo "✅ Build complete!"

