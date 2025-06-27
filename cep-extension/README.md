# AE MCP Bridge CEP Extension

A CEP (Common Extensibility Platform) extension for Adobe After Effects that provides a dockable panel for the AE MCP Bridge system.

## Features

- **Dockable Panel**: Fully integrated into After Effects UI
- **Auto-Processing**: Automatically processes commands every 200ms
- **Command Log**: Visual log of all processed commands with timestamps
- **Statistics**: Track processed commands and errors
- **Manual Controls**: Process commands manually, clear log, open commands folder
- **Dark Theme**: Matches After Effects' interface

## Installation

### Development Mode

1. Enable debug mode in After Effects:
   - **Mac**: In Terminal, run:
     ```bash
     defaults write com.adobe.CSXS.11 PlayerDebugMode 1
     ```
   - **Windows**: Create a registry entry:
     ```
     HKEY_CURRENT_USER\Software\Adobe\CSXS.11
     Create String Value: PlayerDebugMode = 1
     ```

2. Copy the extension folder to CEP extensions directory:
   - **Mac**: `/Library/Application Support/Adobe/CEP/extensions/` or `~/Library/Application Support/Adobe/CEP/extensions/`
   - **Windows**: `C:\Program Files\Common Files\Adobe\CEP\extensions\` or `C:\Users\[username]\AppData\Roaming\Adobe\CEP\extensions\`

3. Restart After Effects

4. Find the panel under Window > Extensions > AE MCP Bridge

### Production Installation

For production use, the extension should be packaged and signed using Adobe's ZXPSignCmd tool.

## Usage

1. Open the panel from Window > Extensions > AE MCP Bridge
2. The panel will automatically start processing commands from the `~/Documents/ae-mcp-commands/` folder
3. Place `.js` command files in the commands folder
4. Commands are automatically executed and archived

## Command File Format

Command files should be JavaScript files that can be executed in After Effects' ExtendScript environment:

```javascript
// example-command.js
app.beginUndoGroup("My Command");

// Create a new composition
var comp = app.project.items.addComp("Generated Comp", 1920, 1080, 1, 10, 30);

// Add a text layer
var textLayer = comp.layers.addText("Hello from MCP!");

app.endUndoGroup();
```

## File Structure

```
cep-extension/
├── CSXS/
│   └── manifest.xml          # Extension configuration
├── jsx/
│   └── host.jsx             # ExtendScript code
├── js/
│   ├── CSInterface.js       # Adobe CEP interface
│   └── main.js              # Panel JavaScript
├── css/
│   └── style.css            # Panel styling
├── icons/
│   └── icon.png             # Extension icon (23x23)
├── index.html               # Panel UI
└── .debug                   # Debug configuration
```

## Development

- The panel communicates with After Effects through the CSInterface
- ExtendScript code runs in the After Effects context
- JavaScript code runs in the CEP Chromium context
- Use `csInterface.evalScript()` to execute ExtendScript from JavaScript

## Troubleshooting

1. **Panel doesn't appear**: Make sure debug mode is enabled and After Effects is restarted
2. **Commands not processing**: Check that the commands folder exists in your Documents folder
3. **Errors in execution**: Check the panel log for error messages

## Technical Details

- **CEP Version**: 11.0 (for After Effects 2025)
- **Minimum After Effects Version**: 22.0
- **Auto-process interval**: 200ms
- **Log retention**: Last 100 entries