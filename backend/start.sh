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

if [ "$RUN_DB_PUSH_ON_STARTUP" = "1" ]; then
    echo "📊 Running database schema push..."
    npx drizzle-kit push --force

    if [ $? -ne 0 ]; then
        echo "❌ Database schema push failed!"
        echo "Please check your DATABASE_URL connection string."
        exit 1
    fi

    echo "✅ Database schema push completed!"
else
    echo "⏭️  Skipping database schema push on startup (set RUN_DB_PUSH_ON_STARTUP=1 to enable)."
fi
echo "🎯 Starting application..."

# Start the NestJS application
exec node dist/main.js
