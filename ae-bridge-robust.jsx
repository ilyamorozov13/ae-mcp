// Robust AE MCP Bridge - Guaranteed to process commands

(function() {
    var documentsFolder = Folder.myDocuments;
    var COMMANDS_DIR = documentsFolder.fsName + "/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    if (!commandsFolder.exists) {
        if (!commandsFolder.create()) {
            alert("Cannot create commands folder!");
            return;
        }
    }
    
    // Use dialog (not palette) for simplicity
    var dialog = new Window("dialog", "AE MCP Bridge - Robust Version");
    dialog.preferredSize.width = 1000;
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    
    // Controls
    var controlPanel = dialog.add("panel", undefined, "Controls");
    var btnGroup = controlPanel.add("group");
    
    var startBtn = btnGroup.add("button", undefined, "START PROCESSING");
    startBtn.preferredSize.height = 40;
    startBtn.graphics.font = ScriptUI.newFont(startBtn.graphics.font.name, ScriptUI.FontStyle.BOLD, 14);
    
    var stopBtn = btnGroup.add("button", undefined, "STOP");
    stopBtn.enabled = false;
    
    // Status
    var statusText = dialog.add("statictext", undefined, "Ready to start");
    
    // Log
    var logPanel = dialog.add("panel", undefined, "Log");
    var log = logPanel.add("edittext", undefined, "", {multiline: true, readonly: true});
    log.preferredSize.height = 400;
    log.preferredSize.width = 980;
    
    var isRunning = false;
    var processed = 0;
    
    function addLog(msg, isError) {
        var time = new Date().toLocaleTimeString();
        var prefix = isError ? "❌ " : "✅ ";
        log.text = "[" + time + "] " + prefix + msg + "\n" + log.text;
        
        // Keep log size manageable
        if (log.text.length > 5000) {
            log.text = log.text.substring(0, 4000);
        }
    }
    
    function processFile(file) {
        try {
            addLog("Processing: " + file.name);
            
            // Read command
            file.open("r");
            var content = file.read();
            file.close();
            
            if (!content) {
                throw new Error("Empty command file");
            }
            
            var cmd = JSON.parse(content);
            var result;
            
            // Fix common issues in script
            var script = cmd.script;
            
            // Fix zero scale values
            script = script.replace(/Scale"\)\.setValue\(\[0,\s*0\]\)/g, 'Scale").setValue([1, 1])');
            script = script.replace(/setValueAtTime\(([^,]+),\s*\[0,\s*0\]\)/g, 'setValueAtTime($1, [1, 1])');
            
            // Fix empty arrays
            script = script.replace(/setValueAtTime\(([^,]+),\s*\[\]\)/g, 'setValueAtTime($1, [100, 100])');
            
            try {
                result = eval(script);
                if (!result) {
                    result = {success: true, data: null};
                }
                addLog("Executed successfully");
            } catch (e) {
                result = {
                    success: false,
                    error: {
                        message: e.toString(),
                        code: e.number || "UNKNOWN"
                    }
                };
                addLog("Script error: " + e.toString(), true);
            }
            
            // Write response
            var responseFile = new File(file.fsName + ".response");
            responseFile.encoding = "UTF-8";
            
            if (!responseFile.open("w")) {
                throw new Error("Cannot open response file");
            }
            
            var responseData = JSON.stringify({
                id: cmd.id,
                result: result
            }, null, 2);
            
            responseFile.write(responseData);
            responseFile.close();
            
            // Verify write
            if (!responseFile.exists || responseFile.length === 0) {
                // Try again with writeln
                responseFile.open("w");
                responseFile.writeln(responseData);
                responseFile.close();
            }
            
            if (responseFile.exists && responseFile.length > 0) {
                addLog("Response written: " + responseFile.length + " bytes");
                processed++;
                statusText.text = "Processed: " + processed + " commands";
            } else {
                throw new Error("Failed to write response");
            }
            
            // Delete command file
            file.remove();
            
        } catch (e) {
            addLog("Error: " + e.toString(), true);
            
            // Try to at least create an error response
            try {
                var errorFile = new File(file.fsName + ".response");
                errorFile.open("w");
                errorFile.writeln(JSON.stringify({
                    id: "unknown",
                    result: {
                        success: false,
                        error: {message: "Processing error: " + e.toString()}
                    }
                }));
                errorFile.close();
            } catch (e2) {}
        }
    }
    
    function processLoop() {
        var loopCount = 0;
        
        while (isRunning) {
            loopCount++;
            
            try {
                var files = commandsFolder.getFiles("*.json");
                var foundCommand = false;
                
                for (var i = 0; i < files.length; i++) {
                    if (files[i].name.indexOf(".response") === -1) {
                        foundCommand = true;
                        processFile(files[i]);
                    }
                }
                
                if (loopCount % 10 === 0) {
                    statusText.text = "Running... Checked " + loopCount + " times, processed " + processed + " commands";
                    dialog.update();
                }
                
            } catch (e) {
                addLog("Loop error: " + e.toString(), true);
            }
            
            // Small delay
            $.sleep(100);
        }
        
        statusText.text = "Stopped. Processed " + processed + " total commands";
    }
    
    // Button handlers
    startBtn.onClick = function() {
        if (!isRunning) {
            isRunning = true;
            startBtn.enabled = false;
            stopBtn.enabled = true;
            addLog("Started processing loop");
            processLoop();
        }
    };
    
    stopBtn.onClick = function() {
        isRunning = false;
        startBtn.enabled = true;
        stopBtn.enabled = false;
        addLog("Stopping...");
    };
    
    dialog.onClose = function() {
        isRunning = false;
    };
    
    // Startup
    addLog("Bridge initialized - " + COMMANDS_DIR);
    
    // Check for existing files
    var existingFiles = commandsFolder.getFiles("*.json");
    var pendingCount = 0;
    for (var i = 0; i < existingFiles.length; i++) {
        if (existingFiles[i].name.indexOf(".response") === -1) {
            pendingCount++;
        }
    }
    
    if (pendingCount > 0) {
        addLog("Found " + pendingCount + " pending command(s)");
        statusText.text = "Found " + pendingCount + " pending commands - click START to process";
    }
    
    dialog.show();
})();