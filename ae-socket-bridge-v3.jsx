// After Effects Socket Bridge V3 - With better port handling
// This version handles port conflicts and allows changing ports

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
    var DEFAULT_PORT = 8090;
    var currentPort = DEFAULT_PORT;
    var server = null;
    var isRunning = false;
    var clients = [];
    
    // Create UI
    var dialog = new Window("dialog", "AE MCP Socket Bridge V3");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.preferredSize.width = 600;
    
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
    
    // Port configuration
    var portGroup = header.add("group");
    portGroup.add("statictext", undefined, "Port:");
    var portInput = portGroup.add("edittext", undefined, currentPort.toString());
    portInput.preferredSize.width = 80;
    var portStatus = portGroup.add("statictext", undefined, "");
    portStatus.preferredSize.width = 300;
    
    // Control buttons
    var buttonPanel = dialog.add("panel", undefined, "Controls");
    var buttonGroup = buttonPanel.add("group");
    buttonGroup.alignment = "center";
    
    var startBtn = buttonGroup.add("button", undefined, "Start Server");
    var stopBtn = buttonGroup.add("button", undefined, "Stop Server");
    stopBtn.enabled = false;
    
    // Test buttons
    var testBtn = buttonGroup.add("button", undefined, "Test Port");
    var findPortBtn = buttonGroup.add("button", undefined, "Find Free Port");
    
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
    logText.preferredSize.height = 300;
    logText.preferredSize.width = 580;
    
    // Info panel
    var infoPanel = dialog.add("panel", undefined, "Instructions");
    var infoText = infoPanel.add("statictext", undefined, 
        "1. Click 'Test Port' to check if the port is available\n" +
        "2. Click 'Find Free Port' to automatically find an available port\n" +
        "3. Click 'Start Server' to begin listening\n" +
        "4. Keep this window open while using MCP", 
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
            case "warn":    prefix = "⚠️  "; break;
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
    
    function testPort(port, callback) {
        try {
            var testServer = new Socket();
            
            // Try to bind to the port
            if (testServer.listen(port)) {
                testServer.close();
                callback(true, port);
            } else {
                callback(false, port);
            }
        } catch (error) {
            callback(false, port, error.toString());
        }
    }
    
    function findFreePort(startPort) {
        log("Searching for free port starting from " + startPort + "...", "info");
        
        var maxTries = 100;
        var port = startPort;
        
        for (var i = 0; i < maxTries; i++) {
            try {
                var testServer = new Socket();
                if (testServer.listen(port)) {
                    testServer.close();
                    log("Found free port: " + port, "success");
                    return port;
                }
            } catch (e) {
                // Port in use, try next
            }
            port++;
        }
        
        log("Could not find free port in range " + startPort + "-" + (startPort + maxTries), "error");
        return -1;
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
            currentPort = parseInt(portInput.text) || DEFAULT_PORT;
            
            // Force close any existing server
            if (server) {
                try {
                    server.close();
                } catch(e) {}
                server = null;
            }
            
            server = new Socket();
            server.timeout = 10;
            
            if (server.listen(currentPort)) {
                updateStatus("Running");
                portStatus.text = "✅ Listening on port " + currentPort;
                log("Server started successfully on port " + currentPort, "success");
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
                throw new Error("Failed to bind to port " + currentPort);
            }
        } catch (error) {
            log("Failed to start server: " + error.toString(), "error");
            portStatus.text = "❌ Port " + currentPort + " is in use";
            updateStatus("Error");
            
            // Suggest alternative
            var suggestion = "Try:\n" +
                           "1. Click 'Find Free Port' to find an available port\n" +
                           "2. Close any other scripts that might be using port " + currentPort + "\n" +
                           "3. Restart After Effects if the problem persists";
            log(suggestion, "warn");
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
        portStatus.text = "";
        log("Server stopped", "info");
    }
    
    function testPortAvailability() {
        var port = parseInt(portInput.text) || DEFAULT_PORT;
        log("Testing port " + port + "...", "test");
        
        testPort(port, function(available, testedPort, error) {
            if (available) {
                log("✅ Port " + testedPort + " is available", "test");
                portStatus.text = "✅ Port " + testedPort + " is available";
            } else {
                log("❌ Port " + testedPort + " is in use" + (error ? ": " + error : ""), "test");
                portStatus.text = "❌ Port " + testedPort + " is in use";
            }
        });
    }
    
    function findAndSetFreePort() {
        var startPort = parseInt(portInput.text) || DEFAULT_PORT;
        var freePort = findFreePort(startPort);
        
        if (freePort > 0) {
            portInput.text = freePort.toString();
            currentPort = freePort;
            portStatus.text = "✅ Port " + freePort + " is available";
        } else {
            portStatus.text = "❌ No free ports found";
        }
    }
    
    // Event handlers
    startBtn.onClick = startServer;
    stopBtn.onClick = stopServer;
    testBtn.onClick = testPortAvailability;
    findPortBtn.onClick = findAndSetFreePort;
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
    log("AE MCP Socket Bridge V3 initialized", "info");
    log("After Effects " + app.version, "info");
    
    // Auto-test the default port
    testPortAvailability();
    
    // Show dialog
    dialog.center();
    dialog.show();
})();