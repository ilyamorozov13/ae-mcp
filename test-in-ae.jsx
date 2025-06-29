// Simple test script for After Effects
// This can be run directly in After Effects to test basic functionality

(function() {
    try {
        // Test 1: Check if we have a project open
        if (!app.project) {
            alert("No project is open. Please open a project first.");
            return;
        }
        
        // Test 2: Check if we have a composition
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("No active composition. Please select a composition.");
            return;
        }
        
        // Test 3: Check layer count
        var layerCount = comp.numLayers;
        alert("Active composition: " + comp.name + "\nNumber of layers: " + layerCount);
        
        // Test 4: Try to access first layer
        if (layerCount > 0) {
            var layer = comp.layer(1);
            var info = "First layer: " + layer.name + "\n";
            info += "Layer type: " + layer.constructor.name + "\n";
            
            // Check if layer has position property
            if (layer.position) {
                info += "Position: " + layer.position.value + "\n";
                info += "Position keyframes: " + layer.position.numKeys;
            }
            
            alert(info);
        }
        
        // Test 5: Test KeyframeEase creation (ES3 compatible)
        try {
            var ease = new KeyframeEase(0, 33.333);
            alert("KeyframeEase test passed! Speed: " + ease.speed + ", Influence: " + ease.influence);
        } catch (e) {
            alert("KeyframeEase test failed: " + e.toString());
        }
        
    } catch (error) {
        alert("Test error: " + error.toString());
    }
})();