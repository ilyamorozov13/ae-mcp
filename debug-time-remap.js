// Diagnostic script to debug Time Remap issues
var comp = app.project.itemByID(931);
if (!comp) {
  throw new Error("Composition not found");
}

var layer = comp.layer(2);
if (!layer) {
  throw new Error("Layer not found");
}

var diagnostics = {
  layerName: layer.name,
  layerIndex: layer.index,
  layerType: layer.constructor.name,
  hasSource: layer.source ? true : false,
  sourceType: layer.source ? layer.source.constructor.name : "none",
  canSetTimeRemap: layer.canSetTimeRemapEnabled,
  timeRemapEnabledBefore: layer.timeRemapEnabled,
  properties: []
};

// List all properties before enabling time remap
for (var i = 1; i <= layer.numProperties; i++) {
  try {
    var prop = layer.property(i);
    diagnostics.properties.push({
      index: i,
      name: prop.name,
      matchName: prop.matchName
    });
  } catch (e) {
    diagnostics.properties.push({
      index: i,
      error: e.toString()
    });
  }
}

// Now enable time remapping
layer.timeRemapEnabled = true;
diagnostics.timeRemapEnabledAfter = layer.timeRemapEnabled;

// Try different ways to access Time Remap
diagnostics.accessAttempts = [];

// Attempt 1: Standard name
try {
  var tr1 = layer.property("Time Remap");
  diagnostics.accessAttempts.push({
    method: "layer.property('Time Remap')",
    success: true,
    canSetExpression: tr1.canSetExpression,
    canVaryOverTime: tr1.canVaryOverTime,
    numKeys: tr1.numKeys
  });
} catch (e) {
  diagnostics.accessAttempts.push({
    method: "layer.property('Time Remap')",
    success: false,
    error: e.toString()
  });
}

// Attempt 2: ADBE name
try {
  var tr2 = layer.property("ADBE Time Remapping");
  diagnostics.accessAttempts.push({
    method: "layer.property('ADBE Time Remapping')",
    success: true,
    canSetExpression: tr2.canSetExpression,
    canVaryOverTime: tr2.canVaryOverTime,
    numKeys: tr2.numKeys
  });
} catch (e) {
  diagnostics.accessAttempts.push({
    method: "layer.property('ADBE Time Remapping')",
    success: false,
    error: e.toString()
  });
}

// Attempt 3: Direct property
try {
  var tr3 = layer.timeRemap;
  diagnostics.accessAttempts.push({
    method: "layer.timeRemap",
    success: true,
    type: typeof tr3,
    hasSetValueAtTime: typeof tr3.setValueAtTime === "function"
  });
} catch (e) {
  diagnostics.accessAttempts.push({
    method: "layer.timeRemap",
    success: false,
    error: e.toString()
  });
}

// List all properties after enabling time remap
diagnostics.propertiesAfter = [];
for (var i = 1; i <= layer.numProperties; i++) {
  try {
    var prop = layer.property(i);
    diagnostics.propertiesAfter.push({
      index: i,
      name: prop.name,
      matchName: prop.matchName
    });
  } catch (e) {
    diagnostics.propertiesAfter.push({
      index: i,
      error: e.toString()
    });
  }
}

// Return diagnostics
JSON.stringify(diagnostics, null, 2);