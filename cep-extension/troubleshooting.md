# AE MCP Bridge Extension Troubleshooting Guide

## Quick Fixes

### Extension Not Showing in After Effects

1. **Enable Debug Mode First**
   ```bash
   # macOS
   ./enable-debug-mode.sh
   
   # Windows
   enable-debug-mode.bat
   ```

2. **Run the Installer**
   ```bash
   # macOS
   ./install.sh
   ```

3. **Restart After Effects completely**
   - Quit After Effects (Cmd+Q / Alt+F4)
   - Make sure it's not running in background
   - Start After Effects again
   - Check Window > Extensions > AE MCP Bridge

## Common Issues and Solutions

### Issue: "Extension failed to load" error

**Solution:**
1. Check if debug mode is enabled:
   ```bash
   # macOS - Check if PlayerDebugMode is set
   defaults read com.adobe.CSXS.11 PlayerDebugMode
   # Should return: 1
   ```

2. If not, run the debug mode enabler again and restart your computer

### Issue: Extension doesn't appear in Window > Extensions menu

**Solution:**
1. Verify installation location:
   ```bash
   # macOS
   ls -la ~/Library/Application\ Support/Adobe/CEP/extensions/
   # Should show: com.aemcp.bridge
   ```

2. Check After Effects version compatibility:
   - Open After Effects > About After Effects
   - Note the version number
   - Our extension supports versions 22.0 and above

3. Clear CEP cache:
   ```bash
   # macOS
   rm -rf ~/Library/Application\ Support/Adobe/CEP/cache/*
   ```

### Issue: "Cannot find module" or JavaScript errors

**Solution:**
1. Verify all files are present:
   ```bash
   # Check critical files
   ls -la ~/Library/Application\ Support/Adobe/CEP/extensions/com.aemcp.bridge/
   ```
   
   Should contain:
   - CSXS/manifest.xml
   - index.html
   - js/CSInterface.js
   - js/main.js
   - jsx/host.jsx

2. Check file permissions:
   ```bash
   chmod -R 755 ~/Library/Application\ Support/Adobe/CEP/extensions/com.aemcp.bridge/
   ```

### Issue: Extension loads but doesn't work properly

**Solution:**
1. Enable remote debugging by checking for .debug file
2. Open Chrome and go to: http://localhost:9999
3. Check console for errors

## Advanced Troubleshooting

### Check CEP Logs

**macOS:**
```bash
# View recent CEP logs
tail -f ~/Library/Logs/CSXS/CEP11-AEFT.log
```

**Windows:**
```cmd
# Navigate to logs
cd %TEMP%
# Look for CEP11-AEFT.log
```

### Verify Registry/Preferences

**macOS:**
```bash
# Check all debug mode settings
for v in 5 6 7 8 9 10 11 12; do
    echo "CSXS.$v: $(defaults read com.adobe.CSXS.$v PlayerDebugMode 2>/dev/null || echo 'not set')"
done
```

**Windows:**
```cmd
# Check registry
reg query "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode
```

### Complete Reset

If nothing works, try a complete reset:

1. **Remove extension:**
   ```bash
   # macOS
   rm -rf ~/Library/Application\ Support/Adobe/CEP/extensions/com.aemcp.bridge
   ```

2. **Clear all CEP cache:**
   ```bash
   # macOS
   rm -rf ~/Library/Application\ Support/Adobe/CEP/cache/*
   rm -rf ~/Library/Application\ Support/Adobe/CEP/logs/*
   ```

3. **Reset debug mode:**
   ```bash
   # macOS
   for v in 5 6 7 8 9 10 11 12; do
       defaults delete com.adobe.CSXS.$v PlayerDebugMode 2>/dev/null || true
   done
   ```

4. **Reinstall:**
   - Run enable-debug-mode.sh
   - Run install.sh
   - Restart computer
   - Start After Effects

## Manual Installation

If the installer doesn't work:

1. **macOS:**
   ```bash
   # Copy extension manually
   cp -R /path/to/cep-extension ~/Library/Application\ Support/Adobe/CEP/extensions/com.aemcp.bridge
   
   # Set debug mode manually
   defaults write com.adobe.CSXS.11 PlayerDebugMode 1
   sudo killall cfprefsd
   ```

2. **Windows:**
   ```cmd
   # Copy to user extensions folder
   xcopy /E /I "path\to\cep-extension" "%APPDATA%\Adobe\CEP\extensions\com.aemcp.bridge"
   
   # Set debug mode in registry
   reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
   ```

## Still Having Issues?

1. Check the main CEP extension guide: `cep-extension-guide.md`
2. Verify your After Effects installation is not corrupted
3. Try installing on a different user account
4. Check if other CEP extensions work (to isolate if it's a system issue)

## Debug Mode Verification Script

Create a test script to verify everything is set up correctly:

```bash
#!/bin/bash
# save as verify-setup.sh

echo "Checking AE MCP Bridge setup..."
echo "=============================="

# Check debug mode
echo -n "Debug mode: "
if [[ $(defaults read com.adobe.CSXS.11 PlayerDebugMode 2>/dev/null) == "1" ]]; then
    echo "✓ Enabled"
else
    echo "✗ Not enabled"
fi

# Check installation
echo -n "Extension installed: "
if [ -d "$HOME/Library/Application Support/Adobe/CEP/extensions/com.aemcp.bridge" ]; then
    echo "✓ Yes"
else
    echo "✗ No"
fi

# Check manifest
echo -n "Manifest present: "
if [ -f "$HOME/Library/Application Support/Adobe/CEP/extensions/com.aemcp.bridge/CSXS/manifest.xml" ]; then
    echo "✓ Yes"
else
    echo "✗ No"
fi
```

Remember: The most common issue is forgetting to enable debug mode or not restarting After Effects completely!