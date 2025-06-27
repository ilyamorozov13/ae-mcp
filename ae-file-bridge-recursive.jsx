// File Bridge with recursive polling - non-blocking approach

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
    var pollCounter = 0;
    
    // UI
    var dialog = new Window("dialog", "AE MCP File Bridge - Recursive Polling");
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
    
    var autoProcessCheck = btnGroup.add("checkbox", undefined, "Auto Process");
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
        log.active = false;
        log.active = true;
    }
    
    function updateStats() {
        var pollStatus = autoProcessCheck.value ? " | Polling: " + pollCounter : "";
        statsText.text = "Processed: " + processedCount + " | Errors: " + errorCount + pollStatus;
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
            
            // Write response
            var responseFile = new File(file.fsName + ".response");
            var responseData = JSON.stringify({
                id: command.id,
                result: result
            }, null, 2);
            
            responseFile.encoding = "UTF-8";
            
            if (!responseFile.open("w")) {
                throw new Error("Cannot open response file: " + responseFile.error);
            }
            
            responseFile.write(responseData);
            responseFile.close();
            
            addLog("Response written: " + responseFile.name, "success");
            
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
        var files = commandsFolder.getFiles();
        var commandFiles = [];
        var foundAny = false;
        
        for (var i = 0; i < files.length; i++) {
            var fileName = files[i].name;
            if (fileName.indexOf(".json") !== -1 && fileName.indexOf(".response") === -1) {
                commandFiles.push(files[i]);
                foundAny = true;
            }
        }
        
        if (foundAny) {
            addLog("Found " + commandFiles.length + " command file(s)", "info");
            
            for (var j = 0; j < commandFiles.length; j++) {
                processFile(commandFiles[j]);
            }
        }
        
        // Update poll counter
        if (autoProcessCheck.value) {
            pollCounter++;
            if (pollCounter % 10 === 0) {
                updateStats();
            }
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
    
    // Recursive polling function
    function pollLoop() {
        if (!autoProcessCheck.value) {
            // Stop polling
            pollCounter = 0;
            updateStats();
            return;
        }
        
        // Process commands
        processCommands();
        
        // Schedule next poll using app idle task
        app.idleTasks.add({
            name: "AE_MCP_Poll",
            sleepTime: 500,
            onIdleTask: function() {
                pollLoop();
                app.idleTasks.remove(this);
                return true;
            }
        });
    }
    
    // Event handlers
    processBtn.onClick = function() {
        addLog("Manual process", "info");
        processCommands();
    };
    
    clearBtn.onClick = clearFolder;
    openBtn.onClick = openFolder;
    
    autoProcessCheck.onClick = function() {
        if (autoProcessCheck.value) {
            addLog("Auto-processing started", "info");
            pollCounter = 0;
            pollLoop();
        } else {
            addLog("Auto-processing stopped", "info");
            pollCounter = 0;
            updateStats();
        }
    };
    
    // Initialize
    addLog("File bridge initialized", "success");
    addLog("Commands folder: " + COMMANDS_DIR, "info");
    addLog("Folder exists: " + commandsFolder.exists, "info");
    addLog("Check 'Auto Process' to enable automatic polling", "info");
    
    updateStats();
    
    dialog.show();
})();