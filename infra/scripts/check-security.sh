#!/bin/bash

# Security check script for Joinery infrastructure
# Checks for common security issues in deployment configurations

set -euo pipefail

echo "🔒 Running security checks for Joinery infrastructure..."

ISSUES_FOUND=0

# Check for secrets in example files
echo "📝 Checking example configuration files..."

if grep -r "password.*=" examples/ --include="*.json" --include="*.yml" --include="*.yaml" | grep -v "your-" | grep -v "example" | grep -v "placeholder"; then
    echo "❌ Found potential real passwords in example files"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ No real passwords found in example files"
fi

# Check for hardcoded secrets in scripts
echo "📝 Checking deployment scripts..."

if grep -r "password.*=" scripts/ | grep -v "PASSWORD" | grep -v "\${" | grep -v "\$DOCKER_REGISTRY_TOKEN" | grep -v "your-"; then
    echo "❌ Found potential hardcoded secrets in scripts"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ No hardcoded secrets found in scripts"
fi

# Check for proper secret placeholder patterns
echo "📝 Checking secret placeholder patterns..."

SECRET_PATTERNS=(
    "your-"
    "example"
    "placeholder"
    "changeme"
    "\${.*}"
    "<.*>"
)

VALID_PLACEHOLDERS=true
for pattern in "${SECRET_PATTERNS[@]}"; do
    if ! grep -r "$pattern" examples/ --include="*.json" --include="*.yml" --include="*.example" >/dev/null 2>&1; then
        VALID_PLACEHOLDERS=false
    fi
done

if [ "$VALID_PLACEHOLDERS" = true ]; then
    echo "✅ Example files use proper placeholder patterns"
else
    echo "⚠️  Some example files may be missing proper placeholders"
fi

# Check Docker security practices
echo "📝 Checking Docker security practices..."

# Check if Dockerfiles use non-root users
if grep -r "USER.*root" docker/ examples/ || ! grep -r "USER" docker/ examples/ | grep -v "root"; then
    echo "❌ Some Dockerfiles may not use non-root users properly"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ Dockerfiles use non-root users"
fi

# Check for COPY --chown usage
if grep -r "COPY.*--chown" docker/ examples/ >/dev/null 2>&1; then
    echo "✅ Dockerfiles use proper file ownership"
else
    echo "⚠️  Consider using COPY --chown for better security"
fi

# Check SSH security in scripts
echo "📝 Checking SSH security practices..."

if grep -r "chmod 600" scripts/ >/dev/null 2>&1; then
    echo "✅ SSH key permissions are set correctly"
else
    echo "❌ SSH key permissions may not be secure"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if grep -r "ssh-keyscan" scripts/ >/dev/null 2>&1; then
    echo "✅ SSH host key verification is implemented"
else
    echo "⚠️  Consider adding SSH host key verification"
fi

# Check for environment variable usage
echo "📝 Checking environment variable usage..."

if grep -r "\$\{.*TOKEN.*\}" scripts/ .github/ >/dev/null 2>&1; then
    echo "✅ Scripts use environment variables for tokens"
else
    echo "⚠️  Consider using environment variables for sensitive data"
fi

# Check GitHub Actions security
echo "📝 Checking GitHub Actions security..."

if grep -r "secrets\." .github/workflows/ >/dev/null 2>&1; then
    echo "✅ GitHub Actions use secrets properly"
else
    echo "❌ GitHub Actions should use secrets for sensitive data"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check for pinned action versions
if grep -r "@v[0-9]" .github/workflows/ >/dev/null 2>&1; then
    echo "✅ GitHub Actions use pinned versions"
else
    echo "⚠️  Consider pinning GitHub Action versions"
fi

# Summary
echo ""
echo "🔒 Security check summary:"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ No critical security issues found!"
    exit 0
else
    echo "❌ Found $ISSUES_FOUND critical security issue(s) that should be addressed"
    echo ""
    echo "📋 Recommended actions:"
    echo "- Review and fix any hardcoded secrets"
    echo "- Ensure all example files use placeholder values"
    echo "- Verify Docker containers run as non-root users"
    echo "- Check SSH key permissions and host verification"
    echo "- Use GitHub Actions secrets for sensitive data"
    exit 1
fi