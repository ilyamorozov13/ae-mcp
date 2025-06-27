// Check if CEP extensions are loaded
try {
    // Try to access CSInterface
    var result = app.project.activeItem;
    
    $.writeln("=== CEP Debug Info ===");
    $.writeln("After Effects version: " + app.version);
    $.writeln("Build number: " + app.buildNumber);
    
    // Check if extension folder exists
    var extensionFolder = new Folder("~/Library/Application Support/Adobe/CEP/extensions/ae-mcp-bridge");
    $.writeln("Extension folder exists: " + extensionFolder.exists);
    
    if (extensionFolder.exists) {
        var files = extensionFolder.getFiles();
        $.writeln("Extension files: " + files.length);
        
        var manifestFile = new File(extensionFolder.fsName + "/CSXS/manifest.xml");
        $.writeln("Manifest exists: " + manifestFile.exists);
    }
    
    alert("Check the Info panel (Window > Info) for debug output");
    
} catch (e) {
    alert("Error: " + e.toString());
}