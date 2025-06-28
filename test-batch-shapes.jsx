// Test script to verify batch shape creation with actual shapes
// Simulates what the updated batchCreateLayers would generate

// Create a new comp
var comp = app.project.items.addComp("Batch Shape Test", 1920, 1080, 1.0, 5, 30);

// Simulate creating multiple shape layers like in batchCreateLayers
var layerDefs = [
  {
    name: "Puppy Head",
    type: "shape",
    properties: {
      shapeType: "ellipse",
      color: [0.8, 0.6, 0.4] // Brown
    }
  },
  {
    name: "Puppy Ear Left",
    type: "shape", 
    properties: {
      shapeType: "ellipse",
      color: [0.6, 0.4, 0.2] // Darker brown
    }
  },
  {
    name: "Puppy Ear Right",
    type: "shape",
    properties: {
      shapeType: "ellipse", 
      color: [0.6, 0.4, 0.2] // Darker brown
    }
  },
  {
    name: "Puppy Eye Left",
    type: "shape",
    properties: {
      shapeType: "ellipse",
      color: [0, 0, 0] // Black
    }
  },
  {
    name: "Puppy Eye Right", 
    type: "shape",
    properties: {
      shapeType: "ellipse",
      color: [0, 0, 0] // Black
    }
  },
  {
    name: "Puppy Nose",
    type: "shape",
    properties: {
      shapeType: "polygon",
      color: [0, 0, 0] // Black
    }
  }
];

// Create layers based on definitions
for (var i = 0; i < layerDefs.length; i++) {
  var layerDef = layerDefs[i];
  
  var layer = comp.layers.addShape();
  layer.name = layerDef.name;
  
  // Add default shape content
  var contents = layer.property("ADBE Root Vectors Group");
  
  // Determine shape type from properties or use default
  var shapeType = "rectangle"; // default
  if (layerDef.properties && layerDef.properties.shapeType) {
    shapeType = layerDef.properties.shapeType;
  }
  
  // Add the shape path based on type
  var shapePath;
  if (shapeType === "rectangle") {
    shapePath = contents.addProperty("ADBE Vector Shape - Rect");
    shapePath.property("ADBE Vector Rect Size").setValue([100, 100]);
  } else if (shapeType === "ellipse") {
    shapePath = contents.addProperty("ADBE Vector Shape - Ellipse");
    shapePath.property("ADBE Vector Ellipse Size").setValue([100, 100]);
  } else if (shapeType === "polygon" || shapeType === "star") {
    shapePath = contents.addProperty("ADBE Vector Shape - Star");
    if (shapeType === "polygon") {
      shapePath.property("ADBE Vector Star Type").setValue(1); // polygon
    } else {
      shapePath.property("ADBE Vector Star Type").setValue(2); // star
    }
    shapePath.property("ADBE Vector Star Points").setValue(5);
    shapePath.property("ADBE Vector Star Inner Radius").setValue(50);
    shapePath.property("ADBE Vector Star Outer Radius").setValue(100);
  }
  
  // Add fill to make the shape visible
  var fill = contents.addProperty("ADBE Vector Graphic - Fill");
  // Use color from properties if provided
  if (layerDef.properties && layerDef.properties.color) {
    fill.property("ADBE Vector Fill Color").setValue(layerDef.properties.color);
  }
  
  // Center the layer in the comp
  layer.property("Position").setValue([comp.width/2, comp.height/2]);
}

// Now manually position and scale them to look like a puppy
// Head
comp.layer("Puppy Head").property("Scale").setValue([200, 180]);
comp.layer("Puppy Head").property("Position").setValue([960, 540]);

// Ears
comp.layer("Puppy Ear Left").property("Scale").setValue([80, 120]);
comp.layer("Puppy Ear Left").property("Position").setValue([850, 420]);
comp.layer("Puppy Ear Left").property("Rotation").setValue(-30);

comp.layer("Puppy Ear Right").property("Scale").setValue([80, 120]);
comp.layer("Puppy Ear Right").property("Position").setValue([1070, 420]);
comp.layer("Puppy Ear Right").property("Rotation").setValue(30);

// Eyes
comp.layer("Puppy Eye Left").property("Scale").setValue([30, 30]);
comp.layer("Puppy Eye Left").property("Position").setValue([920, 520]);

comp.layer("Puppy Eye Right").property("Scale").setValue([30, 30]);
comp.layer("Puppy Eye Right").property("Position").setValue([1000, 520]);

// Nose
comp.layer("Puppy Nose").property("Scale").setValue([20, 20]);
comp.layer("Puppy Nose").property("Position").setValue([960, 580]);

alert("Created puppy shape layers with actual shapes!");