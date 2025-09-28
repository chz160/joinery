#!/bin/sh
set -e

echo "Current working directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PATH: $PATH"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "node_modules directory exists"
    echo "node_modules contents (first 10 items):"
    ls -la node_modules/ | head -10
    echo "Checking for @angular/cli:"
    if [ -d "node_modules/@angular/cli" ]; then
        echo "@angular/cli exists"
        echo "Contents of @angular/cli:"
        ls -la node_modules/@angular/cli/
        if [ -d "node_modules/@angular/cli/bin" ]; then
            echo "bin directory contents:"
            ls -la node_modules/@angular/cli/bin/
        else
            echo "@angular/cli/bin directory does NOT exist"
        fi
    else
        echo "@angular/cli NOT found"
    fi
    if [ -d "node_modules/.bin" ]; then
        echo "node_modules/.bin exists:"
        ls -la node_modules/.bin/ | head -5
    else
        echo "node_modules/.bin does NOT exist"
    fi
else
    echo "ERROR: node_modules directory does not exist"
    exit 1
fi

# Try to run ng directly
if [ -f "node_modules/.bin/ng" ]; then
    echo "Running ng build using node_modules/.bin/ng..."
    node_modules/.bin/ng build
elif [ -f "node_modules/@angular/cli/bin/ng.js" ]; then
    echo "Running ng build using direct path to ng.js..."
    node node_modules/@angular/cli/bin/ng.js build
else
    echo "ERROR: Angular CLI not found"
    exit 1
fi

echo "Build completed successfully!"