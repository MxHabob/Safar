#!/bin/bash
# Script to create initial migration - Auto-detects container
# Usage: ./scripts/create_initial_migration_auto.sh

set -e

echo "🚀 Creating initial migration for Safar Backend..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND_DIR"

# Try to find container using docker-compose first
if command -v docker-compose &> /dev/null; then
    echo "📋 Using docker-compose..."
    
    # Check if services are running
    if docker-compose ps | grep -q "safar_backend.*Up"; then
        echo "✅ Backend container is running"
        
        # Check if migrations directory exists
        if [ ! -d "alembic/versions" ]; then
            echo "📁 Creating migrations directory..."
            mkdir -p alembic/versions
        fi
        
        # Check if there are existing migrations
        if [ "$(ls -A alembic/versions/*.py 2>/dev/null)" ]; then
            echo "⚠️  Warning: There are existing migrations in alembic/versions/"
            echo "   Existing migrations:"
            ls -1 alembic/versions/*.py
            echo ""
            read -p "Do you want to continue? This will create a new migration. (y/N): " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "❌ Cancelled."
                exit 1
            fi
        fi
        
        # Create initial migration
        echo "📝 Creating initial migration..."
        docker-compose exec backend alembic revision --autogenerate -m "initial"
        
        # Check if migration was created
        if [ "$(ls -A alembic/versions/*initial*.py 2>/dev/null)" ]; then
            echo ""
            echo "✅ Initial migration created successfully!"
            echo ""
            echo "📄 Migration file:"
            ls -1 alembic/versions/*initial*.py | tail -1
            echo ""
            echo "📋 Next steps:"
            echo "   1. Review the migration file"
            echo "   2. Apply the migration: make migrate"
            echo "      or: docker-compose exec backend alembic upgrade head"
        else
            echo "❌ Error: Migration file was not created"
            exit 1
        fi
        exit 0
    fi
fi

# Fallback: Try to find container by name or image
echo "📋 Trying to find container..."
CONTAINER_ID=""

# Try by container name
if docker ps --format "{{.Names}}" | grep -q "safar_backend"; then
    CONTAINER_ID=$(docker ps --format "{{.ID}}" --filter "name=safar_backend" | head -1)
    echo "✅ Found container by name: $CONTAINER_ID"
elif docker ps --format "{{.Names}}" | grep -q "backend"; then
    CONTAINER_ID=$(docker ps --format "{{.ID}}" --filter "name=backend" | head -1)
    echo "✅ Found container by name: $CONTAINER_ID"
else
    # Try to find any running container with alembic or python
    CONTAINER_ID=$(docker ps --format "{{.ID}}" --filter "ancestor=python:3.11-slim" | head -1)
    if [ -n "$CONTAINER_ID" ]; then
        echo "✅ Found container by image: $CONTAINER_ID"
    fi
fi

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ Error: Could not find backend container"
    echo ""
    echo "Please run one of the following:"
    echo "  1. docker-compose up -d"
    echo "  2. Or provide container ID manually:"
    echo "     docker exec <container_id> alembic revision --autogenerate -m \"initial\""
    echo ""
    echo "To find your container ID:"
    echo "  docker ps"
    exit 1
fi

# Check if migrations directory exists
if [ ! -d "alembic/versions" ]; then
    echo "📁 Creating migrations directory..."
    mkdir -p alembic/versions
fi

# Check if there are existing migrations
if [ "$(ls -A alembic/versions/*.py 2>/dev/null)" ]; then
    echo "⚠️  Warning: There are existing migrations in alembic/versions/"
    echo "   Existing migrations:"
    ls -1 alembic/versions/*.py
    echo ""
    read -p "Do you want to continue? This will create a new migration. (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled."
        exit 1
    fi
fi

# Create initial migration
echo "📝 Creating initial migration in container $CONTAINER_ID..."
docker exec "$CONTAINER_ID" alembic revision --autogenerate -m "initial"

# Check if migration was created
if [ "$(ls -A alembic/versions/*initial*.py 2>/dev/null)" ]; then
    echo ""
    echo "✅ Initial migration created successfully!"
    echo ""
    echo "📄 Migration file:"
    ls -1 alembic/versions/*initial*.py | tail -1
    echo ""
    echo "📋 Next steps:"
    echo "   1. Review the migration file"
    echo "   2. Apply the migration:"
    echo "      docker exec $CONTAINER_ID alembic upgrade head"
else
    echo "❌ Error: Migration file was not created"
    exit 1
fi

