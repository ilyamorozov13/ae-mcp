// Debug script for shape layer property access
// This script helps identify which properties are causing the "hidden property" error

function debugShapeLayer() {
  var comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) {
    alert("Please select a composition");
    return;
  }
  
  // Create a shape layer
  var layer = comp.layers.addShape();
  layer.name = "Debug Shape Layer";
  
  // Get the contents group
  var contents = layer.property("ADBE Root Vectors Group");
  
  // Add a star shape
  var shapePath = contents.addProperty("ADBE Vector Shape - Star");
  
  // Debug: List all properties of the star shape
  var debugInfo = "Star Shape Properties:\n";
  
  // Try to access each property and check if it's accessible
  var propertiesToCheck = [
    "ADBE Vector Star Type",
    "ADBE Vector Star Points", 
    "ADBE Vector Star Outer Radius",
    "ADBE Vector Star Inner Radius",
    "ADBE Vector Star Inner Roundness",
    "ADBE Vector Star Outer Roundness"
  ];
  
  for (var i = 0; i < propertiesToCheck.length; i++) {
    var propName = propertiesToCheck[i];
    try {
      var prop = shapePath.property(propName);
      if (prop) {
        debugInfo += propName + ": ";
        debugInfo += "canSetValue=" + prop.canSetValue;
        debugInfo += ", value=" + prop.value;
        debugInfo += ", hidden=" + prop.isHidden;
        debugInfo += "\n";
      } else {
        debugInfo += propName + ": NOT FOUND\n";
      }
    } catch (e) {
      debugInfo += propName + ": ERROR - " + e.toString() + "\n";
    }
  }
  
  // Also check transform properties
  debugInfo += "\nTransform Properties:\n";
  var transform = layer.property("ADBE Transform Group");
  var transformProps = [
    "ADBE Position",
    "ADBE Scale",
    "ADBE Rotate Z",
    "ADBE Opacity"
  ];
  
  for (var j = 0; j < transformProps.length; j++) {
    var tPropName = transformProps[j];
    try {
      var tProp = transform.property(tPropName);
      if (tProp) {
        debugInfo += tPropName + ": ";
        debugInfo += "canSetValue=" + tProp.canSetValue;
        debugInfo += ", hidden=" + tProp.isHidden;
        debugInfo += "\n";
      }
    } catch (e) {
      debugInfo += tPropName + ": ERROR - " + e.toString() + "\n";
    }
  }
  
  // Show the debug info
  var debugWindow = new Window("dialog", "Shape Layer Debug Info");
  debugWindow.add("edittext", undefined, debugInfo, {multiline: true, readonly: true});
  debugWindow.preferredSize.width = 600;
  debugWindow.preferredSize.height = 400;
  debugWindow.show();
}

debugShapeLayer();