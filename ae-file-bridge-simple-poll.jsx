// Simple File Bridge with basic polling

(function() {
    var documentsFolder = Folder.myDocuments;
    var COMMANDS_DIR = documentsFolder.fsName + "/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    if (!commandsFolder.exists) {
        commandsFolder.create();
    }
    
    var dialog = new Window("palette", "AE MCP Bridge");
    dialog.preferredSize.width = 900;
    
    var log = dialog.add("edittext", undefined, "", {multiline: true, readonly: true});
    log.preferredSize.height = 400;
    log.preferredSize.width = 880;
    
    var processed = 0;
    var checks = 0;
    
    function addLog(msg) {
        log.text = new Date().toLocaleTimeString() + " - " + msg + "\n" + log.text;
        if (log.text.length > 2000) {
            log.text = log.text.substring(0, 2000);
        }
    }
    
    function processFile(file) {
        try {
            file.open("r");
            var content = file.read();
            file.close();
            
            var cmd = JSON.parse(content);
            addLog("Command: " + cmd.id.split("_")[0]);
            
            // Show script preview for debugging - focus on the time/value part
            var scriptPreview = cmd.script;
            var timeMatch = scriptPreview.match(/var time[^;]+;/);
            var valueMatch = scriptPreview.match(/var value[^;]+;/);
            
            if (timeMatch) {
                addLog("Time line: " + timeMatch[0]);
            }
            if (valueMatch) {
                addLog("Value line: " + valueMatch[0]);
            }
            
            // Also show a bit of the script
            if (cmd.script.length > 300) {
                addLog("Script preview: " + cmd.script.substring(200, 500) + "...");
            }
            
            var result;
            
            try {
                result = eval(cmd.script);
                if (!result) result = {success: true, data: null};
            } catch (e) {
                result = {success: false, error: {message: e.toString()}};
                addLog("Error: " + e.toString());
                
                // Log any console output
                if (typeof $.writeln !== 'undefined') {
                    addLog("Console output may be in Info panel (Window > Info)");
                }
            }
            
            var respFile = new File(file.fsName + ".response");
            respFile.open("w");
            respFile.write(JSON.stringify({id: cmd.id, result: result}));
            respFile.close();
            
            file.remove();
            processed++;
            addLog("Processed command #" + processed);
            
        } catch (e) {
            addLog("Process error: " + e);
        }
    }
    
    // Poll every 200ms
    var lastCheck = 0;
    dialog.onActivate = function() {
        var now = new Date().getTime();
        if (now - lastCheck > 200) {
            lastCheck = now;
            checks++;
            
            if (checks % 25 === 1) { // Log every 5 seconds
                addLog("Checking... (check #" + checks + ", processed: " + processed + ")");
            }
            
            var files = commandsFolder.getFiles("*.json");
            for (var i = 0; i < files.length; i++) {
                if (files[i].name.indexOf(".response") === -1) {
                    processFile(files[i]);
                }
            }
        }
    };
    
    addLog("Bridge started - " + COMMANDS_DIR);
    dialog.show();
})();