// Manual File Bridge - Click button to process commands

(function() {
    var documentsFolder = Folder.myDocuments;
    var COMMANDS_DIR = documentsFolder.fsName + "/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    if (!commandsFolder.exists) {
        commandsFolder.create();
    }
    
    var dialog = new Window("dialog", "AE MCP Bridge - Manual");
    dialog.preferredSize.width = 900;
    
    // Status
    var statusText = dialog.add("statictext", undefined, "Ready");
    
    // Process button - big and obvious
    var processBtn = dialog.add("button", undefined, "PROCESS COMMANDS");
    processBtn.preferredSize.width = 400;
    processBtn.preferredSize.height = 60;
    
    // Log
    var log = dialog.add("edittext", undefined, "", {multiline: true, readonly: true});
    log.preferredSize.height = 400;
    log.preferredSize.width = 880;
    
    var processed = 0;
    
    function addLog(msg) {
        log.text += new Date().toLocaleTimeString() + " - " + msg + "\n";
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
                result = eval(cmd.script);
                if (!result) result = {success: true, data: null};
                addLog("Success!");
            } catch (e) {
                result = {success: false, error: {message: e.toString()}};
                addLog("Error: " + e.toString());
            }
            
            var respFile = new File(file.fsName + ".response");
            respFile.open("w");
            respFile.write(JSON.stringify({id: cmd.id, result: result}));
            respFile.close();
            
            file.remove();
            processed++;
            
        } catch (e) {
            addLog("Process error: " + e);
        }
    }
    
    processBtn.onClick = function() {
        addLog("Checking for commands...");
        
        var files = commandsFolder.getFiles("*.json");
        var found = 0;
        
        for (var i = 0; i < files.length; i++) {
            if (files[i].name.indexOf(".response") === -1) {
                found++;
                processFile(files[i]);
            }
        }
        
        if (found === 0) {
            addLog("No commands found");
        }
        
        statusText.text = "Processed: " + processed + " total";
    };
    
    // Auto-click button every 500ms while dialog is open
    var autoClick = function() {
        processBtn.notify("onClick");
        $.sleep(500);
        autoClick();
    };
    
    // Start auto-clicking in background
    addLog("Bridge started - " + COMMANDS_DIR);
    addLog("Auto-processing every 500ms...");
    
    // Start the auto-clicker
    autoClick();
    
    dialog.show();
})();