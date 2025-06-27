// Safe File Bridge - Handles empty arrays and other edge cases

(function() {
    var documentsFolder = Folder.myDocuments;
    var COMMANDS_DIR = documentsFolder.fsName + "/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    if (!commandsFolder.exists) {
        commandsFolder.create();
    }
    
    var dialog = new Window("palette", "AE MCP Bridge - Safe Mode");
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
            addLog("Processing: " + cmd.id.split("_")[0]);
            
            // Fix empty arrays in the script before executing
            var fixedScript = cmd.script;
            
            // Replace empty arrays with appropriate defaults
            fixedScript = fixedScript.replace(/setValueAtTime\(([^,]+),\s*\[\]\)/g, function(match, time) {
                addLog("WARNING: Found empty array, using default [0,0]");
                return 'setValueAtTime(' + time + ', [0,0])';
            });
            
            // Fix arrays with wrong number of elements for Position/Scale
            fixedScript = fixedScript.replace(/property\("(Position|Scale)"\)[^;]*setValueAtTime\(([^,]+),\s*\[([^\]]*)\]\)/g, 
                function(match, prop, time, values) {
                    var vals = values.split(',').filter(function(v) { return v.trim() !== ''; });
                    if (vals.length === 0) {
                        addLog("Fixed empty " + prop + " array to [0,0]");
                        return match.replace('[' + values + ']', '[0,0]');
                    } else if (vals.length === 1) {
                        addLog("Fixed single-value " + prop + " array to use both axes");
                        return match.replace('[' + values + ']', '[' + vals[0] + ',' + vals[0] + ']');
                    } else if (vals.length > 3) {
                        addLog("Fixed too-many-values " + prop + " array");
                        return match.replace('[' + values + ']', '[' + vals[0] + ',' + vals[1] + ']');
                    }
                    return match;
                }
            );
            
            var result;
            
            try {
                result = eval(fixedScript);
                if (!result) result = {success: true, data: null};
                addLog("Success!");
            } catch (e) {
                result = {success: false, error: {message: e.toString()}};
                addLog("Error: " + e.toString());
            }
            
            var respFile = new File(file.fsName + ".response");
            addLog("Writing response to: " + respFile.fsName);
            
            if (!respFile.open("w")) {
                addLog("ERROR: Cannot open response file for writing!");
                throw new Error("Cannot write response file");
            }
            
            var responseData = JSON.stringify({id: cmd.id, result: result});
            var writeResult = respFile.write(responseData);
            respFile.close();
            
            addLog("Write result: " + writeResult + ", file size: " + respFile.length);
            
            // Verify the file exists
            if (!respFile.exists) {
                addLog("ERROR: Response file doesn't exist after writing!");
            } else if (respFile.length === 0) {
                addLog("ERROR: Response file is empty!");
            } else {
                addLog("Response file written successfully: " + respFile.length + " bytes");
            }
            
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
            
            if (checks % 25 === 1) {
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
    
    addLog("Safe bridge started - " + COMMANDS_DIR);
    addLog("This version fixes empty arrays automatically");
    dialog.show();
})();