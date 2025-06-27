/**
 * AE MCP Bridge - ExtendScript Host
 */

// Global variables
var COMMANDS_FOLDER_NAME = "ae-mcp-commands";
var commandsFolder = null;
var processedCommands = {};

/**
 * Initialize MCP Bridge
 */
function initializeMCPBridge() {
    try {
        // Get or create commands folder
        var documentsFolder = Folder.myDocuments;
        commandsFolder = new Folder(documentsFolder.fsName + "/" + COMMANDS_FOLDER_NAME);
        
        if (!commandsFolder.exists) {
            commandsFolder.create();
        }
        
        // Clear processed commands on initialization to allow re-processing
        processedCommands = {};
        
        return "success";
    } catch (e) {
        return "Error: " + e.toString();
    }
}

/**
 * Process command files
 */
function processCommands() {
    var result = {
        success: true,
        processed: 0,
        errors: 0,
        commands: []
    };
    
    try {
        if (!commandsFolder || !commandsFolder.exists) {
            initializeMCPBridge();
        }
        
        // Get all .json files in the commands folder (excluding .response files)
        var allFiles = commandsFolder.getFiles("*.json");
        var files = [];
        
        // Filter out response files
        for (var i = 0; i < allFiles.length; i++) {
            if (allFiles[i].name.indexOf(".response") === -1) {
                files.push(allFiles[i]);
            }
        }
        
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            
            // Skip if already processed
            if (processedCommands[file.name]) {
                continue;
            }
            
            try {
                // Read the command file
                file.open("r");
                var content = file.read();
                file.close();
                
                // Parse JSON to get the script
                var commandData = JSON.parse(content);
                var commandId = commandData.id;
                var script = commandData.script;
                
                // Execute the command
                app.beginUndoGroup("MCP Command: " + file.name);
                try {
                    // Execute the script and capture the result
                    var commandResult = eval(script);
                    
                    // Convert result to string if it's an object
                    var resultToWrite = commandResult;
                    if (typeof commandResult === "object" && commandResult !== null) {
                        try {
                            resultToWrite = JSON.stringify(commandResult);
                        } catch (e) {
                            resultToWrite = commandResult.toString();
                        }
                    }
                    
                    // Write response file
                    var responseFile = new File(file.fsName + ".response");
                    responseFile.encoding = "UTF-8";
                    if (responseFile.open("w")) {
                        responseFile.write(JSON.stringify({
                            id: commandId,
                            success: true,
                            result: resultToWrite
                        }, null, 2));
                        responseFile.close();
                        
                        result.processed++;
                        result.commands.push(file.name);
                        
                        // Mark as processed
                        processedCommands[file.name] = true;
                        
                        // Archive the processed file (but not the response)
                        archiveCommand(file);
                    } else {
                        throw new Error("Failed to open response file for writing");
                    }
                } catch (execError) {
                    // Write error response
                    var errorResponseFile = new File(file.fsName + ".response");
                    errorResponseFile.encoding = "UTF-8";
                    if (errorResponseFile.open("w")) {
                        errorResponseFile.write(JSON.stringify({
                            id: commandId,
                            success: false,
                            error: execError.toString()
                        }, null, 2));
                        errorResponseFile.close();
                    }
                    
                    result.errors++;
                    result.commands.push("ERROR in " + file.name + ": " + execError.toString());
                    
                    // Still mark as processed and archive even on error
                    processedCommands[file.name] = true;
                    archiveCommand(file);
                } finally {
                    app.endUndoGroup();
                }
                
            } catch (fileError) {
                result.errors++;
                result.commands.push("ERROR reading " + file.name + ": " + fileError.toString());
            }
        }
        
    } catch (e) {
        result.success = false;
        result.error = e.toString();
    }
    
    return JSON.stringify(result);
}

/**
 * Archive processed command file
 */
function archiveCommand(file) {
    try {
        // Simply delete the command file after processing
        // The response file remains for the MCP server to read
        file.remove();
    } catch (e) {
        // If deletion fails, log it but continue
    }
}

/**
 * Open commands folder in system file browser
 */
function openCommandsFolder() {
    try {
        if (!commandsFolder || !commandsFolder.exists) {
            initializeMCPBridge();
        }
        
        if ($.os.indexOf("Windows") !== -1) {
            system.callSystem("explorer " + commandsFolder.fsName);
        } else {
            system.callSystem("open " + commandsFolder.fsName);
        }
        
        return "success";
    } catch (e) {
        return "Error: " + e.toString();
    }
}

/**
 * Utility function to pad numbers
 */
function pad(num) {
    return (num < 10 ? "0" : "") + num;
}

/**
 * Get project information
 */
function getProjectInfo() {
    var info = {
        hasProject: app.project !== null,
        projectName: app.project ? (app.project.file ? app.project.file.name : "Untitled Project") : "No Project",
        numItems: app.project ? app.project.numItems : 0,
        numComps: 0,
        numFootage: 0
    };
    
    if (app.project) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem) {
                info.numComps++;
            } else if (item instanceof FootageItem) {
                info.numFootage++;
            }
        }
    }
    
    return JSON.stringify(info);
}

/**
 * Create a simple composition (example command)
 */
function createExampleComp() {
    try {
        if (!app.project) {
            app.newProject();
        }
        
        var comp = app.project.items.addComp(
            "MCP Test Comp",
            1920,
            1080,
            1,
            10,
            30
        );
        
        // Add a solid layer
        var solid = comp.layers.addSolid(
            [1, 0.5, 0],
            "MCP Solid",
            comp.width,
            comp.height,
            1
        );
        
        // Add some animation
        solid.property("Position").setValueAtTime(0, [comp.width/2, comp.height/2]);
        solid.property("Position").setValueAtTime(5, [comp.width/2, comp.height/2 + 200]);
        
        return "Composition created successfully";
    } catch (e) {
        return "Error: " + e.toString();
    }
}