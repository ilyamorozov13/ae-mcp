// Test script to verify shape layer creation

// This is the script that would be generated for add_shape_layer
var comp = app.project.itemByID(1); // Assuming comp ID 1 exists
if (!comp || !(comp instanceof CompItem)) {
  throw new Error("Composition not found");
}

var layer = comp.layers.addShape();
layer.name = "Test Shape Layer";

// Add shape content to make it visible
var shapeGroup = layer.property("Contents").addProperty("ADBE Vector Group");
var shapeType = "rectangle";

// Add the shape path based on type
var shapePath;
if (shapeType === "rectangle") {
  shapePath = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Rect");
  shapePath.property("Size").setValue([200, 200]);
} else if (shapeType === "ellipse") {
  shapePath = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Ellipse");
  shapePath.property("Size").setValue([200, 200]);
} else if (shapeType === "polygon") {
  shapePath = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Star");
  shapePath.property("Type").setValue(1); // 1 = polygon, 2 = star
  shapePath.property("Points").setValue(6);
  shapePath.property("Outer Radius").setValue(100);
} else if (shapeType === "star") {
  shapePath = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Star");
  shapePath.property("Type").setValue(2); // 2 = star
  shapePath.property("Points").setValue(5);
  shapePath.property("Outer Radius").setValue(100);
  shapePath.property("Inner Radius").setValue(50);
}

// Add fill to make the shape visible
var fill = shapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
fill.property("Color").setValue([1, 1, 1]); // White fill

// Add stroke for better visibility
var stroke = shapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
stroke.property("Color").setValue([0, 0, 0]); // Black stroke
stroke.property("Stroke Width").setValue(2);

// Return success
{
  success: true,
  data: {
    index: layer.index,
    name: layer.name
  }
}