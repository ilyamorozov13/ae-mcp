/**
 * Test command: Create a composition with animated layers
 */

// Ensure we have a project
if (!app.project) {
    app.newProject();
}

// Create a new composition
var comp = app.project.items.addComp(
    "MCP Test Composition",
    1920,
    1080,
    1.0,
    10,
    30
);

// Add a background solid
var bgSolid = comp.layers.addSolid(
    [0.1, 0.1, 0.1],  // Dark gray
    "Background",
    comp.width,
    comp.height,
    1
);

// Add a colored solid with animation
var animSolid = comp.layers.addSolid(
    [0.2, 0.5, 1.0],  // Blue
    "Animated Square",
    400,
    400,
    1
);

// Center the solid
animSolid.property("Position").setValue([comp.width/2, comp.height/2]);

// Add rotation animation
animSolid.property("Rotation").setValueAtTime(0, 0);
animSolid.property("Rotation").setValueAtTime(5, 360);

// Add scale animation
animSolid.property("Scale").setValueAtTime(0, [50, 50]);
animSolid.property("Scale").setValueAtTime(2.5, [100, 100]);
animSolid.property("Scale").setValueAtTime(5, [50, 50]);

// Add a text layer
var textLayer = comp.layers.addText("MCP Bridge Test");
var textProp = textLayer.property("Source Text");
var textDocument = textProp.value;
textDocument.fontSize = 72;
textDocument.fillColor = [1, 1, 1];
textDocument.strokeColor = [0, 0, 0];
textDocument.strokeWidth = 2;
textDocument.font = "Arial";
textDocument.strokeOverFill = true;
textDocument.applyStroke = true;
textDocument.applyFill = true;
textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
textProp.setValue(textDocument);

// Position text at bottom
textLayer.property("Position").setValue([comp.width/2, comp.height - 100]);

// Add fade in/out to text
textLayer.property("Opacity").setValueAtTime(0, 0);
textLayer.property("Opacity").setValueAtTime(1, 100);
textLayer.property("Opacity").setValueAtTime(4, 100);
textLayer.property("Opacity").setValueAtTime(5, 0);

// Open the composition
comp.openInViewer();