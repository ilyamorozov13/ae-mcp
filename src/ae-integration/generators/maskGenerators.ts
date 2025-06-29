import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';
import { generatorHelpers as gh } from './generatorHelpers.js';

export const maskGenerators: ScriptGeneratorModule = {
  addMask: (params: {
    compId: number;
    layerIndex: number;
    name?: string;
    maskShape?: {
      vertices: number[][];
      inTangents?: number[][];
      outTangents?: number[][];
      closed?: boolean;
    };
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += 'var mask = layer.property("Masks").addProperty("Mask");\n';
    if (params.name) {
      script += gh.setStringProperty('mask', 'name', params.name);
    }
    script += '\n';
    
    if (params.maskShape) {
      script += 'var shape = new Shape();\n';
      script += 'shape.vertices = ' + JSON.stringify(params.maskShape.vertices) + ';\n';
      
      if (params.maskShape.inTangents) {
        script += 'shape.inTangents = ' + JSON.stringify(params.maskShape.inTangents) + ';\n';
      }
      
      if (params.maskShape.outTangents) {
        script += 'shape.outTangents = ' + JSON.stringify(params.maskShape.outTangents) + ';\n';
      }
      
      script += 'shape.closed = ' + (params.maskShape.closed !== false) + ';\n\n';
      script += 'mask.property("Mask Path").setValue(shape);\n';
    }
    
    // Use helper for return value
    script += '\n';
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    maskIndex: mask.propertyIndex,\n    maskName: mask.name\n  }');
    
    return script;
  },

  addRectangularMask: (params: {
    compId: number;
    layerIndex: number;
    name?: string;
    bounds: {
      left: number;
      top: number;
      width: number;
      height: number;
    };
    roundness?: number;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += 'var mask = layer.property("Masks").addProperty("Mask");\n';
    if (params.name) {
      script += gh.setStringProperty('mask', 'name', params.name);
    }
    script += '\n';
    
    script += 'var bounds = ' + JSON.stringify(params.bounds) + ';\n';
    script += 'var roundness = ' + (params.roundness || 0) + ';\n\n';
    
    script += '// Calculate vertices for rectangle\n';
    script += 'var left = bounds.left;\n';
    script += 'var top = bounds.top;\n';
    script += 'var right = left + bounds.width;\n';
    script += 'var bottom = top + bounds.height;\n\n';
    
    script += 'var shape = new Shape();\n\n';
    
    script += 'if (roundness > 0) {\n';
    script += '  // Create rounded rectangle with bezier curves\n';
    script += '  var r = Math.min(roundness, bounds.width / 2, bounds.height / 2);\n';
    script += '  var c = r * 0.552284749831; // Bezier constant for circle approximation\n\n';
    
    script += '  shape.vertices = [\n';
    script += '    [left + r, top],\n';
    script += '    [right - r, top],\n';
    script += '    [right, top + r],\n';
    script += '    [right, bottom - r],\n';
    script += '    [right - r, bottom],\n';
    script += '    [left + r, bottom],\n';
    script += '    [left, bottom - r],\n';
    script += '    [left, top + r]\n';
    script += '  ];\n\n';
    
    script += '  shape.inTangents = [\n';
    script += '    [-c, 0],\n';
    script += '    [0, 0],\n';
    script += '    [0, -c],\n';
    script += '    [0, 0],\n';
    script += '    [c, 0],\n';
    script += '    [0, 0],\n';
    script += '    [0, c],\n';
    script += '    [0, 0]\n';
    script += '  ];\n\n';
    
    script += '  shape.outTangents = [\n';
    script += '    [0, 0],\n';
    script += '    [c, 0],\n';
    script += '    [0, 0],\n';
    script += '    [0, c],\n';
    script += '    [0, 0],\n';
    script += '    [-c, 0],\n';
    script += '    [0, 0],\n';
    script += '    [0, -c]\n';
    script += '  ];\n';
    script += '} else {\n';
    script += '  // Simple rectangle\n';
    script += '  shape.vertices = [\n';
    script += '    [left, top],\n';
    script += '    [right, top],\n';
    script += '    [right, bottom],\n';
    script += '    [left, bottom]\n';
    script += '  ];\n';
    script += '}\n\n';
    
    script += 'shape.closed = true;\n';
    script += 'mask.property("Mask Path").setValue(shape);\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    maskIndex: mask.propertyIndex,\n    maskName: mask.name\n  }');
    
    return script;
  },

  addEllipticalMask: (params: {
    compId: number;
    layerIndex: number;
    name?: string;
    center: number[];
    radius: number[];
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += 'var mask = layer.property("Masks").addProperty("Mask");\n';
    if (params.name) {
      script += gh.setStringProperty('mask', 'name', params.name);
    }
    script += '\n';
    
    script += 'var center = [' + params.center.join(',') + '];\n';
    script += 'var radius = [' + params.radius.join(',') + '];\n\n';
    
    script += '// Create ellipse using bezier curves\n';
    script += 'var rx = radius[0];\n';
    script += 'var ry = radius[1];\n';
    script += 'var cx = center[0];\n';
    script += 'var cy = center[1];\n\n';
    
    script += '// Bezier constant for circle approximation\n';
    script += 'var c = 0.552284749831;\n\n';
    
    script += 'var shape = new Shape();\n';
    script += 'shape.vertices = [\n';
    script += '  [cx + rx, cy],\n';
    script += '  [cx, cy + ry],\n';
    script += '  [cx - rx, cy],\n';
    script += '  [cx, cy - ry]\n';
    script += '];\n\n';
    
    script += 'shape.inTangents = [\n';
    script += '  [0, -ry * c],\n';
    script += '  [rx * c, 0],\n';
    script += '  [0, ry * c],\n';
    script += '  [-rx * c, 0]\n';
    script += '];\n\n';
    
    script += 'shape.outTangents = [\n';
    script += '  [0, ry * c],\n';
    script += '  [-rx * c, 0],\n';
    script += '  [0, -ry * c],\n';
    script += '  [rx * c, 0]\n';
    script += '];\n\n';
    
    script += 'shape.closed = true;\n';
    script += 'mask.property("Mask Path").setValue(shape);\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    maskIndex: mask.propertyIndex,\n    maskName: mask.name\n  }');
    
    return script;
  },

  modifyMaskPath: (params: {
    compId: number;
    layerIndex: number;
    maskIndex: number;
    maskShape: {
      vertices: number[][];
      inTangents?: number[][];
      outTangents?: number[][];
      closed?: boolean;
    };
    setKeyframe?: boolean;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += 'var mask = layer.property("Masks").property(' + params.maskIndex + ');\n';
    script += 'if (!mask) {\n';
    script += '  throw new Error("Mask not found");\n';
    script += '}\n\n';
    
    script += 'var shape = new Shape();\n';
    script += 'shape.vertices = ' + JSON.stringify(params.maskShape.vertices) + ';\n';
    
    if (params.maskShape.inTangents) {
      script += 'shape.inTangents = ' + JSON.stringify(params.maskShape.inTangents) + ';\n';
    }
    
    if (params.maskShape.outTangents) {
      script += 'shape.outTangents = ' + JSON.stringify(params.maskShape.outTangents) + ';\n';
    }
    
    script += 'shape.closed = ' + (params.maskShape.closed !== false) + ';\n\n';
    script += 'var maskPath = mask.property("Mask Path");\n\n';
    
    if (params.setKeyframe) {
      script += 'maskPath.setValueAtTime(comp.time, shape);\n';
    } else {
      script += 'maskPath.setValue(shape);\n';
    }
    script += '\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    maskIndex: ' + params.maskIndex + ',\n    maskName: mask.name,\n    keyframeSet: ' + (params.setKeyframe ? 'true' : 'false') + '\n  }');
    
    return script;
  },

  setMaskProperties: (params: {
    compId: number;
    layerIndex: number;
    maskIndex: number;
    properties: {
      maskMode?: string;
      inverted?: boolean;
      maskFeather?: number[];
      maskOpacity?: number;
      maskExpansion?: number;
      locked?: boolean;
    };
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += 'var mask = layer.property("Masks").property(' + params.maskIndex + ');\n';
    script += 'if (!mask) {\n';
    script += '  throw new Error("Mask not found");\n';
    script += '}\n\n';
    
    script += 'var props = ' + JSON.stringify(params.properties) + ';\n\n';
    
    if (params.properties.maskMode) {
      script += 'var modeMap = {\n';
      script += '  "none": MaskMode.NONE,\n';
      script += '  "add": MaskMode.ADD,\n';
      script += '  "subtract": MaskMode.SUBTRACT,\n';
      script += '  "intersect": MaskMode.INTERSECT,\n';
      script += '  "lighten": MaskMode.LIGHTEN,\n';
      script += '  "darken": MaskMode.DARKEN,\n';
      script += '  "difference": MaskMode.DIFFERENCE\n';
      script += '};\n';
      script += 'var mode = modeMap[props.maskMode];\n';
      script += 'if (mode !== undefined) {\n';
      script += '  mask.maskMode = mode;\n';
      script += '}\n\n';
    }
    
    if (params.properties.inverted !== undefined) {
      script += 'mask.inverted = ' + params.properties.inverted + ';\n';
    }
    
    if (params.properties.maskFeather) {
      script += 'mask.property("Mask Feather").setValue([' + params.properties.maskFeather.join(',') + ']);\n';
    }
    
    if (params.properties.maskOpacity !== undefined) {
      script += 'mask.property("Mask Opacity").setValue(' + params.properties.maskOpacity + ');\n';
    }
    
    if (params.properties.maskExpansion !== undefined) {
      script += 'mask.property("Mask Expansion").setValue(' + params.properties.maskExpansion + ');\n';
    }
    
    if (params.properties.locked !== undefined) {
      script += 'mask.locked = ' + params.properties.locked + ';\n';
    }
    
    script += '\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    maskIndex: ' + params.maskIndex + ',\n    maskName: mask.name\n  }');
    
    return script;
  },

  deleteMask: (params: {
    compId: number;
    layerIndex: number;
    maskIndex: number;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += 'var masks = layer.property("Masks");\n';
    script += 'var mask = masks.property(' + params.maskIndex + ');\n';
    script += 'if (!mask) {\n';
    script += '  throw new Error("Mask not found");\n';
    script += '}\n\n';
    
    script += 'var maskName = mask.name;\n';
    script += 'mask.remove();\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    deletedMaskIndex: ' + params.maskIndex + ',\n    deletedMaskName: maskName\n  }');
    
    return script;
  },

  getMaskInfo: (params: {
    compId: number;
    layerIndex: number;
    maskIndex?: number;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += 'var masks = layer.property("Masks");\n\n';
    
    if (params.maskIndex) {
      script += 'var mask = masks.property(' + params.maskIndex + ');\n';
      script += 'if (!mask) {\n';
      script += '  throw new Error("Mask not found");\n';
      script += '}\n\n';
      
      script += 'var shape = mask.property("Mask Path").value;\n\n';
      
      // Use helper for return value
      script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    mask: {\n      index: ' + params.maskIndex + ',\n      name: mask.name,\n      locked: mask.locked,\n      inverted: mask.inverted,\n      maskMode: mask.maskMode,\n      shape: {\n        vertices: shape.vertices,\n        inTangents: shape.inTangents,\n        outTangents: shape.outTangents,\n        closed: shape.closed\n      },\n      feather: mask.property("Mask Feather").value,\n      opacity: mask.property("Mask Opacity").value,\n      expansion: mask.property("Mask Expansion").value\n    }\n  }');
    } else {
      script += 'var maskList = [];\n';
      script += 'for (var i = 1; i <= masks.numProperties; i++) {\n';
      script += '  var mask = masks.property(i);\n';
      script += '  maskList.push({\n';
      script += '    index: i,\n';
      script += '    name: mask.name,\n';
      script += '    locked: mask.locked,\n';
      script += '    inverted: mask.inverted,\n';
      script += '    maskMode: mask.maskMode\n';
      script += '  });\n';
      script += '}\n\n';
      
      // Use helper for return value
      script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    numMasks: masks.numProperties,\n    masks: maskList\n  }');
    }
    
    return script;
  },

  animateMaskPath: (params: {
    compId: number;
    layerIndex: number;
    maskIndex: number;
    keyframes: Array<{
      time: number;
      maskShape: {
        vertices: number[][];
        inTangents?: number[][];
        outTangents?: number[][];
      };
    }>;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += 'var mask = layer.property("Masks").property(' + params.maskIndex + ');\n';
    script += 'if (!mask) {\n';
    script += '  throw new Error("Mask not found");\n';
    script += '}\n\n';
    
    script += 'var maskPath = mask.property("Mask Path");\n';
    script += 'var keyframes = ' + JSON.stringify(params.keyframes) + ';\n\n';
    
    script += 'for (var i = 0; i < keyframes.length; i++) {\n';
    script += '  var kf = keyframes[i];\n';
    script += '  var shape = new Shape();\n';
    script += '  shape.vertices = kf.maskShape.vertices;\n';
    script += '  shape.inTangents = kf.maskShape.inTangents || [];\n';
    script += '  shape.outTangents = kf.maskShape.outTangents || [];\n';
    script += '  shape.closed = true;\n\n';
    script += '  maskPath.setValueAtTime(kf.time, shape);\n';
    script += '}\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    maskIndex: ' + params.maskIndex + ',\n    maskName: mask.name,\n    keyframesSet: keyframes.length\n  }');
    
    return script;
  },

  convertMaskToShape: (params: {
    compId: number;
    layerIndex: number;
    maskIndex: number;
    createNewLayer?: boolean;
    targetLayerIndex?: number;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    
    script += 'var sourceLayer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!sourceLayer) {\n';
    script += '  throw new Error("Source layer not found");\n';
    script += '}\n\n';
    
    script += 'var mask = sourceLayer.property("Masks").property(' + params.maskIndex + ');\n';
    script += 'if (!mask) {\n';
    script += '  throw new Error("Mask not found");\n';
    script += '}\n\n';
    
    script += '// Get mask path shape\n';
    script += 'var maskPath = mask.property("Mask Path");\n';
    script += 'var shape = maskPath.value;\n\n';
    
    script += 'var targetLayer;\n\n';
    
    if (params.createNewLayer !== false) {
      script += '// Create new shape layer\n';
      script += 'targetLayer = comp.layers.addShape();\n';
      script += 'targetLayer.name = sourceLayer.name + " - " + mask.name + " Shape";\n\n';
      
      script += '// Match transform\n';
      script += 'targetLayer.property("Position").setValue(sourceLayer.property("Position").value);\n';
      script += 'targetLayer.property("Scale").setValue(sourceLayer.property("Scale").value);\n';
      script += 'targetLayer.property("Rotation").setValue(sourceLayer.property("Rotation").value);\n\n';
    } else {
      script += '// Add to existing shape layer\n';
      script += 'targetLayer = comp.layer(' + (params.targetLayerIndex || 1) + ');\n';
      script += 'if (!targetLayer || !(targetLayer instanceof ShapeLayer)) {\n';
      script += '  throw new Error("Target must be a shape layer");\n';
      script += '}\n\n';
    }
    
    script += '// Add shape path to shape layer\n';
    script += 'var contents = targetLayer.property("ADBE Root Vectors Group");\n';
    script += 'var shapeGroup = contents.addProperty("ADBE Vector Group");\n';
    script += 'shapeGroup.name = mask.name + " Path";\n\n';
    
    script += 'var shapePath = shapeGroup.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Group");\n';
    script += 'shapePath.property("ADBE Vector Shape").setValue(shape);\n\n';
    
    script += '// Add fill\n';
    script += 'var fill = shapeGroup.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");\n';
    script += 'fill.property("ADBE Vector Fill Color").setValue([1, 1, 1]);\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    sourceLayerName: sourceLayer.name,\n    targetLayerName: targetLayer.name,\n    targetLayerIndex: targetLayer.index,\n    maskName: mask.name\n  }');
    
    return script;
  }
};