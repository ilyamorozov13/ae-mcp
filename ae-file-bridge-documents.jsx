// File Bridge using Documents folder instead of temp folder

(function() {
    // Use Documents folder which AE should have write access to
    var documentsFolder = Folder.myDocuments;
    var COMMANDS_DIR = documentsFolder.fsName + "/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    // Create directory if it doesn't exist
    if (!commandsFolder.exists) {
        if (!commandsFolder.create()) {
            alert("Cannot create commands folder in Documents!");
            return;
        }
    }
    
    var processedCount = 0;
    var errorCount = 0;
    
    // UI - using palette for continuous operation
    var dialog = new Window("palette", "AE MCP File Bridge - Documents Folder", undefined, {resizeable: true});
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.preferredSize.width = 900;
    
    // Status panel
    var statusPanel = dialog.add("panel", undefined, "Status");
    var statsText = statusPanel.add("statictext", undefined, "Ready to process commands");
    var pathText = statusPanel.add("edittext", undefined, COMMANDS_DIR, {readonly: true});
    pathText.preferredSize.width = 880;
    
    // Info panel
    var infoPanel = dialog.add("panel", undefined, "Auto-Processing Info");
    var infoText = infoPanel.add("statictext", undefined, 
        "✅ Auto-processing is enabled by default and checks for commands every 500ms", 
        {multiline: true});
    
    // Controls
    var btnPanel = dialog.add("panel", undefined, "Controls");
    var btnGroup = btnPanel.add("group");
    
    var autoProcessCheck = btnGroup.add("checkbox", undefined, "Auto Process (500ms)");
    autoProcessCheck.value = true;
    
    var processBtn = btnGroup.add("button", undefined, "Process Now");
    processBtn.preferredSize.width = 120;
    
    var clearBtn = btnGroup.add("button", undefined, "Clear Folder");
    var openBtn = btnGroup.add("button", undefined, "Open Folder");
    
    // Log
    var logPanel = dialog.add("panel", undefined, "Activity Log");
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
        log.active = false;
        log.active = true;
    }
    
    function updateStats() {
        statsText.text = "Processed: " + processedCount + " | Errors: " + errorCount;
    }
    
    function processFile(file) {
        addLog("Processing: " + file.name, "process");
        
        try {
            // Read file
            file.open("r");
            var content = file.read();
            file.close();
            
            var command = JSON.parse(content);
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
            
            // Write response with better error checking
            var responseFile = new File(file.fsName + ".response");
            var responseData = JSON.stringify({
                id: command.id,
                result: result
            }, null, 2);
            
            // Try different write methods
            responseFile.encoding = "UTF-8";
            
            if (!responseFile.open("w")) {
                throw new Error("Cannot open response file: " + responseFile.error);
            }
            
            // Write in chunks if large
            var written = 0;
            var chunkSize = 1000;
            for (var i = 0; i < responseData.length; i += chunkSize) {
                var chunk = responseData.substring(i, Math.min(i + chunkSize, responseData.length));
                if (responseFile.write(chunk)) {
                    written += chunk.length;
                } else {
                    addLog("Write failed at position " + i, "error");
                    break;
                }
            }
            
            responseFile.close();
            
            addLog("Response written: " + responseFile.name + " (" + written + " bytes)", "success");
            
            // Verify
            if (responseFile.exists && responseFile.length > 0) {
                addLog("Verified: File exists with " + responseFile.length + " bytes", "success");
            } else {
                throw new Error("Response file verification failed");
            }
            
            // Delete command file
            file.remove();
            
            processedCount++;
            updateStats();
            
        } catch (error) {
            addLog("Error: " + error.toString(), "error");
            errorCount++;
            updateStats();
        }
    }
    
    function processCommands() {
        try {
            var files = commandsFolder.getFiles();
            var commandFiles = [];
            
            for (var i = 0; i < files.length; i++) {
                var fileName = files[i].name;
                if (fileName.indexOf(".json") !== -1 && fileName.indexOf(".response") === -1) {
                    commandFiles.push(files[i]);
                }
            }
            
            if (commandFiles.length > 0) {
                addLog("Found " + commandFiles.length + " command file(s)", "info");
                
                for (var j = 0; j < commandFiles.length; j++) {
                    processFile(commandFiles[j]);
                }
            }
        } catch (error) {
            addLog("Error in processCommands: " + error.toString(), "error");
        }
    }
    
    function clearFolder() {
        var files = commandsFolder.getFiles();
        var cleared = 0;
        
        for (var i = 0; i < files.length; i++) {
            try {
                files[i].remove();
                cleared++;
            } catch (e) {}
        }
        
        addLog("Cleared " + cleared + " files", "info");
    }
    
    function openFolder() {
        commandsFolder.execute();
    }
    
    // Timer variables  
    var pollCount = 0;
    var lastPollTime = 0;
    
    // Simple polling function that runs continuously
    function runAutoPolling() {
        // This function will be called repeatedly by the dialog system
        if (autoProcessCheck.value) {
            var now = new Date().getTime();
            // Only process every 500ms
            if (now - lastPollTime > 500) {
                lastPollTime = now;
                pollCount++;
                
                // Process any pending commands
                var files = commandsFolder.getFiles();
                var hasCommands = false;
                
                for (var i = 0; i < files.length; i++) {
                    var fileName = files[i].name;
                    if (fileName.indexOf(".json") !== -1 && fileName.indexOf(".response") === -1) {
                        hasCommands = true;
                        break;
                    }
                }
                
                if (hasCommands) {
                    processCommands();
                }
                
                // Update stats every 10 polls
                if (pollCount % 10 === 0) {
                    var pollStatus = " | Auto: ON (polls: " + pollCount + ")";
                    statsText.text = "Processed: " + processedCount + " | Errors: " + errorCount + pollStatus;
                    // Show we're actively polling
                    if (pollCount % 20 === 0) {
                        addLog("Still polling... (poll #" + pollCount + ")", "info");
                    }
                }
                
                // Keep UI responsive
                dialog.update();
            }
        }
    }
    
    // Continuous polling using palette's onActivate
    dialog.onActivate = runAutoPolling;
    
    // Event handlers
    processBtn.onClick = processCommands;
    clearBtn.onClick = clearFolder;
    openBtn.onClick = openFolder;
    
    autoProcessCheck.onClick = function() {
        if (autoProcessCheck.value) {
            addLog("Auto-processing enabled", "info");
            pollCount = 0;
            lastPollTime = 0;
        } else {
            addLog("Auto-processing disabled", "info");
            pollCount = 0;
        }
        updateStats();
    };
    
    // Initialize
    addLog("File bridge initialized", "success");
    addLog("Commands folder: " + COMMANDS_DIR, "info");
    addLog("Folder exists: " + commandsFolder.exists, "info");
    
    updateStats();
    
    // Start with auto-processing enabled
    autoProcessCheck.value = true;
    addLog("Auto-processing is ON - checking every 500ms", "info");
    
    dialog.show();
})();