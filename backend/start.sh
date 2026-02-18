#!/bin/sh
# Startup script for Contently Backend
# This script runs database migrations before starting the app

echo "🚀 Starting Contently Backend..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set!"
    echo "Please set the DATABASE_URL environment variable in Dokploy."
    exit 1
fi

echo "📊 Running database migrations..."
npx drizzle-kit push --force

if [ $? -ne 0 ]; then
    echo "❌ Database migration failed!"
    echo "Please check your DATABASE_URL connection string."
    exit 1
fi

echo "✅ Database migrations completed!"
echo "🎯 Starting application..."

# Start the NestJS application
exec node dist/main.js
