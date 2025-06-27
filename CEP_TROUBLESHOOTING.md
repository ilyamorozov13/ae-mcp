# After Effects CEP Extension Troubleshooting Guide

## 1. Enable CEP Extensions and Script Access

### Enable Script Network Access
1. Open After Effects
2. Go to **Preferences > Scripting & Expressions** (Windows: Edit > Preferences)
3. ✅ Check "Allow Scripts to Write Files and Access Network"
4. Restart After Effects

### Enable Unsigned Extensions (Debug Mode)
CEP extensions need to be signed or debug mode must be enabled:

**macOS:**
```bash
# For After Effects 2020-2022 (CEP 9)
defaults write com.adobe.CSXS.9 PlayerDebugMode 1

# For After Effects 2023 (CEP 10)
defaults write com.adobe.CSXS.10 PlayerDebugMode 1

# For After Effects 2024 (CEP 11)
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

**Windows (Run as Administrator):**
```batch
# For CEP 9
reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.9 /v PlayerDebugMode /t REG_SZ /d 1 /f

# For CEP 10
reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.10 /v PlayerDebugMode /t REG_SZ /d 1 /f

# For CEP 11
reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.11 /v PlayerDebugMode /t REG_SZ /d 1 /f
```

## 2. Verify Extension Installation Location

The extension must be in the correct directory:

**macOS:**
```bash
# User-specific location (recommended)
~/Library/Application Support/Adobe/CEP/extensions/ae-mcp-bridge/

# System-wide location
/Library/Application Support/Adobe/CEP/extensions/ae-mcp-bridge/
```

**Windows:**
```
# User-specific location (recommended)
%APPDATA%\Adobe\CEP\extensions\ae-mcp-bridge\

# System-wide location
C:\Program Files\Common Files\Adobe\CEP\extensions\ae-mcp-bridge\
```

## 3. Install the Extension Correctly

```bash
# macOS
mkdir -p ~/Library/Application\ Support/Adobe/CEP/extensions/
cp -r /Users/harathom/workplace/external/ae-mcp/ae-extension ~/Library/Application\ Support/Adobe/CEP/extensions/ae-mcp-bridge

# Windows (in PowerShell)
mkdir -Force "$env:APPDATA\Adobe\CEP\extensions\"
Copy-Item -Recurse "C:\path\to\ae-mcp\ae-extension" "$env:APPDATA\Adobe\CEP\extensions\ae-mcp-bridge"
```

## 4. Check Extension Structure

Verify the extension has this structure:
```
ae-mcp-bridge/
├── CSXS/
│   └── manifest.xml
├── index.html
├── js/
│   ├── main.js
│   └── ae-bridge.jsx
└── css/
    └── styles.css
```

## 5. Debug the Extension

### Enable CEP Debug Console
1. Open Chrome or Edge
2. Navigate to: `http://localhost:8088/`
3. You should see your extension listed if it's loaded

### Check After Effects Console
1. In After Effects, go to **Window > Info**
2. Click the flyout menu (≡) > **Debug Database View**
3. Look for any error messages

## 6. Common Issues and Fixes

### Extension doesn't appear in menu
- **Cause**: Debug mode not enabled or wrong CEP version
- **Fix**: Enable debug mode for all CEP versions and restart

### Extension appears but window is blank
- **Cause**: JavaScript errors or missing dependencies
- **Fix**: Check the CEP debug console for errors

### "Extension could not be loaded" error
- **Cause**: Malformed manifest.xml or missing files
- **Fix**: Verify all files are present and manifest.xml is valid

## 7. Test with a Minimal Extension

Create a test extension to verify CEP is working:

```bash
# Create test extension
mkdir -p ~/Library/Application\ Support/Adobe/CEP/extensions/test-extension/CSXS
```

Create `manifest.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest Version="9.0" ExtensionBundleId="com.test.extension">
    <ExtensionList>
        <Extension Id="com.test.panel" Version="1.0" />
    </ExtensionList>
    <ExecutionEnvironment>
        <HostList>
            <Host Name="AEFT" Version="17.0" />
        </HostList>
        <LocaleList>
            <Locale Code="All" />
        </LocaleList>
        <RequiredRuntimeList>
            <RequiredRuntime Name="CSXS" Version="9.0" />
        </RequiredRuntimeList>
    </ExecutionEnvironment>
    <DispatchInfoList>
        <Extension Id="com.test.panel">
            <DispatchInfo>
                <Resources>
                    <MainPath>./index.html</MainPath>
                </Resources>
                <UI>
                    <Type>Panel</Type>
                    <Menu>Test Extension</Menu>
                </UI>
            </DispatchInfo>
        </Extension>
    </DispatchInfoList>
</ExtensionManifest>
```

Create `index.html`:
```html
<!DOCTYPE html>
<html>
<body>
    <h1>Test Extension Works!</h1>
</body>
</html>
```

## 8. Full Reinstall Steps

1. **Remove old installation:**
   ```bash
   rm -rf ~/Library/Application\ Support/Adobe/CEP/extensions/ae-mcp-bridge
   ```

2. **Enable debug mode for all CEP versions**

3. **Copy extension fresh:**
   ```bash
   cp -r /Users/harathom/workplace/external/ae-mcp/ae-extension ~/Library/Application\ Support/Adobe/CEP/extensions/ae-mcp-bridge
   ```

4. **Set permissions:**
   ```bash
   chmod -R 755 ~/Library/Application\ Support/Adobe/CEP/extensions/ae-mcp-bridge
   ```

5. **Restart After Effects**

## 9. Check Logs

Look for errors in:
- **macOS**: `~/Library/Logs/CSXS/CEP9-AEFT.log`
- **Windows**: `%TEMP%\CEP9-AEFT.log`

## 10. Alternative: Use ExtendScript Instead

If CEP won't work, you can use a simpler ExtendScript approach:

Save this as `ae-mcp-listener.jsx` and run via File > Scripts > Run Script File:
```javascript
// Simple TCP listener for After Effects
var server = new Socket();
if (server.listen(8080)) {
    alert("AE MCP Listener started on port 8080");
    // Keep listening...
}
```

Let me know which After Effects version you're using and what happens when you try these steps!