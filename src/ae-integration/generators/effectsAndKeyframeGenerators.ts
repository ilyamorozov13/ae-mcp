import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

export const effectsAndKeyframeGenerators: ScriptGeneratorModule = {
  applyEffect: (params: {
    compId: number;
    layerIndex: number;
    effectName: string;
  }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += '// Apply the effect\n';
    script += 'var effects = layer.property("Effects");\n';
    script += 'if (!effects) {\n';
    script += '  throw new Error("Cannot access Effects property on layer");\n';
    script += '}\n\n';
    
    script += '// Check if we can add this effect\n';
    script += 'var effectName = "' + helpers.escapeString(params.effectName) + '";\n';
    script += 'var effect = null;\n\n';
    
    script += 'try {\n';
    script += '  // Try exact name first\n';
    script += '  if (effects.canAddProperty(effectName)) {\n';
    script += '    effect = effects.addProperty(effectName);\n';
    script += '  } else {\n';
    script += '    // Try common variations\n';
    script += '    var variations = [];\n';
    script += '    if (effectName === "Fast Blur") {\n';
    script += '      variations = ["Fast Box Blur", "Box Blur", "Gaussian Blur"];\n';
    script += '    } else if (effectName === "Glow") {\n';
    script += '      variations = ["Glow", "Glow 2.0"];\n';
    script += '    }\n';
    script += '    \n';
    script += '    for (var i = 0; i < variations.length; i++) {\n';
    script += '      if (effects.canAddProperty(variations[i])) {\n';
    script += '        effect = effects.addProperty(variations[i]);\n';
    script += '        effectName = variations[i];\n';
    script += '        break;\n';
    script += '      }\n';
    script += '    }\n';
    script += '  }\n';
    script += '} catch (e) {\n';
    script += '  throw new Error("Error adding effect \\\\"" + effectName + "\\\\": " + e.toString());\n';
    script += '}\n\n';
    
    script += 'if (!effect) {\n';
    script += '  throw new Error("Effect \\\\"" + effectName + "\\\\" not available. Fast Blur has been replaced with Fast Box Blur in newer versions of After Effects.");\n';
    script += '}\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.layerName = layer.name;\n';
    script += 'result.data.effectName = effect.name;\n';
    script += 'result.data.effectIndex = effect.propertyIndex;\n';
    script += 'return result;';
    
    return script;
  },
  
  setKeyframe: (params: {
    compId: number;
    layerIndex: number;
    property: string;
    time: number;
    value: any;
  }) => {
    let script = '';
    
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += '// Get time value - use provided time or current comp time\n';
    if (params.time !== undefined && params.time !== null) {
      script += 'var time = ' + params.time + ';\n\n';
    } else {
      script += 'var time = comp.time;\n\n';
    }
    
    script += '// Normalize property name - AE uses specific casing\n';
    script += 'var propertyName = "' + helpers.escapeString(params.property) + '";\n';
    script += 'var propertyMap = {\n';
    script += '  "position": "Position",\n';
    script += '  "scale": "Scale",\n';
    script += '  "rotation": "Rotation",\n';
    script += '  "opacity": "Opacity"\n';
    script += '};\n\n';
    
    script += '// Use mapped name if available, otherwise use as-is\n';
    script += 'var normalizedProperty = propertyMap[propertyName.toLowerCase()] ? propertyMap[propertyName.toLowerCase()] : propertyName;\n\n';
    
    script += 'var prop = layer.property(normalizedProperty);\n';
    script += 'if (!prop) {\n';
    script += '  // Try Transform group for transform properties\n';
    script += '  if (["Position", "Scale", "Rotation"].indexOf(normalizedProperty) !== -1) {\n';
    script += '    var transform = layer.property("Transform");\n';
    script += '    if (transform) {\n';
    script += '      prop = transform.property(normalizedProperty);\n';
    script += '    }\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + normalizedProperty + " (original: " + propertyName + ")");\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += '// Special handling for Time Remap\n';
    script += 'if (normalizedProperty === "Time Remap" || propertyName === "Time Remap") {\n';
    script += '  // Check if time remapping needs to be enabled first\n';
    script += '  if (layer.canSetTimeRemapEnabled && !layer.timeRemapEnabled) {\n';
    script += '    throw new Error("Time Remap is not enabled for this layer. Use set_time_remapping to enable it first, or use animate_time_remap which handles this automatically.");\n';
    script += '  }\n';
    script += '  \n';
    script += '  // For Time Remap, try multiple access methods\n';
    script += '  if (!prop) {\n';
    script += '    try {\n';
    script += '      prop = layer.property("ADBE Time Remapping");\n';
    script += '    } catch (e) {\n';
    script += '      try {\n';
    script += '        prop = layer.property("ADBE Layer Overrides").property("ADBE Time Remapping");\n';
    script += '      } catch (e2) {\n';
    script += '        // Search by name as last resort\n';
    script += '        var numProps = layer.numProperties;\n';
    script += '        for (var i = 1; i <= numProps; i++) {\n';
    script += '          var testProp = layer.property(i);\n';
    script += '          if (testProp && (testProp.name === "Time Remap" || testProp.matchName === "ADBE Time Remapping")) {\n';
    script += '            prop = testProp;\n';
    script += '            break;\n';
    script += '          }\n';
    script += '        }\n';
    script += '      }\n';
    script += '    }\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += '// Check if property can have keyframes\n';
    script += 'if (!prop.canVaryOverTime) {\n';
    script += '  throw new Error("Property cannot be keyframed: ' + helpers.escapeString(params.property) + '");\n';
    script += '}\n\n';
    
    script += '// Get value\n';
    if (params.value !== undefined && params.value !== null) {
      if (Array.isArray(params.value)) {
        script += 'var value = [' + params.value.join(',') + '];\n\n';
      } else {
        script += 'var value = ' + params.value + ';\n\n';
      }
    } else {
      script += 'var value = prop.value;\n\n';
    }
    
    script += '// Final validation before calling setValueAtTime\n';
    script += 'if (time === undefined || time === null) {\n';
    script += '  throw new Error("Time is still undefined after all checks!");\n';
    script += '}\n\n';
    
    script += 'if (value === undefined || value === null) {\n';
    script += '  throw new Error("Value is undefined!");\n';
    script += '}\n\n';
    
    script += '// Validate array values for Position, Scale\n';
    script += 'var arrayProps = ["Position", "Scale"];\n';
    script += 'if (arrayProps.indexOf(normalizedProperty) !== -1) {\n';
    script += '  if (!(value instanceof Array)) {\n';
    script += '    throw new Error(normalizedProperty + " requires an array value, got: " + typeof value);\n';
    script += '  }\n';
    script += '  if (value.length < 2 || value.length > 3) {\n';
    script += '    throw new Error(normalizedProperty + " requires 2 or 3 values, got " + value.length + ": [" + value.join(", ") + "]");\n';
    script += '  }\n';
    script += '  \n';
    script += '  // Prevent zero scale values\n';
    script += '  if (normalizedProperty === "Scale") {\n';
    script += '    for (var i = 0; i < value.length; i++) {\n';
    script += '      if (value[i] === 0) {\n';
    script += '        // Replace zero with small value to avoid divide by zero\n';
    script += '        value[i] = 0.1; // Use 0.1% instead of 0%\n';
    script += '      }\n';
    script += '    }\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'try {\n';
    script += '  // Ensure time is a number\n';
    script += '  var numTime = parseFloat(time);\n';
    script += '  if (isNaN(numTime)) {\n';
    script += '    throw new Error("Time is not a valid number: " + time);\n';
    script += '  }\n';
    script += '  \n';
    script += '  prop.setValueAtTime(numTime, value);\n';
    script += '} catch (e) {\n';
    script += '  throw new Error("Failed to set keyframe at time " + time + " with value " + value + ": " + e.toString());\n';
    script += '}\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.property = "' + helpers.escapeString(params.property) + '";\n';
    script += 'result.data.time = time;\n';
    script += 'result.data.value = value;\n';
    script += 'result.data.numKeys = prop.numKeys;\n';
    script += 'return result;';
    
    return script;
  },
  
  batchKeyframes: (params: { compId: number, keyframes: any[] }) => {
    let script = '';
    
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var results = [];\n';
    script += 'var keyframes = ' + JSON.stringify(params.keyframes) + ';\n\n';
    
    script += 'for (var i = 0; i < keyframes.length; i++) {\n';
    script += '  var kf = keyframes[i];\n';
    script += '  try {\n';
    script += '    var layer = comp.layer(kf.layerIndex);\n';
    script += '    if (!layer) {\n';
    script += '      results.push({success: false, error: "Layer " + kf.layerIndex + " not found"});\n';
    script += '      continue;\n';
    script += '    }\n';
    script += '    \n';
    script += '    // Property name normalization\n';
    script += '    var propertyMap = {\n';
    script += '      "position": "Position",\n';
    script += '      "scale": "Scale",\n';
    script += '      "rotation": "Rotation",\n';
    script += '      "opacity": "Opacity"\n';
    script += '    };\n';
    script += '    var propName = propertyMap[kf.property.toLowerCase()] ? propertyMap[kf.property.toLowerCase()] : kf.property;\n';
    script += '    \n';
    script += '    var prop = layer.property(propName);\n';
    script += '    if (!prop) {\n';
    script += '      // Try under Transform\n';
    script += '      var transform = layer.property("Transform");\n';
    script += '      if (transform) {\n';
    script += '        prop = transform.property(propName);\n';
    script += '      }\n';
    script += '    }\n';
    script += '    \n';
    script += '    if (!prop) {\n';
    script += '      results.push({success: false, error: "Property " + propName + " not found on layer " + kf.layerIndex});\n';
    script += '      continue;\n';
    script += '    }\n';
    script += '    \n';
    script += '    // Fix zero scale values\n';
    script += '    var value = kf.value;\n';
    script += '    if (propName === "Scale" && value instanceof Array) {\n';
    script += '      for (var j = 0; j < value.length; j++) {\n';
    script += '        if (value[j] === 0) value[j] = 0.1;\n';
    script += '      }\n';
    script += '    }\n';
    script += '    \n';
    script += '    prop.setValueAtTime(kf.time, value);\n';
    script += '    results.push({success: true, layer: kf.layerIndex, property: propName, time: kf.time});\n';
    script += '    \n';
    script += '  } catch (e) {\n';
    script += '    results.push({success: false, error: e.toString(), layer: kf.layerIndex});\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'var successCount = 0;\n';
    script += 'for (var i = 0; i < results.length; i++) {\n';
    script += '  if (results[i].success) successCount++;\n';
    script += '}\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.total = keyframes.length;\n';
    script += 'result.data.successful = successCount;\n';
    script += 'result.data.results = results;\n';
    script += 'return result;';
    
    return script;
  }
};