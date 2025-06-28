// Test script for Polystar visibility and parenting

// 1. Test Polystar shape creation
const comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
  alert("Please select a composition");
} else {
  // Create a star shape layer
  const starLayer = comp.layers.addShape();
  starLayer.name = "Test Star";
  
  const contents = starLayer.property("ADBE Root Vectors Group");
  
  // Add star path
  const starPath = contents.addProperty("ADBE Vector Shape - Star");
  starPath.property("ADBE Vector Star Type").setValue(2); // Star
  starPath.property("ADBE Vector Star Points").setValue(5);
  starPath.property("ADBE Vector Star Outer Radius").setValue(100);
  starPath.property("ADBE Vector Star Inner Radius").setValue(50);
  
  // Add fill - this should come AFTER the path
  const fill = contents.addProperty("ADBE Vector Graphic - Fill");
  fill.property("ADBE Vector Fill Color").setValue([1, 0.5, 0]); // Orange
  
  // Position in center
  starLayer.property("Position").setValue([comp.width/2, comp.height/2]);
  
  // 2. Test parenting
  const parentNull = comp.layers.addNull();
  parentNull.name = "Parent Null";
  parentNull.property("Position").setValue([comp.width/2 + 100, comp.height/2]);
  
  // Parent the star to the null
  starLayer.parent = parentNull;
  
  alert("Created star shape with fill and parented to null. Check if star is visible and moves with parent.");
}