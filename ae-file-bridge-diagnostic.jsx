// Diagnostic File Bridge - Shows exactly what's happening

(function() {
    var documentsFolder = Folder.myDocuments;
    var COMMANDS_DIR = documentsFolder.fsName + "/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    if (!commandsFolder.exists) {
        commandsFolder.create();
    }
    
    var dialog = new Window("palette", "AE MCP Bridge - Diagnostic Mode");
    dialog.preferredSize.width = 1000;
    
    var log = dialog.add("edittext", undefined, "", {multiline: true, readonly: true});
    log.preferredSize.height = 500;
    log.preferredSize.width = 980;
    
    function addLog(msg) {
        log.text = new Date().toLocaleTimeString() + " - " + msg + "\n" + log.text;
        if (log.text.length > 5000) {
            log.text = log.text.substring(0, 5000);
        }
    }
    
    function processFile(file) {
        try {
            addLog("=== PROCESSING FILE: " + file.name + " ===");
            
            file.open("r");
            var content = file.read();
            file.close();
            
            addLog("Raw file content length: " + content.length);
            
            var cmd = JSON.parse(content);
            addLog("Command ID: " + cmd.id);
            
            // Extract and show the actual time value from the script
            var scriptStr = cmd.script.toString();
            
            // Look for time assignment
            var timeMatches = scriptStr.match(/var time = ([^;]+);/g);
            if (timeMatches) {
                for (var i = 0; i < timeMatches.length; i++) {
                    addLog("Found time assignment: " + timeMatches[i]);
                }
            }
            
            // Look for value assignment
            var valueMatches = scriptStr.match(/var value = ([^;]+);/g);
            if (valueMatches) {
                for (var i = 0; i < valueMatches.length; i++) {
                    addLog("Found value assignment: " + valueMatches[i]);
                }
            }
            
            // Look for setValueAtTime calls
            var setValueMatches = scriptStr.match(/setValueAtTime\([^)]+\)/g);
            if (setValueMatches) {
                for (var i = 0; i < setValueMatches.length; i++) {
                    addLog("Found setValueAtTime call: " + setValueMatches[i]);
                }
            }
            
            // Execute and capture all variables
            var result;
            
            try {
                // Wrap the script to capture variables
                var wrappedScript = cmd.script.replace(
                    'prop.setValueAtTime(numTime, value);',
                    '$.writeln("BEFORE setValueAtTime:");\n' +
                    '$.writeln("  time=" + time);\n' +
                    '$.writeln("  numTime=" + numTime);\n' +
                    '$.writeln("  value=" + value);\n' +
                    '$.writeln("  typeof time=" + typeof time);\n' +
                    '$.writeln("  typeof numTime=" + typeof numTime);\n' +
                    '$.writeln("  typeof value=" + typeof value);\n' +
                    'prop.setValueAtTime(numTime, value);'
                );
                
                result = eval(wrappedScript);
                if (!result) result = {success: true, data: null};
                
                addLog("Script executed successfully");
                
            } catch (e) {
                result = {success: false, error: {message: e.toString()}};
                addLog("SCRIPT ERROR: " + e.toString());
                
                // Check if error mentions parameter 1
                if (e.toString().indexOf("parameter 1") !== -1) {
                    addLog("This is the 'parameter 1' error - time is undefined!");
                    addLog("Check the Info panel for $.writeln output");
                }
            }
            
            // Write response
            var respFile = new File(file.fsName + ".response");
            respFile.open("w");
            respFile.write(JSON.stringify({id: cmd.id, result: result}));
            respFile.close();
            
            file.remove();
            
            addLog("=== END PROCESSING ===\n");
            
        } catch (e) {
            addLog("PROCESS ERROR: " + e);
        }
    }
    
    // Poll every 200ms
    var lastCheck = 0;
    dialog.onActivate = function() {
        var now = new Date().getTime();
        if (now - lastCheck > 200) {
            lastCheck = now;
            
            var files = commandsFolder.getFiles("*.json");
            for (var i = 0; i < files.length; i++) {
                if (files[i].name.indexOf(".response") === -1) {
                    processFile(files[i]);
                }
            }
        }
    };
    
    addLog("Diagnostic bridge started - " + COMMANDS_DIR);
    addLog("This will show detailed info about each command");
    dialog.show();
})();