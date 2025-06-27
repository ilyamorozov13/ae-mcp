// Simple debug version to test file watching

(function() {
    var COMMANDS_DIR = "/private/var/folders/90/jdxryyf93cz8548m5q07cc1r0000gq/T/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    var dialog = new Window("dialog", "Debug File Watcher");
    dialog.preferredSize.width = 800;
    
    var log = dialog.add("edittext", undefined, "", {multiline: true, readonly: true});
    log.preferredSize.height = 400;
    log.preferredSize.width = 780;
    
    var btnGroup = dialog.add("group");
    var checkBtn = btnGroup.add("button", undefined, "Check Files");
    var processBtn = btnGroup.add("button", undefined, "Process test_manual.json");
    
    function addLog(msg) {
        log.text += new Date().toLocaleTimeString() + " - " + msg + "\n";
    }
    
    checkBtn.onClick = function() {
        addLog("Checking folder: " + COMMANDS_DIR);
        
        if (!commandsFolder.exists) {
            addLog("ERROR: Folder does not exist!");
            return;
        }
        
        var files = commandsFolder.getFiles();
        addLog("Found " + files.length + " files");
        
        for (var i = 0; i < files.length; i++) {
            addLog("  - " + files[i].name);
        }
    };
    
    processBtn.onClick = function() {
        var testFile = new File(COMMANDS_DIR + "/test_manual.json");
        
        if (!testFile.exists) {
            addLog("ERROR: test_manual.json not found");
            return;
        }
        
        addLog("Opening test_manual.json...");
        if (!testFile.open("r")) {
            addLog("ERROR: Cannot open file");
            return;
        }
        
        var content = testFile.read();
        testFile.close();
        addLog("Content: " + content);
        
        try {
            var cmd = JSON.parse(content);
            addLog("Parsed command ID: " + cmd.id);
            
            // Execute
            var result = eval(cmd.script);
            addLog("Result: " + JSON.stringify(result));
            
            // Write response
            var responseFile = new File(testFile.fsName + ".response");
            responseFile.open("w");
            responseFile.write(JSON.stringify({id: cmd.id, result: result}));
            responseFile.close();
            addLog("Response written!");
            
            // Delete command
            testFile.remove();
            addLog("Command file deleted");
            
        } catch (e) {
            addLog("ERROR: " + e.toString());
        }
    };
    
    addLog("Debug watcher ready");
    addLog("Folder: " + COMMANDS_DIR);
    addLog("Exists: " + commandsFolder.exists);
    
    dialog.show();
})();