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
        
        // Get all .js files in the commands folder
        var files = commandsFolder.getFiles("*.js");
        
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            
            // Skip if already processed
            if (processedCommands[file.name]) {
                continue;
            }
            
            try {
                // Read and execute the command file
                file.open("r");
                var content = file.read();
                file.close();
                
                // Execute the command
                app.beginUndoGroup("MCP Command: " + file.name);
                try {
                    eval(content);
                    result.processed++;
                    result.commands.push(file.name);
                    
                    // Mark as processed
                    processedCommands[file.name] = true;
                    
                    // Archive the processed file
                    archiveCommand(file);
                } catch (execError) {
                    result.errors++;
                    result.commands.push("ERROR in " + file.name + ": " + execError.toString());
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
        // Create archive folder if it doesn't exist
        var archiveFolder = new Folder(commandsFolder.fsName + "/processed");
        if (!archiveFolder.exists) {
            archiveFolder.create();
        }
        
        // Create date-based subfolder
        var date = new Date();
        var dateStr = date.getFullYear() + "-" + 
                     pad(date.getMonth() + 1) + "-" + 
                     pad(date.getDate());
        var dateFo
        
        var dateFolder = new Folder(archiveFolder.fsName + "/" + dateStr);
        if (!dateFolder.exists) {
            dateFolder.create();
        }
        
        // Move file to archive with timestamp
        var timestamp = date.getTime();
        var newName = timestamp + "_" + file.name;
        var newPath = dateFolder.fsName + "/" + newName;
        
        file.rename(newName);
        file.changePath(newPath);
        
    } catch (e) {
        // If archiving fails, just delete the file
        file.remove();
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
        projectName: app.project ? app.project.file ? app.project.file.name : "Untitled Project" : "No Project",
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