# Verify Your Setup

## ✅ MCP Server Status
- Using file-based communication bridge
- Commands directory: `/var/folders/90/jdxryyf93cz8548m5q07cc1r0000gq/T/ae-mcp-commands`
- 29 tools registered
- Server is running

## 🔍 Check After Effects Bridge

In the **AE MCP File Bridge** window, verify:

1. **Status shows**: "Status: Running (checking every 500ms)"
2. **Commands folder matches**: The path shown should be:
   ```
   /var/folders/90/jdxryyf93cz8548m5q07cc1r0000gq/T/ae-mcp-commands
   ```

If the paths don't match, that's the issue. The temp directory can vary between runs.

## 🧪 Test Communication

In Claude, try:
```
List all available After Effects tools
```

You should see:
- In the AE bridge: "📥 Processing command" messages
- In Claude: A list of 29 tools

## 🔧 If Not Working

1. **Check the paths match** between:
   - MCP server log: `/var/folders/.../T/ae-mcp-commands`
   - AE bridge window: Shows the same path

2. **Click "Open Commands Folder"** in the AE bridge to see if files are appearing

3. **Try "Clear Old Files"** then restart both:
   - Stop and Start the AE bridge
   - Restart Claude Desktop

## 📁 Manual Path Check

You can manually check if commands are being written:
```bash
ls -la /var/folders/90/jdxryyf93cz8548m5q07cc1r0000gq/T/ae-mcp-commands/
```

If you see `.json` files appearing when you use Claude, the MCP side is working correctly.