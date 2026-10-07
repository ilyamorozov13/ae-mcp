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
for version in 9 10 11 12 13 14; do
    defaults write com.adobe.CSXS.$version PlayerDebugMode 1
    echo "✓ Enabled debug mode for CSXS.$version"
done

install_bridge_into() {
    local scripts_dir="$1"
    local label="$2"
    mkdir -p "$scripts_dir/ScriptUI Panels"
    mkdir -p "$scripts_dir/(support)"
    cp "$SOURCE_DIR/jsx/host.jsx" "$scripts_dir/(support)/ae-mcp-host.jsx"
    # Do NOT install a Startup poller. app.scheduleTask in Startup crashes AE
    # when the user replaces footage (BEE_WorkQueue PreCloseProject).
    rm -f "$scripts_dir/Startup/AE MCP Bridge.jsx"
    cat "$SOURCE_DIR/jsx/host.jsx" > "$scripts_dir/ScriptUI Panels/AE MCP Bridge.jsx"
    echo "" >> "$scripts_dir/ScriptUI Panels/AE MCP Bridge.jsx"
    cat "$SOURCE_DIR/jsx/mcp-bridge-panel.jsx" >> "$scripts_dir/ScriptUI Panels/AE MCP Bridge.jsx"
    if [ ! -s "$scripts_dir/ScriptUI Panels/AE MCP Bridge.jsx" ]; then
        echo "⚠ Failed to write ScriptUI bridge: $label"
        return 1
    fi
    echo "✓ ScriptUI bridge installed (no Startup poller): $label"
}

# ScriptUI / Startup bridge for After Effects 2025+ (CEP 12)
install_scriptui_bridge() {
    echo ""
    echo "Installing ScriptUI/Startup bridge for After Effects 2025+..."

    local prefs_root="$HOME/Library/Preferences/Adobe/After Effects"
    local ae_ver
    if [ -d "$prefs_root" ]; then
        for ae_ver in "$prefs_root"/*; do
            [ -d "$ae_ver" ] || continue
            local ver_name
            ver_name="$(basename "$ae_ver")"
            case "$ver_name" in
                25.*|26.*|27.*)
                    ;;
                *)
                    continue
                    ;;
            esac
            install_bridge_into "$ae_ver/Scripts" "Preferences/After Effects $ver_name"
        done
    fi

    local year
    for year in 2025 2026 2027; do
        local docs_scripts="$HOME/Documents/Adobe/After Effects $year/Scripts"
        mkdir -p "$docs_scripts"
        install_bridge_into "$docs_scripts" "Documents/After Effects $year"
    done

    local app_scripts
    for app_scripts in \
        "/Applications/Adobe After Effects 2026/Scripts" \
        "/Applications/Adobe After Effects 2025/Scripts"; do
        if [ -d "$app_scripts" ]; then
            if install_bridge_into "$app_scripts" "$app_scripts" 2>/dev/null; then
                :
            else
                echo "⚠ Could not write $app_scripts (need write access). Documents Startup is enough."
            fi
        fi
    done
}

install_scriptui_bridge

# Kill cfprefsd to apply changes
echo ""
echo "Applying preferences changes..."
killall cfprefsd 2>/dev/null || true

echo ""
echo "✅ Installation complete!"
echo ""
echo "IMPORTANT: Please follow these steps:"
echo "1. Quit After Effects if it's running"
echo "2. Start After Effects"
echo "3. Window > AE MCP Bridge  (or Window > Extensions (Legacy) > AE MCP Bridge)"
echo "4. Panel should say: Sleeping — safe to edit"
echo ""
echo "There is no Startup background poller. CEP watches command files"
echo "in Chromium and only touches After Effects when a command arrives."