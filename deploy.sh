#!/bin/bash

# SUSCC Adjunct Tracker - Deployment Script
# This script pulls the latest changes and rebuilds the application

set -e  # Exit on any error

echo "=========================================="
echo "SUSCC Adjunct Tracker - Deployment"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Fetch latest changes
echo "→ Fetching latest changes from remote..."
git fetch origin
echo ""

# Pull changes
echo "→ Pulling latest changes..."
git pull origin "$CURRENT_BRANCH"
PULL_EXIT_CODE=$?

if [ $PULL_EXIT_CODE -eq 0 ]; then
    echo "✓ Code updated successfully"
else
    echo "✗ Failed to pull changes (exit code: $PULL_EXIT_CODE)"
    exit 1
fi
echo ""

# Show latest commits
echo "→ Latest commits:"
git log --oneline -3
echo ""

# Rebuild and restart containers
echo "→ Rebuilding and restarting Docker containers..."
docker compose up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✓ Deployment completed successfully!"
    echo "=========================================="
    echo ""
    echo "Container status:"
    docker compose ps
    echo ""
    echo "To view logs: docker compose logs -f"
else
    echo ""
    echo "✗ Deployment failed during Docker build"
    exit 1
fi
