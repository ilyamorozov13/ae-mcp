// Simple socket test to diagnose port issues

(function() {
    var w = new Window("dialog", "Socket Test");
    w.preferredSize.width = 400;
    
    var portGroup = w.add("group");
    portGroup.add("statictext", undefined, "Port:");
    var portInput = portGroup.add("edittext", undefined, "8090");
    portInput.preferredSize.width = 100;
    
    var resultText = w.add("edittext", undefined, "", {multiline: true, readonly: true});
    resultText.preferredSize.height = 200;
    resultText.preferredSize.width = 380;
    
    var btnGroup = w.add("group");
    
    var testBtn = btnGroup.add("button", undefined, "Test Create Socket");
    testBtn.onClick = function() {
        try {
            var sock = new Socket();
            resultText.text += "✅ Created socket successfully\n";
            resultText.text += "Socket object: " + sock + "\n";
            sock.close();
            resultText.text += "✅ Closed socket\n\n";
        } catch(e) {
            resultText.text += "❌ Error: " + e.toString() + "\n\n";
        }
    };
    
    var listenBtn = btnGroup.add("button", undefined, "Test Listen");
    listenBtn.onClick = function() {
        var port = parseInt(portInput.text);
        resultText.text += "Testing port " + port + "...\n";
        
        try {
            var server = new Socket();
            resultText.text += "Created server socket\n";
            
            var success = server.listen(port);
            if (success) {
                resultText.text += "✅ Successfully listening on port " + port + "\n";
                server.close();
                resultText.text += "✅ Closed server socket\n\n";
            } else {
                resultText.text += "❌ Failed to listen on port " + port + "\n";
                resultText.text += "Socket error: " + server.error + "\n\n";
            }
        } catch(e) {
            resultText.text += "❌ Exception: " + e.toString() + "\n\n";
        }
    };
    
    var multiBtn = btnGroup.add("button", undefined, "Test Multiple");
    multiBtn.onClick = function() {
        var port = parseInt(portInput.text);
        resultText.text += "Testing multiple socket operations...\n";
        
        // Test 1: Create and close multiple times
        for (var i = 0; i < 3; i++) {
            try {
                var s = new Socket();
                if (s.listen(port)) {
                    resultText.text += "✅ Round " + (i+1) + ": Listen OK\n";
                    s.close();
                } else {
                    resultText.text += "❌ Round " + (i+1) + ": Listen failed\n";
                }
            } catch(e) {
                resultText.text += "❌ Round " + (i+1) + ": " + e.toString() + "\n";
            }
        }
        resultText.text += "\n";
    };
    
    var clearBtn = btnGroup.add("button", undefined, "Clear");
    clearBtn.onClick = function() {
        resultText.text = "";
    };
    
    w.add("statictext", undefined, "If listen fails, try a different port or restart AE");
    
    w.show();
})();