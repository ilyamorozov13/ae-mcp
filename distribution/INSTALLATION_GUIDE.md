# AE-MCP Pro Installation Guide

## Quick Start (5 minutes)

### Step 1: Run the Installer

#### macOS
1. Double-click `install-mac.command`
2. Enter your admin password when prompted
3. The installer will automatically set up everything

#### Windows
1. Right-click `install-windows.bat` and select "Run as Administrator"
2. Follow the on-screen prompts
3. The installer will automatically set up everything

### Step 2: Configure Your AI Assistant

Choose your AI assistant below and follow the specific instructions:

#### For Claude Desktop
1. Open Claude Desktop settings
2. Go to Developer > Model Context Protocol
3. Click "Add Server" and paste:
```json
{
  "name": "ae-mcp",
  "command": "/Applications/AE-MCP-Pro/ae-mcp-server",
  "args": ["stdio"]
}
```

#### For Cline (VS Code)
1. Open VS Code Settings (Cmd/Ctrl + ,)
2. Search for "Cline MCP"
3. Add to the servers array:
```json
{
  "name": "ae-mcp",
  "command": "/Applications/AE-MCP-Pro/ae-mcp-server",
  "args": ["stdio"]
}
```

#### For ChatGPT (via MCP Bridge)
1. Install MCP Bridge from: https://github.com/modelcontextprotocol/bridge
2. Add AE-MCP to your bridge config
3. Use the provided ChatGPT action URL

### Step 3: Test Your Setup
1. Open After Effects
2. Go to Window > Extensions > AE-MCP
3. Click "Test Connection" in the panel
4. Ask your AI: "Can you connect to After Effects?"

## Manual Installation

If the automatic installer doesn't work, follow these steps:

### Installing the CEP Extension

#### macOS
```bash
# Copy extension to Adobe folder
cp -r cep-extension ~/Library/Application\ Support/CEP/extensions/ae-mcp

# Enable debug mode
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

#### Windows
```batch
# Copy extension to Adobe folder
xcopy /E /I cep-extension "%APPDATA%\Adobe\CEP\extensions\ae-mcp"

# Enable debug mode (run as admin)
reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.12 /v PlayerDebugMode /t REG_SZ /d 1
```

### Installing the MCP Server

1. Extract the server files to:
   - macOS: `/Applications/AE-MCP-Pro/`
   - Windows: `C:\Program Files\AE-MCP-Pro\`

2. Test the server:
```bash
# macOS/Linux
/Applications/AE-MCP-Pro/ae-mcp-server stdio

# Windows
"C:\Program Files\AE-MCP-Pro\ae-mcp-server.exe" stdio
```

## Troubleshooting

### "Extension not visible in After Effects"
1. Restart After Effects
2. Check Window > Extensions menu
3. Ensure debug mode is enabled (see manual installation)
4. Try resetting preferences: Hold Alt+Ctrl+Shift (Win) or Option+Cmd+Shift (Mac) while starting AE

### "Connection failed" error
1. Make sure After Effects is running
2. Check that the AE-MCP panel is open
3. Verify the MCP server path in your AI config
4. Try restarting both After Effects and your AI assistant

### "Permission denied" on macOS
```bash
# Make the server executable
chmod +x /Applications/AE-MCP-Pro/ae-mcp-server

# Clear quarantine flag
xattr -d com.apple.quarantine /Applications/AE-MCP-Pro/ae-mcp-server
```

### Windows Defender blocking the server
1. Open Windows Security
2. Go to Virus & threat protection > Protection history
3. Find ae-mcp-server.exe and click "Allow"

## System Requirements

- **After Effects:** CC 2019 or later
- **Operating System:** 
  - macOS 10.14 or later
  - Windows 10/11 64-bit
- **RAM:** 8GB minimum (16GB recommended)
- **AI Assistant:** Claude Desktop, Cline, or MCP-compatible tool

## Getting Help

- **Documentation:** https://docs.aemcppro.com
- **Video Tutorials:** https://youtube.com/aemcppro
- **Email Support:** support@aemcppro.com
- **Discord Community:** https://discord.gg/aemcppro (Pro/Team only)

## License Activation

Your license key was sent to your email. To activate:

1. Open the AE-MCP panel in After Effects
2. Click the settings icon
3. Enter your license key
4. Click "Activate"

You can use your license on up to 2 machines simultaneously.

## Next Steps

1. Watch the [Quick Start Video](https://youtube.com/watch?v=QUICKSTART)
2. Try the example projects in the `examples/` folder
3. Join our Discord community (Pro/Team licenses)
4. Check out the [API Reference](API_REFERENCE.md) for all available commands

Congratulations! You're ready to automate After Effects with AI.