// WORKAROUND: Use Time Stretch instead of Time Remap for layers that can't support time remapping
var comp = app.project.itemByID(931);
var layer = comp.layer(2);

// Apply 2x speed using Time Stretch (50% stretch = 2x speed)
var originalStretch = layer.stretch;
var originalOutPoint = layer.outPoint;

// Set stretch to 50% for 2x playback speed
layer.stretch = 50; // 50% = 2x speed

// Adjust the out point to maintain the desired duration
// If we want the final duration to be 1.25 seconds at 2x speed
var desiredFinalDuration = 1.25;
layer.outPoint = layer.inPoint + desiredFinalDuration;

return {
  success: true,
  method: "time_stretch",
  message: "Applied 2x speed using Time Stretch (50% stretch value)",
  originalStretch: originalStretch,
  newStretch: layer.stretch,
  originalOutPoint: originalOutPoint,
  newOutPoint: layer.outPoint,
  finalDuration: layer.outPoint - layer.inPoint,
  speedMultiplier: 100 / layer.stretch
};