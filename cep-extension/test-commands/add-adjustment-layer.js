/**
 * Test command: Add an adjustment layer with effects
 */

// Get the active composition
var comp = app.project.activeItem;

if (comp && comp instanceof CompItem) {
    // Add an adjustment layer
    var adjLayer = comp.layers.addSolid(
        [1, 1, 1],
        "Color Correction",
        comp.width,
        comp.height,
        1
    );
    
    // Make it an adjustment layer
    adjLayer.adjustmentLayer = true;
    
    // Add Curves effect
    var curves = adjLayer.property("Effects").addProperty("Curves");
    
    // Add Glow effect
    var glow = adjLayer.property("Effects").addProperty("Glow");
    glow.property("Glow Threshold").setValue(50);
    glow.property("Glow Radius").setValue(20);
    glow.property("Glow Intensity").setValue(1.5);
    
    // Animate the glow intensity
    glow.property("Glow Intensity").setValueAtTime(0, 0);
    glow.property("Glow Intensity").setValueAtTime(2, 1.5);
    glow.property("Glow Intensity").setValueAtTime(4, 0);
    
    // Add a vignette using a solid with radial gradient
    var vignette = comp.layers.addSolid(
        [0, 0, 0],
        "Vignette",
        comp.width,
        comp.height,
        1
    );
    
    // Apply radial gradient
    var ramp = vignette.property("Effects").addProperty("Gradient Ramp");
    ramp.property("Start of Ramp").setValue([comp.width/2, comp.height/2]);
    ramp.property("Start Color").setValue([0, 0, 0, 0]);
    ramp.property("End of Ramp").setValue([0, 0]);
    ramp.property("End Color").setValue([0, 0, 0, 1]);
    ramp.property("Ramp Shape").setValue(2); // Radial
    
    // Set blend mode to multiply
    vignette.blendingMode = BlendingMode.MULTIPLY;
    vignette.opacity.setValue(50);
    
} else {
    alert("Please select a composition first");
}