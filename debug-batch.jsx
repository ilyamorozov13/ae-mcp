// Debug script to test batch command processing
// Run this in After Effects to see what happens with batch commands

(function() {
    var documentsFolder = Folder.myDocuments;
    var COMMANDS_DIR = documentsFolder.fsName + "/ae-mcp-commands";
    
    $.writeln("=== AE MCP Batch Debug ===");
    $.writeln("Commands directory: " + COMMANDS_DIR);
    
    // Look for any command files
    var commandsFolder = new Folder(COMMANDS_DIR);
    if (!commandsFolder.exists) {
        $.writeln("ERROR: Commands folder doesn't exist!");
        return;
    }
    
    var files = commandsFolder.getFiles("*.json");
    $.writeln("Found " + files.length + " JSON files");
    
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.name.indexOf(".response") !== -1) continue;
        
        $.writeln("\n--- Processing: " + file.name);
        
        try {
            file.open("r");
            var content = file.read();
            file.close();
            
            var cmd = JSON.parse(content);
            $.writeln("Command ID: " + cmd.id);
            $.writeln("Script length: " + cmd.script.length + " chars");
            
            // Check if it's a batch command
            var cmdName = cmd.id.split("_")[0];
            $.writeln("Command type: " + cmdName);
            
            if (cmdName === "batch") {
                $.writeln("This is a BATCH command!");
            }
            
            // Try to execute
            $.writeln("Attempting to execute script...");
            var result;
            
            try {
                result = eval(cmd.script);
                $.writeln("SUCCESS: " + JSON.stringify(result));
            } catch (e) {
                $.writeln("EXECUTION ERROR: " + e.toString());
                $.writeln("Error line: " + e.line);
                $.writeln("Error source: " + e.source);
                result = {
                    success: false,
                    error: {
                        message: e.toString(),
                        code: e.number || "UNKNOWN"
                    }
                };
            }
            
            // Write response
            var responseFile = new File(file.fsName + ".response");
            responseFile.encoding = "UTF-8";
            
            if (responseFile.open("w")) {
                responseFile.write(JSON.stringify({id: cmd.id, result: result}, null, 2));
                responseFile.close();
                $.writeln("Response written to: " + responseFile.name);
                
                // Delete command file
                file.remove();
                $.writeln("Command file deleted");
            } else {
                $.writeln("ERROR: Could not write response file!");
            }
            
        } catch (e) {
            $.writeln("FILE ERROR: " + e.toString());
        }
    }
    
    $.writeln("\n=== Debug complete ===");
})();