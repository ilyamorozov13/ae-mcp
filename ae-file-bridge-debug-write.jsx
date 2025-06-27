// Debug version to understand file writing issues

(function() {
    var COMMANDS_DIR = "/private/var/folders/90/jdxryyf93cz8548m5q07cc1r0000gq/T/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    var dialog = new Window("dialog", "Debug File Writing");
    dialog.preferredSize.width = 900;
    
    var log = dialog.add("edittext", undefined, "", {multiline: true, readonly: true, scrolling: true});
    log.preferredSize.height = 500;
    log.preferredSize.width = 880;
    
    var btnGroup = dialog.add("group");
    var testWriteBtn = btnGroup.add("button", undefined, "Test Write");
    var processBtn = btnGroup.add("button", undefined, "Process First Command");
    
    function addLog(msg) {
        log.text += new Date().toLocaleTimeString() + " - " + msg + "\n";
    }
    
    testWriteBtn.onClick = function() {
        addLog("=== Testing file write ===");
        
        try {
            var testFile = new File(commandsFolder.fsName + "/test-write-" + Date.now() + ".txt");
            addLog("Creating file: " + testFile.fsName);
            
            if (!testFile.open("w")) {
                addLog("ERROR: Cannot open file for writing");
                addLog("Error: " + testFile.error);
                return;
            }
            
            var testData = "Hello from After Effects at " + new Date().toString();
            addLog("Writing data: " + testData);
            
            var written = testFile.write(testData);
            addLog("Write returned: " + written);
            
            testFile.close();
            addLog("File closed");
            
            // Check if file exists
            addLog("File exists: " + testFile.exists);
            addLog("File length: " + testFile.length);
            
            // Try to read it back
            if (testFile.open("r")) {
                var readBack = testFile.read();
                testFile.close();
                addLog("Read back: " + readBack);
            } else {
                addLog("ERROR: Cannot read file back");
            }
            
            // Clean up
            testFile.remove();
            addLog("Test file removed");
            
        } catch (e) {
            addLog("EXCEPTION: " + e.toString());
        }
    };
    
    processBtn.onClick = function() {
        addLog("=== Looking for command files ===");
        
        var files = commandsFolder.getFiles("*.json");
        var commandFile = null;
        
        for (var i = 0; i < files.length; i++) {
            if (files[i].name.indexOf(".response") === -1) {
                commandFile = files[i];
                break;
            }
        }
        
        if (!commandFile) {
            addLog("No command file found");
            return;
        }
        
        addLog("Found command: " + commandFile.name);
        
        try {
            // Read command
            if (!commandFile.open("r")) {
                addLog("ERROR: Cannot open command file");
                return;
            }
            
            var content = commandFile.read();
            commandFile.close();
            addLog("Command content: " + content.substring(0, 100) + "...");
            
            var command = JSON.parse(content);
            addLog("Command ID: " + command.id);
            
            // Execute
            var result;
            try {
                result = eval(command.script);
                addLog("Script executed, result: " + JSON.stringify(result).substring(0, 100) + "...");
            } catch (e) {
                result = { success: false, error: { message: e.toString() } };
                addLog("Script error: " + e.toString());
            }
            
            // Write response - with detailed debugging
            var responseFile = new File(commandFile.fsName + ".response");
            addLog("Response file path: " + responseFile.fsName);
            
            addLog("Opening response file for writing...");
            if (!responseFile.open("w")) {
                addLog("ERROR: Cannot open response file");
                addLog("File error: " + responseFile.error);
                return;
            }
            
            var responseData = {
                id: command.id,
                result: result
            };
            
            var responseText = JSON.stringify(responseData, null, 2);
            addLog("Response data length: " + responseText.length);
            addLog("Response preview: " + responseText.substring(0, 200) + "...");
            
            addLog("Writing to file...");
            var writeResult = responseFile.write(responseText);
            addLog("Write result: " + writeResult);
            
            addLog("Closing file...");
            responseFile.close();
            
            addLog("Checking if response file exists...");
            addLog("Exists: " + responseFile.exists);
            addLog("Length: " + responseFile.length);
            
            // Try to read it back
            if (responseFile.open("r")) {
                var verify = responseFile.read();
                responseFile.close();
                addLog("Verified content length: " + verify.length);
                addLog("First 100 chars: " + verify.substring(0, 100));
            } else {
                addLog("ERROR: Cannot read response file back");
            }
            
            // Delete command file
            commandFile.remove();
            addLog("Command file deleted");
            
        } catch (e) {
            addLog("EXCEPTION: " + e.toString());
            addLog("Stack: " + e.stack);
        }
    };
    
    addLog("Debug tool ready");
    addLog("Commands folder: " + COMMANDS_DIR);
    addLog("Folder exists: " + commandsFolder.exists);
    
    dialog.show();
})();