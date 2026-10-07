/**
 * AE MCP Bridge - ExtendScript Host
 */

// Global variables
var COMMANDS_FOLDER_NAME = "ae-mcp-commands";
var commandsFolder = null;
var processedCommands = {};
var mcpOwnUndoDepth = 0;

function mcpBeginUndo(name) {
    app.beginUndoGroup(name);
    mcpOwnUndoDepth++;
}

function mcpEndUndo() {
    if (mcpOwnUndoDepth > 0) {
        try {
            app.endUndoGroup();
        } catch (e) {}
        mcpOwnUndoDepth--;
        if (mcpOwnUndoDepth < 0) {
            mcpOwnUndoDepth = 0;
        }
    }
}

function mcpCloseOwnUndoGroups() {
    while (mcpOwnUndoDepth > 0) {
        mcpEndUndo();
    }
}

// Extra app.endUndoGroup() / app.purge / $.sleep during BEE PreCloseProject
// (user replacing a photo) crash After Effects. Only close groups we opened.
function mcpSleepBackgroundPoller() {
    $.global.mcpBridgeAutoProcess = false;
    $.global.mcpBridgeLastStatus = "Sleeping";
    $.global.mcpBridgePoll = function () {
        $.global.mcpBridgeLastStatus = "Sleeping";
    };
    if ($.global.mcpBridgeTaskId) {
        try {
            app.cancelTask($.global.mcpBridgeTaskId);
        } catch (cancelErr) {}
        $.global.mcpBridgeTaskId = 0;
    }
}

function mcpStabilizeAfterCommand(script) {
    mcpCloseOwnUndoGroups();
    try {
        app.endSuppressDialogs(false);
    } catch (dialogErr) {}
}

function mcpStabilizeAfterBatch(didMutate) {
    mcpCloseOwnUndoGroups();
    try {
        app.endSuppressDialogs(false);
    } catch (dialogErr) {}
    mcpSleepBackgroundPoller();
}

