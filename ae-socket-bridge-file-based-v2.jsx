// After Effects File-Based Bridge V2 - Fixed path handling
// This version ensures paths match between AE and Node.js

(function() {
    // Configuration - Use consistent path handling
    var tempFolder = Folder.temp;
    var COMMANDS_DIR = tempFolder.fsName + "/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    // Create commands directory if it doesn't exist
    if (!commandsFolder.exists) {
        commandsFolder.create();
    }
    
    // Normalize the path to match Node.js format
    // Remove /private prefix if present (macOS specific)
    var normalizedPath = COMMANDS_DIR;
    if (normalizedPath.indexOf("/private") === 0) {
        normalizedPath = normalizedPath.substring(8); // Remove "/private"
    }
    
    var isRunning = false;
    var checkInterval = 250; // Check more frequently - every 250ms
    var commandCounter = 0;
    var lastError = null;
    
    // Create UI
    var dialog = new Window("dialog", "AE MCP File Bridge V2");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.preferredSize.width = 650;
    
    // Header
    var header = dialog.add("panel", undefined, "File Bridge Status");
    header.orientation = "column";
    header.alignChildren = "fill";
    
    var statusText = header.add("statictext", undefined, "Status: Stopped");
    statusText.graphics.font = ScriptUI.newFont(statusText.graphics.font.name, ScriptUI.FontStyle.BOLD, 12);
    
    var pathGroup = header.add("group");
    pathGroup.add("statictext", undefined, "AE watches:");
    var aePathText = pathGroup.add("edittext", undefined, COMMANDS_DIR, {readonly: true});
    aePathText.preferredSize.width = 450;
    
    var nodePathGroup = header.add("group");
    nodePathGroup.add("statictext", undefined, "Node.js uses:");
    var nodePathText = nodePathGroup.add("edittext", undefined, normalizedPath, {readonly: true});
    nodePathText.preferredSize.width = 450;
    
    // Stats
    var statsText = header.add("statictext", undefined, "Commands processed: 0 | Errors: 0");
    
    // Control buttons
    var buttonPanel = dialog.add("panel", undefined, "Controls");
    var buttonGroup = buttonPanel.add("group");
    buttonGroup.alignment = "center";
    
    var startBtn = buttonGroup.add("button", undefined, "Start Bridge");
    var stopBtn = buttonGroup.add("button", undefined, "Stop Bridge");
    stopBtn.enabled = false;
    
    var openFolderBtn = buttonGroup.add("button", undefined, "Open Folder");
    var clearBtn = buttonGroup.add("button", undefined, "Clear Files");
    var testBtn = buttonGroup.add("button", undefined, "Test Write");
    
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
    logText.preferredSize.height = 250;
    
    // Info panel
    var infoPanel = dialog.add("panel", undefined, "Status");
    var infoText = infoPanel.add("statictext", undefined, 
        "Ready to bridge After Effects with MCP using file-based communication.",
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
            case "debug":   prefix = "🔍 "; break;
            default:        prefix = "   ";
        }
        
        logText.text += "[" + timestamp + "] " + prefix + message + "\n";
        
        // Auto-scroll
        logText.active = false;
        logText.active = true;
        
        // Keep last 500 lines
        var lines = logText.text.split("\n");
        if (lines.length > 500) {
            logText.text = lines.slice(-500).join("\n");
        }
    }
    
    function updateStats() {
        var errorCount = lastError ? 1 : 0;
        statsText.text = "Commands processed: " + commandCounter + " | Errors: " + errorCount;
    }
    
    function executeScript(scriptCode) {
        try {
            log("Executing script", "debug");
            var result = eval(scriptCode);
            log("Script executed successfully", "debug");
            return {
                success: true,
                data: result
            };
        } catch (error) {
            log("Script error: " + error.toString(), "error");
            lastError = error;
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
            log("Found command file: " + file.name, "command");
            
            // Read command
            if (!file.open("r")) {
                log("Cannot open file: " + file.name, "error");
                return;
            }
            
            var content = file.read();
            file.close();
            
            if (!content) {
                log("Empty command file", "error");
                return;
            }
            
            var command;
            try {
                command = JSON.parse(content);
            } catch (e) {
                log("Invalid JSON in command: " + e.toString(), "error");
                file.remove(); // Remove invalid file
                return;
            }
            
            log("Command ID: " + command.id, "debug");
            
            // Execute script
            var result = executeScript(command.script);
            
            // Write response
            var responseFile = new File(file.fsName + ".response");
            responseFile.open("w");
            responseFile.write(JSON.stringify({
                id: command.id,
                result: result
            }, null, 2));
            responseFile.close();
            
            log("Response written: " + responseFile.name, "response");
            
            // Delete command file
            file.remove();
            
            commandCounter++;
            updateStats();
            
        } catch (error) {
            log("Error processing command: " + error.toString(), "error");
            lastError = error;
            updateStats();
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
                
                processCommandFile(file);
            }
        } catch (error) {
            if (error.toString().indexOf("does not exist") === -1) {
                log("Error checking commands: " + error.toString(), "error");
            }
        }
        
        // Schedule next check
        if (isRunning) {
            $.scheduleTask(checkForCommands, checkInterval);
        }
    }
    
    function startBridge() {
        isRunning = true;
        statusText.text = "Status: ✅ Running (checking every " + checkInterval + "ms)";
        startBtn.enabled = false;
        stopBtn.enabled = true;
        
        log("File bridge started", "success");
        log("Watching: " + COMMANDS_DIR, "info");
        log("Node path: " + normalizedPath, "info");
        
        infoText.text = "Bridge is active. Commands are being monitored.\n" +
                       "Keep this window open while using MCP.";
        
        // Start checking for commands
        checkForCommands();
    }
    
    function stopBridge() {
        isRunning = false;
        statusText.text = "Status: ⏹️ Stopped";
        startBtn.enabled = true;
        stopBtn.enabled = false;
        
        log("File bridge stopped", "info");
        log("Total commands processed: " + commandCounter, "info");
        
        infoText.text = "Bridge stopped. Click 'Start Bridge' to resume.";
    }
    
    function clearOldFiles() {
        var files = commandsFolder.getFiles();
        var cleared = 0;
        
        for (var i = 0; i < files.length; i++) {
            try {
                files[i].remove();
                cleared++;
            } catch (e) {
                log("Could not remove: " + files[i].name, "error");
            }
        }
        
        log("Cleared " + cleared + " files", "info");
    }
    
    function openCommandsFolder() {
        if ($.os.indexOf("Windows") !== -1) {
            system.callSystem("explorer \"" + COMMANDS_DIR + "\"");
        } else {
            system.callSystem("open \"" + COMMANDS_DIR + "\"");
        }
    }
    
    function testWrite() {
        log("Testing file write...", "info");
        try {
            var testFile = new File(commandsFolder.fsName + "/test-" + Date.now() + ".txt");
            testFile.open("w");
            testFile.write("Test from After Effects");
            testFile.close();
            log("✅ Write test successful: " + testFile.name, "success");
            testFile.remove();
        } catch (e) {
            log("❌ Write test failed: " + e.toString(), "error");
        }
    }
    
    // Event handlers
    startBtn.onClick = startBridge;
    stopBtn.onClick = stopBridge;
    clearBtn.onClick = clearOldFiles;
    openFolderBtn.onClick = openCommandsFolder;
    testBtn.onClick = testWrite;
    clearLogBtn.onClick = function() {
        logText.text = "";
        log("Log cleared", "info");
    };
    
    dialog.onClose = function() {
        stopBridge();
    };
    
    // Initial setup
    log("AE MCP File Bridge V2 initialized", "info");
    log("After Effects " + app.version, "info");
    
    // Show path information
    log("Temp folder: " + tempFolder.fsName, "debug");
    log("Commands folder: " + COMMANDS_DIR, "debug");
    log("Normalized path: " + normalizedPath, "debug");
    
    // Test write permissions
    testWrite();
    
    // Clear old files on startup
    clearOldFiles();
    
    // Show dialog
    dialog.center();
    dialog.show();
})();