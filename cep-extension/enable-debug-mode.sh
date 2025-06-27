#!/bin/bash

# Enable Debug Mode for Adobe CEP Extensions
# This allows unsigned extensions to run in After Effects

echo "Adobe CEP Debug Mode Enabler"
echo "============================"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Enabling debug mode on macOS..."
    echo ""
    
    # Enable for all CEP versions
    for version in 5 6 7 8 9 10 11 12; do
        defaults write com.adobe.CSXS.$version PlayerDebugMode 1
        echo "✓ Enabled debug mode for CSXS.$version"
    done
    
    echo ""
    echo "Killing cfprefsd to apply changes..."
    sudo killall cfprefsd 2>/dev/null || true
    
    echo ""
    echo "✅ Debug mode enabled successfully!"
    echo ""
    echo "You can now run unsigned CEP extensions in After Effects."
    echo "Please restart After Effects if it's currently running."
    
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    echo "For Windows, please run enable-debug-mode.bat instead"
    exit 1
else
    echo "Unsupported operating system: $OSTYPE"
    exit 1
fi