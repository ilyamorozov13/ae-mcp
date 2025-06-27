#!/bin/bash

echo "=== Adobe After Effects CEP Extension Installer ==="
echo

# Set extension name and paths
EXTENSION_NAME="ae-mcp-bridge"
SOURCE_DIR="$(pwd)/ae-extension"
USER_EXTENSIONS_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"

# Create extensions directory if it doesn't exist
echo "Creating extensions directory..."
mkdir -p "$USER_EXTENSIONS_DIR"

# Remove old installation if exists
if [ -d "$USER_EXTENSIONS_DIR/$EXTENSION_NAME" ]; then
    echo "Removing old installation..."
    rm -rf "$USER_EXTENSIONS_DIR/$EXTENSION_NAME"
fi

# Copy extension
echo "Installing extension..."
cp -r "$SOURCE_DIR" "$USER_EXTENSIONS_DIR/$EXTENSION_NAME"

# Set permissions
echo "Setting permissions..."
chmod -R 755 "$USER_EXTENSIONS_DIR/$EXTENSION_NAME"

# Enable debug mode for all CEP versions
echo "Enabling CEP debug mode..."
defaults write com.adobe.CSXS.7 PlayerDebugMode 1
defaults write com.adobe.CSXS.8 PlayerDebugMode 1
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1

echo
echo "✅ Installation complete!"
echo
echo "Next steps:"
echo "1. Restart After Effects"
echo "2. Go to Window > Extensions > AE MCP Bridge"
echo "3. If it doesn't appear, run the diagnostic script:"
echo "   File > Scripts > Run Script File > diagnose-cep.jsx"
echo
echo "Extension installed to: $USER_EXTENSIONS_DIR/$EXTENSION_NAME"