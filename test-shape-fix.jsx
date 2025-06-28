// Test script to verify shape layer creation
// This creates shape layers with actual shapes

// Create a new comp
var comp = app.project.items.addComp("Shape Test", 1920, 1080, 1.0, 5, 30);

// Method 1: Create shape layer and add content manually
var layer1 = comp.layers.addShape();
layer1.name = "Manual Shape - Rectangle";

// Get the contents group
var contents1 = layer1.property("ADBE Root Vectors Group");

// Add a rectangle shape
var rect = contents1.addProperty("ADBE Vector Shape - Rect");
// Set size
rect.property("ADBE Vector Rect Size").setValue([200, 200]);

// Add fill to make it visible
var fill1 = contents1.addProperty("ADBE Vector Graphic - Fill");
fill1.property("ADBE Vector Fill Color").setValue([1, 0, 0]); // Red

// Set position
layer1.property("Position").setValue([500, 540]);

// Method 2: Create another shape with ellipse
var layer2 = comp.layers.addShape();
layer2.name = "Manual Shape - Ellipse";

var contents2 = layer2.property("ADBE Root Vectors Group");
var ellipse = contents2.addProperty("ADBE Vector Shape - Ellipse");
ellipse.property("ADBE Vector Ellipse Size").setValue([300, 150]);

var fill2 = contents2.addProperty("ADBE Vector Graphic - Fill");
fill2.property("ADBE Vector Fill Color").setValue([0, 1, 0]); // Green

layer2.property("Position").setValue([1000, 540]);

// Method 3: Test the approach used in addShapeLayer
var layer3 = comp.layers.addShape();
layer3.name = "Like addShapeLayer - Star";

var contents3 = layer3.property("ADBE Root Vectors Group");
var star = contents3.addProperty("ADBE Vector Shape - Star");
star.property("ADBE Vector Star Type").setValue(2); // Star type
star.property("ADBE Vector Star Points").setValue(5);
star.property("ADBE Vector Star Inner Radius").setValue(50);
star.property("ADBE Vector Star Outer Radius").setValue(100);

var fill3 = contents3.addProperty("ADBE Vector Graphic - Fill");
fill3.property("ADBE Vector Fill Color").setValue([0, 0, 1]); // Blue

layer3.property("Position").setValue([1500, 540]);

// Show result
alert("Created 3 shape layers with actual shapes:\n1. Red Rectangle\n2. Green Ellipse\n3. Blue Star");