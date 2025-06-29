#!/bin/bash

# AE-MCP Pro Package Builder
# This script creates a distributable package for macOS

set -e

echo "🚀 Building AE-MCP Pro Package..."

# Configuration
VERSION="1.0.0"
PRODUCT_NAME="AE-MCP-Pro"
BUILD_DIR="./build"
DIST_DIR="./dist"
PKG_DIR="$DIST_DIR/$PRODUCT_NAME-v$VERSION"

# Clean previous builds
rm -rf $BUILD_DIR $DIST_DIR
mkdir -p $BUILD_DIR $PKG_DIR

# Step 1: Build MCP Server
echo "📦 Building MCP Server..."
cd ..
npm install
npm run build

# Step 2: Create standalone executable using pkg
echo "🔨 Creating standalone executable..."
npm install -g pkg
pkg . --targets node18-macos-x64 --output $BUILD_DIR/ae-mcp-server

# Step 3: Copy CEP Extension
echo "📋 Copying CEP Extension..."
cp -r cep-extension distribution/$PKG_DIR/

# Step 4: Create installer scripts
echo "📝 Creating installer scripts..."

# Mac installer
cat > distribution/$PKG_DIR/install-mac.command << 'EOF'
#!/bin/bash

echo "🎬 AE-MCP Pro Installer"
echo "======================"
echo ""

# Check if After Effects is installed
if [ ! -d "/Applications/Adobe After Effects"* ]; then
    echo "❌ Adobe After Effects not found. Please install After Effects first."
    exit 1
fi

# Request admin privileges
echo "🔐 This installer needs admin privileges to install system components."
sudo -v

# Create directories
echo "📁 Creating directories..."
sudo mkdir -p "/Applications/AE-MCP-Pro"
mkdir -p "$HOME/Library/Application Support/Adobe/CEP/extensions"

# Copy MCP Server
echo "📦 Installing MCP Server..."
sudo cp -f "./ae-mcp-server" "/Applications/AE-MCP-Pro/"
sudo chmod +x "/Applications/AE-MCP-Pro/ae-mcp-server"

# Copy CEP Extension
echo "🎨 Installing After Effects Extension..."
cp -rf "./cep-extension" "$HOME/Library/Application Support/Adobe/CEP/extensions/ae-mcp"

# Enable CEP Debug Mode
echo "🔧 Configuring After Effects..."
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1

# Create uninstaller
echo "🗑️ Creating uninstaller..."
sudo tee "/Applications/AE-MCP-Pro/uninstall.command" > /dev/null << 'UNINSTALL'
#!/bin/bash
echo "Uninstalling AE-MCP Pro..."
sudo rm -rf "/Applications/AE-MCP-Pro"
rm -rf "$HOME/Library/Application Support/Adobe/CEP/extensions/ae-mcp"
echo "✅ AE-MCP Pro has been uninstalled."
UNINSTALL
sudo chmod +x "/Applications/AE-MCP-Pro/uninstall.command"

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Restart After Effects"
echo "2. Go to Window > Extensions > AE-MCP"
echo "3. Configure your AI assistant (see INSTALLATION_GUIDE.md)"
echo ""
echo "Press any key to continue..."
read -n 1

EOF

chmod +x distribution/$PKG_DIR/install-mac.command

# Step 5: Copy documentation
echo "📚 Copying documentation..."
cp distribution/INSTALLATION_GUIDE.md $PKG_DIR/
cp ../README.md $PKG_DIR/README-ORIGINAL.md

# Create product README
cat > $PKG_DIR/README.txt << EOF
AE-MCP Pro v$VERSION
===================

Thank you for purchasing AE-MCP Pro!

Quick Start:
1. Run install-mac.command (double-click)
2. Open After Effects
3. Configure your AI assistant (see INSTALLATION_GUIDE.md)

Support: support@aemcppro.com

Your license key has been sent to your email.

EOF

# Step 6: Copy server files
echo "🚀 Copying server executable..."
cp $BUILD_DIR/ae-mcp-server $PKG_DIR/

# Step 7: Create examples directory
echo "📝 Creating examples..."
mkdir -p $PKG_DIR/examples
cat > $PKG_DIR/examples/basic-automation.txt << 'EOF'
// Example 1: Create a simple animation
"Create a new composition called 'Logo Animation' that's 1920x1080, 30fps, 5 seconds long"
"Add a text layer with the text 'HELLO WORLD'"
"Animate the text sliding in from the left over 1 second"

// Example 2: Batch operations
"Create 10 shape layers with random colors"
"Arrange them in a grid pattern"
"Add a wiggle expression to their position"

// Example 3: Complex workflow
"Import all PNG files from my desktop"
"Create a composition for each image"
"Add a fade in and fade out to each comp"
"Add all comps to the render queue"
EOF

# Step 8: Create DMG (optional, requires create-dmg)
if command -v create-dmg &> /dev/null; then
    echo "💿 Creating DMG installer..."
    create-dmg \
        --volname "$PRODUCT_NAME-v$VERSION" \
        --background "distribution/assets/dmg-background.png" \
        --window-pos 200 120 \
        --window-size 600 400 \
        --icon-size 100 \
        --icon "$PRODUCT_NAME-v$VERSION" 175 190 \
        --hide-extension "$PRODUCT_NAME-v$VERSION" \
        --app-drop-link 425 190 \
        "$DIST_DIR/$PRODUCT_NAME-v$VERSION.dmg" \
        "$PKG_DIR"
else
    echo "⚠️  create-dmg not found. Creating ZIP instead..."
    cd $DIST_DIR
    zip -r "$PRODUCT_NAME-v$VERSION-mac.zip" "$PRODUCT_NAME-v$VERSION"
    cd ..
fi

echo ""
echo "✅ Build complete!"
echo "📦 Package location: $PKG_DIR"
echo ""
echo "To test the installer:"
echo "cd $PKG_DIR && ./install-mac.command"
EOF

chmod +x ./distribution/build-package.sh