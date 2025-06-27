// After Effects File-Based Bridge - Alternative to socket approach
// This version uses file watching instead of sockets to avoid port issues

(function() {
    // Configuration
    var COMMANDS_DIR = Folder.temp.fsName + "/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    // Create commands directory if it doesn't exist
    if (!commandsFolder.exists) {
        commandsFolder.create();
    }
    
    var isRunning = false;
    var checkInterval = 500; // Check for new commands every 500ms
    var commandCounter = 0;
    
    // Create UI
    var dialog = new Window("dialog", "AE MCP File Bridge");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.preferredSize.width = 600;
    
    // Header
    var header = dialog.add("panel", undefined, "File Bridge Status");
    header.orientation = "column";
    header.alignChildren = "fill";
    
    var statusText = header.add("statictext", undefined, "Status: Stopped");
    var pathText = header.add("statictext", undefined, "Commands folder: " + COMMANDS_DIR);
    pathText.graphics.font = ScriptUI.newFont(pathText.graphics.font.name, ScriptUI.FontStyle.REGULAR, 10);
    
    // Control buttons
    var buttonPanel = dialog.add("panel", undefined, "Controls");
    var buttonGroup = buttonPanel.add("group");
    buttonGroup.alignment = "center";
    
    var startBtn = buttonGroup.add("button", undefined, "Start Bridge");
    var stopBtn = buttonGroup.add("button", undefined, "Stop Bridge");
    stopBtn.enabled = false;
    
    var openFolderBtn = buttonGroup.add("button", undefined, "Open Commands Folder");
    var clearBtn = buttonGroup.add("button", undefined, "Clear Old Files");
    
    // Log panel
    var logPanel = dialog.add("panel", undefined, "Activity Log");
    logPanel.orientation = "column";
    logPanel.alignChildren = "fill";
    
    var logHeader = logPanel.add("group");
    logHeader.alignment = "right";
    var clearLogBtn = logHeader.add("button", undefined, "Clear Log");
    
    var logText = logPanel.add("edittext", undefined, "", {
        multiline: true,
        scrolling: true,
        readonly: true
    });
    logText.preferredSize.height = 300;
    
    // Info panel
    var infoPanel = dialog.add("panel", undefined, "How It Works");
    var infoText = infoPanel.add("statictext", undefined, 
        "This bridge watches for command files instead of using network sockets.\n" +
        "1. Click 'Start Bridge' to begin monitoring\n" +
        "2. The MCP server will write command files to the folder\n" +
        "3. This bridge executes them and writes response files\n" +
        "4. No port conflicts! Works around AE socket issues.",
        {multiline: true}
    );
    
    // Functions
    function log(message, type) {
        var timestamp = new Date().toLocaleTimeString();
        var prefix = "";
        
        switch(type) {
            case "info":    prefix = "ℹ️  "; break;
            case "success": prefix = "✅ "; break;
            case "error":   prefix = "❌ "; break;
            case "command": prefix = "📥 "; break;
            case "response": prefix = "📤 "; break;
            default:        prefix = "   ";
        }
        
        logText.text += "[" + timestamp + "] " + prefix + message + "\n";
        
        // Auto-scroll
        logText.active = false;
        logText.active = true;
    }
    
    function executeScript(scriptCode) {
        try {
            var result = eval(scriptCode);
            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: error.toString(),
                    code: error.number || "UNKNOWN"
                }
            };
        }
    }
    
    function processCommandFile(file) {
        try {
            // Read command
            file.open("r");
            var content = file.read();
            file.close();
            
            var command = JSON.parse(content);
            log("Processing command: " + command.id, "command");
            
            // Execute script
            var result = executeScript(command.script);
            
            // Write response
            var responseFile = new File(file.fsName + ".response");
            responseFile.open("w");
            responseFile.write(JSON.stringify({
                id: command.id,
                result: result
            }));
            responseFile.close();
            
            log("Wrote response: " + command.id, "response");
            
            // Delete command file
            file.remove();
            
            commandCounter++;
            
        } catch (error) {
            log("Error processing command: " + error.toString(), "error");
        }
    }
    
    function checkForCommands() {
        if (!isRunning) return;
        
        try {
            var files = commandsFolder.getFiles("*.json");
            
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                
                // Skip response files
                if (file.name.indexOf(".response") !== -1) continue;
                
                // Skip files that are still being written (check if we can open them)
                if (!file.open("r")) continue;
                file.close();
                
                processCommandFile(file);
            }
        } catch (error) {
            log("Error checking commands: " + error.toString(), "error");
        }
        
        // Schedule next check
        if (isRunning) {
            $.scheduleTask(checkForCommands, checkInterval);
        }
    }
    
    function startBridge() {
        isRunning = true;
        statusText.text = "Status: Running (checking every " + checkInterval + "ms)";
        startBtn.enabled = false;
        stopBtn.enabled = true;
        
        log("File bridge started", "success");
        log("Watching folder: " + COMMANDS_DIR, "info");
        
        // Start checking for commands
        checkForCommands();
    }
    
    function stopBridge() {
        isRunning = false;
        statusText.text = "Status: Stopped";
        startBtn.enabled = true;
        stopBtn.enabled = false;
        
        log("File bridge stopped", "info");
        log("Processed " + commandCounter + " commands", "info");
    }
    
    function clearOldFiles() {
        var files = commandsFolder.getFiles();
        var cleared = 0;
        
        for (var i = 0; i < files.length; i++) {
            try {
                files[i].remove();
                cleared++;
            } catch (e) {}
        }
        
        log("Cleared " + cleared + " old files", "info");
    }
    
    function openCommandsFolder() {
        if ($.os.indexOf("Windows") !== -1) {
            system.callSystem("explorer " + COMMANDS_DIR);
        } else {
            system.callSystem("open \"" + COMMANDS_DIR + "\"");
        }
    }
    
    // Event handlers
    startBtn.onClick = startBridge;
    stopBtn.onClick = stopBridge;
    clearBtn.onClick = clearOldFiles;
    openFolderBtn.onClick = openCommandsFolder;
    clearLogBtn.onClick = function() {
        logText.text = "";
        log("Log cleared", "info");
    };
    
    dialog.onClose = function() {
        stopBridge();
    };
    
    // Initial setup
    log("AE MCP File Bridge initialized", "info");
    log("After Effects " + app.version, "info");
    log("Commands folder: " + COMMANDS_DIR, "info");
    
    // Clear old files on startup
    clearOldFiles();
    
    // Show dialog
    dialog.center();
    dialog.show();
})();