// Test apply_easy_ease ExtendScript generation
// This tests the actual generated script in After Effects

(function() {
    try {
        // Get the active composition
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("Please select a composition first");
            return;
        }
        
        // Create a test layer if needed
        if (comp.numLayers === 0) {
            var solid = comp.layers.addSolid([1, 0, 0], "Test Layer", comp.width, comp.height, 1);
        }
        
        var layer = comp.layer(1);
        if (!layer) {
            alert("No layer found");
            return;
        }
        
        // Add keyframes to position
        var position = layer.property("ADBE Transform Group").property("ADBE Position");
        
        // Clear existing keyframes
        while (position.numKeys > 0) {
            position.removeKey(1);
        }
        
        // Add two keyframes
        position.setValueAtTime(0, [100, 100]);
        position.setValueAtTime(1, [500, 500]);
        
        alert("Added keyframes. Layer: " + layer.name + ", Keyframes: " + position.numKeys);
        
        // Now test the apply easy ease logic
        var easeIn = new KeyframeEase(0, 33.333);
        var easeOut = new KeyframeEase(0, 33.333);
        
        // Apply to both keyframes
        for (var i = 1; i <= position.numKeys; i++) {
            try {
                position.setTemporalEaseAtKey(i, [easeIn, easeIn], [easeOut, easeOut]);
            } catch (e) {
                alert("Error applying ease to keyframe " + i + ": " + e.toString());
            }
        }
        
        alert("Successfully applied Easy Ease to " + position.numKeys + " keyframes");
        
    } catch (error) {
        alert("Test Error: " + error.toString());
    }
})();