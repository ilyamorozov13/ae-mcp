import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';
import { generatorHelpers as gh } from './generatorHelpers.js';

export const effectsAndKeyframeGenerators: ScriptGeneratorModule = {
  applyEffect: (params: {
    compId: number;
    layerIndex: number;
    effectName: string;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += '// Apply the effect\n';
    script += 'var effects = layer.property("Effects");\n';
    script += 'if (!effects) {\n';
    script += '  throw new Error("Cannot access Effects property on layer");\n';
    script += '}\n\n';
    
    script += '// Check if we can add this effect\n';
    script += 'var effectName = "' + helpers.escapeString(params.effectName) + '";\n';
    script += 'var effect = null;\n\n';
    
    script += gh.wrapInTryCatch(
      '  // Try exact name first\n' +
      '  if (effects.canAddProperty(effectName)) {\n' +
      '    effect = effects.addProperty(effectName);\n' +
      '  } else {\n' +
      '    // Try common variations\n' +
      '    var variations = [];\n' +
      '    if (effectName === "Fast Blur") {\n' +
      '      variations = ["Fast Box Blur", "Box Blur", "Gaussian Blur"];\n' +
      '    } else if (effectName === "Glow") {\n' +
      '      variations = ["Glow", "Glow 2.0"];\n' +
      '    }\n' +
      '    \n' +
      '    for (var i = 0; i < variations.length; i++) {\n' +
      '      if (effects.canAddProperty(variations[i])) {\n' +
      '        effect = effects.addProperty(variations[i]);\n' +
      '        effectName = variations[i];\n' +
      '        break;\n' +
      '      }\n' +
      '    }\n' +
      '  }\n',
      '  throw new Error("Error adding effect \\\\\\"" + effectName + "\\\\\\": " + String(e));\n'
    );
    script += '\n';
    
    script += 'if (!effect) {\n';
    script += '  throw new Error("Effect \\\\\\"" + effectName + "\\\\\\" not available. Fast Blur has been replaced with Fast Box Blur in newer versions of After Effects.");\n';
    script += '}\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    effectName: effect.name,\n    effectIndex: effect.propertyIndex\n  }');
    
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
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += '// Get time value - use provided time or current comp time\n';
    if (params.time !== undefined && params.time !== null) {
      script += 'var time = ' + params.time + ';\n\n';
    } else {
      script += 'var time = comp.time;\n\n';
    }
    
    // Use helper for property normalization
    script += 'var propertyName = "' + helpers.escapeString(params.property) + '";\n';
    script += gh.normalizePropertyName('propertyName');
    
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
    script += gh.wrapInTryCatch(
      '      prop = layer.property("ADBE Time Remapping");\n',
      '      try {\n' +
      '        prop = layer.property("ADBE Layer Overrides").property("ADBE Time Remapping");\n' +
      '      } catch (e2) {\n' +
      '        // Search by name as last resort\n' +
      '        var numProps = layer.numProperties;\n' +
      '        for (var i = 1; i <= numProps; i++) {\n' +
      '          var testProp = layer.property(i);\n' +
      '          if (testProp && (testProp.name === "Time Remap" || testProp.matchName === "ADBE Time Remapping")) {\n' +
      '            prop = testProp;\n' +
      '            break;\n' +
      '          }\n' +
      '        }\n' +
      '      }\n'
    );
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
    script += gh.validateArrayValue('value', 'normalizedProperty', 2, 3);
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
    
    script += gh.wrapInTryCatch(
      '  var newKeyIndex = prop.setValueAtTime(time, value);\n' +
      '  \n' +
      '  // Prepare result using ES3 compatible object creation\n' +
      '  var result = {};\n' +
      '  result.property = normalizedProperty;\n' +
      '  result.time = time;\n' +
      '  result.keyIndex = newKeyIndex;\n' +
      '  result.totalKeys = prop.numKeys;\n' +
      '  result.value = value;\n' +
      '  \n' +
      '  ' + gh.generateSuccessReturn('result') + '\n',
      '  throw new Error("Failed to set keyframe: " + String(e));\n'
    );
    
    return script;
  },
  
  batchKeyframes: (params: {
    compId: number;
    keyframes: Array<{
      layerIndex: number;
      property: string;
      time: number;
      value: any;
    }>;
  }) => {
    let script = '';
    
    // Use helper for composition validation
    script += gh.getCompValidation(params.compId);
    
    script += 'var keyframes = ' + JSON.stringify(params.keyframes) + ';\n';
    script += 'var results = [];\n\n';
    
    // Add property normalization helper
    script += gh.normalizePropertyName('"dummy"').split('\n').slice(1, -2).join('\n') + '\n\n';
    
    script += 'for (var i = 0; i < keyframes.length; i++) {\n';
    script += '  var kf = keyframes[i];\n';
    script += '  \n';
    script += '  try {\n';
    script += '    var layer = comp.layer(kf.layerIndex);\n';
    script += '    if (!layer) {\n';
    script += '      throw new Error("Layer " + kf.layerIndex + " not found");\n';
    script += '    }\n';
    script += '    \n';
    script += '    // Use normalized property name\n';
    script += '    var normalizedProperty = propertyMap[kf.property.toLowerCase()] || kf.property;\n';
    script += '    \n';
    script += '    var prop = layer.property(normalizedProperty);\n';
    script += '    if (!prop) {\n';
    script += '      throw new Error("Property " + normalizedProperty + " not found on layer " + kf.layerIndex);\n';
    script += '    }\n';
    script += '    \n';
    script += '    prop.setValueAtTime(kf.time, kf.value);\n';
    script += '    \n';
    script += '    results.push({\n';
    script += '      success: true,\n';
    script += '      layerIndex: kf.layerIndex,\n';
    script += '      property: normalizedProperty,\n';
    script += '      time: kf.time\n';
    script += '    });\n';
    script += '  } catch (e) {\n';
    script += '    results.push({\n';
    script += '      success: false,\n';
    script += '      layerIndex: kf.layerIndex,\n';
    script += '      property: kf.property,\n';
    script += '      error: String(e)\n';
    script += '    });\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'var successCount = 0;\n';
    script += 'for (var i = 0; i < results.length; i++) {\n';
    script += '  if (results[i].success) successCount++;\n';
    script += '}\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    total: keyframes.length,\n    successful: successCount,\n    results: results\n  }');
    
    return script;
  },
  
  animateTimeRemap: (params: {
    compId: number;
    layerIndex: number;
    keyframes: Array<{ time: number; value: number }>;
    clearExisting?: boolean;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += '// Check if layer is an AVLayer (required for time remapping)\n';
    script += gh.validateLayerType('AVLayer', 'Layer does not support time remapping');
    
    script += '// Enable time remapping if not already enabled\n';
    script += 'if (!layer.timeRemapEnabled) {\n';
    script += '  layer.timeRemapEnabled = true;\n';
    script += '}\n\n';
    
    script += '// Get time remap property\n';
    script += 'var timeRemap = layer.property("Time Remap");\n';
    script += 'if (!timeRemap) {\n';
    script += '  throw new Error("Could not access Time Remap property");\n';
    script += '}\n\n';
    
    script += '// Clear existing keyframes if requested\n';
    if (params.clearExisting !== false) {
      script += 'while (timeRemap.numKeys > 0) {\n';
      script += '  timeRemap.removeKey(1);\n';
      script += '}\n\n';
    }
    
    script += '// Add keyframes\n';
    script += 'var keyframes = ' + JSON.stringify(params.keyframes) + ';\n';
    script += 'for (var i = 0; i < keyframes.length; i++) {\n';
    script += '  var kf = keyframes[i];\n';
    script += '  timeRemap.setValueAtTime(kf.time, kf.value);\n';
    script += '}\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    keyframesAdded: keyframes.length,\n    totalKeyframes: timeRemap.numKeys\n  }');
    
    return script;
  }
};