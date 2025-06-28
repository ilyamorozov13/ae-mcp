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
        script += '  if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || \n';
        script += '      prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {\n';
        script += '    prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn], [easeOut, easeOut]);\n';
        script += '  } else if (prop.propertyValueType === PropertyValueType.ThreeD) {\n';
        script += '    prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn, easeIn], [easeOut, easeOut, easeOut]);\n';
        script += '  } else {\n';
        script += '    prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);\n';
        script += '  }\n';
        script += '}\n\n';
      }
      
      // Set spatial interpolation for position properties
      if (params.interpolation.spatialInterpolation) {
        script += '// Set spatial interpolation for position properties\n';
        script += 'if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || \n';
        script += '    prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {\n';
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
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    property: "' + helpers.escapeString(params.propertyPath) + '",\n';
    script += '    time: ' + params.time + ',\n';
    script += '    value: value,\n';
    script += '    keyIndex: keyIndex\n';
    script += '  }\n';
    script += '};';
    
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
    
    script += '// Check if property has keyframes\n';
    script += 'if (prop.numKeys === 0) {\n';
    script += '  throw new Error("Property has no keyframes to apply easing to");\n';
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
    script += '    if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || \n';
    script += '        prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {\n';
    script += '      prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn], [easeOut, easeOut]);\n';
    script += '    } else if (prop.propertyValueType === PropertyValueType.ThreeD) {\n';
    script += '      prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn, easeIn], [easeOut, easeOut, easeOut]);\n';
    script += '    } else {\n';
    script += '      prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);\n';
    script += '    }\n';
    script += '    modifiedCount++;\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    property: "' + helpers.escapeString(params.propertyPath) + '",\n';
    script += '    keyframesModified: modifiedCount,\n';
    script += '    totalKeyframes: prop.numKeys,\n';
    script += '    easeType: easeType,\n';
    script += '    propertyType: prop.propertyValueType\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },

  setKeyframeVelocity: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    keyframeIndex: number;
    incomingVelocity?: number;
    outgoingVelocity?: number;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Position");
      } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Scale");
      } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Rotate Z");
      } else if (part === "Opacity" && prop === layer) {
        prop = prop.property("ADBE Opacity");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    var keyIndex = ${params.keyframeIndex};
    if (keyIndex < 1 || keyIndex > prop.numKeys) {
      throw new Error("Invalid keyframe index. Property has " + prop.numKeys + " keyframes");
    }
    
    // Get current ease values
    var currentInEase = prop.keyInTemporalEase(keyIndex);
    var currentOutEase = prop.keyOutTemporalEase(keyIndex);
    
    // Update velocities
    " + (params.incomingVelocity !== undefined ? 
      "for (var i = 0; i < currentInEase.length; i++) {\n" +
      "  currentInEase[i].speed = " + params.incomingVelocity + ";\n" +
      "}\n" : '') + "
    
    " + (params.outgoingVelocity !== undefined ? 
      "for (var i = 0; i < currentOutEase.length; i++) {\n" +
      "  currentOutEase[i].speed = " + params.outgoingVelocity + ";\n" +
      "}\n" : '') + "
    
    // Apply updated ease
    prop.setTemporalEaseAtKey(keyIndex, currentInEase, currentOutEase);
    
    return {
      success: true,
      data: {
        property: "${helpers.escapeString(params.propertyPath)}",
        keyframeIndex: keyIndex,
        incomingVelocity: \" + (params.incomingVelocity || 'currentInEase[0].speed') + \",
        outgoingVelocity: \" + (params.outgoingVelocity || 'currentOutEase[0].speed') + \"
      }
    };
  `,

  setTemporalEase: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    keyframeIndex: number;
    easeIn?: Array<{ speed: number; influence: number }>;
    easeOut?: Array<{ speed: number; influence: number }>;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Position");
      } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Scale");
      } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Rotate Z");
      } else if (part === "Opacity" && prop === layer) {
        prop = prop.property("ADBE Opacity");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    var keyIndex = ${params.keyframeIndex};
    if (keyIndex < 1 || keyIndex > prop.numKeys) {
      throw new Error("Invalid keyframe index. Property has " + prop.numKeys + " keyframes");
    }
    
    var inEase = [];
    var outEase = [];
    
    " + (params.easeIn ? 
      "var easeInData = " + JSON.stringify(params.easeIn) + ";\n" +
      "for (var i = 0; i < easeInData.length; i++) {\n" +
      "  inEase.push(new KeyframeEase(easeInData[i].speed, easeInData[i].influence));\n" +
      "}\n" : 
      "inEase = prop.keyInTemporalEase(keyIndex);\n") + "
    
    " + (params.easeOut ? 
      "var easeOutData = " + JSON.stringify(params.easeOut) + ";\n" +
      "for (var i = 0; i < easeOutData.length; i++) {\n" +
      "  outEase.push(new KeyframeEase(easeOutData[i].speed, easeOutData[i].influence));\n" +
      "}\n" : 
      "outEase = prop.keyOutTemporalEase(keyIndex);\n") + "
    
    prop.setTemporalEaseAtKey(keyIndex, inEase, outEase);
    
    return {
      success: true,
      data: {
        property: "${helpers.escapeString(params.propertyPath)}",
        keyframeIndex: keyIndex
      }
    };
  `,

  setSpatialTangent: (params: {
    compId: number;
    layerIndex: number;
    keyframeIndex: number;
    inTangent?: number[];
    outTangent?: number[];
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var prop = layer.property("Position");
    if (!prop) {
      throw new Error("Position property not found");
    }
    
    var keyIndex = ${params.keyframeIndex};
    if (keyIndex < 1 || keyIndex > prop.numKeys) {
      throw new Error("Invalid keyframe index");
    }
    
    var inTangent = \" + (params.inTangent ? '[' + params.inTangent.join(',') + ']' : 'prop.keyInSpatialTangent(keyIndex)') + \";
    var outTangent = \" + (params.outTangent ? '[' + params.outTangent.join(',') + ']' : 'prop.keyOutSpatialTangent(keyIndex)') + \";
    
    prop.setSpatialTangentsAtKey(keyIndex, inTangent, outTangent);
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        keyframeIndex: keyIndex
      }
    };
  `,

  setKeyframeInterpolationType: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    keyframeIndex: number;
    inType?: string;
    outType?: string;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Position");
      } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Scale");
      } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Rotate Z");
      } else if (part === "Opacity" && prop === layer) {
        prop = prop.property("ADBE Opacity");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    var keyIndex = ${params.keyframeIndex};
    if (keyIndex < 1 || keyIndex > prop.numKeys) {
      throw new Error("Invalid keyframe index. Property has " + prop.numKeys + " keyframes");
    }
    
    var typeMap = {
      "linear": KeyframeInterpolationType.LINEAR,
      "bezier": KeyframeInterpolationType.BEZIER,
      "hold": KeyframeInterpolationType.HOLD,
      "auto": KeyframeInterpolationType.BEZIER // Auto becomes bezier
    };
    
    " + (params.inType ? 
      "var inType = typeMap[\"" + params.inType + "\"];\n" +
      "if (inType === undefined) {\n" +
      "  throw new Error(\"Invalid interpolation type: " + params.inType + "\");\n" +
      "}\n" : 
      "var inType = prop.keyInInterpolationType(keyIndex);\n") + "
    
    " + (params.outType ? 
      "var outType = typeMap[\"" + params.outType + "\"];\n" +
      "if (outType === undefined) {\n" +
      "  throw new Error(\"Invalid interpolation type: " + params.outType + "\");\n" +
      "}\n" : 
      "var outType = prop.keyOutInterpolationType(keyIndex);\n") + "
    
    prop.setInterpolationTypeAtKey(keyIndex, inType, outType);
    
    return {
      success: true,
      data: {
        property: "${helpers.escapeString(params.propertyPath)}",
        keyframeIndex: keyIndex,
        inType: \"" + (params.inType || 'unchanged') + "\",
        outType: \"" + (params.outType || 'unchanged') + "\""
      }
    };
  `,

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
    script += '    if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || \n';
    script += '        prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {\n';
    script += '      prop.setTemporalEaseAtKey(keyIndex, [inEase, inEase], [outEase, outEase]);\n';
    script += '    } else if (prop.propertyValueType === PropertyValueType.ThreeD) {\n';
    script += '      prop.setTemporalEaseAtKey(keyIndex, [inEase, inEase, inEase], [outEase, outEase, outEase]);\n';
    script += '    } else {\n';
    script += '      prop.setTemporalEaseAtKey(keyIndex, [inEase], [outEase]);\n';
    script += '    }\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    property: "' + helpers.escapeString(params.propertyPath) + '",\n';
    script += '    keyframesSet: keyframes.length,\n';
    script += '    firstTime: keyframes[0].time,\n';
    script += '    lastTime: keyframes[keyframes.length - 1].time\n';
    script += '  }\n';
    script += '};';
    
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
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var sourceLayer = comp.layer(${params.sourceLayer});
    var targetLayer = comp.layer(${params.targetLayer});
    
    if (!sourceLayer) throw new Error("Source layer not found");
    if (!targetLayer) throw new Error("Target layer not found");
    
    // Get source property
    var sourceProp = sourceLayer.property("${helpers.escapeString(params.sourceProperty)}");
    if (!sourceProp) {
      sourceProp = sourceLayer.property("Transform").property("${helpers.escapeString(params.sourceProperty)}");
    }
    if (!sourceProp) throw new Error("Source property not found");
    
    // Get target property
    var targetProp = targetLayer.property("${helpers.escapeString(params.targetProperty)}");
    if (!targetProp) {
      targetProp = targetLayer.property("Transform").property("${helpers.escapeString(params.targetProperty)}");
    }
    if (!targetProp) throw new Error("Target property not found");
    
    var timeOffset = ${params.timeOffset || 0};
    
    // Clear target keyframes
    while (targetProp.numKeys > 0) {
      targetProp.removeKey(1);
    }
    
    // Copy keyframes
    var keyframeTimes = [];
    var keyframeValues = [];
    var keyframeInEases = [];
    var keyframeOutEases = [];
    
    for (var i = 1; i <= sourceProp.numKeys; i++) {
      keyframeTimes.push(sourceProp.keyTime(i));
      keyframeValues.push(sourceProp.keyValue(i));
      keyframeInEases.push(sourceProp.keyInTemporalEase(i));
      keyframeOutEases.push(sourceProp.keyOutTemporalEase(i));
    }
    
    // Reverse if requested
    " + (params.reverseKeyframes ? 
      "keyframeValues.reverse();\n" +
      "keyframeInEases.reverse();\n" +
      "keyframeOutEases.reverse();\n" +
      "\n" +
      "// Swap in/out eases when reversing\n" +
      "var temp = keyframeInEases;\n" +
      "keyframeInEases = keyframeOutEases;\n" +
      "keyframeOutEases = temp;\n" : '') + "
    
    // Apply to target
    for (var i = 0; i < keyframeTimes.length; i++) {
      targetProp.setValueAtTime(keyframeTimes[i] + timeOffset, keyframeValues[i]);
      var keyIndex = targetProp.nearestKeyIndex(keyframeTimes[i] + timeOffset);
      targetProp.setTemporalEaseAtKey(keyIndex, keyframeInEases[i], keyframeOutEases[i]);
    }
    
    return {
      success: true,
      data: {
        sourceLayer: sourceLayer.name,
        targetLayer: targetLayer.name,
        keyframesCopied: keyframeTimes.length,
        timeOffset: timeOffset,
        reversed: " + (params.reverseKeyframes ? 'true' : 'false') + "
      }
    };
  `,

  offsetKeyframes: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    offset: number;
    keyframeIndices?: number[];
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Position");
      } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Scale");
      } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Rotate Z");
      } else if (part === "Opacity" && prop === layer) {
        prop = prop.property("ADBE Opacity");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    var offset = ${params.offset};
    var keyIndices = \" + (params.keyframeIndices ? JSON.stringify(params.keyframeIndices) : 'null') + \";
    
    // Store keyframe data
    var keyframeData = [];
    
    if (keyIndices) {
      // Specific keyframes
      for (var i = 0; i < keyIndices.length; i++) {
        var keyIndex = keyIndices[i];
        if (keyIndex > 0 && keyIndex <= prop.numKeys) {
          keyframeData.push({
            time: prop.keyTime(keyIndex),
            value: prop.keyValue(keyIndex),
            inEase: prop.keyInTemporalEase(keyIndex),
            outEase: prop.keyOutTemporalEase(keyIndex)
          });
        }
      }
    } else {
      // All keyframes
      for (var i = 1; i <= prop.numKeys; i++) {
        keyframeData.push({
          time: prop.keyTime(i),
          value: prop.keyValue(i),
          inEase: prop.keyInTemporalEase(i),
          outEase: prop.keyOutTemporalEase(i)
        });
      }
    }
    
    // Clear and reapply with offset
    while (prop.numKeys > 0) {
      prop.removeKey(1);
    }
    
    for (var i = 0; i < keyframeData.length; i++) {
      var kf = keyframeData[i];
      prop.setValueAtTime(kf.time + offset, kf.value);
      var newKeyIndex = prop.nearestKeyIndex(kf.time + offset);
      prop.setTemporalEaseAtKey(newKeyIndex, kf.inEase, kf.outEase);
    }
    
    return {
      success: true,
      data: {
        property: "${helpers.escapeString(params.propertyPath)}",
        keyframesOffset: keyframeData.length,
        offset: offset
      }
    };
  `,

  scaleKeyframeTiming: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    scaleFactor: number;
    anchorTime?: number;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Position");
      } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Scale");
      } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Rotate Z");
      } else if (part === "Opacity" && prop === layer) {
        prop = prop.property("ADBE Opacity");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    var scaleFactor = ${params.scaleFactor};
    var anchorTime = ${params.anchorTime || 0};
    
    // Store keyframe data
    var keyframeData = [];
    for (var i = 1; i <= prop.numKeys; i++) {
      keyframeData.push({
        time: prop.keyTime(i),
        value: prop.keyValue(i),
        inEase: prop.keyInTemporalEase(i),
        outEase: prop.keyOutTemporalEase(i)
      });
    }
    
    // Clear and reapply with scaled timing
    while (prop.numKeys > 0) {
      prop.removeKey(1);
    }
    
    for (var i = 0; i < keyframeData.length; i++) {
      var kf = keyframeData[i];
      var newTime = anchorTime + (kf.time - anchorTime) * scaleFactor;
      prop.setValueAtTime(newTime, kf.value);
      var newKeyIndex = prop.nearestKeyIndex(newTime);
      prop.setTemporalEaseAtKey(newKeyIndex, kf.inEase, kf.outEase);
    }
    
    return {
      success: true,
      data: {
        property: "${helpers.escapeString(params.propertyPath)}",
        keyframesScaled: keyframeData.length,
        scaleFactor: scaleFactor,
        anchorTime: anchorTime
      }
    };
  `,

  reverseKeyframes: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Position");
      } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Scale");
      } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {
        prop = prop.property("ADBE Rotate Z");
      } else if (part === "Opacity" && prop === layer) {
        prop = prop.property("ADBE Opacity");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    if (prop.numKeys < 2) {
      throw new Error("Need at least 2 keyframes to reverse");
    }
    
    // Store keyframe data
    var keyframeTimes = [];
    var keyframeValues = [];
    var keyframeInEases = [];
    var keyframeOutEases = [];
    
    for (var i = 1; i <= prop.numKeys; i++) {
      keyframeTimes.push(prop.keyTime(i));
      keyframeValues.push(prop.keyValue(i));
      keyframeInEases.push(prop.keyInTemporalEase(i));
      keyframeOutEases.push(prop.keyOutTemporalEase(i));
    }
    
    // Reverse values and swap eases
    keyframeValues.reverse();
    
    var reversedInEases = [];
    var reversedOutEases = [];
    
    for (var i = keyframeOutEases.length - 1; i >= 0; i--) {
      reversedInEases.push(keyframeOutEases[i]);
      reversedOutEases.push(keyframeInEases[i]);
    }
    
    // Clear and reapply
    while (prop.numKeys > 0) {
      prop.removeKey(1);
    }
    
    for (var i = 0; i < keyframeTimes.length; i++) {
      prop.setValueAtTime(keyframeTimes[i], keyframeValues[i]);
      var keyIndex = prop.nearestKeyIndex(keyframeTimes[i]);
      prop.setTemporalEaseAtKey(keyIndex, reversedInEases[i], reversedOutEases[i]);
    }
    
    return {
      success: true,
      data: {
        property: "${helpers.escapeString(params.propertyPath)}",
        keyframesReversed: keyframeTimes.length
      }
    };
  `,

  applyAnimationPreset: (params: {
    compId: number;
    layerIndex: number;
    preset: string;
    properties?: string[];
    startTime?: number;
    duration?: number;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var preset = "${params.preset}";
    var startTime = ${params.startTime || 'comp.time'};
    var duration = ${params.duration || 1};
    var properties = \" + (params.properties ? JSON.stringify(params.properties) : '["position", "scale", "rotation", "opacity"]') + \";
    
    // Apply preset animations
    switch(preset) {
      case "fadeIn":
        if (properties.indexOf("opacity") !== -1) {
          var opacity = layer.property("Opacity");
          opacity.setValueAtTime(startTime, 0);
          opacity.setValueAtTime(startTime + duration, 100);
          // Apply ease
          opacity.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333)]);
        }
        break;
        
      case "fadeOut":
        if (properties.indexOf("opacity") !== -1) {
          var opacity = layer.property("Opacity");
          opacity.setValueAtTime(startTime, 100);
          opacity.setValueAtTime(startTime + duration, 0);
          opacity.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333)]);
        }
        break;
        
      case "slideInLeft":
        if (properties.indexOf("position") !== -1) {
          var position = layer.property("Position");
          var currentPos = position.value;
          position.setValueAtTime(startTime, [currentPos[0] - comp.width, currentPos[1]]);
          position.setValueAtTime(startTime + duration, currentPos);
          position.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333)]);
        }
        break;
        
      case "slideInRight":
        if (properties.indexOf("position") !== -1) {
          var position = layer.property("Position");
          var currentPos = position.value;
          position.setValueAtTime(startTime, [currentPos[0] + comp.width, currentPos[1]]);
          position.setValueAtTime(startTime + duration, currentPos);
          position.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333)]);
        }
        break;
        
      case "slideInTop":
        if (properties.indexOf("position") !== -1) {
          var position = layer.property("Position");
          var currentPos = position.value;
          position.setValueAtTime(startTime, [currentPos[0], currentPos[1] - comp.height]);
          position.setValueAtTime(startTime + duration, currentPos);
          position.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333)]);
        }
        break;
        
      case "slideInBottom":
        if (properties.indexOf("position") !== -1) {
          var position = layer.property("Position");
          var currentPos = position.value;
          position.setValueAtTime(startTime, [currentPos[0], currentPos[1] + comp.height]);
          position.setValueAtTime(startTime + duration, currentPos);
          position.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333)]);
        }
        break;
        
      case "scaleIn":
        if (properties.indexOf("scale") !== -1) {
          var scale = layer.property("Scale");
          scale.setValueAtTime(startTime, [0, 0]);
          scale.setValueAtTime(startTime + duration, [100, 100]);
          scale.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)], 
                                         [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)]);
        }
        break;
        
      case "scaleOut":
        if (properties.indexOf("scale") !== -1) {
          var scale = layer.property("Scale");
          scale.setValueAtTime(startTime, [100, 100]);
          scale.setValueAtTime(startTime + duration, [0, 0]);
          scale.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)], 
                                         [new KeyframeEase(0, 33.333), new KeyframeEase(0, 33.333)]);
        }
        break;
        
      case "rotateIn":
        if (properties.indexOf("rotation") !== -1) {
          var rotation = layer.property("Rotation");
          rotation.setValueAtTime(startTime, -720);
          rotation.setValueAtTime(startTime + duration, 0);
          rotation.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333)]);
        }
        if (properties.indexOf("scale") !== -1) {
          var scale = layer.property("Scale");
          scale.setValueAtTime(startTime, [0, 0]);
          scale.setValueAtTime(startTime + duration, [100, 100]);
        }
        break;
        
      case "bounce":
        if (properties.indexOf("position") !== -1) {
          // Apply bounce expression
          var position = layer.property("Position");
          var currentPos = position.value;
          position.setValueAtTime(startTime, [currentPos[0], currentPos[1] - 200]);
          position.setValueAtTime(startTime + duration, currentPos);
          
          // Add bounce expression
          position.expression = "// Bounce\\n" +
                               "amp = .1;\\n" +
                               "freq = 2.0;\\n" +
                               "decay = 2.0;\\n" +
                               "n = 0;\\n" +
                               "if (numKeys > 0){\\n" +
                               "  n = nearestKey(time).index;\\n" +
                               "  if (key(n).time > time){n--;}\\n" +
                               "}\\n" +
                               "if (n == 0){ t = 0; }\\n" +
                               "else{t = time - key(n).time;}\\n" +
                               "if (n > 0 && t < 1){\\n" +
                               "  v = velocityAtTime(key(n).time - thisComp.frameDuration/10);\\n" +
                               "  value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);\\n" +
                               "}else{value}";
        }
        break;
        
      case "elastic":
        if (properties.indexOf("scale") !== -1) {
          var scale = layer.property("Scale");
          scale.setValueAtTime(startTime, [0, 0]);
          scale.setValueAtTime(startTime + duration * 0.7, [100, 100]);
          
          // Add elastic expression
          scale.expression = "// Elastic\\n" +
                            "amp = .05;\\n" +
                            "freq = 4.0;\\n" +
                            "decay = 7.0;\\n" +
                            "n = 0;\\n" +
                            "if (numKeys > 0){\\n" +
                            "  n = nearestKey(time).index;\\n" +
                            "  if (key(n).time > time){n--;}\\n" +
                            "}\\n" +
                            "if (n == 0){ t = 0; }\\n" +
                            "else{t = time - key(n).time;}\\n" +
                            "if (n > 0 && t < 1){\\n" +
                            "  v = velocityAtTime(key(n).time - thisComp.frameDuration/10);\\n" +
                            "  value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);\\n" +
                            "}else{value}";
        }
        break;
        
      case "overshoot":
        if (properties.indexOf("scale") !== -1) {
          var scale = layer.property("Scale");
          scale.setValueAtTime(startTime, [0, 0]);
          scale.setValueAtTime(startTime + duration * 0.7, [120, 120]);
          scale.setValueAtTime(startTime + duration, [100, 100]);
          
          // Apply custom easing for overshoot
          scale.setTemporalEaseAtKey(2, [new KeyframeEase(0, 75)], [new KeyframeEase(0, 75)]);
          scale.setTemporalEaseAtKey(3, [new KeyframeEase(0, 33.333)], [new KeyframeEase(0, 33.333)]);
        }
        break;
    }
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        preset: preset,
        startTime: startTime,
        duration: duration,
        propertiesAnimated: properties
      }
    };
  `
};