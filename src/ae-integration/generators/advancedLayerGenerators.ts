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
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.index = camera.index;\n';
    script += 'result.data.name = camera.name;\n';
    script += 'return result;';
    
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
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.index = light.index;\n';
    script += 'result.data.name = light.name;\n';
    script += 'return result;';
    
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
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.childIndex = childLayer.index;\n';
    script += 'result.data.childName = childLayer.name;\n';
    script += 'result.data.parentIndex = ' + (params.parentLayerIndex != null ? params.parentLayerIndex : 'null') + ';\n';
    script += 'return result;';
    
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
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.index = layer.index;\n';
    script += 'result.data.name = layer.name;\n';
    script += 'result.data.blendMode = "' + params.blendMode + '";\n';
    script += 'return result;';
    
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
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.index = layer.index;\n';
    script += 'result.data.name = layer.name;\n';
    script += 'result.data.is3D = layer.threeDLayer;\n';
    script += 'return result;';
    
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
    
    script += '\nvar result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.index = layer.index;\n';
    script += 'result.data.name = layer.name;\n';
    script += 'result.data.visible = layer.enabled;\n';
    script += 'result.data.solo = layer.solo;\n';
    script += 'result.data.shy = layer.shy;\n';
    script += 'result.data.locked = layer.locked;\n';
    script += 'return result;';
    
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
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.index = layer.index;\n';
    script += 'result.data.name = layer.name;\n';
    script += 'result.data.trackMatteType = "' + params.matteType + '";\n';
    script += 'return result;';
    
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
      const opts = params.properties.materialOptions;
      
      if (opts.acceptsLights !== undefined) {
        script += 'materialOptions.property("Accepts Lights").setValue(' + (opts.acceptsLights ? 1 : 0) + ');\n';
      }
      if (opts.acceptsShadows !== undefined) {
        script += 'materialOptions.property("Accepts Shadows").setValue(' + (opts.acceptsShadows ? 1 : 0) + ');\n';
      }
      if (opts.castsShadows !== undefined) {
        script += 'materialOptions.property("Casts Shadows").setValue(' + (opts.castsShadows ? 1 : 0) + ');\n';
      }
      if (opts.ambientCoefficient !== undefined) {
        script += 'materialOptions.property("Ambient").setValue(' + opts.ambientCoefficient + ');\n';
      }
      if (opts.diffuseCoefficient !== undefined) {
        script += 'materialOptions.property("Diffuse").setValue(' + opts.diffuseCoefficient + ');\n';
      }
      if (opts.specularCoefficient !== undefined) {
        script += 'materialOptions.property("Specular").setValue(' + opts.specularCoefficient + ');\n';
      }
      if (opts.shininess !== undefined) {
        script += 'materialOptions.property("Shininess").setValue(' + opts.shininess + ');\n';
      }
    }
    
    script += '\nvar result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.index = layer.index;\n';
    script += 'result.data.name = layer.name;\n';
    script += 'result.data.is3D = true;\n';
    script += 'return result;';
    
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
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.index = layer.index;\n';
    script += 'result.data.name = layer.name;\n';
    script += 'result.data.quality = "' + params.quality + '";\n';
    script += 'return result;';
    
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
    
    script += '\nvar result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.index = layer.index;\n';
    script += 'result.data.name = layer.name;\n';
    script += 'result.data.motionBlur = layer.motionBlur;\n';
    script += 'return result;';
    
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
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.index = layer.index;\n';
    script += 'result.data.name = layer.name;\n';
    script += 'result.data.timeRemapEnabled = layer.timeRemapEnabled;\n';
    script += 'return result;';
    
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
    script += '  var errorMsg = "Layer " + layer.name + " cannot have time remapping enabled. ";\n';
    script += '  \n';
    script += '  if (layer.source) {\n';
    script += '    errorMsg += "Source: " + layer.source.name + " (Type: " + layer.source.constructor.name + "). ";\n';
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
    
    script += '// Access Time Remap property - now that it is enabled\n';
    script += 'var timeRemap = null;\n';
    script += 'try {\n';
    script += '  // Method 1: Direct access with ADBE property name\n';
    script += '  timeRemap = layer.property("ADBE Time Remapping");\n';
    script += '} catch (e) {\n';
    script += '  // Method 2: Access through property path\n';
    script += '  try {\n';
    script += '    timeRemap = layer.property("ADBE Layer Overrides").property("ADBE Time Remapping");\n';
    script += '  } catch (e2) {\n';
    script += '    // Method 3: Search by name\n';
    script += '    var numProps = layer.numProperties;\n';
    script += '    for (var i = 1; i <= numProps; i++) {\n';
    script += '      var prop = layer.property(i);\n';
    script += '      if (prop && (prop.name === "Time Remap" || prop.matchName === "ADBE Time Remapping")) {\n';
    script += '        timeRemap = prop;\n';
    script += '        break;\n';
    script += '      }\n';
    script += '    }\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'if (!timeRemap) {\n';
    script += '  throw new Error("Could not access Time Remap property. Layer: " + layer.name + ", Type: " + layer.constructor.name);\n';
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
    script += 'var keyframes = [];\n';
    for (let i = 0; i < params.keyframes.length; i++) {
      const kf = params.keyframes[i];
      script += 'keyframes[' + i + '] = {};\n';
      script += 'keyframes[' + i + '].time = ' + kf.time + ';\n';
      script += 'keyframes[' + i + '].value = ' + kf.value + ';\n';
    }
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
    script += '    throw new Error("Failed to set keyframe at time " + keyframes[i].time + ": " + String(e));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'result.data.layerIndex = layer.index;\n';
    script += 'result.data.layerName = layer.name;\n';
    script += 'result.data.keyframesSet = keyframes.length;\n';
    script += 'result.data.timeRemapEnabled = true;\n';
    script += 'return result;';
    
    return script;
  }
};