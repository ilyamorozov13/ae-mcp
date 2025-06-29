import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

export const advancedLayerGenerators: ScriptGeneratorModule = {
  addCameraLayer: (params: { compId: number; name?: string; preset?: string; focalLength?: number }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var camera = comp.layers.addCamera("' + helpers.escapeString(params.name || 'Camera') + '", [comp.width/2, comp.height/2]);\n\n';
    
    script += '// Apply preset\n';
    script += 'var preset = "' + (params.preset || '50mm') + '";\n';
    script += 'if (preset !== "Custom") {\n';
    script += '  // Extract focal length from preset string\n';
    script += '  var focalLength = parseInt(preset);\n';
    script += '  if (!isNaN(focalLength)) {\n';
    script += '    camera.property("Camera Options").property("Zoom").setValue(focalLength);\n';
    script += '  }\n';
    if (params.focalLength) {
      script += '} else {\n';
      script += '  camera.property("Camera Options").property("Zoom").setValue(' + params.focalLength + ');\n';
    }
    script += '}\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: camera.index,\n';
    script += '    name: camera.name\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  addLightLayer: (params: { 
    compId: number; 
    name?: string; 
    lightType?: string; 
    color?: number[]; 
    intensity?: number 
  }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var lightName = "' + helpers.escapeString(params.name || 'Light') + '";\n';
    script += 'var light = comp.layers.addLight(lightName, [comp.width/2, comp.height/2]);\n\n';
    
    script += '// Set light type\n';
    script += 'var lightTypeMap = {\n';
    script += '  "parallel": 1,\n';
    script += '  "spot": 2,\n';
    script += '  "point": 3,\n';
    script += '  "ambient": 4\n';
    script += '};\n';
    script += 'var lightType = lightTypeMap["' + (params.lightType || 'point') + '"] || 3;\n';
    script += 'light.property("Light Options").property("Light Type").setValue(lightType);\n\n';
    
    if (params.color) {
      script += '// Set color\n';
      script += 'light.property("Light Options").property("Color").setValue([' + params.color.join(',') + ']);\n\n';
    }
    
    if (params.intensity) {
      script += '// Set intensity\n';
      script += 'light.property("Light Options").property("Intensity").setValue(' + params.intensity + ');\n\n';
    }
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: light.index,\n';
    script += '    name: light.name\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  setLayerParent: (params: { compId: number; childLayerIndex: number; parentLayerIndex?: number }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var childLayer = comp.layer(' + params.childLayerIndex + ');\n';
    script += 'if (!childLayer) {\n';
    script += '  throw new Error("Child layer not found");\n';
    script += '}\n\n';
    
    if (params.parentLayerIndex != null) {
      script += 'var parentLayer = comp.layer(' + params.parentLayerIndex + ');\n';
      script += 'if (!parentLayer) {\n';
      script += '  throw new Error("Parent layer not found");\n';
      script += '}\n';
      script += 'childLayer.parent = parentLayer;\n\n';
    } else {
      script += 'childLayer.parent = null;\n\n';
    }
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    childIndex: childLayer.index,\n';
    script += '    childName: childLayer.name,\n';
    script += '    parentIndex: ' + (params.parentLayerIndex != null ? params.parentLayerIndex : 'null') + '\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  setLayerBlendMode: (params: { compId: number; layerIndex: number; blendMode: string }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += 'var blendModeMap = {\n';
    script += '  "normal": BlendingMode.NORMAL,\n';
    script += '  "dissolve": BlendingMode.DISSOLVE,\n';
    script += '  "darken": BlendingMode.DARKEN,\n';
    script += '  "multiply": BlendingMode.MULTIPLY,\n';
    script += '  "colorBurn": BlendingMode.COLOR_BURN,\n';
    script += '  "linearBurn": BlendingMode.LINEAR_BURN,\n';
    script += '  "darkerColor": BlendingMode.DARKER_COLOR,\n';
    script += '  "add": BlendingMode.ADD,\n';
    script += '  "lighten": BlendingMode.LIGHTEN,\n';
    script += '  "screen": BlendingMode.SCREEN,\n';
    script += '  "colorDodge": BlendingMode.COLOR_DODGE,\n';
    script += '  "linearDodge": BlendingMode.LINEAR_DODGE,\n';
    script += '  "lighterColor": BlendingMode.LIGHTER_COLOR,\n';
    script += '  "overlay": BlendingMode.OVERLAY,\n';
    script += '  "softLight": BlendingMode.SOFT_LIGHT,\n';
    script += '  "hardLight": BlendingMode.HARD_LIGHT,\n';
    script += '  "linearLight": BlendingMode.LINEAR_LIGHT,\n';
    script += '  "vividLight": BlendingMode.VIVID_LIGHT,\n';
    script += '  "pinLight": BlendingMode.PIN_LIGHT,\n';
    script += '  "hardMix": BlendingMode.HARD_MIX,\n';
    script += '  "difference": BlendingMode.DIFFERENCE,\n';
    script += '  "exclusion": BlendingMode.EXCLUSION,\n';
    script += '  "subtract": BlendingMode.SUBTRACT,\n';
    script += '  "divide": BlendingMode.DIVIDE,\n';
    script += '  "hue": BlendingMode.HUE,\n';
    script += '  "saturation": BlendingMode.SATURATION,\n';
    script += '  "color": BlendingMode.COLOR,\n';
    script += '  "luminosity": BlendingMode.LUMINOSITY\n';
    script += '};\n\n';
    
    script += 'var mode = blendModeMap["' + params.blendMode + '"];\n';
    script += 'if (!mode) {\n';
    script += '  throw new Error("Invalid blend mode: ' + params.blendMode + '");\n';
    script += '}\n\n';
    
    script += 'layer.blendingMode = mode;\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name,\n';
    script += '    blendMode: "' + params.blendMode + '"\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  setLayer3d: (params: { compId: number; layerIndex: number; is3D: boolean }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += 'layer.threeDLayer = ' + params.is3D + ';\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name,\n';
    script += '    is3D: layer.threeDLayer\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  setLayerVisibility: (params: { 
    compId: number; 
    layerIndex: number; 
    visible?: boolean;
    solo?: boolean;
    shy?: boolean;
    locked?: boolean;
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
    
    if (params.visible !== undefined) {
      script += 'layer.enabled = ' + params.visible + ';\n';
    }
    if (params.solo !== undefined) {
      script += 'layer.solo = ' + params.solo + ';\n';
    }
    if (params.shy !== undefined) {
      script += 'layer.shy = ' + params.shy + ';\n';
    }
    if (params.locked !== undefined) {
      script += 'layer.locked = ' + params.locked + ';\n';
    }
    
    script += '\nreturn {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name,\n';
    script += '    visible: layer.enabled,\n';
    script += '    solo: layer.solo,\n';
    script += '    shy: layer.shy,\n';
    script += '    locked: layer.locked\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  setTrackMatte: (params: { compId: number; layerIndex: number; matteType: string }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += 'var trackMatteMap = {\n';
    script += '  "none": TrackMatteType.NO_TRACK_MATTE,\n';
    script += '  "alpha": TrackMatteType.ALPHA,\n';
    script += '  "alphaInverted": TrackMatteType.ALPHA_INVERTED,\n';
    script += '  "luma": TrackMatteType.LUMA,\n';
    script += '  "lumaInverted": TrackMatteType.LUMA_INVERTED\n';
    script += '};\n\n';
    
    script += 'var matteType = trackMatteMap["' + params.matteType + '"];\n';
    script += 'if (matteType === undefined) {\n';
    script += '  throw new Error("Invalid track matte type: ' + params.matteType + '");\n';
    script += '}\n\n';
    
    script += 'layer.trackMatteType = matteType;\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name,\n';
    script += '    trackMatteType: "' + params.matteType + '"\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  modifyLayer3dProperties: (params: {
    compId: number;
    layerIndex: number;
    properties: {
      orientation?: number[];
      xRotation?: number;
      yRotation?: number;
      zRotation?: number;
      materialOptions?: any;
    };
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
    
    script += 'if (!layer.threeDLayer) {\n';
    script += '  throw new Error("Layer is not a 3D layer");\n';
    script += '}\n\n';
    
    if (params.properties.orientation) {
      script += 'layer.property("Orientation").setValue([' + params.properties.orientation.join(',') + ']);\n';
    }
    if (params.properties.xRotation !== undefined) {
      script += 'layer.property("X Rotation").setValue(' + params.properties.xRotation + ');\n';
    }
    if (params.properties.yRotation !== undefined) {
      script += 'layer.property("Y Rotation").setValue(' + params.properties.yRotation + ');\n';
    }
    if (params.properties.zRotation !== undefined) {
      script += 'layer.property("Z Rotation").setValue(' + params.properties.zRotation + ');\n';
    }
    
    if (params.properties.materialOptions) {
      script += '\nvar materialOptions = layer.property("Material Options");\n';
      script += 'var options = ' + JSON.stringify(params.properties.materialOptions) + ';\n\n';
      
      script += 'if (options.acceptsLights !== undefined) {\n';
      script += '  materialOptions.property("Accepts Lights").setValue(options.acceptsLights ? 1 : 0);\n';
      script += '}\n';
      script += 'if (options.acceptsShadows !== undefined) {\n';
      script += '  materialOptions.property("Accepts Shadows").setValue(options.acceptsShadows ? 1 : 0);\n';
      script += '}\n';
      script += 'if (options.castsShadows !== undefined) {\n';
      script += '  materialOptions.property("Casts Shadows").setValue(options.castsShadows ? 1 : 0);\n';
      script += '}\n';
      script += 'if (options.ambientCoefficient !== undefined) {\n';
      script += '  materialOptions.property("Ambient").setValue(options.ambientCoefficient);\n';
      script += '}\n';
      script += 'if (options.diffuseCoefficient !== undefined) {\n';
      script += '  materialOptions.property("Diffuse").setValue(options.diffuseCoefficient);\n';
      script += '}\n';
      script += 'if (options.specularCoefficient !== undefined) {\n';
      script += '  materialOptions.property("Specular").setValue(options.specularCoefficient);\n';
      script += '}\n';
      script += 'if (options.shininess !== undefined) {\n';
      script += '  materialOptions.property("Shininess").setValue(options.shininess);\n';
      script += '}\n';
    }
    
    script += '\nreturn {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name,\n';
    script += '    is3D: true\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  setLayerQuality: (params: { compId: number; layerIndex: number; quality: string }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += 'var qualityMap = {\n';
    script += '  "best": LayerQuality.BEST,\n';
    script += '  "draft": LayerQuality.DRAFT,\n';
    script += '  "wireframe": LayerQuality.WIREFRAME\n';
    script += '};\n\n';
    
    script += 'var quality = qualityMap["' + params.quality + '"];\n';
    script += 'if (!quality) {\n';
    script += '  throw new Error("Invalid quality setting: ' + params.quality + '");\n';
    script += '}\n\n';
    
    script += 'layer.quality = quality;\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name,\n';
    script += '    quality: "' + params.quality + '"\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  setMotionBlur: (params: { compId: number; layerIndex: number; enabled: boolean; adjustmentLayer?: boolean }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += 'layer.motionBlur = ' + params.enabled + ';\n';
    
    if (params.adjustmentLayer !== undefined) {
      script += 'if (layer.adjustmentLayer) {\n';
      script += '  // Adjustment layer motion blur affects layers below it\n';
      script += '}\n';
    }
    
    script += '\nreturn {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name,\n';
    script += '    motionBlur: layer.motionBlur\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  setTimeRemapping: (params: { compId: number; layerIndex: number; enabled: boolean }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += '// Check if layer supports time remapping\n';
    script += '// CompItem layers (nested compositions) also support time remapping\n';
    script += 'var isValidLayer = false;\n';
    script += 'try {\n';
    script += '  // Try to access source to determine layer type\n';
    script += '  if (layer.source) {\n';
    script += '    isValidLayer = layer.source instanceof CompItem || layer.source instanceof FootageItem;\n';
    script += '  }\n';
    script += '} catch (e) {\n';
    script += '  // If we cannot access source, try to enable time remapping anyway\n';
    script += '  isValidLayer = true;\n';
    script += '}\n\n';
    
    script += 'if (!isValidLayer) {\n';
    script += '  throw new Error("Time remapping can only be applied to composition or footage layers");\n';
    script += '}\n\n';
    
    script += 'layer.timeRemapEnabled = ' + params.enabled + ';\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name,\n';
    script += '    timeRemapEnabled: layer.timeRemapEnabled\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  animateTimeRemap: (params: { 
    compId: number; 
    layerIndex: number; 
    keyframes: Array<{ time: number; value: number }>; 
    clearExisting?: boolean 
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
    
    script += '// CRITICAL CHECK: Verify layer can actually support time remapping\n';
    script += 'if (!layer.canSetTimeRemapEnabled) {\n';
    script += '  var errorMsg = "Layer \\\\"" + layer.name + "\\\\" cannot have time remapping enabled. ";\n';
    script += '  \n';
    script += '  if (layer.source) {\n';
    script += '    errorMsg += "Source: \\\\"" + layer.source.name + "\\\\" (Type: " + layer.source.constructor.name + "). ";\n';
    script += '    \n';
    script += '    if (layer.source instanceof CompItem) {\n';
    script += '      if (layer.source.duration === 0) {\n';
    script += '        errorMsg += "Source composition has 0 duration. ";\n';
    script += '      }\n';
    script += '      if (layer.source.frameRate === 0) {\n';
    script += '        errorMsg += "Source composition has 0 frame rate. ";\n';
    script += '      }\n';
    script += '      errorMsg += "Source comp may contain text layers or other elements that prevent time remapping. ";\n';
    script += '    }\n';
    script += '  }\n';
    script += '  \n';
    script += '  errorMsg += "Workaround: Use Time > Time Stretch or apply Timewarp effect instead.";\n';
    script += '  throw new Error(errorMsg);\n';
    script += '}\n\n';
    
    script += '// Enable time remapping first\n';
    script += 'layer.timeRemapEnabled = true;\n\n';
    
    script += '// CRITICAL FIX: After enabling time remapping, we need to access it through the correct property path\n';
    script += '// Time Remap is not a direct property but needs to be accessed through the correct property group\n';
    script += 'var timeRemap = null;\n';
    script += 'var attempts = 0;\n';
    script += 'var maxAttempts = 3;\n\n';
    
    script += '// Multiple approaches to access Time Remap property\n';
    script += 'while (!timeRemap && attempts < maxAttempts) {\n';
    script += '  attempts++;\n';
    script += '  \n';
    script += '  try {\n';
    script += '    switch(attempts) {\n';
    script += '      case 1:\n';
    script += '        // First attempt: Direct access with ADBE property name\n';
    script += '        timeRemap = layer.property("ADBE Time Remapping");\n';
    script += '        break;\n';
    script += '      case 2:\n';
    script += '        // Second attempt: Force refresh and use standard name\n';
    script += '        layer.selected = true;\n';
    script += '        layer.selected = false;\n';
    script += '        // Access through the layer\'s time remap property directly\n';
    script += '        if (layer.canSetTimeRemapEnabled && layer.timeRemapEnabled) {\n';
    script += '          // For AVLayer (comp/footage), time remap is a direct property\n';
    script += '          timeRemap = layer.timeRemap;\n';
    script += '        }\n';
    script += '        break;\n';
    script += '      case 3:\n';
    script += '        // Third attempt: Use property index\n';
    script += '        // Time Remap is typically the last property when enabled\n';
    script += '        var numProps = layer.numProperties;\n';
    script += '        for (var i = 1; i <= numProps; i++) {\n';
    script += '          var prop = layer.property(i);\n';
    script += '          if (prop && prop.name === "Time Remap") {\n';
    script += '            timeRemap = prop;\n';
    script += '            break;\n';
    script += '          }\n';
    script += '        }\n';
    script += '        break;\n';
    script += '    }\n';
    script += '    \n';
    script += '    // Verify we got a valid property that can accept keyframes\n';
    script += '    if (timeRemap && timeRemap.canSetExpression) {\n';
    script += '      break; // Success!\n';
    script += '    } else {\n';
    script += '      timeRemap = null; // Reset if invalid\n';
    script += '    }\n';
    script += '  } catch (e) {\n';
    script += '    // Continue to next attempt\n';
    script += '    timeRemap = null;\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'if (!timeRemap) {\n';
    script += '  throw new Error("Could not access Time Remap property after " + attempts + " attempts. Layer type: " + layer.constructor.name + ", Layer name: " + layer.name);\n';
    script += '}\n\n';
    
    script += '// Additional validation\n';
    script += 'if (!timeRemap.canVaryOverTime) {\n';
    script += '  throw new Error("Time Remap property found but cannot vary over time");\n';
    script += '}\n\n';
    
    if (params.clearExisting !== false) {
      script += '// Clear existing keyframes - but be careful with default Time Remap keyframes\n';
      script += '// When time remapping is enabled, AE may create default keyframes\n';
      script += 'var initialKeys = timeRemap.numKeys;\n';
      script += 'if (initialKeys > 0) {\n';
      script += '  // Remove keyframes in reverse order to avoid index shifting\n';
      script += '  for (var i = initialKeys; i >= 1; i--) {\n';
      script += '    try {\n';
      script += '      timeRemap.removeKey(i);\n';
      script += '    } catch (e) {\n';
      script += '      // Some keyframes might be protected, skip them\n';
      script += '    }\n';
      script += '  }\n';
      script += '}\n\n';
    }
    
    script += '// Add keyframes - ensure layer duration is sufficient\n';
    script += 'var keyframes = ' + JSON.stringify(params.keyframes) + ';\n';
    script += 'var maxTime = 0;\n';
    script += 'for (var i = 0; i < keyframes.length; i++) {\n';
    script += '  if (keyframes[i].time > maxTime) {\n';
    script += '    maxTime = keyframes[i].time;\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += '// Extend layer duration if needed (add small buffer)\n';
    script += 'if (layer.outPoint < maxTime + 0.1) {\n';
    script += '  layer.outPoint = maxTime + 0.5;\n';
    script += '}\n\n';
    
    script += '// Set keyframes\n';
    script += 'for (var i = 0; i < keyframes.length; i++) {\n';
    script += '  try {\n';
    script += '    timeRemap.setValueAtTime(keyframes[i].time, keyframes[i].value);\n';
    script += '  } catch (e) {\n';
    script += '    throw new Error("Failed to set keyframe at time " + keyframes[i].time + ": " + e.toString());\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    layerIndex: layer.index,\n';
    script += '    layerName: layer.name,\n';
    script += '    keyframesSet: keyframes.length,\n';
    script += '    timeRemapEnabled: true\n';
    script += '  }\n';
    script += '};';
    
    return script;
  }
};