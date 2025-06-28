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
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    // Set keyframe
    var value = ${Array.isArray(params.value) ? `[${params.value.join(',')}]` : params.value};
    prop.setValueAtTime(${params.time}, value);
    
    // Get the keyframe index
    var keyIndex = prop.nearestKeyIndex(${params.time});
    
    ${params.interpolation ? `
      var interpolation = ${JSON.stringify(params.interpolation)};
      
      // Set temporal interpolation
      ${params.interpolation.temporalEase ? `
        var easeType = "${params.interpolation.temporalEase}";
        var easeIn, easeOut;
        
        switch(easeType) {
          case "linear":
            easeIn = easeOut = new KeyframeEase(0, 0.1);
            break;
          case "easeIn":
            easeIn = new KeyframeEase(0, 33.333);
            easeOut = new KeyframeEase(0, 0.1);
            break;
          case "easeOut":
            easeIn = new KeyframeEase(0, 0.1);
            easeOut = new KeyframeEase(0, 33.333);
            break;
          case "easeInOut":
            easeIn = easeOut = new KeyframeEase(0, 33.333);
            break;
          case "hold":
            prop.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.HOLD);
            break;
          case "custom":
            ${params.interpolation.customEase ? `
              var customEase = interpolation.customEase;
              if (customEase.easeIn) {
                easeIn = new KeyframeEase(customEase.easeIn.speed, customEase.easeIn.influence);
              }
              if (customEase.easeOut) {
                easeOut = new KeyframeEase(customEase.easeOut.speed, customEase.easeOut.influence);
              }
            ` : ''}
            break;
        }
        
        if (easeType !== "hold" && easeIn && easeOut) {
          if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || 
              prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {
            prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn], [easeOut, easeOut]);
          } else if (prop.propertyValueType === PropertyValueType.ThreeD) {
            prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn, easeIn], [easeOut, easeOut, easeOut]);
          } else {
            prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);
          }
        }
      ` : ''}
      
      // Set spatial interpolation for position properties
      ${params.interpolation.spatialInterpolation ? `
        if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || 
            prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {
          var spatialType = "${params.interpolation.spatialInterpolation}";
          
          switch(spatialType) {
            case "linear":
              prop.setSpatialTangentsAtKey(keyIndex, [0, 0], [0, 0]);
              break;
            case "bezier":
              prop.setSpatialAutoBezierAtKey(keyIndex, true);
              break;
            case "auto":
              prop.setSpatialContinuousAtKey(keyIndex, true);
              prop.setSpatialAutoBezierAtKey(keyIndex, true);
              break;
          }
        }
      ` : ''}
    ` : ''}
    
    return {
      success: true,
      data: {
        property: "${helpers.escapeString(params.propertyPath)}",
        time: ${params.time},
        value: value,
        keyIndex: keyIndex
      }
    };
  `,

  applyEasyEase: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    keyframeIndices?: number[];
    easeType?: string;
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
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    var keyIndices = ${params.keyframeIndices ? JSON.stringify(params.keyframeIndices) : 'null'};
    var easeType = "${params.easeType || 'ease'}";
    
    // If no specific keys, apply to all
    if (!keyIndices) {
      keyIndices = [];
      for (var i = 1; i <= prop.numKeys; i++) {
        keyIndices.push(i);
      }
    }
    
    // Define ease values
    var easeIn, easeOut;
    switch(easeType) {
      case "easeIn":
        easeIn = new KeyframeEase(0, 33.333);
        easeOut = new KeyframeEase(0, 0.1);
        break;
      case "easeOut":
        easeIn = new KeyframeEase(0, 0.1);
        easeOut = new KeyframeEase(0, 33.333);
        break;
      case "ease":
      default:
        easeIn = easeOut = new KeyframeEase(0, 33.333);
        break;
    }
    
    // Apply to each keyframe
    for (var i = 0; i < keyIndices.length; i++) {
      var keyIndex = keyIndices[i];
      if (keyIndex > 0 && keyIndex <= prop.numKeys) {
        if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || 
            prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {
          prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn], [easeOut, easeOut]);
        } else if (prop.propertyValueType === PropertyValueType.ThreeD) {
          prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn, easeIn], [easeOut, easeOut, easeOut]);
        } else {
          prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);
        }
      }
    }
    
    return {
      success: true,
      data: {
        property: "${helpers.escapeString(params.propertyPath)}",
        keyframesModified: keyIndices.length,
        easeType: easeType
      }
    };
  `,

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
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    var keyIndex = ${params.keyframeIndex};
    if (keyIndex < 1 || keyIndex > prop.numKeys) {
      throw new Error("Invalid keyframe index");
    }
    
    // Get current ease values
    var currentInEase = prop.keyInTemporalEase(keyIndex);
    var currentOutEase = prop.keyOutTemporalEase(keyIndex);
    
    // Update velocities
    ${params.incomingVelocity !== undefined ? `
      for (var i = 0; i < currentInEase.length; i++) {
        currentInEase[i].speed = ${params.incomingVelocity};
      }
    ` : ''}
    
    ${params.outgoingVelocity !== undefined ? `
      for (var i = 0; i < currentOutEase.length; i++) {
        currentOutEase[i].speed = ${params.outgoingVelocity};
      }
    ` : ''}
    
    // Apply updated ease
    prop.setTemporalEaseAtKey(keyIndex, currentInEase, currentOutEase);
    
    return {
      success: true,
      data: {
        property: "${helpers.escapeString(params.propertyPath)}",
        keyframeIndex: keyIndex,
        incomingVelocity: ${params.incomingVelocity || 'currentInEase[0].speed'},
        outgoingVelocity: ${params.outgoingVelocity || 'currentOutEase[0].speed'}
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
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    var keyIndex = ${params.keyframeIndex};
    if (keyIndex < 1 || keyIndex > prop.numKeys) {
      throw new Error("Invalid keyframe index");
    }
    
    var inEase = [];
    var outEase = [];
    
    ${params.easeIn ? `
      var easeInData = ${JSON.stringify(params.easeIn)};
      for (var i = 0; i < easeInData.length; i++) {
        inEase.push(new KeyframeEase(easeInData[i].speed, easeInData[i].influence));
      }
    ` : `
      inEase = prop.keyInTemporalEase(keyIndex);
    `}
    
    ${params.easeOut ? `
      var easeOutData = ${JSON.stringify(params.easeOut)};
      for (var i = 0; i < easeOutData.length; i++) {
        outEase.push(new KeyframeEase(easeOutData[i].speed, easeOutData[i].influence));
      }
    ` : `
      outEase = prop.keyOutTemporalEase(keyIndex);
    `}
    
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
    
    var inTangent = ${params.inTangent ? `[${params.inTangent.join(',')}]` : 'prop.keyInSpatialTangent(keyIndex)'};
    var outTangent = ${params.outTangent ? `[${params.outTangent.join(',')}]` : 'prop.keyOutSpatialTangent(keyIndex)'};
    
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
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    var keyIndex = ${params.keyframeIndex};
    if (keyIndex < 1 || keyIndex > prop.numKeys) {
      throw new Error("Invalid keyframe index");
    }
    
    var typeMap = {
      "linear": KeyframeInterpolationType.LINEAR,
      "bezier": KeyframeInterpolationType.BEZIER,
      "hold": KeyframeInterpolationType.HOLD,
      "auto": KeyframeInterpolationType.BEZIER // Auto becomes bezier
    };
    
    ${params.inType ? `
      var inType = typeMap["${params.inType}"];
      if (inType === undefined) {
        throw new Error("Invalid interpolation type: ${params.inType}");
      }
    ` : `
      var inType = prop.keyInInterpolationType(keyIndex);
    `}
    
    ${params.outType ? `
      var outType = typeMap["${params.outType}"];
      if (outType === undefined) {
        throw new Error("Invalid interpolation type: ${params.outType}");
      }
    ` : `
      var outType = prop.keyOutInterpolationType(keyIndex);
    `}
    
    prop.setInterpolationTypeAtKey(keyIndex, inType, outType);
    
    return {
      success: true,
      data: {
        property: "${helpers.escapeString(params.propertyPath)}",
        keyframeIndex: keyIndex,
        inType: "${params.inType || 'unchanged'}",
        outType: "${params.outType || 'unchanged'}"
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
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    // Clear existing keyframes if requested
    ${params.clearExisting !== false ? `
      while (prop.numKeys > 0) {
        prop.removeKey(1);
      }
    ` : ''}
    
    // Add keyframes
    var keyframes = ${JSON.stringify(params.keyframes)};
    
    for (var i = 0; i < keyframes.length; i++) {
      var kf = keyframes[i];
      var value = kf.value;
      
      // Handle array values
      if (typeof value === "object" && value.length) {
        prop.setValueAtTime(kf.time, value);
      } else {
        prop.setValueAtTime(kf.time, value);
      }
      
      // Get the key index
      var keyIndex = prop.nearestKeyIndex(kf.time);
      
      // Apply easing if specified
      if (kf.easeIn || kf.easeOut) {
        var inEase, outEase;
        
        if (kf.easeIn) {
          inEase = new KeyframeEase(kf.easeIn.speed, kf.easeIn.influence);
        } else {
          inEase = new KeyframeEase(0, 33.333);
        }
        
        if (kf.easeOut) {
          outEase = new KeyframeEase(kf.easeOut.speed, kf.easeOut.influence);
        } else {
          outEase = new KeyframeEase(0, 33.333);
        }
        
        // Apply appropriate number of ease values based on property type
        if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || 
            prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {
          prop.setTemporalEaseAtKey(keyIndex, [inEase, inEase], [outEase, outEase]);
        } else if (prop.propertyValueType === PropertyValueType.ThreeD) {
          prop.setTemporalEaseAtKey(keyIndex, [inEase, inEase, inEase], [outEase, outEase, outEase]);
        } else {
          prop.setTemporalEaseAtKey(keyIndex, [inEase], [outEase]);
        }
      }
    }
    
    return {
      success: true,
      data: {
        property: "${helpers.escapeString(params.propertyPath)}",
        keyframesSet: keyframes.length,
        firstTime: keyframes[0].time,
        lastTime: keyframes[keyframes.length - 1].time
      }
    };
  `,

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
    ${params.reverseKeyframes ? `
      keyframeValues.reverse();
      keyframeInEases.reverse();
      keyframeOutEases.reverse();
      
      // Swap in/out eases when reversing
      var temp = keyframeInEases;
      keyframeInEases = keyframeOutEases;
      keyframeOutEases = temp;
    ` : ''}
    
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
        reversed: ${params.reverseKeyframes ? 'true' : 'false'}
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
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    var offset = ${params.offset};
    var keyIndices = ${params.keyframeIndices ? JSON.stringify(params.keyframeIndices) : 'null'};
    
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
    var properties = ${params.properties ? JSON.stringify(params.properties) : '["position", "scale", "rotation", "opacity"]'};
    
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