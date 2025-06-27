// After Effects CEP Diagnostic Script
// Run this via File > Scripts > Run Script File

function diagnoseSystem() {
    var report = "=== After Effects CEP Diagnostic Report ===\n\n";
    
    // AE Version
    report += "After Effects Version: " + app.version + "\n";
    report += "Build: " + app.buildName + "\n\n";
    
    // System Info
    report += "OS: " + $.os + "\n";
    report += "ExtendScript Version: " + $.version + "\n\n";
    
    // Script Preferences
    report += "=== Script Settings ===\n";
    try {
        report += "Allow Write Files and Network: " + app.preferences.getPrefAsBool("Main Pref Section v2", "Pref_SCRIPTING_FILE_NETWORK_SECURITY") + "\n";
    } catch(e) {
        report += "Could not read script security preference\n";
    }
    
    // Check Extension Paths
    report += "\n=== Extension Paths ===\n";
    var extensionPath;
    if ($.os.indexOf("Windows") !== -1) {
        extensionPath = Folder.userData.fsName + "\\Adobe\\CEP\\extensions\\";
    } else {
        extensionPath = Folder.userData.fsName + "/Adobe/CEP/extensions/";
    }
    report += "User Extensions Path: " + extensionPath + "\n";
    
    // Check if our extension exists
    var aeFolder = new Folder(extensionPath + "ae-mcp-bridge");
    report += "AE MCP Bridge exists: " + aeFolder.exists + "\n";
    
    if (aeFolder.exists) {
        report += "\n=== Extension Contents ===\n";
        var files = aeFolder.getFiles();
        for (var i = 0; i < files.length && i < 10; i++) {
            report += "- " + files[i].name + "\n";
        }
        
        // Check manifest
        var manifestFile = new File(aeFolder.fsName + "/CSXS/manifest.xml");
        report += "\nManifest exists: " + manifestFile.exists + "\n";
    }
    
    // Test Socket capability
    report += "\n=== Network Test ===\n";
    try {
        var testSocket = new Socket();
        report += "Socket available: true\n";
        report += "Can create socket: " + (testSocket !== null) + "\n";
        testSocket.close();
    } catch(e) {
        report += "Socket error: " + e.toString() + "\n";
    }
    
    // Show report
    var w = new Window("dialog", "CEP Diagnostic Report");
    w.preferredSize.width = 600;
    w.preferredSize.height = 400;
    
    var textArea = w.add("edittext", undefined, report, {multiline: true, scrolling: true});
    textArea.preferredSize.width = 580;
    textArea.preferredSize.height = 350;
    
    var btnGroup = w.add("group");
    btnGroup.alignment = "center";
    
    var saveBtn = btnGroup.add("button", undefined, "Save Report");
    saveBtn.onClick = function() {
        var file = File.saveDialog("Save Diagnostic Report", "*.txt");
        if (file) {
            file.open("w");
            file.write(report);
            file.close();
            alert("Report saved to: " + file.fsName);
        }
    };
    
    var closeBtn = btnGroup.add("button", undefined, "Close");
    closeBtn.onClick = function() { w.close(); };
    
    w.show();
}

// Run diagnostic
diagnoseSystem();