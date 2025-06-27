// AE MCP Bridge - Palette Version with Scrollable Logs

(function() {
    var documentsFolder = Folder.myDocuments;
    var COMMANDS_DIR = documentsFolder.fsName + "/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    if (!commandsFolder.exists) {
        commandsFolder.create();
    }
    
    // Use palette instead of dialog - allows working in AE while open
    var win = new Window("palette", "AE MCP Bridge", undefined, {
        resizeable: true,
        closeButton: true,
        maximizeButton: false,
        minimizeButton: true
    });
    
    win.preferredSize.width = 1000;
    win.minimumSize.width = 800;
    win.maximumSize.width = 1400;
    win.orientation = "column";
    win.alignChildren = "fill";
    win.spacing = 5;
    win.margins = 10;
    
    // Header panel with controls
    var headerPanel = win.add("panel", undefined, "Controls");
    headerPanel.orientation = "row";
    headerPanel.alignChildren = "center";
    headerPanel.preferredSize.height = 60;
    
    // Status text
    var statusText = headerPanel.add("statictext", undefined, "Ready - Auto-processing active");
    statusText.graphics.font = ScriptUI.newFont(statusText.graphics.font.name, ScriptUI.FontStyle.BOLD, 12);
    
    // Spacer
    headerPanel.add("panel", undefined, "").preferredSize.width = 20;
    
    // Control buttons
    var btnGroup = headerPanel.add("group");
    btnGroup.orientation = "row";
    btnGroup.alignChildren = "center";
    btnGroup.spacing = 10;
    
    var processBtn = btnGroup.add("button", undefined, "Process Now");
    processBtn.preferredSize.width = 120;
    
    var clearLogBtn = btnGroup.add("button", undefined, "Clear Log");
    clearLogBtn.preferredSize.width = 100;
    
    var clearFilesBtn = btnGroup.add("button", undefined, "Clear Files");
    clearFilesBtn.preferredSize.width = 100;
    
    var openFolderBtn = btnGroup.add("button", undefined, "Open Folder");
    openFolderBtn.preferredSize.width = 100;
    
    // Stats panel
    var statsPanel = win.add("panel", undefined, "Statistics");
    statsPanel.orientation = "row";
    statsPanel.preferredSize.height = 40;
    
    var statsText = statsPanel.add("statictext", undefined, "Processed: 0 | Errors: 0 | Checks: 0");
    
    // Log panel with proper scrolling
    var logPanel = win.add("panel", undefined, "Activity Log");
    logPanel.alignChildren = "fill";
    logPanel.preferredSize.height = 400;
    logPanel.minimumSize.height = 200;
    
    // Create scrollable group
    var scrollGroup = logPanel.add("group");
    scrollGroup.orientation = "row";
    scrollGroup.alignChildren = "fill";
    scrollGroup.alignment = "fill";
    
    // Log text with scrollbar
    var log = scrollGroup.add("edittext", undefined, "", {
        multiline: true,
        readonly: true,
        scrolling: true,
        wantReturn: true
    });
    log.alignment = "fill";
    log.graphics.font = ScriptUI.newFont("Monaco", ScriptUI.FontStyle.REGULAR, 11);
    
    // Footer with options
    var footerPanel = win.add("panel");
    footerPanel.orientation = "row";
    footerPanel.alignChildren = "center";
    footerPanel.preferredSize.height = 40;
    
    var autoScrollCheck = footerPanel.add("checkbox", undefined, "Auto-scroll log");
    autoScrollCheck.value = true;
    
    footerPanel.add("statictext", undefined, " | ");
    
    var verboseCheck = footerPanel.add("checkbox", undefined, "Verbose logging");
    verboseCheck.value = false;
    
    footerPanel.add("statictext", undefined, " | Path: " + COMMANDS_DIR);
    
    // Variables
    var isRunning = true;
    var processed = 0;
    var errors = 0;
    var checks = 0;
    var maxLogLength = 50000; // Limit log size for performance
    
    // Functions
    function addLog(msg, type) {
        var time = new Date().toLocaleTimeString();
        var prefix = "";
        
        switch(type) {
            case "error": prefix = "❌ "; break;
            case "success": prefix = "✅ "; break;
            case "process": prefix = "🔄 "; break;
            case "verbose": 
                if (!verboseCheck.value) return;
                prefix = "🔍 "; 
                break;
            default: prefix = "ℹ️ ";
        }
        
        var newLine = "[" + time + "] " + prefix + msg + "\n";
        log.text = log.text + newLine;
        
        // Trim log if too long
        if (log.text.length > maxLogLength) {
            var lines = log.text.split("\n");
            var trimCount = Math.floor(lines.length * 0.2); // Remove oldest 20%
            log.text = lines.slice(trimCount).join("\n");
            log.text = "... (trimmed old entries) ...\n" + log.text;
        }
        
        // Auto-scroll to bottom if enabled
        if (autoScrollCheck.value) {
            log.active = false;
            log.active = true;
            // Move cursor to end
            log.textselection = [log.text.length, log.text.length];
        }
    }
    
    function updateStats() {
        statsText.text = "Processed: " + processed + " | Errors: " + errors + " | Checks: " + checks;
    }
    
    function processFile(file) {
        try {
            addLog("Processing: " + file.name, "process");
            
            file.open("r");
            var content = file.read();
            file.close();
            
            var cmd = JSON.parse(content);
            var result;
            
            // Fix common issues
            var script = cmd.script;
            
            // Fix zero scale
            script = script.replace(/Scale["\)]*\.setValue\(\[0,\s*0\]\)/g, function(match) {
                addLog("Fixed zero scale in setValue", "verbose");
                return match.replace("[0, 0]", "[1, 1]");
            });
            
            script = script.replace(/setValueAtTime\(([^,]+),\s*\[0,\s*0\]\)/g, function(match, time) {
                addLog("Fixed zero scale in setValueAtTime", "verbose");
                return 'setValueAtTime(' + time + ', [1, 1])';
            });
            
            try {
                result = eval(script);
                if (!result) result = {success: true, data: null};
                addLog("Success: " + file.name, "success");
                processed++;
            } catch (e) {
                result = {
                    success: false,
                    error: {
                        message: e.toString(),
                        code: e.number || "UNKNOWN"
                    }
                };
                addLog("Error: " + e.toString(), "error");
                errors++;
            }
            
            // Write response
            var responseFile = new File(file.fsName + ".response");
            responseFile.encoding = "UTF-8";
            responseFile.open("w");
            responseFile.write(JSON.stringify({id: cmd.id, result: result}, null, 2));
            responseFile.close();
            
            // Verify
            if (responseFile.exists && responseFile.length > 0) {
                addLog("Response written: " + responseFile.length + " bytes", "verbose");
            } else {
                throw new Error("Failed to write response");
            }
            
            file.remove();
            updateStats();
            
        } catch (e) {
            addLog("Process error: " + e.toString(), "error");
            errors++;
            updateStats();
        }
    }
    
    function checkForCommands() {
        checks++;
        if (checks % 50 === 0) { // Update every 10 seconds at 200ms interval
            updateStats();
            addLog("Still running... (check #" + checks + ")", "verbose");
        }
        
        try {
            var files = commandsFolder.getFiles("*.json");
            for (var i = 0; i < files.length; i++) {
                if (files[i].name.indexOf(".response") === -1) {
                    processFile(files[i]);
                }
            }
        } catch (e) {
            addLog("Check error: " + e.toString(), "error");
        }
    }
    
    // Auto-processing using onActivate event
    var lastCheck = 0;
    win.onActivate = function() {
        if (!isRunning) return;
        
        var now = new Date().getTime();
        if (now - lastCheck > 200) { // Check every 200ms
            lastCheck = now;
            checkForCommands();
        }
    };
    
    // Button handlers
    processBtn.onClick = function() {
        addLog("Manual check triggered", "info");
        checkForCommands();
    };
    
    clearLogBtn.onClick = function() {
        log.text = "";
        addLog("Log cleared", "info");
    };
    
    clearFilesBtn.onClick = function() {
        var files = commandsFolder.getFiles();
        var cleared = 0;
        for (var i = 0; i < files.length; i++) {
            try {
                files[i].remove();
                cleared++;
            } catch (e) {}
        }
        addLog("Cleared " + cleared + " files", "info");
    };
    
    openFolderBtn.onClick = function() {
        commandsFolder.execute();
    };
    
    win.onClose = function() {
        isRunning = false;
    };
    
    // Add keyboard shortcut to show/hide (Cmd+Shift+M)
    win.addEventListener("keydown", function(k) {
        if (k.keyName === "M" && k.shiftKey && (k.ctrlKey || k.metaKey)) {
            win.visible = !win.visible;
        }
    });
    
    // Window resize handler to ensure log resizes properly
    win.onResize = function() {
        win.layout.layout(true);
    };
    
    // Initialize
    addLog("AE MCP Bridge started", "success");
    addLog("Commands folder: " + COMMANDS_DIR, "info");
    addLog("Auto-processing is active (200ms interval)", "info");
    addLog("This is a palette window - you can work in AE while it's open", "info");
    
    win.show();
})();