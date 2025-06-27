// Simple File Bridge - Manual checking only to avoid timer issues

(function() {
    var COMMANDS_DIR = "/private/var/folders/90/jdxryyf93cz8548m5q07cc1r0000gq/T/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    if (!commandsFolder.exists) {
        alert("Commands folder does not exist:\n" + COMMANDS_DIR);
        return;
    }
    
    var processedCount = 0;
    var errorCount = 0;
    
    // UI
    var dialog = new Window("dialog", "AE MCP File Bridge - Simple");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.preferredSize.width = 900;
    
    // Status panel
    var statusPanel = dialog.add("panel", undefined, "Status");
    var statsText = statusPanel.add("statictext", undefined, "Ready to process commands");
    var pathText = statusPanel.add("statictext", undefined, "Path: " + COMMANDS_DIR);
    pathText.graphics.font = ScriptUI.newFont(pathText.graphics.font.name, ScriptUI.FontStyle.REGULAR, 10);
    
    // Instructions
    var instructPanel = dialog.add("panel", undefined, "Instructions");
    var instructText = instructPanel.add("statictext", undefined, 
        "Click 'Process Commands' to check for and process any waiting command files.\n" +
        "Keep clicking it periodically while using Claude.", 
        {multiline: true});
    
    // Controls
    var btnPanel = dialog.add("panel", undefined, "Controls");
    var btnGroup = btnPanel.add("group");
    
    var processBtn = btnGroup.add("button", undefined, "Process Commands");
    processBtn.preferredSize.width = 150;
    
    var clearBtn = btnGroup.add("button", undefined, "Clear Folder");
    var refreshBtn = btnGroup.add("button", undefined, "Refresh Stats");
    
    // Log
    var logPanel = dialog.add("panel", undefined, "Activity Log");
    var logHeader = logPanel.add("group");
    logHeader.alignment = "right";
    var clearLogBtn = logHeader.add("button", undefined, "Clear Log");
    
    var log = logPanel.add("edittext", undefined, "", {
        multiline: true,
        readonly: true,
        scrolling: true
    });
    log.preferredSize.height = 350;
    log.preferredSize.width = 880;
    
    // Functions
    function addLog(msg, type) {
        var time = new Date().toLocaleTimeString();
        var prefix = "";
        
        switch(type) {
            case "error": prefix = "❌ "; break;
            case "success": prefix = "✅ "; break;
            case "process": prefix = "🔄 "; break;
            case "info": prefix = "ℹ️ "; break;
            default: prefix = "📝 ";
        }
        
        log.text += "[" + time + "] " + prefix + msg + "\n";
        
        // Auto-scroll to bottom
        log.active = false;
        log.active = true;
    }
    
    function updateStats() {
        statsText.text = "Processed: " + processedCount + " | Errors: " + errorCount + " | Click 'Process Commands' to check for new files";
    }
    
    function processFile(file) {
        addLog("Processing: " + file.name, "process");
        
        try {
            // Read file
            if (!file.open("r")) {
                throw new Error("Cannot open file");
            }
            var content = file.read();
            file.close();
            
            // Parse command
            var command;
            try {
                command = JSON.parse(content);
            } catch (e) {
                throw new Error("Invalid JSON: " + e.toString());
            }
            
            addLog("Command ID: " + command.id, "info");
            
            // Execute script
            var result;
            try {
                result = eval(command.script);
                if (!result) {
                    result = { success: true, data: null };
                }
                addLog("Script executed successfully", "success");
            } catch (scriptError) {
                result = {
                    success: false,
                    error: {
                        message: scriptError.toString(),
                        code: scriptError.number || "UNKNOWN"
                    }
                };
                addLog("Script error: " + scriptError.toString(), "error");
            }
            
            // Write response
            var responseFile = new File(file.fsName + ".response");
            if (!responseFile.open("w")) {
                throw new Error("Cannot create response file");
            }
            
            var responseData = JSON.stringify({
                id: command.id,
                result: result
            }, null, 2);
            
            responseFile.write(responseData);
            responseFile.close();
            
            // Verify the file was written
            if (!responseFile.exists || responseFile.length === 0) {
                throw new Error("Response file was not written properly");
            }
            
            addLog("Response written: " + responseFile.name, "success");
            
            // Delete command file
            if (!file.remove()) {
                addLog("Warning: Could not delete command file", "error");
            }
            
            processedCount++;
            updateStats();
            
        } catch (error) {
            addLog("Error processing file: " + error.toString(), "error");
            errorCount++;
            updateStats();
            
            // Try to clean up
            try {
                if (file.exists) {
                    file.remove();
                }
            } catch (e) {}
        }
    }
    
    function processCommands() {
        addLog("Checking for commands...", "info");
        
        try {
            var files = commandsFolder.getFiles();
            var commandFiles = [];
            
            // Filter for command files (not responses)
            for (var i = 0; i < files.length; i++) {
                var fileName = files[i].name;
                if (fileName.indexOf(".json") !== -1 && fileName.indexOf(".response") === -1) {
                    commandFiles.push(files[i]);
                }
            }
            
            if (commandFiles.length === 0) {
                addLog("No command files found", "info");
            } else {
                addLog("Found " + commandFiles.length + " command file(s)", "info");
                
                for (var j = 0; j < commandFiles.length; j++) {
                    processFile(commandFiles[j]);
                }
            }
            
        } catch (error) {
            addLog("Error checking for commands: " + error.toString(), "error");
        }
    }
    
    function clearFolder() {
        addLog("Clearing folder...", "info");
        var files = commandsFolder.getFiles();
        var cleared = 0;
        
        for (var i = 0; i < files.length; i++) {
            try {
                files[i].remove();
                cleared++;
            } catch (e) {
                addLog("Could not remove: " + files[i].name, "error");
            }
        }
        
        addLog("Cleared " + cleared + " files", "info");
    }
    
    // Event handlers
    processBtn.onClick = function() {
        processCommands();
    };
    
    clearBtn.onClick = clearFolder;
    
    refreshBtn.onClick = function() {
        updateStats();
        addLog("Stats refreshed", "info");
    };
    
    clearLogBtn.onClick = function() {
        log.text = "";
        addLog("Log cleared", "info");
    };
    
    // Initialize
    addLog("File bridge initialized", "success");
    addLog("Commands folder: " + COMMANDS_DIR, "info");
    addLog("Folder exists: " + commandsFolder.exists, "info");
    addLog("Ready! Click 'Process Commands' after using Claude commands", "info");
    
    updateStats();
    
    // Check once on startup
    processCommands();
    
    dialog.show();
})();