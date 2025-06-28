import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

export const advancedLayerGenerators: ScriptGeneratorModule = {
  addCameraLayer: (params: { compId: number; name?: string; preset?: string; focalLength?: number }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var camera = comp.layers.addCamera("${helpers.escapeString(params.name || 'Camera')}", [comp.width/2, comp.height/2]);
    
    // Apply preset
    var preset = "${params.preset || '50mm'}";
    if (preset !== "Custom") {
      // Extract focal length from preset string
      var focalLength = parseInt(preset);
      if (!isNaN(focalLength)) {
        camera.property("Camera Options").property("Zoom").setValue(focalLength);
      }
    } else if (${params.focalLength}) {
      camera.property("Camera Options").property("Zoom").setValue(${params.focalLength});
    }
    
    return {
      success: true,
      data: {
        index: camera.index,
        name: camera.name
      }
    };
  `,
  
  addLightLayer: (params: { 
    compId: number; 
    name?: string; 
    lightType?: string; 
    color?: number[]; 
    intensity?: number 
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var lightName = "${helpers.escapeString(params.name || 'Light')}";
    var light = comp.layers.addLight(lightName, [comp.width/2, comp.height/2]);
    
    // Set light type
    var lightTypeMap = {
      "parallel": 1,
      "spot": 2,
      "point": 3,
      "ambient": 4
    };
    var lightType = lightTypeMap["${params.lightType || 'point'}"] || 3;
    light.property("Light Options").property("Light Type").setValue(lightType);
    
    // Set color
    ` + (params.color ? `light.property("Light Options").property("Color").setValue([${params.color.join(',')}]);` : '') + `
    
    // Set intensity
    ` + (params.intensity ? `light.property("Light Options").property("Intensity").setValue(${params.intensity});` : '') + `
    
    return {
      success: true,
      data: {
        index: light.index,
        name: light.name
      }
    };
  `,
  
  setLayerParent: (params: { compId: number; childLayerIndex: number; parentLayerIndex?: number }) => {
    // ES3-compatible script generation
    let script = `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var childLayer = comp.layer(${params.childLayerIndex});
    if (!childLayer) {
      throw new Error("Child layer not found");
    }
    `;
    
    if (params.parentLayerIndex != null) {
      script += `
      var parentLayer = comp.layer(${params.parentLayerIndex});
      if (!parentLayer) {
        throw new Error("Parent layer not found");
      }
      childLayer.parent = parentLayer;
      `;
    } else {
      script += `
      childLayer.parent = null;
      `;
    }
    
    script += `
    return {
      success: true,
      data: {
        childIndex: childLayer.index,
        childName: childLayer.name,
        parentIndex: ${params.parentLayerIndex != null ? params.parentLayerIndex : 'null'}
      }
    };
    `;
    
    return script;
  },
  
  setLayerBlendMode: (params: { compId: number; layerIndex: number; blendMode: string }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var blendModeMap = {
      "normal": BlendingMode.NORMAL,
      "dissolve": BlendingMode.DISSOLVE,
      "darken": BlendingMode.DARKEN,
      "multiply": BlendingMode.MULTIPLY,
      "colorBurn": BlendingMode.COLOR_BURN,
      "linearBurn": BlendingMode.LINEAR_BURN,
      "darkerColor": BlendingMode.DARKER_COLOR,
      "add": BlendingMode.ADD,
      "lighten": BlendingMode.LIGHTEN,
      "screen": BlendingMode.SCREEN,
      "colorDodge": BlendingMode.COLOR_DODGE,
      "linearDodge": BlendingMode.LINEAR_DODGE,
      "lighterColor": BlendingMode.LIGHTER_COLOR,
      "overlay": BlendingMode.OVERLAY,
      "softLight": BlendingMode.SOFT_LIGHT,
      "hardLight": BlendingMode.HARD_LIGHT,
      "linearLight": BlendingMode.LINEAR_LIGHT,
      "vividLight": BlendingMode.VIVID_LIGHT,
      "pinLight": BlendingMode.PIN_LIGHT,
      "hardMix": BlendingMode.HARD_MIX,
      "difference": BlendingMode.DIFFERENCE,
      "exclusion": BlendingMode.EXCLUSION,
      "subtract": BlendingMode.SUBTRACT,
      "divide": BlendingMode.DIVIDE,
      "hue": BlendingMode.HUE,
      "saturation": BlendingMode.SATURATION,
      "color": BlendingMode.COLOR,
      "luminosity": BlendingMode.LUMINOSITY
    };
    
    var mode = blendModeMap["${params.blendMode}"];
    if (!mode) {
      throw new Error("Invalid blend mode: ${params.blendMode}");
    }
    
    layer.blendingMode = mode;
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name,
        blendMode: "${params.blendMode}"
      }
    };
  `,
  
  setLayer3d: (params: { compId: number; layerIndex: number; is3D: boolean }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    layer.threeDLayer = ${params.is3D};
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name,
        is3D: layer.threeDLayer
      }
    };
  `,
  
  setLayerVisibility: (params: { 
    compId: number; 
    layerIndex: number; 
    visible?: boolean;
    solo?: boolean;
    shy?: boolean;
    locked?: boolean;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    ` + (params.visible !== undefined ? `layer.enabled = ${params.visible};` : '') + `
    ` + (params.solo !== undefined ? `layer.solo = ${params.solo};` : '') + `
    ` + (params.shy !== undefined ? `layer.shy = ${params.shy};` : '') + `
    ` + (params.locked !== undefined ? `layer.locked = ${params.locked};` : '') + `
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name,
        visible: layer.enabled,
        solo: layer.solo,
        shy: layer.shy,
        locked: layer.locked
      }
    };
  `,
  
  setTrackMatte: (params: { compId: number; layerIndex: number; matteType: string }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var trackMatteMap = {
      "none": TrackMatteType.NO_TRACK_MATTE,
      "alpha": TrackMatteType.ALPHA,
      "alphaInverted": TrackMatteType.ALPHA_INVERTED,
      "luma": TrackMatteType.LUMA,
      "lumaInverted": TrackMatteType.LUMA_INVERTED
    };
    
    var matteType = trackMatteMap["${params.matteType}"];
    if (matteType === undefined) {
      throw new Error("Invalid track matte type: ${params.matteType}");
    }
    
    layer.trackMatteType = matteType;
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name,
        trackMatteType: "${params.matteType}"
      }
    };
  `,
  
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
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    if (!layer.threeDLayer) {
      throw new Error("Layer is not a 3D layer");
    }
    
    ` + (params.properties.orientation ? `layer.property("Orientation").setValue([${params.properties.orientation.join(',')}]);` : '') + `
    ` + (params.properties.xRotation !== undefined ? `layer.property("X Rotation").setValue(${params.properties.xRotation});` : '') + `
    ` + (params.properties.yRotation !== undefined ? `layer.property("Y Rotation").setValue(${params.properties.yRotation});` : '') + `
    ` + (params.properties.zRotation !== undefined ? `layer.property("Z Rotation").setValue(${params.properties.zRotation});` : '') + `
    
    ` + (params.properties.materialOptions ? `
      var materialOptions = layer.property("Material Options");
      var options = ${JSON.stringify(params.properties.materialOptions)};
      
      if (options.acceptsLights !== undefined) {
        materialOptions.property("Accepts Lights").setValue(options.acceptsLights ? 1 : 0);
      }
      if (options.acceptsShadows !== undefined) {
        materialOptions.property("Accepts Shadows").setValue(options.acceptsShadows ? 1 : 0);
      }
      if (options.castsShadows !== undefined) {
        materialOptions.property("Casts Shadows").setValue(options.castsShadows ? 1 : 0);
      }
      if (options.ambientCoefficient !== undefined) {
        materialOptions.property("Ambient").setValue(options.ambientCoefficient);
      }
      if (options.diffuseCoefficient !== undefined) {
        materialOptions.property("Diffuse").setValue(options.diffuseCoefficient);
      }
      if (options.specularCoefficient !== undefined) {
        materialOptions.property("Specular").setValue(options.specularCoefficient);
      }
      if (options.shininess !== undefined) {
        materialOptions.property("Shininess").setValue(options.shininess);
      }
    ` : '') + `
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name,
        is3D: true
      }
    };
  `,
  
  setLayerQuality: (params: { compId: number; layerIndex: number; quality: string }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var qualityMap = {
      "best": LayerQuality.BEST,
      "draft": LayerQuality.DRAFT,
      "wireframe": LayerQuality.WIREFRAME
    };
    
    var quality = qualityMap["${params.quality}"];
    if (!quality) {
      throw new Error("Invalid quality setting: ${params.quality}");
    }
    
    layer.quality = quality;
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name,
        quality: "${params.quality}"
      }
    };
  `,
  
  setMotionBlur: (params: { compId: number; layerIndex: number; enabled: boolean; adjustmentLayer?: boolean }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    layer.motionBlur = ${params.enabled};
    ` + (params.adjustmentLayer !== undefined ? `
      if (layer.adjustmentLayer) {
        // Adjustment layer motion blur affects layers below it
      }
    ` : '') + `
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name,
        motionBlur: layer.motionBlur
      }
    };
  `,
  
  setTimeRemapping: (params: { compId: number; layerIndex: number; enabled: boolean }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    if (!(layer instanceof AVLayer)) {
      throw new Error("Time remapping can only be applied to AV layers");
    }
    
    layer.timeRemapEnabled = ${params.enabled};
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name,
        timeRemapEnabled: layer.timeRemapEnabled
      }
    };
  `
};