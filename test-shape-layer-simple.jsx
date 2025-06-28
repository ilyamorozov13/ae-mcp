// Simple test for shape layer creation in After Effects
// Run this in ExtendScript Toolkit or Script Editor

try {
    // Get the active composition
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Please select a composition first");
    } else {
        // Create a shape layer
        var layer = comp.layers.addShape();
        layer.name = "Test Shape";
        
        // Method 1: Simple approach - add a rectangle path
        var rect = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Shape - Rect");
        
        // The layer should now have a default rectangle
        // Let's also add a fill
        var fill = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Graphic - Fill");
        
        alert("Shape layer created with rectangle");
    }
} catch (e) {
    alert("Error: " + e.toString());
}