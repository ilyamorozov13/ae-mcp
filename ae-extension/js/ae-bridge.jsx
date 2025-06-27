// After Effects ExtendScript Bridge for MCP
// This script runs in the After Effects context

// Global state
var isConnected = false;
var pendingResults = {};

// Logging function
function log(message, level) {
    var event = new CSXSEvent();
    event.type = "com.aemcp.log";
    event.data = JSON.stringify({
        message: message,
        level: level || "info"
    });
    event.dispatch();
}

// Set connection status
function setConnectionStatus(status) {
    isConnected = status;
    log("Connection status: " + (status ? "connected" : "disconnected"));
}

// Execute script from MCP server
function executeScript(message) {
    var id = message.id;
    var script = message.script;
    
    log("Executing script: " + id);
    
    try {
        // Evaluate the script
        var result = eval(script);
        
        // Send result back
        var response = {
            id: id,
            result: result
        };
        
        return JSON.stringify(response);
        
    } catch (error) {
        log("Script error: " + error.toString(), "error");
        
        return JSON.stringify({
            id: id,
            error: {
                message: error.toString(),
                code: error.number || "UNKNOWN"
            }
        });
    }
}

// Utility functions for common operations
function getActiveComp() {
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem) {
        return comp;
    }
    return null;
}

function getCompById(id) {
    try {
        var item = app.project.itemByID(id);
        if (item && item instanceof CompItem) {
            return item;
        }
    } catch (e) {}
    return null;
}

function getLayerByIndex(comp, index) {
    if (comp && index > 0 && index <= comp.numLayers) {
        return comp.layer(index);
    }
    return null;
}

// Helper for converting AE objects to JSON-safe format
function aeObjectToJSON(obj) {
    if (!obj) return null;
    
    var result = {};
    
    try {
        // Handle different AE object types
        if (obj instanceof CompItem) {
            result = {
                type: "composition",
                id: obj.id,
                name: obj.name,
                width: obj.width,
                height: obj.height,
                duration: obj.duration,
                frameRate: obj.frameRate,
                numLayers: obj.numLayers
            };
        } else if (obj instanceof AVLayer || obj instanceof TextLayer || obj instanceof ShapeLayer) {
            result = {
                type: "layer",
                index: obj.index,
                name: obj.name,
                position: obj.position.value,
                scale: obj.scale.value,
                rotation: obj.rotation.value,
                opacity: obj.opacity.value
            };
        } else if (obj instanceof FootageItem) {
            result = {
                type: "footage",
                id: obj.id,
                name: obj.name,
                width: obj.width,
                height: obj.height,
                duration: obj.duration
            };
        } else if (obj instanceof Project) {
            result = {
                type: "project",
                file: obj.file ? obj.file.fsName : null,
                numItems: obj.numItems
            };
        }
    } catch (e) {
        log("Error converting object: " + e.toString(), "error");
    }
    
    return result;
}

// Initialize
log("After Effects bridge initialized", "info");