#!/bin/bash
# AE MCP Bridge CEP Extension Verification Script

echo "AE MCP Bridge Setup Verification"
echo "================================"
echo ""

# Check debug mode
echo "1. Debug Mode Status:"
echo "--------------------"
for version in 9 10 11 12; do
    debug_mode=$(defaults read com.adobe.CSXS.$version PlayerDebugMode 2>/dev/null || echo "not set")
    if [ "$debug_mode" == "1" ]; then
        echo "   CSXS.$version: ✓ Enabled"
    else
        echo "   CSXS.$version: ✗ $debug_mode"
    fi
done

echo ""
echo "2. Extension Installation:"
echo "-------------------------"
EXTENSION_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/com.aemcp.bridge"
if [ -d "$EXTENSION_DIR" ]; then
    echo "   Directory exists: ✓"
    echo "   Location: $EXTENSION_DIR"
    
    # Check critical files
    echo ""
    echo "3. Critical Files:"
    echo "-----------------"
    critical_files=(
        "CSXS/manifest.xml"
        "index.html"
        "js/CSInterface.js"
        "js/main.js"
        "jsx/host.jsx"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -f "$EXTENSION_DIR/$file" ]; then
            echo "   $file: ✓"
        else
            echo "   $file: ✗ MISSING"
        fi
    done
else
    echo "   Directory exists: ✗ NOT INSTALLED"
    echo "   Expected location: $EXTENSION_DIR"
fi

echo ""
echo "4. Commands Directory:"
echo "--------------------"
COMMANDS_DIR="$HOME/Documents/ae-mcp-commands"
if [ -d "$COMMANDS_DIR" ]; then
    echo "   Directory exists: ✓"
    echo "   Location: $COMMANDS_DIR"
    
    # Count files
    total_files=$(ls -1 "$COMMANDS_DIR" 2>/dev/null | wc -l | tr -d ' ')
    json_files=$(ls -1 "$COMMANDS_DIR"/*.json 2>/dev/null | wc -l | tr -d ' ')
    response_files=$(ls -1 "$COMMANDS_DIR"/*.response 2>/dev/null | wc -l | tr -d ' ')
    processed_files=$(ls -1 "$COMMANDS_DIR"/*.processed 2>/dev/null | wc -l | tr -d ' ')
    
    echo "   Total files: $total_files"
    echo "   Command files (.json): $json_files"
    echo "   Response files (.response): $response_files"
    echo "   Processed files (.processed): $processed_files"
else
    echo "   Directory exists: ✗"
    echo "   Creating directory..."
    mkdir -p "$COMMANDS_DIR"
fi

echo ""
echo "5. After Effects Status:"
echo "-----------------------"
# Check if After Effects is running
if pgrep -x "After Effects" > /dev/null; then
    echo "   After Effects is running: ✓"
else
    echo "   After Effects is running: ✗"
fi

echo ""
echo "6. Recommendations:"
echo "------------------"

all_good=true

# Check if debug mode is enabled for at least one version
debug_enabled=false
for version in 9 10 11 12; do
    debug_mode=$(defaults read com.adobe.CSXS.$version PlayerDebugMode 2>/dev/null || echo "0")
    if [ "$debug_mode" == "1" ]; then
        debug_enabled=true
        break
    fi
done

if [ "$debug_enabled" != true ]; then
    echo "   ⚠️  Debug mode is not enabled for any CSXS version"
    echo "      Run: ./cep-extension/enable-debug-mode.sh"
    all_good=false
fi

if [ ! -d "$EXTENSION_DIR" ]; then
    echo "   ⚠️  Extension is not installed"
    echo "      Run: ./cep-extension/install.sh"
    all_good=false
fi

if pgrep -x "After Effects" > /dev/null; then
    echo "   ⚠️  After Effects is running"
    echo "      Please quit After Effects completely before installing"
    all_good=false
fi

if [ "$all_good" = true ]; then
    echo "   ✅ Everything looks good!"
    echo "   1. Start After Effects"
    echo "   2. Go to Window > Extensions > AE MCP Bridge"
    echo "   3. The panel should open with 'Auto Process: ON'"
fi

echo ""
echo "If you still have issues, check the troubleshooting guide:"
echo "cep-extension/troubleshooting.md"