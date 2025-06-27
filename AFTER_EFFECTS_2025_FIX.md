# After Effects 2025 Network Permission Fix

## The Problem

After Effects 2025 (version 25.x) has a known issue where the "Allow Scripts to Write Files and Access Network" preference doesn't work properly, even when checked.

## Solutions

### Solution 1: Use the Socket Bridge Script

The easiest solution is to use the ExtendScript bridge instead of the CEP extension:

1. **Open After Effects**
2. **Run the script**: File > Scripts > Run Script File > `ae-socket-bridge-v2.jsx`
3. **Click "Start Server"** in the dialog
4. **Keep the dialog open** while using MCP

This bypasses the CEP issues entirely and gives you real-time feedback.

### Solution 2: Reset After Effects Preferences

Sometimes resetting preferences fixes the network permission:

1. **Quit After Effects**
2. **Hold Cmd+Option+Shift** while launching After Effects
3. **Click "Yes" to delete preferences**
4. **Re-enable** "Allow Scripts to Write Files and Access Network"
5. **Restart After Effects**

### Solution 3: Manual Preference Edit

1. **Quit After Effects**
2. **Find the preferences file**:
   ```
   ~/Library/Preferences/Adobe/After Effects/25.3/Adobe After Effects 25.3 Prefs.txt
   ```
3. **Open in a text editor**
4. **Search for**: `"Pref_SCRIPTING_FILE_NETWORK_SECURITY"`
5. **Change the value to**: `"1"`
6. **Save and restart After Effects**

### Solution 4: Use Terminal Commands

Try these commands to reset CEP and permissions:

```bash
# Reset CEP cache
rm -rf ~/Library/Application\ Support/Adobe/CEP/cache/

# Reset CEP preferences
rm -rf ~/Library/Application\ Support/Adobe/CEP/

# Re-enable debug mode
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1

# Reset After Effects scripting preferences
defaults write com.adobe.AfterEffects PrefScriptingFileNetworkSecurity -bool true
```

## Recommended Approach

For After Effects 2025, **use the Socket Bridge script** (`ae-socket-bridge-v2.jsx`):

1. It works regardless of preference settings
2. Provides real-time logging
3. No installation required
4. More reliable than CEP

## Testing the Connection

Once the socket bridge is running:

1. The dialog should show "Status: Running"
2. Click "Test" to verify socket functionality
3. Watch the log for incoming connections

## Using with MCP

With the socket bridge running:
1. MCP commands will be received on port 8090
2. Results will be sent back automatically
3. All activity is logged in the dialog

This approach is more reliable for After Effects 2025 until Adobe fixes the preference issue.