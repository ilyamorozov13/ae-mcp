#!/bin/bash

# AE MCP Bridge CEP Extension Installer
# This script installs the extension and enables debug mode

echo "AE MCP Bridge Extension Installer"
echo "================================="

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    EXTENSION_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
    echo "Detected macOS"
else
    echo "This script currently only supports macOS. For Windows, please install manually."
    exit 1
fi

# Create extensions directory if it doesn't exist
echo "Creating extensions directory if needed..."
mkdir -p "$EXTENSION_DIR"

# Copy extension
EXTENSION_NAME="com.aemcp.bridge"
SOURCE_DIR="$(dirname "$0")"

echo "Installing extension to: $EXTENSION_DIR/$EXTENSION_NAME"

# Remove old version if exists
if [ -d "$EXTENSION_DIR/$EXTENSION_NAME" ]; then
    echo "Removing old version..."
    rm -rf "$EXTENSION_DIR/$EXTENSION_NAME"
fi

# Copy new version
cp -R "$SOURCE_DIR" "$EXTENSION_DIR/$EXTENSION_NAME"

# Enable debug mode for unsigned extensions
echo ""
echo "Enabling debug mode for unsigned extensions..."
for version in 9 10 11 12; do
    defaults write com.adobe.CSXS.$version PlayerDebugMode 1
    echo "✓ Enabled debug mode for CSXS.$version"
done

# Kill cfprefsd to apply changes
echo ""
echo "Applying preferences changes..."
sudo killall cfprefsd 2>/dev/null || true

echo ""
echo "✅ Installation complete!"
echo ""
echo "IMPORTANT: Please follow these steps:"
echo "1. Quit After Effects if it's running"
echo "2. Start After Effects"
echo "3. Go to Window > Extensions > AE MCP Bridge"
echo ""
echo "If the extension doesn't appear:"
echo "- Make sure After Effects is fully quit before restarting"
echo "- Check the troubleshooting guide in troubleshooting.md"
echo "- You may need to restart your computer for debug mode to take effect"