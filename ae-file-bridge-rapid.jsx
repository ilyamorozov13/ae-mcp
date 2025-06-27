// File Bridge with rapid manual polling

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
    var isRapidMode = false;
    var lastProcessTime = 0;
    
    // UI
    var dialog = new Window("dialog", "AE MCP File Bridge - Rapid Mode");
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
    
    var processBtn = btnGroup.add("button", undefined, "Process Once");
    processBtn.preferredSize.width = 120;
    
    var rapidBtn = btnGroup.add("button", undefined, "⚡ RAPID MODE (Hold)");
    rapidBtn.preferredSize.width = 180;
    
    var clearBtn = btnGroup.add("button", undefined, "Clear");
    var openBtn = btnGroup.add("button", undefined, "Open Folder");
    
    // Instructions
    var instructText = btnPanel.add("statictext", undefined, 
        "Hold down RAPID MODE button to continuously process commands", 
        {multiline: true});
    
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
            case "rapid": prefix = "⚡ "; break;
            default: prefix = "📝 ";
        }
        
        log.text += "[" + time + "] " + prefix + msg + "\n";
        log.active = false;
        log.active = true;
    }
    
    function updateStats() {
        var mode = isRapidMode ? " | ⚡ RAPID MODE ACTIVE" : "";
        statsText.text = "Processed: " + processedCount + " | Errors: " + errorCount + mode;
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
            return true;
            
        } catch (error) {
            errorCount++;
            return false;
        }
    }
    
    function processCommands(silent) {
        var files = commandsFolder.getFiles();
        var commandFiles = [];
        var processedNow = 0;
        
        for (var i = 0; i < files.length; i++) {
            var fileName = files[i].name;
            if (fileName.indexOf(".json") !== -1 && fileName.indexOf(".response") === -1) {
                commandFiles.push(files[i]);
            }
        }
        
        if (commandFiles.length > 0) {
            if (!silent) addLog("Processing " + commandFiles.length + " commands", "process");
            
            for (var j = 0; j < commandFiles.length; j++) {
                if (processFile(commandFiles[j])) {
                    processedNow++;
                }
            }
            
            if (processedNow > 0 && !silent) {
                addLog("Processed " + processedNow + " commands", "success");
            }
        }
        
        updateStats();
        return processedNow;
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
    
    // Event handlers
    processBtn.onClick = function() {
        addLog("Manual process", "info");
        processCommands(false);
    };
    
    clearBtn.onClick = clearFolder;
    openBtn.onClick = openFolder;
    
    // Rapid mode handlers
    rapidBtn.addEventListener("mousedown", function() {
        isRapidMode = true;
        addLog("RAPID MODE STARTED - Processing continuously", "rapid");
        updateStats();
        
        // Process in a loop while mouse is down
        while (isRapidMode) {
            var now = new Date().getTime();
            if (now - lastProcessTime > 100) { // Process every 100ms in rapid mode
                processCommands(true); // Silent mode
                lastProcessTime = now;
            }
            
            // Update UI
            dialog.update();
            
            // Small delay to prevent complete UI freeze
            $.sleep(10);
        }
    });
    
    rapidBtn.addEventListener("mouseup", function() {
        isRapidMode = false;
        addLog("RAPID MODE STOPPED", "rapid");
        updateStats();
    });
    
    rapidBtn.addEventListener("mouseout", function() {
        if (isRapidMode) {
            isRapidMode = false;
            addLog("RAPID MODE STOPPED (mouse left button)", "rapid");
            updateStats();
        }
    });
    
    // Initialize
    addLog("File bridge initialized", "success");
    addLog("Commands folder: " + COMMANDS_DIR, "info");
    addLog("Hold 'RAPID MODE' button to process continuously", "info");
    
    updateStats();
    
    dialog.show();
})();