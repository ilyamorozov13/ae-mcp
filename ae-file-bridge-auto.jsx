// File Bridge with working auto-polling

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
    var pollCount = 0;
    var isPolling = false;
    var stopPolling = false;
    
    // UI
    var dialog = new Window("dialog", "AE MCP File Bridge - Auto Polling");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.preferredSize.width = 900;
    
    // Status panel
    var statusPanel = dialog.add("panel", undefined, "Status");
    var statsText = statusPanel.add("statictext", undefined, "Ready to process commands");
    var pathText = statusPanel.add("edittext", undefined, COMMANDS_DIR, {readonly: true});
    pathText.preferredSize.width = 880;
    
    // Controls
    var btnPanel = dialog.add("panel", undefined, "Controls");
    var btnGroup = btnPanel.add("group");
    
    var autoProcessCheck = btnGroup.add("checkbox", undefined, "Auto Process (500ms)");
    autoProcessCheck.value = false;
    
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
        
        // Auto-scroll
        var temp = log.text;
        log.text = " ";
        log.text = temp;
    }
    
    function updateStats() {
        var pollStatus = isPolling ? " | Polls: " + pollCount : "";
        statsText.text = "Processed: " + processedCount + " | Errors: " + errorCount + pollStatus;
    }
    
    function processFile(file) {
        try {
            // Read file
            file.open("r");
            var content = file.read();
            file.close();
            
            var command = JSON.parse(content);
            
            // Execute script
            var result;
            try {
                result = eval(command.script);
                if (!result) {
                    result = { success: true, data: null };
                }
            } catch (scriptError) {
                result = {
                    success: false,
                    error: {
                        message: scriptError.toString(),
                        code: scriptError.number || "UNKNOWN"
                    }
                };
            }
            
            // Write response
            var responseFile = new File(file.fsName + ".response");
            var responseData = JSON.stringify({
                id: command.id,
                result: result
            }, null, 2);
            
            responseFile.encoding = "UTF-8";
            responseFile.open("w");
            responseFile.write(responseData);
            responseFile.close();
            
            // Delete command file
            file.remove();
            
            processedCount++;
            updateStats();
            
            addLog("Processed: " + command.id, "success");
            return true;
            
        } catch (error) {
            addLog("Error: " + error.toString(), "error");
            errorCount++;
            updateStats();
            return false;
        }
    }
    
    function processCommands() {
        var files = commandsFolder.getFiles();
        var commandFiles = [];
        
        for (var i = 0; i < files.length; i++) {
            var fileName = files[i].name;
            if (fileName.indexOf(".json") !== -1 && fileName.indexOf(".response") === -1) {
                commandFiles.push(files[i]);
            }
        }
        
        if (commandFiles.length > 0) {
            for (var j = 0; j < commandFiles.length; j++) {
                processFile(commandFiles[j]);
            }
        }
        
        return commandFiles.length;
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
    
    // Main polling function
    function runPolling() {
        stopPolling = false;
        isPolling = true;
        addLog("Auto-polling started", "info");
        
        // Create a separate function that we can call recursively
        function pollOnce() {
            if (stopPolling || !autoProcessCheck.value) {
                isPolling = false;
                pollCount = 0;
                updateStats();
                addLog("Auto-polling stopped", "info");
                return;
            }
            
            // Process commands
            processCommands();
            
            // Update poll count
            pollCount++;
            if (pollCount % 10 === 0) {
                updateStats();
            }
            
            // Wait 500ms then poll again
            // Using a button to schedule the next poll
            var hiddenButton = btnGroup.add("button", undefined, "hidden");
            hiddenButton.visible = false;
            hiddenButton.onClick = function() {
                btnGroup.remove(hiddenButton);
                pollOnce();
            };
            
            // Trigger the button after a delay
            $.sleep(500);
            hiddenButton.notify("onClick");
        }
        
        // Start the first poll
        pollOnce();
    }
    
    // Event handlers
    processBtn.onClick = function() {
        addLog("Manual process", "info");
        var processed = processCommands();
        if (processed === 0) {
            addLog("No commands found", "info");
        }
    };
    
    clearBtn.onClick = clearFolder;
    openBtn.onClick = openFolder;
    
    autoProcessCheck.onClick = function() {
        if (autoProcessCheck.value) {
            if (!isPolling) {
                runPolling();
            }
        } else {
            stopPolling = true;
        }
    };
    
    dialog.onClose = function() {
        stopPolling = true;
    };
    
    // Initialize
    addLog("File bridge initialized", "success");
    addLog("Commands folder: " + COMMANDS_DIR, "info");
    addLog("Click 'Auto Process' to enable automatic polling", "info");
    
    updateStats();
    
    dialog.show();
})();