function mcpHasPendingCommands() {
    try {
        if (!commandsFolder || !commandsFolder.exists) {
            initializeMCPBridge();
        }
        if (!commandsFolder || !commandsFolder.exists) {
            return false;
        }
        var allFiles = commandsFolder.getFiles("*.json");
        var i;
        for (i = 0; i < allFiles.length; i++) {
            var fname = allFiles[i].name;
            if (fname.indexOf(".response") === -1 &&
                fname.indexOf(".processed") === -1 &&
                fname.indexOf("_") !== 0 &&
                !processedCommands[fname]) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

function mcpEscapeString(value) {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t");
}

function mcpStringify(value) {
    if (typeof JSON !== "undefined" && JSON && typeof JSON.stringify === "function") {
        try {
            // ExtendScript JSON.stringify often rejects the spacing argument
            return JSON.stringify(value);
        } catch (jsonError) {
            // Fall through to manual serializer
        }
    }

    if (value === null) {
        return "null";
    }

    var valueType = typeof value;
    if (valueType === "string") {
        return '"' + mcpEscapeString(value) + '"';
    }
    if (valueType === "number" || valueType === "boolean") {
        return String(value);
    }
    if (valueType === "undefined" || valueType === "function") {
        return "null";
    }

    if (value instanceof Array) {
        var arrayParts = [];
        for (var i = 0; i < value.length; i++) {
            arrayParts.push(mcpStringify(value[i]));
        }
        return "[" + arrayParts.join(",") + "]";
    }

    var objectParts = [];
    for (var key in value) {
        if (value.hasOwnProperty(key) && typeof value[key] !== "function" && typeof value[key] !== "undefined") {
            objectParts.push('"' + mcpEscapeString(key) + '":' + mcpStringify(value[key]));
        }
    }
    return "{" + objectParts.join(",") + "}";
}

function mcpParse(content) {
    if (typeof JSON !== "undefined" && JSON && typeof JSON.parse === "function") {
        return JSON.parse(content);
    }
    return eval("(" + content + ")");
}

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
        mcpOwnUndoDepth = 0;
        if (!$.global.mcpBridgeBusy) {
            mcpSleepBackgroundPoller();
        }
        
        return "success";
    } catch (e) {
        return "Error: " + e.toString();
    }
}

/**
 * Process command files
 */
function processCommands(debugMode) {
    var result = {
        success: true,
        processed: 0,
        errors: 0,
        commands: [],
        errorDetails: [],
        mutated: 0
    };

    if ($.global.mcpBridgeBusy) {
        result.busy = true;
        return mcpStringify(result);
    }
    $.global.mcpBridgeBusy = true;
    
    try {
        if (!commandsFolder || !commandsFolder.exists) {
            initializeMCPBridge();
        }
        
        // Get all .json files in the commands folder (excluding .response files)
        var allFiles = commandsFolder.getFiles("*.json");
        var files = [];
        
        // Filter out response files and processed files
        for (var i = 0; i < allFiles.length; i++) {
            var fname = allFiles[i].name;
            if (fname.indexOf(".response") === -1 &&
                fname.indexOf(".processed") === -1 &&
                fname.indexOf("_") !== 0) {
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
                var commandStartTime = new Date().getTime();
                
                // Read the command file
                file.open("r");
                var content = file.read();
                file.close();
                
                // Parse JSON to get the script
                var commandData = mcpParse(content);
                var commandId = commandData.id;
                var script = commandData.script;
                var useUndo = commandData.undo !== false;
                
                if (useUndo) {
                    mcpBeginUndo("MCP Command: " + file.name);
                    result.mutated++;
                }
                try {
                    // Execute the script and capture the result
                    var commandResult = eval(script);
                    
                    // Format result to match expected structure
                    var formattedResult;
                    if (commandResult && typeof commandResult === "object" && commandResult.hasOwnProperty("success")) {
                        // Result already has the expected format
                        formattedResult = commandResult;
                    } else {
                        // Wrap result in expected format
                        formattedResult = {
                            success: true,
                            data: commandResult
                        };
                    }
                    
                    // Write response file (serialize before open to avoid empty files on failure)
                    var responseBody = mcpStringify({
                        id: commandId,
                        result: formattedResult
                    });
                    var responseFile = new File(file.fsName + ".response");
                    responseFile.encoding = "UTF-8";
                    if (responseFile.open("w")) {
                        responseFile.write(responseBody);
                        responseFile.close();
                        
                        result.processed++;
                        
                        var commandEndTime = new Date().getTime();
                        var executionTime = commandEndTime - commandStartTime;
                        
                        if (debugMode) {
                            result.commands.push({
                                file: file.name,
                                content: content.substring(0, 500) + (content.length > 500 ? "..." : ""),
                                executionTime: executionTime
                            });
                        } else {
                            result.commands.push(file.name);
                        }
                        
                        // Mark as processed
                        processedCommands[file.name] = true;
                        archiveCommand(file);
                    } else {
                        throw new Error("Failed to open response file for writing");
                    }
                } catch (execError) {
                    // Write error response
                    var errorResponseBody = mcpStringify({
                        id: commandId,
                        result: {
                            success: false,
                            error: {
                                message: execError.toString(),
                                code: "EXECUTION_ERROR"
                            }
                        }
                    });
                    var errorResponseFile = new File(file.fsName + ".response");
                    errorResponseFile.encoding = "UTF-8";
                    if (errorResponseFile.open("w")) {
                        errorResponseFile.write(errorResponseBody);
                        errorResponseFile.close();
                    }
                    
                    result.errors++;
                    
                    if (debugMode) {
                        result.errorDetails.push({
                            file: file.name,
                            message: execError.toString(),
                            stack: execError.stack || "No stack trace available"
                        });
                        result.commands.push({
                            file: file.name,
                            content: content.substring(0, 500) + (content.length > 500 ? "..." : ""),
                            error: execError.toString()
                        });
                    } else {
                        result.commands.push("ERROR in " + file.name + ": " + execError.toString());
                    }
                    
                    // Still mark as processed and archive even on error
                    processedCommands[file.name] = true;
                    archiveCommand(file);
                } finally {
                    mcpStabilizeAfterCommand(script);
                }
                
            } catch (fileError) {
                result.errors++;
                
                if (debugMode) {
                    result.errorDetails.push({
                        file: file.name,
                        message: fileError.toString(),
                        stack: fileError.stack || "No stack trace available"
                    });
                } else {
                    result.commands.push("ERROR reading " + file.name + ": " + fileError.toString());
                }
            }
        }

        if (result.processed > 0 || result.mutated > 0) {
            mcpStabilizeAfterBatch(true);
        } else {
            mcpSleepBackgroundPoller();
        }
        
    } catch (e) {
        result.success = false;
        result.error = e.toString();
        try {
            mcpStabilizeAfterBatch(result.mutated > 0);
        } catch (stabilizeErr) {}
    } finally {
        $.global.mcpBridgeBusy = false;
    }
    
    return mcpStringify(result);
}

/**
 * Archive processed command file
 */
function archiveCommand(file) {
    try {
        // Don't delete the command file immediately
        // Instead, rename it to mark as processed
        var processedName = file.name + ".processed";
        file.rename(processedName);
    } catch (e) {
        // If rename fails, try to delete
        try {
            file.remove();
        } catch (e2) {
            // If deletion also fails, log it but continue
        }
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
    
    return {
        success: true,
        data: info
    };
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

$.global.mcpProcessCommands = processCommands;
$.global.mcpHasPendingCommands = mcpHasPendingCommands;
$.global.mcpInitializeMCPBridge = initializeMCPBridge;
$.global.mcpSleepBackgroundPoller = mcpSleepBackgroundPoller;