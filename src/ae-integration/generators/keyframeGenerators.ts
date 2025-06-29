import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

export const keyframeGenerators: ScriptGeneratorModule = {
  setKeyframeAdvanced: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    time: number;
    value: any;
    interpolation?: {
      temporalEase?: string;
      spatialInterpolation?: string;
      customEase?: {
        easeIn?: { speed: number; influence: number };
        easeOut?: { speed: number; influence: number };
      };
    };
  }) => {
    // Build the script with proper ES3 compatibility
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Position");\n';
    script += '  } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Scale");\n';
    script += '  } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Rotate Z");\n';
    script += '  } else if (part === "Opacity" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Opacity");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    // Set keyframe
    script += '// Set keyframe\n';
    if (Array.isArray(params.value)) {
      script += 'var value = [' + params.value.join(',') + '];\n';
    } else {
      script += 'var value = ' + params.value + ';\n';
    }
    script += 'prop.setValueAtTime(' + params.time + ', value);\n\n';
    
    script += '// Get the keyframe index\n';
    script += 'var keyIndex = prop.nearestKeyIndex(' + params.time + ');\n\n';
    
    if (params.interpolation) {
      script += 'var interpolation = ' + JSON.stringify(params.interpolation) + ';\n\n';
      
      // Set temporal interpolation
      if (params.interpolation.temporalEase) {
        script += '// Set temporal interpolation\n';
        script += 'var easeType = "' + params.interpolation.temporalEase + '";\n';
        script += 'var easeIn, easeOut;\n\n';
        
        script += 'switch(easeType) {\n';
        script += '  case "linear":\n';
        script += '    easeIn = easeOut = new KeyframeEase(0, 0.1);\n';
        script += '    break;\n';
        script += '  case "easeIn":\n';
        script += '    easeIn = new KeyframeEase(0, 33.333);\n';
        script += '    easeOut = new KeyframeEase(0, 0.1);\n';
        script += '    break;\n';
        script += '  case "easeOut":\n';
        script += '    easeIn = new KeyframeEase(0, 0.1);\n';
        script += '    easeOut = new KeyframeEase(0, 33.333);\n';
        script += '    break;\n';
        script += '  case "easeInOut":\n';
        script += '    easeIn = easeOut = new KeyframeEase(0, 33.333);\n';
        script += '    break;\n';
        script += '  case "hold":\n';
        script += '    prop.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.HOLD);\n';
        script += '    break;\n';
        script += '  case "custom":\n';
        if (params.interpolation.customEase) {
          script += '    var customEase = interpolation.customEase;\n';
          script += '    if (customEase.easeIn) {\n';
          script += '      easeIn = new KeyframeEase(customEase.easeIn.speed, customEase.easeIn.influence);\n';
          script += '    }\n';
          script += '    if (customEase.easeOut) {\n';
          script += '      easeOut = new KeyframeEase(customEase.easeOut.speed, customEase.easeOut.influence);\n';
          script += '    }\n';
        }
        script += '    break;\n';
        script += '}\n\n';
        
        script += 'if (easeType !== "hold" && easeIn && easeOut) {\n';
        script += '  try {\n';
        script += '    // Check if property has separated dimensions\n';
        script += '    if (prop.dimensionsSeparated) {\n';
        script += '      prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);\n';
        script += '    } else {\n';
        script += '      // Determine number of dimensions\n';
        script += '      var numDimensions = 1;\n';
        script += '      try {\n';
        script += '        var keyValue = prop.keyValue(keyIndex);\n';
        script += '        if (typeof keyValue === "object" && keyValue.length) {\n';
        script += '          numDimensions = keyValue.length;\n';
        script += '        }\n';
        script += '      } catch (e) {\n';
        script += '        // Fallback to property type checking\n';
        script += '        if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.TwoD) {\n';
        script += '          numDimensions = 2;\n';
        script += '        } else if (prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD) {\n';
        script += '          numDimensions = 3;\n';
        script += '        }\n';
        script += '      }\n';
        script += '      \n';
        script += '      // Apply ease based on dimensions\n';
        script += '      if (numDimensions === 1) {\n';
        script += '        prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);\n';
        script += '      } else if (numDimensions === 2) {\n';
        script += '        prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn], [easeOut, easeOut]);\n';
        script += '      } else if (numDimensions === 3) {\n';
        script += '        prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn, easeIn], [easeOut, easeOut, easeOut]);\n';
        script += '      }\n';
        script += '    }\n';
        script += '  } catch (e) {\n';
        script += '    // If standard approach fails, try fallback\n';
        script += '    try {\n';
        script += '      prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);\n';
        script += '    } catch (e2) {\n';
        script += '      try {\n';
        script += '        prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn], [easeOut, easeOut]);\n';
        script += '      } catch (e3) {\n';
        script += '        prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn, easeIn], [easeOut, easeOut, easeOut]);\n';
        script += '      }\n';
        script += '    }\n';
        script += '  }\n';
        script += '}\n\n';
      }
      
      // Set spatial interpolation for position properties
      if (params.interpolation.spatialInterpolation) {
        script += '// Set spatial interpolation for position properties\n';
        script += 'if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {\n';
        script += '  var spatialType = "' + params.interpolation.spatialInterpolation + '";\n';
        script += '  \n';
        script += '  switch(spatialType) {\n';
        script += '    case "linear":\n';
        script += '      prop.setSpatialTangentsAtKey(keyIndex, [0, 0], [0, 0]);\n';
        script += '      break;\n';
        script += '    case "bezier":\n';
        script += '      prop.setSpatialAutoBezierAtKey(keyIndex, true);\n';
        script += '      break;\n';
        script += '    case "auto":\n';
        script += '      prop.setSpatialContinuousAtKey(keyIndex, true);\n';
        script += '      prop.setSpatialAutoBezierAtKey(keyIndex, true);\n';
        script += '      break;\n';
        script += '  }\n';
        script += '}\n\n';
      }
    }
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.property = "' + helpers.escapeString(params.propertyPath) + '";\n';
    script += 'result.data.time = ' + params.time + ';\n';
    script += 'result.data.value = value;\n';
    script += 'result.data.keyIndex = keyIndex;\n';
    script += 'return result;';
    
    return script;
  },

  applyEasyEase: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    keyframeIndices?: number[];
    easeType?: string;
  }) => {
    // Build the script with proper ES3 compatibility
    let script = '';
    script += '// Apply Easy Ease to keyframes\n';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found with ID: ' + params.compId + '");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found at index: ' + params.layerIndex + '");\n';
    script += '}\n\n';
    
    script += '// Get property using proper After Effects property access\n';
    script += 'var prop = null;\n';
    script += 'var propertyPath = "' + helpers.escapeString(params.propertyPath) + '";\n';
    script += 'var layerNameSafe = layer.name;\n';
    script += 'var layerInfo = "Layer: " + layerNameSafe + " [" + layer.index + "]";\n\n';
    
    script += '// Navigate property path\n';
    script += 'var pathParts = propertyPath.split(".");\n';
    script += 'prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Position");\n';
    script += '  } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Scale");\n';
    script += '  } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Rotate Z");\n';
    script += '  } else if (part === "Opacity") {\n';
    script += '    // Opacity is at layer level, not under Transform\n';
    script += '    if (prop === layer || (i > 0 && pathParts[i-1] === "Transform")) {\n';
    script += '      prop = layer.property("ADBE Opacity");\n';
    script += '    } else {\n';
    script += '      prop = prop.property("ADBE Opacity");\n';
    script += '    }\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'if (!prop) {\n';
    script += '  throw new Error("Property not found: " + propertyPath);\n';
    script += '}\n\n';
    
    script += '// Check if property can have keyframes\n';
    script += 'if (!prop.canSetExpression) {\n';
    script += '  throw new Error("Property cannot be animated: " + propertyPath);\n';
    script += '}\n\n';
    
    script += '// Check if property has keyframes\n';
    script += 'if (prop.numKeys === 0) {\n';
    script += '  var errorMsg = "Property \\\\\\"" + propertyPath + "\\\\\\" has no keyframes. ";\n';
    script += '  errorMsg += layerInfo + ". ";\n';
    script += '  errorMsg += "Please add keyframes using set_keyframe before applying easing.";\n';
    script += '  throw new Error(errorMsg);\n';
    script += '}\n\n';
    
    script += 'var keyIndices = ' + (params.keyframeIndices ? JSON.stringify(params.keyframeIndices) : 'null') + ';\n';
    script += 'var easeType = "' + (params.easeType || 'ease') + '";\n\n';
    
    script += '// If no specific keys, apply to all\n';
    script += 'if (!keyIndices) {\n';
    script += '  keyIndices = [];\n';
    script += '  for (var i = 1; i <= prop.numKeys; i++) {\n';
    script += '    keyIndices.push(i);\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += '// Define ease values\n';
    script += 'var easeIn, easeOut;\n';
    script += 'switch(easeType) {\n';
    script += '  case "easeIn":\n';
    script += '    easeIn = new KeyframeEase(0, 33.333);\n';
    script += '    easeOut = new KeyframeEase(0, 0.1);\n';
    script += '    break;\n';
    script += '  case "easeOut":\n';
    script += '    easeIn = new KeyframeEase(0, 0.1);\n';
    script += '    easeOut = new KeyframeEase(0, 33.333);\n';
    script += '    break;\n';
    script += '  case "ease":\n';
    script += '  default:\n';
    script += '    easeIn = easeOut = new KeyframeEase(0, 33.333);\n';
    script += '    break;\n';
    script += '}\n\n';
    
    script += 'var modifiedCount = 0;\n\n';
    
    script += '// Apply to each keyframe\n';
    script += 'for (var i = 0; i < keyIndices.length; i++) {\n';
    script += '  var keyIndex = keyIndices[i];\n';
    script += '  if (keyIndex > 0 && keyIndex <= prop.numKeys) {\n';
    script += '    try {\n';
    script += '      // Check if property has separated dimensions\n';
    script += '      if (prop.dimensionsSeparated) {\n';
    script += '        // For separated dimensions, apply ease with single value\n';
    script += '        prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);\n';
    script += '      } else {\n';
    script += '        // Try to determine the number of dimensions\n';
    script += '        var numDimensions = 1;\n';
    script += '        \n';
    script += '        // Try to get the key value to determine dimensions\n';
    script += '        try {\n';
    script += '          var keyValue = prop.keyValue(keyIndex);\n';
    script += '          if (typeof keyValue === "object" && keyValue.length) {\n';
    script += '            numDimensions = keyValue.length;\n';
    script += '          }\n';
    script += '        } catch (e) {\n';
    script += '          // If we cannot get key value, try to infer from property type\n';
    script += '          if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.TwoD) {\n';
    script += '            numDimensions = 2;\n';
    script += '          } else if (prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD) {\n';
    script += '            numDimensions = 3;\n';
    script += '          }\n';
    script += '        }\n';
    script += '        \n';
    script += '        // Apply ease based on dimensions\n';
    script += '        if (numDimensions === 1) {\n';
    script += '          prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);\n';
    script += '        } else if (numDimensions === 2) {\n';
    script += '          prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn], [easeOut, easeOut]);\n';
    script += '        } else if (numDimensions === 3) {\n';
    script += '          prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn, easeIn], [easeOut, easeOut, easeOut]);\n';
    script += '        } else {\n';
    script += '          // Fallback - try single dimension\n';
    script += '          prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);\n';
    script += '        }\n';
    script += '      }\n';
    script += '      modifiedCount++;\n';
    script += '    } catch (e) {\n';
    script += '      // If the standard approach fails, try a fallback approach\n';
    script += '      try {\n';
    script += '        // Try single ease value (for separated dimensions)\n';
    script += '        prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);\n';
    script += '        modifiedCount++;\n';
    script += '      } catch (e2) {\n';
    script += '        try {\n';
    script += '          // Try two ease values (for 2D properties)\n';
    script += '          prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn], [easeOut, easeOut]);\n';
    script += '          modifiedCount++;\n';
    script += '        } catch (e3) {\n';
    script += '          try {\n';
    script += '            // Try three ease values (for 3D properties)\n';
    script += '            prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn, easeIn], [easeOut, easeOut, easeOut]);\n';
    script += '            modifiedCount++;\n';
    script += '          } catch (e4) {\n';
    script += '            var errorDetail = "Failed to set ease on keyframe " + keyIndex + " of " + prop.numKeys + ": " + e4.toString();\n';
    script += '            errorDetail += " | Property: " + propertyPath;\n';
    script += '            errorDetail += " | Layer: " + layer.name;\n';
    script += '            errorDetail += " | Ease Type: " + easeType;\n';
    script += '            throw new Error(errorDetail);\n';
    script += '          }\n';
    script += '        }\n';
    script += '      }\n';
    script += '    }\n';
    script += '  } else {\n';
    script += '    // Skip invalid keyframe index\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'if (modifiedCount === 0) {\n';
    script += '  throw new Error("No keyframes were modified. Check keyframe indices.");\n';
    script += '}\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.property = "' + helpers.escapeString(params.propertyPath) + '";\n';
    script += 'result.data.layerName = layer.name;\n';
    script += 'result.data.layerIndex = layer.index;\n';
    script += 'result.data.keyframesModified = modifiedCount;\n';
    script += 'result.data.totalKeyframes = prop.numKeys;\n';
    script += 'result.data.easeType = easeType;\n';
    script += 'result.data.propertyType = prop.propertyValueType;\n';
    script += 'result.data.appliedIndices = keyIndices;\n';
    script += 'return result;';
    
    return script;
  },

  setKeyframeVelocity: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    keyframeIndex: number;
    incomingVelocity?: number;
    outgoingVelocity?: number;
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
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Position");\n';
    script += '  } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Scale");\n';
    script += '  } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Rotate Z");\n';
    script += '  } else if (part === "Opacity" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Opacity");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'var keyIndex = ' + params.keyframeIndex + ';\n';
    script += 'if (keyIndex < 1 || keyIndex > prop.numKeys) {\n';
    script += '  throw new Error("Invalid keyframe index. Property has " + prop.numKeys + " keyframes");\n';
    script += '}\n\n';
    
    script += '// Get current ease values\n';
    script += 'var currentInEase = prop.keyInTemporalEase(keyIndex);\n';
    script += 'var currentOutEase = prop.keyOutTemporalEase(keyIndex);\n\n';
    
    script += '// Update velocities\n';
    if (params.incomingVelocity !== undefined) {
      script += 'for (var i = 0; i < currentInEase.length; i++) {\n';
      script += '  currentInEase[i].speed = ' + params.incomingVelocity + ';\n';
      script += '}\n\n';
    }
    
    if (params.outgoingVelocity !== undefined) {
      script += 'for (var i = 0; i < currentOutEase.length; i++) {\n';
      script += '  currentOutEase[i].speed = ' + params.outgoingVelocity + ';\n';
      script += '}\n\n';
    }
    
    script += '// Apply updated ease\n';
    script += 'prop.setTemporalEaseAtKey(keyIndex, currentInEase, currentOutEase);\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.property = "' + helpers.escapeString(params.propertyPath) + '";\n';
    script += 'result.data.keyframeIndex = keyIndex;\n';
    script += 'result.data.incomingVelocity = ' + (params.incomingVelocity !== undefined ? params.incomingVelocity : 'currentInEase[0].speed') + ';\n';
    script += 'result.data.outgoingVelocity = ' + (params.outgoingVelocity !== undefined ? params.outgoingVelocity : 'currentOutEase[0].speed') + ';\n';
    script += 'return result;';
    
    return script;
  },

  setTemporalEase: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    keyframeIndex: number;
    easeIn?: Array<{ speed: number; influence: number }>;
    easeOut?: Array<{ speed: number; influence: number }>;
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
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Position");\n';
    script += '  } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Scale");\n';
    script += '  } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Rotate Z");\n';
    script += '  } else if (part === "Opacity" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Opacity");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'var keyIndex = ' + params.keyframeIndex + ';\n';
    script += 'if (keyIndex < 1 || keyIndex > prop.numKeys) {\n';
    script += '  throw new Error("Invalid keyframe index. Property has " + prop.numKeys + " keyframes");\n';
    script += '}\n\n';
    
    script += 'var inEase = [];\n';
    script += 'var outEase = [];\n\n';
    
    if (params.easeIn) {
      script += 'var easeInData = ' + JSON.stringify(params.easeIn) + ';\n';
      script += 'for (var i = 0; i < easeInData.length; i++) {\n';
      script += '  inEase.push(new KeyframeEase(easeInData[i].speed, easeInData[i].influence));\n';
      script += '}\n\n';
    } else {
      script += 'inEase = prop.keyInTemporalEase(keyIndex);\n\n';
    }
    
    if (params.easeOut) {
      script += 'var easeOutData = ' + JSON.stringify(params.easeOut) + ';\n';
      script += 'for (var i = 0; i < easeOutData.length; i++) {\n';
      script += '  outEase.push(new KeyframeEase(easeOutData[i].speed, easeOutData[i].influence));\n';
      script += '}\n\n';
    } else {
      script += 'outEase = prop.keyOutTemporalEase(keyIndex);\n\n';
    }
    
    script += '// Apply temporal ease with proper dimension handling\n';
    script += 'try {\n';
    script += '  prop.setTemporalEaseAtKey(keyIndex, inEase, outEase);\n';
    script += '} catch (e) {\n';
    script += '  // If the provided ease arrays don\'t match the property dimensions,\n';
    script += '  // we need to adjust them\n';
    script += '  var numDimensions = 1;\n';
    script += '  \n';
    script += '  // Check if property has separated dimensions\n';
    script += '  if (prop.dimensionsSeparated) {\n';
    script += '    // For separated dimensions, we need single ease values\n';
    script += '    if (inEase.length > 1 || outEase.length > 1) {\n';
    script += '      prop.setTemporalEaseAtKey(keyIndex, [inEase[0]], [outEase[0]]);\n';
    script += '    } else {\n';
    script += '      throw e;\n';
    script += '    }\n';
    script += '  } else {\n';
    script += '    // Try to determine the correct number of dimensions\n';
    script += '    try {\n';
    script += '      var keyValue = prop.keyValue(keyIndex);\n';
    script += '      if (typeof keyValue === "object" && keyValue.length) {\n';
    script += '        numDimensions = keyValue.length;\n';
    script += '      }\n';
    script += '    } catch (e2) {\n';
    script += '      // Check property type\n';
    script += '      if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.TwoD) {\n';
    script += '        numDimensions = 2;\n';
    script += '      } else if (prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD) {\n';
    script += '        numDimensions = 3;\n';
    script += '      }\n';
    script += '    }\n';
    script += '    \n';
    script += '    // Adjust ease arrays to match dimensions\n';
    script += '    var adjustedInEase = [];\n';
    script += '    var adjustedOutEase = [];\n';
    script += '    \n';
    script += '    for (var i = 0; i < numDimensions; i++) {\n';
    script += '      adjustedInEase.push(inEase[Math.min(i, inEase.length - 1)]);\n';
    script += '      adjustedOutEase.push(outEase[Math.min(i, outEase.length - 1)]);\n';
    script += '    }\n';
    script += '    \n';
    script += '    prop.setTemporalEaseAtKey(keyIndex, adjustedInEase, adjustedOutEase);\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.property = "' + helpers.escapeString(params.propertyPath) + '";\n';
    script += 'result.data.keyframeIndex = keyIndex;\n';
    script += 'return result;';
    
    return script;
  },

  setSpatialTangent: (params: {
    compId: number;
    layerIndex: number;
    keyframeIndex: number;
    inTangent?: number[];
    outTangent?: number[];
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
    
    script += 'var prop = layer.property("Position");\n';
    script += 'if (!prop) {\n';
    script += '  throw new Error("Position property not found");\n';
    script += '}\n\n';
    
    script += 'var keyIndex = ' + params.keyframeIndex + ';\n';
    script += 'if (keyIndex < 1 || keyIndex > prop.numKeys) {\n';
    script += '  throw new Error("Invalid keyframe index");\n';
    script += '}\n\n';
    
    if (params.inTangent) {
      script += 'var inTangent = [' + params.inTangent.join(',') + '];\n';
    } else {
      script += 'var inTangent = prop.keyInSpatialTangent(keyIndex);\n';
    }
    
    if (params.outTangent) {
      script += 'var outTangent = [' + params.outTangent.join(',') + '];\n\n';
    } else {
      script += 'var outTangent = prop.keyOutSpatialTangent(keyIndex);\n\n';
    }
    
    script += 'prop.setSpatialTangentsAtKey(keyIndex, inTangent, outTangent);\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.layerName = layer.name;\n';
    script += 'result.data.keyframeIndex = keyIndex;\n';
    script += 'return result;';
    
    return script;
  },

  setKeyframeInterpolationType: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    keyframeIndex: number;
    inType?: string;
    outType?: string;
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
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Position");\n';
    script += '  } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Scale");\n';
    script += '  } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Rotate Z");\n';
    script += '  } else if (part === "Opacity" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Opacity");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'var keyIndex = ' + params.keyframeIndex + ';\n';
    script += 'if (keyIndex < 1 || keyIndex > prop.numKeys) {\n';
    script += '  throw new Error("Invalid keyframe index. Property has " + prop.numKeys + " keyframes");\n';
    script += '}\n\n';
    
    script += 'var typeMap = {\n';
    script += '  "linear": KeyframeInterpolationType.LINEAR,\n';
    script += '  "bezier": KeyframeInterpolationType.BEZIER,\n';
    script += '  "hold": KeyframeInterpolationType.HOLD,\n';
    script += '  "auto": KeyframeInterpolationType.BEZIER // Auto becomes bezier\n';
    script += '};\n\n';
    
    if (params.inType) {
      script += 'var inType = typeMap["' + params.inType + '"];\n';
      script += 'if (inType === undefined) {\n';
      script += '  throw new Error("Invalid interpolation type: ' + params.inType + '");\n';
      script += '}\n\n';
    } else {
      script += 'var inType = prop.keyInInterpolationType(keyIndex);\n\n';
    }
    
    if (params.outType) {
      script += 'var outType = typeMap["' + params.outType + '"];\n';
      script += 'if (outType === undefined) {\n';
      script += '  throw new Error("Invalid interpolation type: ' + params.outType + '");\n';
      script += '}\n\n';
    } else {
      script += 'var outType = prop.keyOutInterpolationType(keyIndex);\n\n';
    }
    
    script += 'prop.setInterpolationTypeAtKey(keyIndex, inType, outType);\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.property = "' + helpers.escapeString(params.propertyPath) + '";\n';
    script += 'result.data.keyframeIndex = keyIndex;\n';
    script += 'result.data.inType = "' + (params.inType || 'unchanged') + '";\n';
    script += 'result.data.outType = "' + (params.outType || 'unchanged') + '";\n';
    script += 'return result;';
    
    return script;
  },

  createAnimationCurve: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    keyframes: Array<{
      time: number;
      value: any;
      easeIn?: { speed: number; influence: number };
      easeOut?: { speed: number; influence: number };
    }>;
    clearExisting?: boolean;
  }) => {
    // Build the script with proper ES3 compatibility
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Position");\n';
    script += '  } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Scale");\n';
    script += '  } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Rotate Z");\n';
    script += '  } else if (part === "Opacity" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Opacity");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    // Clear existing keyframes if requested
    if (params.clearExisting !== false) {
      script += '// Clear existing keyframes\n';
      script += 'while (prop.numKeys > 0) {\n';
      script += '  prop.removeKey(1);\n';
      script += '}\n\n';
    }
    
    script += '// Add keyframes\n';
    script += 'var keyframes = ' + JSON.stringify(params.keyframes) + ';\n\n';
    
    script += 'for (var i = 0; i < keyframes.length; i++) {\n';
    script += '  var kf = keyframes[i];\n';
    script += '  var value = kf.value;\n';
    script += '  \n';
    script += '  // Handle array values\n';
    script += '  if (typeof value === "object" && value.length) {\n';
    script += '    prop.setValueAtTime(kf.time, value);\n';
    script += '  } else {\n';
    script += '    prop.setValueAtTime(kf.time, value);\n';
    script += '  }\n';
    script += '  \n';
    script += '  // Get the key index\n';
    script += '  var keyIndex = prop.nearestKeyIndex(kf.time);\n';
    script += '  \n';
    script += '  // Apply easing if specified\n';
    script += '  if (kf.easeIn || kf.easeOut) {\n';
    script += '    var inEase, outEase;\n';
    script += '    \n';
    script += '    if (kf.easeIn) {\n';
    script += '      inEase = new KeyframeEase(kf.easeIn.speed, kf.easeIn.influence);\n';
    script += '    } else {\n';
    script += '      inEase = new KeyframeEase(0, 33.333);\n';
    script += '    }\n';
    script += '    \n';
    script += '    if (kf.easeOut) {\n';
    script += '      outEase = new KeyframeEase(kf.easeOut.speed, kf.easeOut.influence);\n';
    script += '    } else {\n';
    script += '      outEase = new KeyframeEase(0, 33.333);\n';
    script += '    }\n';
    script += '    \n';
    script += '    // Apply appropriate number of ease values based on property type\n';
    script += '    try {\n';
    script += '      // Check if property has separated dimensions\n';
    script += '      if (prop.dimensionsSeparated) {\n';
    script += '        prop.setTemporalEaseAtKey(keyIndex, [inEase], [outEase]);\n';
    script += '      } else {\n';
    script += '        // Determine number of dimensions from the value we just set\n';
    script += '        var numDimensions = 1;\n';
    script += '        if (typeof value === "object" && value.length) {\n';
    script += '          numDimensions = value.length;\n';
    script += '        } else {\n';
    script += '          // Fallback to property type checking\n';
    script += '          if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.TwoD) {\n';
    script += '            numDimensions = 2;\n';
    script += '          } else if (prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD) {\n';
    script += '            numDimensions = 3;\n';
    script += '          }\n';
    script += '        }\n';
    script += '        \n';
    script += '        if (numDimensions === 1) {\n';
    script += '          prop.setTemporalEaseAtKey(keyIndex, [inEase], [outEase]);\n';
    script += '        } else if (numDimensions === 2) {\n';
    script += '          prop.setTemporalEaseAtKey(keyIndex, [inEase, inEase], [outEase, outEase]);\n';
    script += '        } else if (numDimensions === 3) {\n';
    script += '          prop.setTemporalEaseAtKey(keyIndex, [inEase, inEase, inEase], [outEase, outEase, outEase]);\n';
    script += '        }\n';
    script += '      }\n';
    script += '    } catch (e) {\n';
    script += '      // Fallback approach - try different dimensions\n';
    script += '      try {\n';
    script += '        prop.setTemporalEaseAtKey(keyIndex, [inEase], [outEase]);\n';
    script += '      } catch (e2) {\n';
    script += '        try {\n';
    script += '          prop.setTemporalEaseAtKey(keyIndex, [inEase, inEase], [outEase, outEase]);\n';
    script += '        } catch (e3) {\n';
    script += '          prop.setTemporalEaseAtKey(keyIndex, [inEase, inEase, inEase], [outEase, outEase, outEase]);\n';
    script += '        }\n';
    script += '      }\n';
    script += '    }\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.property = "' + helpers.escapeString(params.propertyPath) + '";\n';
    script += 'result.data.keyframesSet = keyframes.length;\n';
    script += 'result.data.firstTime = keyframes[0].time;\n';
    script += 'result.data.lastTime = keyframes[keyframes.length - 1].time;\n';
    script += 'return result;';
    
    return script;
  },

  copyKeyframes: (params: {
    compId: number;
    sourceLayer: number;
    sourceProperty: string;
    targetLayer: number;
    targetProperty: string;
    timeOffset?: number;
    reverseKeyframes?: boolean;
  }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var sourceLayer = comp.layer(' + params.sourceLayer + ');\n';
    script += 'var targetLayer = comp.layer(' + params.targetLayer + ');\n\n';
    
    script += 'if (!sourceLayer) throw new Error("Source layer not found");\n';
    script += 'if (!targetLayer) throw new Error("Target layer not found");\n\n';
    
    script += '// Get source property\n';
    script += 'var sourceProp = sourceLayer.property("' + helpers.escapeString(params.sourceProperty) + '");\n';
    script += 'if (!sourceProp) {\n';
    script += '  sourceProp = sourceLayer.property("Transform").property("' + helpers.escapeString(params.sourceProperty) + '");\n';
    script += '}\n';
    script += 'if (!sourceProp) throw new Error("Source property not found");\n\n';
    
    script += '// Get target property\n';
    script += 'var targetProp = targetLayer.property("' + helpers.escapeString(params.targetProperty) + '");\n';
    script += 'if (!targetProp) {\n';
    script += '  targetProp = targetLayer.property("Transform").property("' + helpers.escapeString(params.targetProperty) + '");\n';
    script += '}\n';
    script += 'if (!targetProp) throw new Error("Target property not found");\n\n';
    
    script += 'var timeOffset = ' + (params.timeOffset || 0) + ';\n\n';
    
    script += '// Clear target keyframes\n';
    script += 'while (targetProp.numKeys > 0) {\n';
    script += '  targetProp.removeKey(1);\n';
    script += '}\n\n';
    
    script += '// Copy keyframes\n';
    script += 'var keyframeTimes = [];\n';
    script += 'var keyframeValues = [];\n';
    script += 'var keyframeInEases = [];\n';
    script += 'var keyframeOutEases = [];\n\n';
    
    script += 'for (var i = 1; i <= sourceProp.numKeys; i++) {\n';
    script += '  keyframeTimes.push(sourceProp.keyTime(i));\n';
    script += '  keyframeValues.push(sourceProp.keyValue(i));\n';
    script += '  keyframeInEases.push(sourceProp.keyInTemporalEase(i));\n';
    script += '  keyframeOutEases.push(sourceProp.keyOutTemporalEase(i));\n';
    script += '}\n\n';
    
    // Reverse if requested
    if (params.reverseKeyframes) {
      script += '// Reverse if requested\n';
      script += 'keyframeValues.reverse();\n';
      script += 'keyframeInEases.reverse();\n';
      script += 'keyframeOutEases.reverse();\n\n';
      script += '// Swap in/out eases when reversing\n';
      script += 'var temp = keyframeInEases;\n';
      script += 'keyframeInEases = keyframeOutEases;\n';
      script += 'keyframeOutEases = temp;\n\n';
    }
    
    script += '// Apply to target\n';
    script += 'for (var i = 0; i < keyframeTimes.length; i++) {\n';
    script += '  targetProp.setValueAtTime(keyframeTimes[i] + timeOffset, keyframeValues[i]);\n';
    script += '  var keyIndex = targetProp.nearestKeyIndex(keyframeTimes[i] + timeOffset);\n';
    script += '  targetProp.setTemporalEaseAtKey(keyIndex, keyframeInEases[i], keyframeOutEases[i]);\n';
    script += '}\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.sourceLayer = sourceLayer.name;\n';
    script += 'result.data.targetLayer = targetLayer.name;\n';
    script += 'result.data.keyframesCopied = keyframeTimes.length;\n';
    script += 'result.data.timeOffset = timeOffset;\n';
    script += 'result.data.reversed = ' + (params.reverseKeyframes ? 'true' : 'false') + ';\n';
    script += 'return result;';
    
    return script;
  },

  offsetKeyframes: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    offset: number;
    keyframeIndices?: number[];
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
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Position");\n';
    script += '  } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Scale");\n';
    script += '  } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Rotate Z");\n';
    script += '  } else if (part === "Opacity" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Opacity");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'var offset = ' + params.offset + ';\n';
    script += 'var keyIndices = ' + (params.keyframeIndices ? JSON.stringify(params.keyframeIndices) : 'null') + ';\n\n';
    
    script += '// Store keyframe data\n';
    script += 'var keyframeData = [];\n\n';
    
    script += 'if (keyIndices) {\n';
    script += '  // Specific keyframes\n';
    script += '  for (var i = 0; i < keyIndices.length; i++) {\n';
    script += '    var keyIndex = keyIndices[i];\n';
    script += '    if (keyIndex > 0 && keyIndex <= prop.numKeys) {\n';
    script += '      var kfData = {};\n';
    script += '      kfData.time = prop.keyTime(keyIndex);\n';
    script += '      kfData.value = prop.keyValue(keyIndex);\n';
    script += '      kfData.inEase = prop.keyInTemporalEase(keyIndex);\n';
    script += '      kfData.outEase = prop.keyOutTemporalEase(keyIndex);\n';
    script += '      keyframeData.push(kfData);\n';
    script += '    }\n';
    script += '  }\n';
    script += '} else {\n';
    script += '  // All keyframes\n';
    script += '  for (var i = 1; i <= prop.numKeys; i++) {\n';
    script += '    var kfData = {};\n';
    script += '    kfData.time = prop.keyTime(i);\n';
    script += '    kfData.value = prop.keyValue(i);\n';
    script += '    kfData.inEase = prop.keyInTemporalEase(i);\n';
    script += '    kfData.outEase = prop.keyOutTemporalEase(i);\n';
    script += '    keyframeData.push(kfData);\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += '// Clear and reapply with offset\n';
    script += 'while (prop.numKeys > 0) {\n';
    script += '  prop.removeKey(1);\n';
    script += '}\n\n';
    
    script += 'for (var i = 0; i < keyframeData.length; i++) {\n';
    script += '  var kf = keyframeData[i];\n';
    script += '  prop.setValueAtTime(kf.time + offset, kf.value);\n';
    script += '  var newKeyIndex = prop.nearestKeyIndex(kf.time + offset);\n';
    script += '  prop.setTemporalEaseAtKey(newKeyIndex, kf.inEase, kf.outEase);\n';
    script += '}\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.property = "' + helpers.escapeString(params.propertyPath) + '";\n';
    script += 'result.data.keyframesOffset = keyframeData.length;\n';
    script += 'result.data.offset = offset;\n';
    script += 'return result;';
    
    return script;
  },

  scaleKeyframeTiming: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    scaleFactor: number;
    anchorTime?: number;
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
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Position");\n';
    script += '  } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Scale");\n';
    script += '  } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Rotate Z");\n';
    script += '  } else if (part === "Opacity" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Opacity");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'var scaleFactor = ' + params.scaleFactor + ';\n';
    script += 'var anchorTime = ' + (params.anchorTime || 0) + ';\n\n';
    
    script += '// Store keyframe data\n';
    script += 'var keyframeData = [];\n';
    script += 'for (var i = 1; i <= prop.numKeys; i++) {\n';
    script += '  var kfData = {};\n';
    script += '  kfData.time = prop.keyTime(i);\n';
    script += '  kfData.value = prop.keyValue(i);\n';
    script += '  kfData.inEase = prop.keyInTemporalEase(i);\n';
    script += '  kfData.outEase = prop.keyOutTemporalEase(i);\n';
    script += '  keyframeData.push(kfData);\n';
    script += '}\n\n';
    
    script += '// Clear and reapply with scaled timing\n';
    script += 'while (prop.numKeys > 0) {\n';
    script += '  prop.removeKey(1);\n';
    script += '}\n\n';
    
    script += 'for (var i = 0; i < keyframeData.length; i++) {\n';
    script += '  var kf = keyframeData[i];\n';
    script += '  var newTime = anchorTime + (kf.time - anchorTime) * scaleFactor;\n';
    script += '  prop.setValueAtTime(newTime, kf.value);\n';
    script += '  var newKeyIndex = prop.nearestKeyIndex(newTime);\n';
    script += '  prop.setTemporalEaseAtKey(newKeyIndex, kf.inEase, kf.outEase);\n';
    script += '}\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.property = "' + helpers.escapeString(params.propertyPath) + '";\n';
    script += 'result.data.keyframesScaled = keyframeData.length;\n';
    script += 'result.data.scaleFactor = scaleFactor;\n';
    script += 'result.data.anchorTime = anchorTime;\n';
    script += 'return result;';
    
    return script;
  },

  reverseKeyframes: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
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
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Position");\n';
    script += '  } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Scale");\n';
    script += '  } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Rotate Z");\n';
    script += '  } else if (part === "Opacity" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Opacity");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'if (prop.numKeys < 2) {\n';
    script += '  throw new Error("Need at least 2 keyframes to reverse");\n';
    script += '}\n\n';
    
    script += '// Store keyframe data\n';
    script += 'var keyframeTimes = [];\n';
    script += 'var keyframeValues = [];\n';
    script += 'var keyframeInEases = [];\n';
    script += 'var keyframeOutEases = [];\n\n';
    
    script += 'for (var i = 1; i <= prop.numKeys; i++) {\n';
    script += '  keyframeTimes.push(prop.keyTime(i));\n';
    script += '  keyframeValues.push(prop.keyValue(i));\n';
    script += '  keyframeInEases.push(prop.keyInTemporalEase(i));\n';
    script += '  keyframeOutEases.push(prop.keyOutTemporalEase(i));\n';
    script += '}\n\n';
    
    script += '// Reverse values and swap eases\n';
    script += 'keyframeValues.reverse();\n\n';
    
    script += 'var reversedInEases = [];\n';
    script += 'var reversedOutEases = [];\n\n';
    
    script += 'for (var i = keyframeOutEases.length - 1; i >= 0; i--) {\n';
    script += '  reversedInEases.push(keyframeOutEases[i]);\n';
    script += '  reversedOutEases.push(keyframeInEases[i]);\n';
    script += '}\n\n';
    
    script += '// Clear and reapply\n';
    script += 'while (prop.numKeys > 0) {\n';
    script += '  prop.removeKey(1);\n';
    script += '}\n\n';
    
    script += 'for (var i = 0; i < keyframeTimes.length; i++) {\n';
    script += '  prop.setValueAtTime(keyframeTimes[i], keyframeValues[i]);\n';
    script += '  var keyIndex = prop.nearestKeyIndex(keyframeTimes[i]);\n';
    script += '  prop.setTemporalEaseAtKey(keyIndex, reversedInEases[i], reversedOutEases[i]);\n';
    script += '}\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.property = "' + helpers.escapeString(params.propertyPath) + '";\n';
    script += 'result.data.keyframesReversed = keyframeTimes.length;\n';
    script += 'return result;';
    
    return script;
  },

  applyAnimationPreset: (params: {
    compId: number;
    layerIndex: number;
    preset: string;
    properties?: string[];
    startTime?: number;
    duration?: number;
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
    
    script += 'var preset = "' + params.preset + '";\n';
    script += 'var startTime = ' + (params.startTime !== undefined ? params.startTime : 'comp.time') + ';\n';
    script += 'var duration = ' + (params.duration || 1) + ';\n';
    script += 'var properties = ' + (params.properties ? JSON.stringify(params.properties) : '["position", "scale", "rotation", "opacity"]') + ';\n\n';
    
    script += '// Apply preset animations\n';
    script += 'switch(preset) {\n';
    
    // fadeIn
    script += '  case "fadeIn":\n';
    script += '    if (properties.indexOf("opacity") !== -1) {\n';
    script += '      var opacity = layer.property("ADBE Opacity");\n';
    script += '      opacity.setValueAtTime(startTime, 0);\n';
    script += '      opacity.setValueAtTime(startTime + duration, 100);\n';
    script += '      // Apply ease\n';
    script += '      opacity.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333)]);\n';
    script += '    }\n';
    script += '    break;\n\n';
    
    // fadeOut
    script += '  case "fadeOut":\n';
    script += '    if (properties.indexOf("opacity") !== -1) {\n';
    script += '      var opacity = layer.property("ADBE Opacity");\n';
    script += '      opacity.setValueAtTime(startTime, 100);\n';
    script += '      opacity.setValueAtTime(startTime + duration, 0);\n';
    script += '      opacity.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333)]);\n';
    script += '    }\n';
    script += '    break;\n\n';
    
    // slideInLeft
    script += '  case "slideInLeft":\n';
    script += '    if (properties.indexOf("position") !== -1) {\n';
    script += '      var position = layer.property("ADBE Transform Group").property("ADBE Position");\n';
    script += '      var currentPos = position.value;\n';
    script += '      position.setValueAtTime(startTime, [currentPos[0] - comp.width, currentPos[1]]);\n';
    script += '      position.setValueAtTime(startTime + duration, currentPos);\n';
    script += '      // Apply ease based on dimensions\n';
    script += '      if (currentPos.length === 2) {\n';
    script += '        position.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)]);\n';
    script += '      } else if (currentPos.length === 3) {\n';
    script += '        position.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)]);\n';
    script += '      }\n';
    script += '    }\n';
    script += '    break;\n\n';
    
    // slideInRight
    script += '  case "slideInRight":\n';
    script += '    if (properties.indexOf("position") !== -1) {\n';
    script += '      var position = layer.property("ADBE Transform Group").property("ADBE Position");\n';
    script += '      var currentPos = position.value;\n';
    script += '      position.setValueAtTime(startTime, [currentPos[0] + comp.width, currentPos[1]]);\n';
    script += '      position.setValueAtTime(startTime + duration, currentPos);\n';
    script += '      // Apply ease based on dimensions\n';
    script += '      if (currentPos.length === 2) {\n';
    script += '        position.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)]);\n';
    script += '      } else if (currentPos.length === 3) {\n';
    script += '        position.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)]);\n';
    script += '      }\n';
    script += '    }\n';
    script += '    break;\n\n';
    
    // slideInTop
    script += '  case "slideInTop":\n';
    script += '    if (properties.indexOf("position") !== -1) {\n';
    script += '      var position = layer.property("ADBE Transform Group").property("ADBE Position");\n';
    script += '      var currentPos = position.value;\n';
    script += '      position.setValueAtTime(startTime, [currentPos[0], currentPos[1] - comp.height]);\n';
    script += '      position.setValueAtTime(startTime + duration, currentPos);\n';
    script += '      // Apply ease based on dimensions\n';
    script += '      if (currentPos.length === 2) {\n';
    script += '        position.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)]);\n';
    script += '      } else if (currentPos.length === 3) {\n';
    script += '        position.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)]);\n';
    script += '      }\n';
    script += '    }\n';
    script += '    break;\n\n';
    
    // slideInBottom
    script += '  case "slideInBottom":\n';
    script += '    if (properties.indexOf("position") !== -1) {\n';
    script += '      var position = layer.property("ADBE Transform Group").property("ADBE Position");\n';
    script += '      var currentPos = position.value;\n';
    script += '      position.setValueAtTime(startTime, [currentPos[0], currentPos[1] + comp.height]);\n';
    script += '      position.setValueAtTime(startTime + duration, currentPos);\n';
    script += '      // Apply ease based on dimensions\n';
    script += '      if (currentPos.length === 2) {\n';
    script += '        position.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)]);\n';
    script += '      } else if (currentPos.length === 3) {\n';
    script += '        position.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)]);\n';
    script += '      }\n';
    script += '    }\n';
    script += '    break;\n\n';
    
    // scaleIn
    script += '  case "scaleIn":\n';
    script += '    if (properties.indexOf("scale") !== -1) {\n';
    script += '      var scale = layer.property("ADBE Transform Group").property("ADBE Scale");\n';
    script += '      scale.setValueAtTime(startTime, [0, 0]);\n';
    script += '      scale.setValueAtTime(startTime + duration, [100, 100]);\n';
    script += '      scale.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)], \n';
    script += '                                     [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)]);\n';
    script += '    }\n';
    script += '    break;\n\n';
    
    // scaleOut
    script += '  case "scaleOut":\n';
    script += '    if (properties.indexOf("scale") !== -1) {\n';
    script += '      var scale = layer.property("ADBE Transform Group").property("ADBE Scale");\n';
    script += '      scale.setValueAtTime(startTime, [100, 100]);\n';
    script += '      scale.setValueAtTime(startTime + duration, [0, 0]);\n';
    script += '      scale.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)], \n';
    script += '                                     [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)]);\n';
    script += '    }\n';
    script += '    break;\n\n';
    
    // rotateIn
    script += '  case "rotateIn":\n';
    script += '    if (properties.indexOf("rotation") !== -1) {\n';
    script += '      var rotation = layer.property("ADBE Transform Group").property("ADBE Rotate Z");\n';
    script += '      rotation.setValueAtTime(startTime, -720);\n';
    script += '      rotation.setValueAtTime(startTime + duration, 0);\n';
    script += '      rotation.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333)]);\n';
    script += '    }\n';
    script += '    if (properties.indexOf("scale") !== -1) {\n';
    script += '      var scale = layer.property("ADBE Transform Group").property("ADBE Scale");\n';
    script += '      scale.setValueAtTime(startTime, [0, 0]);\n';
    script += '      scale.setValueAtTime(startTime + duration, [100, 100]);\n';
    script += '    }\n';
    script += '    break;\n\n';
    
    // bounce
    script += '  case "bounce":\n';
    script += '    if (properties.indexOf("position") !== -1) {\n';
    script += '      // Apply bounce expression\n';
    script += '      var position = layer.property("ADBE Transform Group").property("ADBE Position");\n';
    script += '      var currentPos = position.value;\n';
    script += '      position.setValueAtTime(startTime, [currentPos[0], currentPos[1] - 200]);\n';
    script += '      position.setValueAtTime(startTime + duration, currentPos);\n';
    script += '      \n';
    script += '      // Add bounce expression\n';
    script += '      position.expression = "// Bounce\\\\n" +\n';
    script += '                           "amp = .1;\\\\n" +\n';
    script += '                           "freq = 2.0;\\\\n" +\n';
    script += '                           "decay = 2.0;\\\\n" +\n';
    script += '                           "n = 0;\\\\n" +\n';
    script += '                           "if (numKeys > 0){\\\\n" +\n';
    script += '                           "  n = nearestKey(time).index;\\\\n" +\n';
    script += '                           "  if (key(n).time > time){n--;}\\\\n" +\n';
    script += '                           "}\\\\n" +\n';
    script += '                           "if (n == 0){ t = 0; }\\\\n" +\n';
    script += '                           "else{t = time - key(n).time;}\\\\n" +\n';
    script += '                           "if (n > 0 && t < 1){\\\\n" +\n';
    script += '                           "  v = velocityAtTime(key(n).time - thisComp.frameDuration/10);\\\\n" +\n';
    script += '                           "  value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);\\\\n" +\n';
    script += '                           "}else{value}";\n';
    script += '    }\n';
    script += '    break;\n\n';
    
    // elastic
    script += '  case "elastic":\n';
    script += '    if (properties.indexOf("scale") !== -1) {\n';
    script += '      var scale = layer.property("ADBE Transform Group").property("ADBE Scale");\n';
    script += '      scale.setValueAtTime(startTime, [0, 0]);\n';
    script += '      scale.setValueAtTime(startTime + duration * 0.7, [100, 100]);\n';
    script += '      \n';
    script += '      // Add elastic expression\n';
    script += '      scale.expression = "// Elastic\\\\n" +\n';
    script += '                        "amp = .05;\\\\n" +\n';
    script += '                        "freq = 4.0;\\\\n" +\n';
    script += '                        "decay = 7.0;\\\\n" +\n';
    script += '                        "n = 0;\\\\n" +\n';
    script += '                        "if (numKeys > 0){\\\\n" +\n';
    script += '                        "  n = nearestKey(time).index;\\\\n" +\n';
    script += '                        "  if (key(n).time > time){n--;}\\\\n" +\n';
    script += '                        "}\\\\n" +\n';
    script += '                        "if (n == 0){ t = 0; }\\\\n" +\n';
    script += '                        "else{t = time - key(n).time;}\\\\n" +\n';
    script += '                        "if (n > 0 && t < 1){\\\\n" +\n';
    script += '                        "  v = velocityAtTime(key(n).time - thisComp.frameDuration/10);\\\\n" +\n';
    script += '                        "  value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);\\\\n" +\n';
    script += '                        "}else{value}";\n';
    script += '    }\n';
    script += '    break;\n\n';
    
    // overshoot
    script += '  case "overshoot":\n';
    script += '    if (properties.indexOf("scale") !== -1) {\n';
    script += '      var scale = layer.property("ADBE Transform Group").property("ADBE Scale");\n';
    script += '      scale.setValueAtTime(startTime, [0, 0]);\n';
    script += '      scale.setValueAtTime(startTime + duration * 0.7, [120, 120]);\n';
    script += '      scale.setValueAtTime(startTime + duration, [100, 100]);\n';
    script += '      \n';
    script += '      // Apply custom easing for overshoot\n';
    script += '      scale.setTemporalEaseAtKey(2, [new KeyframeEase(0, 75)], [new KeyframeEase(0, 75)]);\n';
    script += '      scale.setTemporalEaseAtKey(3, [new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333)]);\n';
    script += '    }\n';
    script += '    break;\n';
    script += '}\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.layerName = layer.name;\n';
    script += 'result.data.preset = preset;\n';
    script += 'result.data.startTime = startTime;\n';
    script += 'result.data.duration = duration;\n';
    script += 'result.data.propertiesAnimated = properties;\n';
    script += 'return result;';
    
    return script;
  }
};