// Test script to debug set_keyframe issue

// Create a test composition
var comp = app.project.items.addComp("Test Comp", 1920, 1080, 1, 10, 30);
var solid = comp.layers.addSolid([1, 0, 0], "Test Layer", 1920, 1080, 1);

// Test direct setValueAtTime call
try {
    var transform = solid.property("Transform");
    var position = transform.property("Position");
    
    $.writeln("=== Direct Test ===");
    $.writeln("Position property: " + position);
    $.writeln("Can vary over time: " + position.canVaryOverTime);
    $.writeln("Current value: " + position.value);
    
    // Try setting a keyframe
    position.setValueAtTime(0, [960, 540]);
    $.writeln("Set keyframe at time 0");
    
    position.setValueAtTime(2, [100, 100]);
    $.writeln("Set keyframe at time 2");
    
    $.writeln("Success! Keyframes set.");
    
} catch (e) {
    $.writeln("Error in direct test: " + e.toString());
}

// Now test the generated script format
$.writeln("\n=== Testing Generated Script Format ===");

// Simulate what the MCP would generate
var testParams = {
    compId: comp.id,
    layerIndex: 1,
    property: "Position",
    time: 1.5,
    value: [500, 300]
};

try {
    // This simulates the generated script
    var generatedScript = '\
        var comp = app.project.itemByID(' + testParams.compId + ');\
        var layer = comp.layer(' + testParams.layerIndex + ');\
        var time = ' + testParams.time + ';\
        var value = [' + testParams.value.join(',') + '];\
        $.writeln("Time in script: " + time);\
        $.writeln("Value in script: " + value);\
        var prop = layer.property("Position");\
        if (!prop) {\
            var transform = layer.property("Transform");\
            if (transform) {\
                prop = transform.property("Position");\
            }\
        }\
        prop.setValueAtTime(time, value);\
        $.writeln("Generated script worked!");\
    ';
    
    eval(generatedScript);
    
} catch (e) {
    $.writeln("Error in generated script: " + e.toString());
}

"Test complete - check Info panel (Window > Info) for output";