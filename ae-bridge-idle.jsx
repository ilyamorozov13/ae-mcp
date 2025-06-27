// AE MCP Bridge with Idle Task Processing
// Uses After Effects' app.scheduleTask for reliable command processing

(function() {
    var documentsFolder = Folder.myDocuments;
    var COMMANDS_DIR = documentsFolder.fsName + "/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    if (!commandsFolder.exists) {
        commandsFolder.create();
    }
    
    // Create palette window
    var win = (this instanceof Panel) ? this : new Window("palette", "AE MCP Bridge (Idle)", undefined, {
        resizeable: true,
        closeButton: true,
        maximizeButton: false,
        minimizeButton: true
    });
    
    // Window setup
    win.preferredSize.width = 450;
    win.preferredSize.height = 600;
    win.orientation = "column";
    win.alignChildren = "fill";
    win.spacing = 5;
    win.margins = 10;
    
    // Header with title and status
    var headerGroup = win.add("group");
    headerGroup.orientation = "row";
    headerGroup.alignment = "fill";
    
    var titleText = headerGroup.add("statictext", undefined, "AE MCP Bridge (Idle)");
    titleText.graphics.font = ScriptUI.newFont(titleText.graphics.font.name, ScriptUI.FontStyle.BOLD, 14);
    
    headerGroup.add("panel", undefined, "").preferredSize.width = 20; // spacer
    
    var statusText = headerGroup.add("statictext", undefined, "● Active");
    statusText.graphics.foregroundColor = statusText.graphics.newPen(statusText.graphics.PenType.SOLID_COLOR, [0.2, 0.8, 0.2], 1);
    
    // Control buttons
    var controlPanel = win.add("panel", undefined, "Controls");
    controlPanel.orientation = "row";
    controlPanel.alignChildren = "center";
    controlPanel.margins = 10;
    
    var autoCheck = controlPanel.add("checkbox", undefined, "Auto");
    autoCheck.value = true;
    autoCheck.helpTip = "Auto-process commands";
    
    var processBtn = controlPanel.add("button", undefined, "Process Now");
    processBtn.preferredSize.width = 100;
    
    var clearLogBtn = controlPanel.add("button", undefined, "Clear Log");
    clearLogBtn.preferredSize.width = 80;
    
    var openFolderBtn = controlPanel.add("button", undefined, "📁");
    openFolderBtn.preferredSize.width = 40;
    openFolderBtn.helpTip = "Open commands folder";
    
    // Statistics panel
    var statsPanel = win.add("panel", undefined, "Statistics");
    statsPanel.preferredSize.height = 50;
    var statsText = statsPanel.add("statictext", undefined, "Processed: 0 | Errors: 0 | Pending: 0");
    statsText.alignment = "center";
    
    // Log panel
    var logPanel = win.add("panel", undefined, "Activity Log");
    logPanel.alignChildren = "fill";
    logPanel.preferredSize.height = 400;
    
    var log = logPanel.add("edittext", undefined, "", {
        multiline: true,
        readonly: true,
        scrolling: true
    });
    log.graphics.font = ScriptUI.newFont("Courier", ScriptUI.FontStyle.REGULAR, 10);
    
    // Footer
    var footerGroup = win.add("group");
    footerGroup.orientation = "row";
    footerGroup.alignment = "center";
    
    var pathText = footerGroup.add("statictext", undefined, "📂 " + COMMANDS_DIR);
    pathText.graphics.font = ScriptUI.newFont(pathText.graphics.font.name, ScriptUI.FontStyle.REGULAR, 9);
    
    // Variables
    var isRunning = true;
    var processed = 0;
    var errors = 0;
    var pending = 0;
    var checkCount = 0;
    var taskId = null;
    var isProcessing = false;
    
    // Functions
    function addLog(msg, type) {
        var time = new Date().toLocaleTimeString();
        var icon = "";
        
        switch(type) {
            case "error": icon = "❌"; break;
            case "success": icon = "✅"; break;
            case "process": icon = "⚡"; break;
            case "info": icon = "ℹ️"; break;
            default: icon = "•";
        }
        
        var newEntry = "[" + time + "] " + icon + " " + msg + "\n";
        log.text = log.text + newEntry;
        
        // Limit log size
        var lines = log.text.split("\n");
        if (lines.length > 100) {
            log.text = lines.slice(-100).join("\n");
        }
        
        // Auto-scroll
        log.active = false;
        log.active = true;
        log.textselection = [log.text.length, log.text.length];
    }
    
    function updateStats() {
        statsText.text = "Processed: " + processed + " | Errors: " + errors + " | Pending: " + pending;
        
        // Update status indicator
        if (errors > 0) {
            statusText.text = "● Active (with errors)";
            statusText.graphics.foregroundColor = statusText.graphics.newPen(
                statusText.graphics.PenType.SOLID_COLOR, [0.8, 0.2, 0.2], 1
            );
        } else if (pending > 0) {
            statusText.text = "● Processing...";
            statusText.graphics.foregroundColor = statusText.graphics.newPen(
                statusText.graphics.PenType.SOLID_COLOR, [0.8, 0.8, 0.2], 1
            );
        } else {
            statusText.text = "● Active";
            statusText.graphics.foregroundColor = statusText.graphics.newPen(
                statusText.graphics.PenType.SOLID_COLOR, [0.2, 0.8, 0.2], 1
            );
        }
    }
    
    function processFile(file) {
        try {
            file.open("r");
            var content = file.read();
            file.close();
            
            var cmd = JSON.parse(content);
            var cmdName = cmd.id.split("_")[0];
            addLog("Processing: " + cmdName + " (ID: " + cmd.id + ")", "process");
            
            var result;
            var script = cmd.script;
            
            // Apply fixes for common issues
            script = script.replace(/Scale["\)]*\.[gs]etValue(?:AtTime)?\([^,)]*,\s*\[0,\s*0\]/g, function(match) {
                return match.replace("[0, 0]", "[1, 1]");
            });
            
            try {
                result = eval(script);
                if (!result) result = {success: true, data: null};
                processed++;
                addLog("Success: " + cmdName, "success");
            } catch (e) {
                result = {
                    success: false,
                    error: {
                        message: e.toString(),
                        code: e.number || "UNKNOWN",
                        line: e.line || "unknown"
                    }
                };
                errors++;
                addLog("Error in " + cmdName + ": " + e.toString(), "error");
            }
            
            // Write response
            var responseFile = new File(file.fsName + ".response");
            responseFile.encoding = "UTF-8";
            
            if (responseFile.open("w")) {
                responseFile.write(JSON.stringify({id: cmd.id, result: result}, null, 2));
                responseFile.close();
                
                // Verify response was written
                if (responseFile.exists && responseFile.length > 0) {
                    // Delete the command file
                    file.remove();
                } else {
                    throw new Error("Response file write failed");
                }
            } else {
                throw new Error("Cannot open response file");
            }
            
            updateStats();
            
        } catch (e) {
            addLog("Process error for " + file.name + ": " + e.toString(), "error");
            errors++;
            updateStats();
        }
    }
    
    function checkCommands() {
        if (!autoCheck.value || !isRunning || isProcessing) return;
        
        isProcessing = true;
        checkCount++;
        
        try {
            var files = commandsFolder.getFiles("*.json");
            pending = 0;
            var commandFiles = [];
            
            // Filter out response files and count pending
            for (var i = 0; i < files.length; i++) {
                if (files[i].name.indexOf(".response") === -1) {
                    pending++;
                    commandFiles.push(files[i]);
                }
            }
            
            // Process command files
            for (var j = 0; j < commandFiles.length; j++) {
                processFile(commandFiles[j]);
            }
            
            if (checkCount % 10 === 0 || pending > 0) {
                updateStats();
            }
            
        } catch (e) {
            addLog("Check error: " + e.toString(), "error");
        } finally {
            isProcessing = false;
        }
    }
    
    // Use app.scheduleTask if available, otherwise fall back to idle events
    function scheduleNextCheck() {
        if (!isRunning || !autoCheck.value) return;
        
        try {
            if (app.scheduleTask) {
                // Use scheduleTask if available
                taskId = app.scheduleTask("checkCommands();", 200, false);
            } else {
                // Fallback: trigger on next idle
                app.idleTask = checkCommands;
            }
        } catch (e) {
            // Final fallback: use window events
            addLog("Using window event fallback", "info");
        }
    }
    
    // Alternative: Use onDraw for continuous updates
    win.onDraw = function() {
        if (!isRunning || !autoCheck.value) return;
        
        var now = new Date().getTime();
        if (!this.lastCheck) this.lastCheck = 0;
        
        if (now - this.lastCheck > 200) {
            this.lastCheck = now;
            checkCommands();
        }
    };
    
    // Button handlers
    processBtn.onClick = function() {
        addLog("Manual process triggered", "info");
        checkCommands();
    };
    
    clearLogBtn.onClick = function() {
        log.text = "";
        addLog("Log cleared", "info");
    };
    
    openFolderBtn.onClick = function() {
        commandsFolder.execute();
    };
    
    autoCheck.onClick = function() {
        if (autoCheck.value) {
            addLog("Auto-processing enabled", "info");
            scheduleNextCheck();
        } else {
            addLog("Auto-processing disabled", "info");
            if (taskId) {
                app.cancelTask(taskId);
                taskId = null;
            }
        }
    };
    
    win.onClose = function() {
        isRunning = false;
        if (taskId) {
            app.cancelTask(taskId);
        }
        addLog("Bridge shutting down", "info");
    };
    
    win.onResize = function() {
        win.layout.layout(true);
    };
    
    // Window mouse events for activity-based checking
    win.addEventListener("mousemove", function() {
        if (!isRunning || !autoCheck.value) return;
        
        var now = new Date().getTime();
        if (!this.lastMouseCheck) this.lastMouseCheck = 0;
        
        if (now - this.lastMouseCheck > 500) {
            this.lastMouseCheck = now;
            checkCommands();
        }
    });
    
    // Initialize
    addLog("AE MCP Bridge (Idle) initialized", "success");
    addLog("Commands folder: " + COMMANDS_DIR, "info");
    addLog("Auto-processing enabled", "info");
    
    // Process any existing files
    checkCommands();
    
    // Start checking
    if (autoCheck.value) {
        scheduleNextCheck();
    }
    
    // Show window
    if (win instanceof Window) {
        win.show();
    } else {
        win.layout.layout(true);
    }
})();