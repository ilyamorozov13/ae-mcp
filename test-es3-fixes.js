// Test script to verify ES3 compatibility fixes
// This script tests the apply_effect functionality

// Test 1: List compositions (should work without parameters)
var listCompsScript = 'var comps = [];\n' +
  'for (var i = 1; i <= app.project.numItems; i++) {\n' +
  '  var item = app.project.item(i);\n' +
  '  if (item instanceof CompItem) {\n' +
  '    comps.push({\n' +
  '      id: item.id,\n' +
  '      name: item.name\n' +
  '    });\n' +
  '  }\n' +
  '}\n' +
  'JSON.stringify(comps);\n';

// Test 2: Apply effect with proper error handling
var applyEffectScript = 'var comp = app.project.itemByID(931);\n' +
  'if (!comp || !(comp instanceof CompItem)) {\n' +
  '  throw new Error("Composition not found");\n' +
  '}\n' +
  '\n' +
  'var layer = comp.layer(1);\n' +
  'if (!layer) {\n' +
  '  throw new Error("Layer not found");\n' +
  '}\n' +
  '\n' +
  'var effectName = "Gaussian Blur";\n' +
  'var effects = layer.property("ADBE Effect Parade");\n' +
  'if (!effects) {\n' +
  '  throw new Error("Cannot access effects on this layer");\n' +
  '}\n' +
  '\n' +
  'try {\n' +
  '  var newEffect = effects.addProperty(effectName);\n' +
  '  if (!newEffect) {\n' +
  '    throw new Error("Failed to add effect");\n' +
  '  }\n' +
  '} catch (e) {\n' +
  '  // Test the fixed error message with properly escaped quotes\n' +
  '  throw new Error("Failed to apply effect \\\\"" + effectName + "\\\\": " + e.toString());\n' +
  '}\n' +
  '\n' +
  '"Effect applied successfully";\n';

// Test 3: Set keyframe with proper error handling
var setKeyframeScript = 'var comp = app.project.itemByID(931);\n' +
  'if (!comp || !(comp instanceof CompItem)) {\n' +
  '  throw new Error("Composition not found");\n' +
  '}\n' +
  '\n' +
  'var layer = comp.layer(1);\n' +
  'if (!layer) {\n' +
  '  throw new Error("Layer not found");\n' +
  '}\n' +
  '\n' +
  'var property = layer.property("Transform").property("Opacity");\n' +
  'if (!property) {\n' +
  '  throw new Error("Property \\\\"Opacity\\\\" not found");\n' +
  '}\n' +
  '\n' +
  'if (!property.canSetExpression) {\n' +
  '  throw new Error("Property cannot be keyframed: \\\\"Opacity\\\\"");\n' +
  '}\n' +
  '\n' +
  'property.setValueAtTime(0, 100);\n' +
  'property.setValueAtTime(1, 0);\n' +
  '\n' +
  '"Keyframes set successfully";\n';

console.log("Test scripts created for ES3 compatibility verification");
console.log("\nTo run these tests:");
console.log("1. Ensure After Effects is running with a composition (ID: 931)");
console.log("2. Ensure the AE MCP Bridge panel is open with Auto Process enabled");
console.log("3. Use the execute_script tool with each test script");