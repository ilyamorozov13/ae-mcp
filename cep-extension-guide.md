# Complete Guide: CEP Plugin Development for After Effects 2025

## Overview

This guide provides detailed steps to create, configure, and run CEP (Common Extensibility Platform) plugins locally in Adobe After Effects 2025 without signing requirements.

## Understanding CEP Versions

After Effects version 18.4 (FY2021) uses CEP 11. For After Effects 2025, you should use CEP 11.x as the framework version.

## Step 1: Enable Debug Mode (CRITICAL)

This is the most important step to bypass signing requirements for local development. You need to set PlayerDebugMode to "1" to prevent your host application from throwing alerts about unsigned extensions.

### Windows:
1. Open Registry Editor (Win + R, type `regedit`)
2. Navigate to: `HKEY_CURRENT_USER\Software\Adobe\`
3. Create these keys if they don't exist:
   - `CSXS.9`
   - `CSXS.10`
   - `CSXS.11`
4. In each key, create a new String Value:
   - Name: `PlayerDebugMode`
   - Value: `1`

**Alternative Windows Method (Command Line):**
```batch
reg add HKCU\Software\Adobe\CSXS.9 /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add HKCU\Software\Adobe\CSXS.10 /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add HKCU\Software\Adobe\CSXS.11 /v PlayerDebugMode /t REG_SZ /d 1 /f
```

### macOS:
Open Terminal and run:
```bash
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

On macOS 10.9+, you must kill the cfprefsd process for changes to take effect:
```bash
sudo killall cfprefsd
```

## Step 2: Create Your Extension Structure

Create the following folder structure:

```
MyExtension/
├── CSXS/
│   └── manifest.xml
├── client/
│   ├── index.html
│   ├── style.css
│   ├── main.js
│   └── CSInterface.js
├── host/
│   └── index.jsx
└── .debug (optional for debugging)
```

## Step 3: Configure manifest.xml

Here's a working manifest.xml for After Effects 2025:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest Version="11.0" ExtensionBundleId="com.mycompany.myextension" 
                   ExtensionBundleVersion="1.0.0"
                   ExtensionBundleName="My Extension" 
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <ExtensionList>
        <Extension Id="com.mycompany.myextension.panel" Version="1.0.0" />
    </ExtensionList>
    <ExecutionEnvironment>
        <HostList>
            <!-- After Effects host ID is AEFT -->
            <Host Name="AEFT" Version="[18.0,99.9]" />
        </HostList>
        <LocaleList>
            <Locale Code="All" />
        </LocaleList>
        <RequiredRuntimeList>
            <RequiredRuntime Name="CSXS" Version="11.0" />
        </RequiredRuntimeList>
    </ExecutionEnvironment>
    <DispatchInfoList>
        <Extension Id="com.mycompany.myextension.panel">
            <DispatchInfo>
                <Resources>
                    <MainPath>./client/index.html</MainPath>
                    <ScriptPath>./host/index.jsx</ScriptPath>
                </Resources>
                <Lifecycle>
                    <AutoVisible>true</AutoVisible>
                </Lifecycle>
                <UI>
                    <Type>Panel</Type>
                    <Menu>My Extension Panel</Menu>
                    <Geometry>
                        <Size>
                            <Height>400</Height>
                            <Width>300</Width>
                        </Size>
                    </Geometry>
                </UI>
            </DispatchInfo>
        </Extension>
    </DispatchInfoList>
</ExtensionManifest>
```

### Important Notes:
- Set the Host Version to a range like [18.0,99.9] to ensure compatibility with current and future versions
- Use CEP/CSXS version 11.0 for After Effects 2025
- The Host Name for After Effects is "AEFT"

## Step 4: Download CSInterface.js

Download the latest CSInterface.js from the Adobe CEP GitHub repository and place it in your client folder. This library enables communication between your panel and After Effects.

## Step 5: Create Basic Panel Files

### client/index.html:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>My Extension</title>
    <link rel="stylesheet" href="style.css">
    <script src="CSInterface.js"></script>
</head>
<body>
    <h1>My After Effects Panel</h1>
    <button id="createComp">Create Composition</button>
    <div id="result"></div>
    <script src="main.js"></script>
</body>
</html>
```

