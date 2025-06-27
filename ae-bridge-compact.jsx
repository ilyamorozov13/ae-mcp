// AE MCP Bridge - Compact Version for corner placement

(function() {
    var documentsFolder = Folder.myDocuments;
    var COMMANDS_DIR = documentsFolder.fsName + "/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    if (!commandsFolder.exists) {
        commandsFolder.create();
    }
    
    // Compact palette
    var win = new Window("palette", "AE MCP", undefined, {
        resizeable: true,
        closeButton: true
    });
    
    // Smaller default size
    win.preferredSize.width = 400;
    win.preferredSize.height = 300;
    win.orientation = "column";
    win.alignChildren = "fill";
    win.spacing = 2;
    win.margins = 5;
    
    // Compact header
    var header = win.add("group");
    header.orientation = "row";
    
    var statusText = header.add("statictext", undefined, "Active");
    statusText.preferredSize.width = 200;
    
    var processBtn = header.add("button", undefined, "▶");
    processBtn.preferredSize.width = 30;
    processBtn.helpTip = "Process now";
    
    var clearBtn = header.add("button", undefined, "✗");
    clearBtn.preferredSize.width = 30;
    clearBtn.helpTip = "Clear log";
    
    // Compact stats
    var statsText = win.add("statictext", undefined, "P:0 E:0");
    statsText.graphics.font = ScriptUI.newFont(statsText.graphics.font.name, ScriptUI.FontStyle.REGULAR, 10);
    
    // Log
    var log = win.add("edittext", undefined, "", {
        multiline: true,
        readonly: true,
        scrolling: true
    });
    log.graphics.font = ScriptUI.newFont("Monaco", ScriptUI.FontStyle.REGULAR, 9);
    
    var isRunning = true;
    var processed = 0;
    var errors = 0;
    
    function addLog(msg) {
        var time = new Date().toTimeString().substring(0, 8);
        log.text += time + " " + msg + "\n";
        
        // Keep only last 50 lines
        var lines = log.text.split("\n");
        if (lines.length > 50) {
            log.text = lines.slice(-50).join("\n");
        }
        
        // Auto-scroll
        log.active = false;
        log.active = true;
    }
    
    function processFile(file) {
        try {
            file.open("r");
            var content = file.read();
            file.close();
            
            var cmd = JSON.parse(content);
            var result;
            
            var script = cmd.script;
            // Fix zero scale
            script = script.replace(/\[0,\s*0\]/g, "[1, 1]");
            
            try {
                result = eval(script);
                if (!result) result = {success: true, data: null};
                processed++;
                addLog("✓ " + cmd.id.split("_")[0]);
            } catch (e) {
                result = {
                    success: false,
                    error: {message: e.toString()}
                };
                errors++;
                addLog("✗ " + e.toString().substring(0, 30) + "...");
            }
            
            var responseFile = new File(file.fsName + ".response");
            responseFile.open("w");
            responseFile.write(JSON.stringify({id: cmd.id, result: result}));
            responseFile.close();
            
            file.remove();
            statsText.text = "P:" + processed + " E:" + errors;
            
        } catch (e) {
            addLog("Error: " + e.toString().substring(0, 40));
        }
    }
    
    var lastCheck = 0;
    win.onActivate = function() {
        if (!isRunning) return;
        
        var now = new Date().getTime();
        if (now - lastCheck > 200) {
            lastCheck = now;
            
            try {
                var files = commandsFolder.getFiles("*.json");
                for (var i = 0; i < files.length; i++) {
                    if (files[i].name.indexOf(".response") === -1) {
                        processFile(files[i]);
                    }
                }
            } catch (e) {}
        }
    };
    
    processBtn.onClick = function() {
        win.onActivate();
    };
    
    clearBtn.onClick = function() {
        log.text = "";
    };
    
    win.onClose = function() {
        isRunning = false;
    };
    
    addLog("Ready");
    win.show();
})();