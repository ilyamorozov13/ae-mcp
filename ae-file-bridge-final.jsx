// Working File Bridge - Final Version without scheduleTask

(function() {
    var COMMANDS_DIR = "/private/var/folders/90/jdxryyf93cz8548m5q07cc1r0000gq/T/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    if (!commandsFolder.exists) {
        alert("Commands folder does not exist:\n" + COMMANDS_DIR);
        return;
    }
    
    var isRunning = false;
    var processedCount = 0;
    var errorCount = 0;
    var checkTimer = null;
    
    // UI
    var dialog = new Window("dialog", "AE MCP File Bridge - Final");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.preferredSize.width = 900;
    
    // Status panel
    var statusPanel = dialog.add("panel", undefined, "Status");
    var statusText = statusPanel.add("statictext", undefined, "Status: Stopped");
    var statsText = statusPanel.add("statictext", undefined, "Processed: 0 | Errors: 0");
    var pathText = statusPanel.add("statictext", undefined, "Path: " + COMMANDS_DIR);
    pathText.graphics.font = ScriptUI.newFont(pathText.graphics.font.name, ScriptUI.FontStyle.REGULAR, 10);
    
    // Controls
    var btnPanel = dialog.add("panel", undefined, "Controls");
    var btnGroup = btnPanel.add("group");
    
    var startBtn = btnGroup.add("button", undefined, "Start Processing");
    var stopBtn = btnGroup.add("button", undefined, "Stop");
    stopBtn.enabled = false;
    var checkBtn = btnGroup.add("button", undefined, "Check Now");
    var clearBtn = btnGroup.add("button", undefined, "Clear Folder");
    
    // Log
    var logPanel = dialog.add("panel", undefined, "Activity Log");
    var log = logPanel.add("edittext", undefined, "", {
        multiline: true,
        readonly: true,
        scrolling: true
    });
    log.preferredSize.height = 400;
    log.preferredSize.width = 880;
    
    // Functions
    function addLog(msg, type) {
        var time = new Date().toLocaleTimeString();
        var prefix = type === "error" ? "❌ " : type === "success" ? "✅ " : "📝 ";
        log.text += "[" + time + "] " + prefix + msg + "\n";
        log.active = false;
        log.active = true;
        
        // Limit log size
        var lines = log.text.split("\n");
        if (lines.length > 100) {
            log.text = lines.slice(-100).join("\n");
        }
    }
    
    function updateStats() {
        statsText.text = "Processed: " + processedCount + " | Errors: " + errorCount;
    }
    
    function processFile(file) {
        addLog("Processing: " + file.name);
        
        try {
            // Read file
            if (!file.open("r")) {
                throw new Error("Cannot open file");
            }
            var content = file.read();
            file.close();
            
            // Parse command
            var command = JSON.parse(content);
            addLog("Command ID: " + command.id);
            
            // Execute script
            var result;
            try {
                result = eval(command.script);
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
            responseFile.open("w");
            responseFile.write(JSON.stringify({
                id: command.id,
                result: result
            }, null, 2));
            responseFile.close();
            
            addLog("Response written: " + responseFile.name, "success");
            
            // Delete command file
            file.remove();
            
            processedCount++;
            updateStats();
            
        } catch (error) {
            addLog("Error: " + error.toString(), "error");
            errorCount++;
            updateStats();
            
            // Try to clean up
            try {
                file.remove();
            } catch (e) {}
        }
    }
    
    function checkForCommands() {
        if (!isRunning) return;
        
        try {
            var files = commandsFolder.getFiles("*.json");
            var foundCommands = false;
            
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                
                // Skip response files
                if (file.name.indexOf(".response") !== -1) continue;
                
                foundCommands = true;
                processFile(file);
            }
            
        } catch (error) {
            addLog("Check error: " + error.toString(), "error");
        }
    }
    
    function startProcessing() {
        isRunning = true;
        statusText.text = "Status: ✅ Running";
        startBtn.enabled = false;
        stopBtn.enabled = true;
        
        addLog("Started file bridge", "success");
        
        // Use dialog's onDraw to check periodically
        dialog.onDraw = function() {
            if (isRunning) {
                checkForCommands();
            }
        };
        
        // Force redraw to trigger checks
        if (checkTimer) {
            dialog.windowObj.clearInterval(checkTimer);
        }
        checkTimer = dialog.windowObj.setInterval(function() {
            if (isRunning) {
                dialog.layout.layout(true);
            }
        }, 250); // Check every 250ms
        
        addLog("Watching for command files...");
    }
    
    function stopProcessing() {
        isRunning = false;
        statusText.text = "Status: ⏹ Stopped";
        startBtn.enabled = true;
        stopBtn.enabled = false;
        
        if (checkTimer) {
            dialog.windowObj.clearInterval(checkTimer);
            checkTimer = null;
        }
        
        dialog.onDraw = null;
        
        addLog("Stopped file bridge");
    }
    
    function manualCheck() {
        addLog("Manual check...");
        var files = commandsFolder.getFiles("*.json");
        var commandFiles = [];
        
        for (var i = 0; i < files.length; i++) {
            if (files[i].name.indexOf(".response") === -1) {
                commandFiles.push(files[i]);
            }
        }
        
        addLog("Found " + commandFiles.length + " command files");
        
        for (var j = 0; j < commandFiles.length; j++) {
            processFile(commandFiles[j]);
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
        
        addLog("Cleared " + cleared + " files");
    }
    
    // Event handlers
    startBtn.onClick = startProcessing;
    stopBtn.onClick = stopProcessing;
    checkBtn.onClick = manualCheck;
    clearBtn.onClick = clearFolder;
    
    dialog.onClose = function() {
        stopProcessing();
    };
    
    // Initialize
    addLog("File bridge initialized");
    addLog("Commands folder: " + COMMANDS_DIR);
    addLog("Folder exists: " + commandsFolder.exists);
    addLog("Click 'Start Processing' to begin");
    
    // Initial check
    manualCheck();
    
    dialog.show();
})();