### client/main.js:
```javascript
// Initialize CSInterface
const csInterface = new CSInterface();

// Button click handler
document.getElementById('createComp').addEventListener('click', function() {
    // Call ExtendScript function
    csInterface.evalScript('createNewComposition()', function(result) {
        document.getElementById('result').innerHTML = result;
    });
});
```

### host/index.jsx:
```javascript
function createNewComposition() {
    try {
        // Create a new composition
        var comp = app.project.items.addComp("New Comp", 1920, 1080, 1, 10, 30);
        return "Composition created successfully!";
    } catch (e) {
        return "Error: " + e.toString();
    }
}
```

## Step 6: Install Your Extension

Extensions can be installed in the following locations:

### System-wide installation:
- **Windows**: `C:\Program Files\Common Files\Adobe\CEP\extensions\`
- **macOS**: `/Library/Application Support/Adobe/CEP/extensions/`

### User-specific installation (Recommended for development):
- **Windows**: `%APPDATA%\Adobe\CEP\extensions\`
- **macOS**: `~/Library/Application Support/Adobe/CEP/extensions/`

Copy your entire extension folder to one of these locations.

## Step 7: Enable Remote Debugging (Optional)

Create a .debug file in your extension root directory for remote debugging:

### Creating .debug file:
- **Windows**: Open Command Prompt in your extension folder and run: `copy con .debug` then press Ctrl+Z
- **macOS**: Run: `touch .debug`

### .debug file content:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
    <Extension Id="com.mycompany.myextension.panel">
        <HostList>
            <Host Name="AEFT" Port="8088"/>
        </HostList>
    </Extension>
</ExtensionList>
```

Access the debugger at: `http://localhost:8088/`

## Troubleshooting Common Issues

### Extension Not Showing Up:

1. **Check PlayerDebugMode**: Ensure PlayerDebugMode has no extra spaces and is set to "1"
2. **Verify manifest.xml version**: Ensure the Host Version range includes your After Effects version
3. **Check extension ID**: Make sure Extension Id in manifest.xml matches throughout the file
4. **Clear cache**: On macOS, run `sudo killall cfprefsd`
5. **Restart After Effects**: Always restart after making changes

### "Cannot load extension" Error:

1. **Log files location**: Check CEP logs at:
   - **Windows**: `%TEMP%\CEP11-AEFT.log`
   - **macOS**: `~/Library/Logs/CSXS/CEP11-AEFT.log`

2. **Common fixes**:
   - Verify all file paths in manifest.xml are correct
   - Ensure CSInterface.js is present and properly referenced
   - Check that the CSXS folder and manifest.xml exist
   - Verify ExtensionManifest Version matches RequiredRuntime Version

### Signing Issues:

If PlayerDebugMode isn't working:
1. Try setting it for all CSXS versions (5 through 11)
2. On Windows, run regedit as Administrator
3. Ensure you're modifying HKEY_CURRENT_USER, not HKEY_LOCAL_MACHINE
4. Restart your computer after making registry changes

## Best Practices

1. **Development Workflow**:
   - Keep debug mode enabled during development
   - Use version ranges in manifest.xml for flexibility
   - Test in multiple After Effects versions if needed

2. **File Organization**:
   - Keep ExtendScript (.jsx) files in the host folder
   - Keep web assets (HTML/CSS/JS) in the client folder
   - Use relative paths in manifest.xml

3. **Version Compatibility**:
   - Always check the CEP version for your target After Effects version
   - Use the Adobe CEP GitHub repository for the latest documentation
   - Test thoroughly before distribution

## Distribution (When Ready)

For distribution outside of development:
1. Get a proper code signing certificate
2. Use ZXPSignCmd tool to sign your extension
3. Package as .zxp file for distribution
4. Users can install using Extension Manager or Anastasiy's Extension Manager

## Additional Resources

- [Adobe CEP Resources GitHub](https://github.com/Adobe-CEP/CEP-Resources)
- [Getting Started Guides](https://github.com/Adobe-CEP/Getting-Started-guides)
- [CEP Samples](https://github.com/Adobe-CEP/Samples)

Remember: For local development, PlayerDebugMode is the key to bypassing signing requirements. Always ensure it's properly set before troubleshooting other issues.