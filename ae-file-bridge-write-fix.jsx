// File Bridge with Write Fix - Uses alternative write method

(function() {
    var documentsFolder = Folder.myDocuments;
    var COMMANDS_DIR = documentsFolder.fsName + "/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    if (!commandsFolder.exists) {
        commandsFolder.create();
    }
    
    var dialog = new Window("palette", "AE MCP Bridge - Write Fix");
    dialog.preferredSize.width = 900;
    
    var log = dialog.add("edittext", undefined, "", {multiline: true, readonly: true});
    log.preferredSize.height = 400;
    log.preferredSize.width = 880;
    
    var processed = 0;
    
    function addLog(msg) {
        log.text = new Date().toLocaleTimeString() + " - " + msg + "\n" + log.text;
        if (log.text.length > 3000) {
            log.text = log.text.substring(0, 3000);
        }
    }
    
    function writeFile(file, content) {
        // Method 1: Standard write
        try {
            file.encoding = "UTF-8";
            if (file.open("w")) {
                var result = file.write(content);
                file.close();
                if (result && file.exists && file.length > 0) {
                    addLog("Method 1 worked: " + file.length + " bytes");
                    return true;
                }
            }
        } catch (e) {
            addLog("Method 1 failed: " + e);
        }
        
        // Method 2: Write in chunks
        try {
            file.encoding = "UTF-8";
            if (file.open("w")) {
                for (var i = 0; i < content.length; i += 1000) {
                    var chunk = content.substring(i, Math.min(i + 1000, content.length));
                    file.write(chunk);
                }
                file.close();
                if (file.exists && file.length > 0) {
                    addLog("Method 2 worked: " + file.length + " bytes");
                    return true;
                }
            }
        } catch (e) {
            addLog("Method 2 failed: " + e);
        }
        
        // Method 3: Use writeln
        try {
            file.encoding = "UTF-8";
            if (file.open("w")) {
                file.writeln(content);
                file.close();
                if (file.exists && file.length > 0) {
                    addLog("Method 3 worked: " + file.length + " bytes");
                    return true;
                }
            }
        } catch (e) {
            addLog("Method 3 failed: " + e);
        }
        
        // Method 4: Create new file in temp first
        try {
            var tempFile = new File(Folder.temp.fsName + "/ae-temp-" + Date.now() + ".json");
            tempFile.encoding = "UTF-8";
            if (tempFile.open("w")) {
                tempFile.write(content);
                tempFile.close();
                if (tempFile.exists && tempFile.length > 0) {
                    // Copy to target location
                    tempFile.copy(file.fsName);
                    tempFile.remove();
                    if (file.exists && file.length > 0) {
                        addLog("Method 4 worked: " + file.length + " bytes");
                        return true;
                    }
                }
            }
        } catch (e) {
            addLog("Method 4 failed: " + e);
        }
        
        return false;
    }
    
    function processFile(file) {
        try {
            addLog("Processing: " + file.name);
            
            file.open("r");
            var content = file.read();
            file.close();
            
            var cmd = JSON.parse(content);
            var result;
            
            try {
                // Fix common issues before execution
                var fixedScript = cmd.script;
                
                // Replace scale values of 0 with 0.1 to prevent divide by zero
                fixedScript = fixedScript.replace(/\.setValueAtTime\(([^,]+),\s*\[0,\s*0\]\)/g, function(match, time) {
                    addLog("Fixed zero scale to [0.1, 0.1]");
                    return '.setValueAtTime(' + time + ', [0.1, 0.1])';
                });
                
                // Also fix single zero values in arrays
                fixedScript = fixedScript.replace(/\.setValueAtTime\(([^,]+),\s*\[0,\s*([^]]+)\]\)/g, '.setValueAtTime($1, [0.1, $2])');
                fixedScript = fixedScript.replace(/\.setValueAtTime\(([^,]+),\s*\[([^,]+),\s*0\]\)/g, '.setValueAtTime($1, [$2, 0.1])');
                
                result = eval(fixedScript);
                if (!result) result = {success: true, data: null};
                addLog("Script executed successfully");
            } catch (e) {
                result = {success: false, error: {message: e.toString()}};
                addLog("Script error: " + e.toString());
                
                // Special handling for divide by zero
                if (e.toString().indexOf("divide by zero") !== -1) {
                    addLog("This is likely due to Scale being set to 0. Use values > 0 for Scale.");
                }
            }
            
            // Write response
            var respFile = new File(file.fsName + ".response");
            var responseData = JSON.stringify({id: cmd.id, result: result}, null, 2);
            
            addLog("Attempting to write " + responseData.length + " bytes to: " + respFile.name);
            
            if (writeFile(respFile, responseData)) {
                addLog("Response written successfully!");
                file.remove();
                processed++;
            } else {
                addLog("ERROR: All write methods failed!");
                // Try to at least create an error response
                var errorResp = new File(file.fsName + ".error");
                errorResp.open("w");
                errorResp.writeln("Write failed");
                errorResp.close();
            }
            
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
            
            var files = commandsFolder.getFiles("*.json");
            for (var i = 0; i < files.length; i++) {
                if (files[i].name.indexOf(".response") === -1 && files[i].name.indexOf(".error") === -1) {
                    processFile(files[i]);
                }
            }
        }
    };
    
    // Test write capability on startup
    addLog("Testing write capability...");
    var testFile = new File(COMMANDS_DIR + "/test-write-" + Date.now() + ".txt");
    if (writeFile(testFile, "Test content")) {
        addLog("Write test successful!");
        testFile.remove();
    } else {
        addLog("WARNING: Write test failed - may have permission issues");
    }
    
    addLog("Bridge started - " + COMMANDS_DIR);
    dialog.show();
})();