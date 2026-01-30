#!/bin/bash

# Authentik - Dependency Installation Script
# This script helps resolve npm cache permission issues and installs dependencies

echo "🚀 Authentik - Installing Dependencies"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   echo "⚠️  Please do not run this script as root (with sudo)"
   exit 1
fi

# Step 1: Fix npm cache permissions
echo "Step 1: Fixing npm cache permissions..."
echo "You may be prompted for your password."
sudo chown -R $(whoami) ~/.npm

if [ $? -ne 0 ]; then
    echo "❌ Failed to fix npm cache permissions"
    echo "Please run manually: sudo chown -R \$(whoami) ~/.npm"
    exit 1
fi

echo "✅ npm cache permissions fixed"
echo ""

# Step 2: Clean npm cache
echo "Step 2: Cleaning npm cache..."
npm cache clean --force

echo "✅ npm cache cleaned"
echo ""

# Step 3: Install dependencies
echo "Step 3: Installing dependencies..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    echo "Please try manually: npm install --legacy-peer-deps"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Step 4: Verify installation
echo "Step 4: Verifying installation..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory exists"
else
    echo "❌ node_modules directory not found"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.local.example to .env.local"
echo "2. Fill in your Supabase and Mapbox credentials"
echo "3. Run: npm run dev"
echo ""
