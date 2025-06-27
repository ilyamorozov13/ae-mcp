// Direct test of set_keyframe functionality

// Get the first comp (or create one)
var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
    comp = app.project.items.addComp("Direct Test", 1920, 1080, 1, 10, 30);
}

// Add a solid layer
var solid = comp.layers.addSolid([1, 0, 0], "Test Solid", 1920, 1080, 1);

// Test different property types
$.writeln("=== Testing Position (array value) ===");
try {
    var position = solid.property("Transform").property("Position");
    $.writeln("Current position value: " + position.value);
    $.writeln("Value is array: " + (position.value instanceof Array));
    $.writeln("Value length: " + position.value.length);
    
    // Try setting with array
    var testArray = [500, 300];
    $.writeln("Setting position to: [" + testArray.join(", ") + "]");
    position.setValueAtTime(1, testArray);
    $.writeln("SUCCESS: Position keyframe set");
} catch (e) {
    $.writeln("ERROR: " + e.toString());
}

$.writeln("\n=== Testing Opacity (single value) ===");
try {
    var opacity = solid.property("Transform").property("Opacity");
    $.writeln("Current opacity value: " + opacity.value);
    opacity.setValueAtTime(1, 50);
    $.writeln("SUCCESS: Opacity keyframe set");
} catch (e) {
    $.writeln("ERROR: " + e.toString());
}

$.writeln("\n=== Testing what happens with wrong array size ===");
try {
    var position2 = solid.property("Transform").property("Position");
    position2.setValueAtTime(2, [100]); // Only 1 element - should fail
} catch (e) {
    $.writeln("Expected error with 1 element: " + e.toString());
}

try {
    var position3 = solid.property("Transform").property("Position");
    position3.setValueAtTime(2, [100, 200, 300, 400]); // 4 elements - should fail
} catch (e) {
    $.writeln("Expected error with 4 elements: " + e.toString());
}

"Check Info panel for results";