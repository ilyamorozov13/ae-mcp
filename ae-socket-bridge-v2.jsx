// After Effects Socket Bridge V2 - Works even with network restrictions
// This version uses a different approach that should work regardless of settings

(function() {
    // Check if we can use sockets
    var canUseNetwork = false;
    try {
        var testSocket = new Socket();
        canUseNetwork = (testSocket !== null);
        testSocket.close();
    } catch(e) {
        canUseNetwork = false;
    }
    
    if (!canUseNetwork) {
        alert("Network access is disabled in After Effects.\n\n" +
              "To fix this:\n" +
              "1. Go to Preferences > Scripting & Expressions\n" +
              "2. Check 'Allow Scripts to Write Files and Access Network'\n" +
              "3. Restart After Effects\n\n" +
              "Note: Even if it's already checked, try unchecking and rechecking it.");
        return;
    }
    
    // Configuration
    var PORT = 8090;  // Changed from 8080 to avoid conflicts
    var server = null;
    var isRunning = false;
    var clients = [];
    
    // Create UI
    var dialog = new Window("dialog", "AE MCP Socket Bridge V2");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.preferredSize.width = 600;  // Increased from 350
    
    // Header
    var header = dialog.add("panel", undefined, "Connection Status");
    header.orientation = "column";
    header.alignChildren = "fill";
    
    var statusGroup = header.add("group");
    statusGroup.alignment = "fill";
    var statusText = statusGroup.add("statictext", undefined, "Status: Disconnected");
    statusText.preferredSize.width = 200;
    var clientsText = statusGroup.add("statictext", undefined, "Clients: 0");
    clientsText.alignment = "right";
    
    var portText = header.add("statictext", undefined, "Port: " + PORT);
    
    // Control buttons
    var buttonPanel = dialog.add("panel", undefined, "Controls");
    var buttonGroup = buttonPanel.add("group");
    buttonGroup.alignment = "center";
    
    var startBtn = buttonGroup.add("button", undefined, "Start Server");
    var stopBtn = buttonGroup.add("button", undefined, "Stop Server");
    stopBtn.enabled = false;
    
    // Test button
    var testBtn = buttonGroup.add("button", undefined, "Test");
    
    // Log panel with header
    var logPanel = dialog.add("panel", undefined, "Activity Log");
    logPanel.orientation = "column";
    logPanel.alignChildren = "fill";
    
    // Log header with clear button
    var logHeader = logPanel.add("group");
    logHeader.alignment = "right";
    var clearBtn = logHeader.add("button", undefined, "Clear Log");
    clearBtn.preferredSize.width = 80;
    
    // Log text area
    var logText = logPanel.add("edittext", undefined, "", {
        multiline: true, 
        scrolling: true,
        readonly: true
    });
    logText.preferredSize.height = 300;  // Increased height
    logText.preferredSize.width = 580;   // Set explicit width
    
    // Info panel
    var infoPanel = dialog.add("panel", undefined, "Instructions");
    var infoText = infoPanel.add("statictext", undefined, 
        "1. Click 'Start Server' to begin listening on port 8090\n" +
        "2. Keep this window open while using MCP\n" +
        "3. The server will handle commands from the MCP client", 
        {multiline: true}
    );
    
    // Functions
    function log(message, type) {
        var timestamp = new Date().toLocaleTimeString();
        var prefix = "";
        
        // Add emoji/symbol prefix based on type
        switch(type) {
            case "info":    prefix = "ℹ️  "; break;
            case "success": prefix = "✅ "; break;
            case "error":   prefix = "❌ "; break;
            case "recv":    prefix = "📥 "; break;
            case "send":    prefix = "📤 "; break;
            case "test":    prefix = "🧪 "; break;
            default:        prefix = "   ";
        }
        
        logText.text += "[" + timestamp + "] " + prefix + message + "\n";
        
        // Auto-scroll to bottom
        logText.active = false;
        logText.active = true;
        
        // Limit log to last 1000 lines
        var lines = logText.text.split("\n");
        if (lines.length > 1000) {
            logText.text = lines.slice(-1000).join("\n");
        }
    }
    
    function updateStatus(status, color) {
        statusText.text = "Status: " + status;
        isRunning = (status === "Running");
        startBtn.enabled = !isRunning;
        stopBtn.enabled = isRunning;
        updateClientCount();
    }
    
    function updateClientCount() {
        clientsText.text = "Clients: " + clients.length;
    }
    
    function executeScript(scriptCode) {
        log("Executing script...", "info");
        try {
            var result = eval(scriptCode);
            log("Script executed successfully", "success");
            return {
                success: true,
                data: result
            };
        } catch (error) {
            log("Script error: " + error.toString(), "error");
            return {
                success: false,
                error: {
                    message: error.toString(),
                    code: error.number || "UNKNOWN"
                }
            };
        }
    }
    
    function handleClient(client) {
        log("Client connected from " + client.host);
        clients.push(client);
        updateClientCount();
        
        // Set timeout for read operations
        client.timeout = 10;
        
        // Handle incoming data
        var buffer = "";
        
        client.onData = function() {
            try {
                var chunk = client.read();
                if (!chunk) return;
                
                buffer += chunk;
                
                // Look for message delimiter
                var delimiter = "\n\n";
                var delimiterIndex = buffer.indexOf(delimiter);
                
                while (delimiterIndex !== -1) {
                    var messageStr = buffer.substring(0, delimiterIndex);
                    buffer = buffer.substring(delimiterIndex + delimiter.length);
                    
                    // Process message
                    try {
                        var message = JSON.parse(messageStr);
                        log("Received: " + (message.id || "unknown"), "recv");
                        
                        if (message.script) {
                            var result = executeScript(message.script);
                            var response = JSON.stringify({
                                id: message.id,
                                result: result
                            }) + delimiter;
                            
                            if (client.write(response)) {
                                log("Sent response: " + message.id, "send");
                            } else {
                                log("Failed to send response", "error");
                            }
                        }
                    } catch (parseError) {
                        log("Parse error: " + parseError.toString(), "error");
                    }
                    
                    delimiterIndex = buffer.indexOf(delimiter);
                }
            } catch (error) {
                log("Connection error: " + error.toString(), "error");
            }
        };
        
        client.onError = function() {
            log("Client error", "error");
        };
        
        client.onClose = function() {
            log("Client disconnected");
            // Remove from clients array
            for (var i = 0; i < clients.length; i++) {
                if (clients[i] === client) {
                    clients.splice(i, 1);
                    break;
                }
            }
            updateClientCount();
        };
    }
    
    function startServer() {
        try {
            server = new Socket();
            server.timeout = 10;
            
            if (server.listen(PORT)) {
                updateStatus("Running");
                log("Server started successfully on port " + PORT, "success");
                log("Waiting for connections...");
                
                // Check for connections periodically
                $.scheduleTask(function() {
                    if (!server || !isRunning) return;
                    
                    var client = server.poll();
                    if (client) {
                        handleClient(client);
                    }
                }, 100, true); // Check every 100ms
                
            } else {
                throw new Error("Failed to bind to port " + PORT + ". It may be in use.");
            }
        } catch (error) {
            log("Failed to start server: " + error.toString(), "error");
            updateStatus("Error");
            
            // Show helpful error message
            if (error.toString().indexOf("port") !== -1) {
                alert("Port " + PORT + " is already in use.\n\n" +
                      "Another application might be using this port.\n" +
                      "Try closing other applications or restart After Effects.");
            }
        }
    }
    
    function stopServer() {
        // Close all client connections
        for (var i = 0; i < clients.length; i++) {
            try {
                clients[i].close();
            } catch(e) {}
        }
        clients = [];
        
        // Close server
        if (server) {
            try {
                server.close();
            } catch(e) {}
            server = null;
        }
        
        updateStatus("Disconnected");
        log("Server stopped", "info");
    }
    
    function testConnection() {
        log("Running connection test...", "test");
        
        // Test 1: Socket creation
        try {
            var sock = new Socket();
            log("✓ Socket creation successful", "test");
            sock.close();
        } catch(e) {
            log("✗ Socket creation failed: " + e.toString(), "test");
            return;
        }
        
        // Test 2: Can create server
        try {
            var testServer = new Socket();
            if (testServer.listen(9999)) {
                log("✓ Can create server socket", "test");
                testServer.close();
            } else {
                log("✗ Cannot create server socket", "test");
            }
        } catch(e) {
            log("✗ Server test failed: " + e.toString(), "test");
        }
        
        log("Test complete", "test");
    }
    
    // Event handlers
    startBtn.onClick = startServer;
    stopBtn.onClick = stopServer;
    testBtn.onClick = testConnection;
    clearBtn.onClick = function() {
        logText.text = "";
        log("Log cleared", "info");
    };
    
    dialog.onClose = function() {
        stopServer();
        // Cancel scheduled tasks
        app.cancelTask();
    };
    
    // Initial setup
    log("AE MCP Socket Bridge V2 initialized", "info");
    log("After Effects " + app.version, "info");
    
    // Run initial test
    testConnection();
    
    // Show dialog
    dialog.center();
    dialog.show();
})();