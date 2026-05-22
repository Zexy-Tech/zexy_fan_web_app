#!/bin/bash

# Sentry Release Automation Script for Zexy Fan Web
# Usage: ./scripts/sentry-release.sh [VERSION]

if [ -z "$1" ]; then
    VERSION=$(git rev-parse --short HEAD)
else
    VERSION=$1
fi

export SENTRY_ORG="adysun-ventures-pvt-ltd"
export SENTRY_PROJECT="zexy-fan-web"

echo "🚀 Creating Sentry release for Fan Web: $VERSION"

# Create a release
sentry-cli releases new -p $SENTRY_PROJECT "$VERSION"

# Customize: Associate commits
sentry-cli releases set-commits --auto "$VERSION"

# Finalize the release
sentry-cli releases finalize "$VERSION"

echo "✅ Release $VERSION finalized."
