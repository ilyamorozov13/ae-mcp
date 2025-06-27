# Final Setup - Your AE MCP Bridge is Ready!

## ✅ After Effects Side is Working

Your socket bridge is running successfully on port 8090.

## 📝 Update Claude Desktop Configuration

1. **Open your Claude Desktop config**:
   ```bash
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Update or add this configuration**:
   ```json
   {
     "mcpServers": {
       "adobe-after-effects": {
         "command": "node",
         "args": ["/Users/harathom/workplace/external/ae-mcp/dist/stdio-server.js"],
         "env": {
           "AE_BRIDGE_PORT": "8090",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

3. **Save the file and restart Claude Desktop**

## 🧪 Testing the Connection

Once Claude Desktop is restarted, you can test by asking:

- "What After Effects tools are available?"
- "List all compositions in the current project"
- "Create a new composition called Test that's 1920x1080"

## 📊 Monitor the Connection

Watch the Activity Log in the AE Socket Bridge window:
- You'll see "📥 Client connected" when MCP connects
- You'll see "📥 Received" messages for each command
- You'll see "📤 Sent response" when AE sends data back

## 🎯 Quick Test Commands

Try these in Claude to verify everything works:

1. **Get project info**:
   "What's in the current After Effects project?"

2. **Create something**:
   "Create a new composition called 'MCP Test' that's 1080x1080, 30fps, 5 seconds"

3. **Add content**:
   "Add a red solid layer to the current composition"

## ⚠️ Important Notes

- Keep the Socket Bridge window open while using MCP
- The bridge shows as "Status: Running" and listening on port 8090
- You can see client connections in real-time
- All activity is logged in the window

## 🚀 You're Ready!

Your After Effects MCP server is now fully configured and ready to use!