// After Effects Socket Bridge - Alternative to CEP Extension
// Run this script in After Effects via File > Scripts > Run Script File

(function() {
    // Configuration
    var PORT = 8080;
    var server = null;
    var isRunning = false;
    
    // Create UI
    var dialog = new Window("dialog", "AE MCP Socket Bridge");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.preferredSize.width = 300;
    
    // Status
    var statusGroup = dialog.add("group");
    statusGroup.add("statictext", undefined, "Status:");
    var statusText = statusGroup.add("statictext", undefined, "Disconnected");
    statusText.preferredSize.width = 200;
    
    // Port
    var portGroup = dialog.add("group");
    portGroup.add("statictext", undefined, "Port:");
    var portInput = portGroup.add("edittext", undefined, PORT.toString());
    portInput.preferredSize.width = 100;
    
    // Buttons
    var buttonGroup = dialog.add("group");
    buttonGroup.alignment = "center";
    
    var startBtn = buttonGroup.add("button", undefined, "Start Server");
    var stopBtn = buttonGroup.add("button", undefined, "Stop Server");
    stopBtn.enabled = false;
    
    // Log
    dialog.add("statictext", undefined, "Log:");
    var logText = dialog.add("edittext", undefined, "", {multiline: true, scrolling: true});
    logText.preferredSize.height = 150;
    
    // Functions
    function log(message) {
        var timestamp = new Date().toLocaleTimeString();
        logText.text += "[" + timestamp + "] " + message + "\n";
    }
    
    function updateStatus(status) {
        statusText.text = status;
        isRunning = (status === "Connected");
        startBtn.enabled = !isRunning;
        stopBtn.enabled = isRunning;
    }
    
    function executeScript(scriptCode) {
        try {
            var result = eval(scriptCode);
            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: error.toString(),
                    code: error.number || "UNKNOWN"
                }
            };
        }
    }
    
    function handleConnection(conn) {
        log("Client connected");
        
        conn.onData = function() {
            try {
                var data = conn.read();
                if (!data) return;
                
                var message = JSON.parse(data);
                log("Received command: " + (message.id || "unknown"));
                
                if (message.script) {
                    var result = executeScript(message.script);
                    var response = JSON.stringify({
                        id: message.id,
                        result: result
                    }) + "\n\n";
                    
                    conn.write(response);
                    log("Sent response for: " + message.id);
                }
            } catch (error) {
                log("Error: " + error.toString());
            }
        };
        
        conn.onClose = function() {
            log("Client disconnected");
        };
    }
    
    function startServer() {
        try {
            PORT = parseInt(portInput.text) || 8080;
            server = new Socket();
            
            if (server.listen(PORT)) {
                updateStatus("Connected");
                log("Server started on port " + PORT);
                
                // Handle incoming connections
                server.onConnection = function() {
                    var conn = server.accept();
                    if (conn) {
                        handleConnection(conn);
                    }
                };
                
            } else {
                throw new Error("Failed to bind to port " + PORT);
            }
        } catch (error) {
            log("Error starting server: " + error.toString());
            updateStatus("Error");
        }
    }
    
    function stopServer() {
        if (server) {
            server.close();
            server = null;
        }
        updateStatus("Disconnected");
        log("Server stopped");
    }
    
    // Event handlers
    startBtn.onClick = startServer;
    stopBtn.onClick = stopServer;
    
    dialog.onClose = function() {
        stopServer();
    };
    
    // Initial log
    log("AE MCP Socket Bridge ready");
    log("Click 'Start Server' to begin listening");
    
    // Show dialog
    dialog.center();
    dialog.show();
})();