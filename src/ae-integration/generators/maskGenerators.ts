import { ScriptGeneratorModule } from './types';
import { helpers } from './helpers';

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
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var mask = layer.property("Masks").addProperty("Mask");
    ${params.name ? `mask.name = "${helpers.escapeString(params.name)}";` : ''}
    
    ${params.maskShape ? `
      var shape = new Shape();
      shape.vertices = ${JSON.stringify(params.maskShape.vertices)};
      ${params.maskShape.inTangents ? `shape.inTangents = ${JSON.stringify(params.maskShape.inTangents)};` : ''}
      ${params.maskShape.outTangents ? `shape.outTangents = ${JSON.stringify(params.maskShape.outTangents)};` : ''}
      shape.closed = ${params.maskShape.closed !== false};
      
      mask.property("Mask Path").setValue(shape);
    ` : ''}
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        maskIndex: mask.propertyIndex,
        maskName: mask.name
      }
    };
  `,

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
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var mask = layer.property("Masks").addProperty("Mask");
    ${params.name ? `mask.name = "${helpers.escapeString(params.name)}";` : ''}
    
    var bounds = ${JSON.stringify(params.bounds)};
    var roundness = ${params.roundness || 0};
    
    // Calculate vertices for rectangle
    var left = bounds.left;
    var top = bounds.top;
    var right = left + bounds.width;
    var bottom = top + bounds.height;
    
    var shape = new Shape();
    
    if (roundness > 0) {
      // Create rounded rectangle with bezier curves
      var r = Math.min(roundness, bounds.width / 2, bounds.height / 2);
      var c = r * 0.552284749831; // Bezier constant for circle approximation
      
      shape.vertices = [
        [left + r, top],
        [right - r, top],
        [right, top + r],
        [right, bottom - r],
        [right - r, bottom],
        [left + r, bottom],
        [left, bottom - r],
        [left, top + r]
      ];
      
      shape.inTangents = [
        [-c, 0],
        [0, 0],
        [0, -c],
        [0, 0],
        [c, 0],
        [0, 0],
        [0, c],
        [0, 0]
      ];
      
      shape.outTangents = [
        [0, 0],
        [c, 0],
        [0, 0],
        [0, c],
        [0, 0],
        [-c, 0],
        [0, 0],
        [0, -c]
      ];
    } else {
      // Simple rectangle
      shape.vertices = [
        [left, top],
        [right, top],
        [right, bottom],
        [left, bottom]
      ];
    }
    
    shape.closed = true;
    mask.property("Mask Path").setValue(shape);
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        maskIndex: mask.propertyIndex,
        maskName: mask.name
      }
    };
  `,

  addEllipticalMask: (params: {
    compId: number;
    layerIndex: number;
    name?: string;
    center: number[];
    radius: number[];
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var mask = layer.property("Masks").addProperty("Mask");
    ${params.name ? `mask.name = "${helpers.escapeString(params.name)}";` : ''}
    
    var center = [${params.center.join(',')}];
    var radius = [${params.radius.join(',')}];
    
    // Create ellipse using bezier curves
    var rx = radius[0];
    var ry = radius[1];
    var cx = center[0];
    var cy = center[1];
    
    // Bezier constant for circle approximation
    var c = 0.552284749831;
    
    var shape = new Shape();
    shape.vertices = [
      [cx + rx, cy],
      [cx, cy + ry],
      [cx - rx, cy],
      [cx, cy - ry]
    ];
    
    shape.inTangents = [
      [0, -ry * c],
      [rx * c, 0],
      [0, ry * c],
      [-rx * c, 0]
    ];
    
    shape.outTangents = [
      [0, ry * c],
      [-rx * c, 0],
      [0, -ry * c],
      [rx * c, 0]
    ];
    
    shape.closed = true;
    mask.property("Mask Path").setValue(shape);
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        maskIndex: mask.propertyIndex,
        maskName: mask.name
      }
    };
  `,

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
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var mask = layer.property("Masks").property(${params.maskIndex});
    if (!mask) {
      throw new Error("Mask not found");
    }
    
    var shape = new Shape();
    shape.vertices = ${JSON.stringify(params.maskShape.vertices)};
    ${params.maskShape.inTangents ? `shape.inTangents = ${JSON.stringify(params.maskShape.inTangents)};` : ''}
    ${params.maskShape.outTangents ? `shape.outTangents = ${JSON.stringify(params.maskShape.outTangents)};` : ''}
    shape.closed = ${params.maskShape.closed !== false};
    
    var maskPath = mask.property("Mask Path");
    
    ${params.setKeyframe ? `
      maskPath.setValueAtTime(comp.time, shape);
    ` : `
      maskPath.setValue(shape);
    `}
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        maskIndex: ${params.maskIndex},
        maskName: mask.name,
        keyframeSet: ${params.setKeyframe ? 'true' : 'false'}
      }
    };
  `,

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
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var mask = layer.property("Masks").property(${params.maskIndex});
    if (!mask) {
      throw new Error("Mask not found");
    }
    
    var props = ${JSON.stringify(params.properties)};
    
    ${params.properties.maskMode ? `
      var modeMap = {
        "none": MaskMode.NONE,
        "add": MaskMode.ADD,
        "subtract": MaskMode.SUBTRACT,
        "intersect": MaskMode.INTERSECT,
        "lighten": MaskMode.LIGHTEN,
        "darken": MaskMode.DARKEN,
        "difference": MaskMode.DIFFERENCE
      };
      var mode = modeMap[props.maskMode];
      if (mode !== undefined) {
        mask.maskMode = mode;
      }
    ` : ''}
    
    ${params.properties.inverted !== undefined ? `mask.inverted = ${params.properties.inverted};` : ''}
    ${params.properties.maskFeather ? `mask.property("Mask Feather").setValue([${params.properties.maskFeather.join(',')}]);` : ''}
    ${params.properties.maskOpacity !== undefined ? `mask.property("Mask Opacity").setValue(${params.properties.maskOpacity});` : ''}
    ${params.properties.maskExpansion !== undefined ? `mask.property("Mask Expansion").setValue(${params.properties.maskExpansion});` : ''}
    ${params.properties.locked !== undefined ? `mask.locked = ${params.properties.locked};` : ''}
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        maskIndex: ${params.maskIndex},
        maskName: mask.name
      }
    };
  `,

  deleteMask: (params: {
    compId: number;
    layerIndex: number;
    maskIndex: number;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var masks = layer.property("Masks");
    var mask = masks.property(${params.maskIndex});
    if (!mask) {
      throw new Error("Mask not found");
    }
    
    var maskName = mask.name;
    mask.remove();
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        deletedMaskIndex: ${params.maskIndex},
        deletedMaskName: maskName
      }
    };
  `,

  getMaskInfo: (params: {
    compId: number;
    layerIndex: number;
    maskIndex?: number;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var masks = layer.property("Masks");
    
    ${params.maskIndex ? `
      var mask = masks.property(${params.maskIndex});
      if (!mask) {
        throw new Error("Mask not found");
      }
      
      var shape = mask.property("Mask Path").value;
      
      return {
        success: true,
        data: {
          layerName: layer.name,
          mask: {
            index: ${params.maskIndex},
            name: mask.name,
            locked: mask.locked,
            inverted: mask.inverted,
            maskMode: mask.maskMode,
            shape: {
              vertices: shape.vertices,
              inTangents: shape.inTangents,
              outTangents: shape.outTangents,
              closed: shape.closed
            },
            feather: mask.property("Mask Feather").value,
            opacity: mask.property("Mask Opacity").value,
            expansion: mask.property("Mask Expansion").value
          }
        }
      };
    ` : `
      var maskList = [];
      for (var i = 1; i <= masks.numProperties; i++) {
        var mask = masks.property(i);
        maskList.push({
          index: i,
          name: mask.name,
          locked: mask.locked,
          inverted: mask.inverted,
          maskMode: mask.maskMode
        });
      }
      
      return {
        success: true,
        data: {
          layerName: layer.name,
          numMasks: masks.numProperties,
          masks: maskList
        }
      };
    `}
  `,

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
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var mask = layer.property("Masks").property(${params.maskIndex});
    if (!mask) {
      throw new Error("Mask not found");
    }
    
    var maskPath = mask.property("Mask Path");
    var keyframes = ${JSON.stringify(params.keyframes)};
    
    for (var i = 0; i < keyframes.length; i++) {
      var kf = keyframes[i];
      var shape = new Shape();
      shape.vertices = kf.maskShape.vertices;
      shape.inTangents = kf.maskShape.inTangents || [];
      shape.outTangents = kf.maskShape.outTangents || [];
      shape.closed = true;
      
      maskPath.setValueAtTime(kf.time, shape);
    }
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        maskIndex: ${params.maskIndex},
        maskName: mask.name,
        keyframesSet: keyframes.length
      }
    };
  `,

  convertMaskToShape: (params: {
    compId: number;
    layerIndex: number;
    maskIndex: number;
    createNewLayer?: boolean;
    targetLayerIndex?: number;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var sourceLayer = comp.layer(${params.layerIndex});
    if (!sourceLayer) {
      throw new Error("Source layer not found");
    }
    
    var mask = sourceLayer.property("Masks").property(${params.maskIndex});
    if (!mask) {
      throw new Error("Mask not found");
    }
    
    // Get mask path shape
    var maskPath = mask.property("Mask Path");
    var shape = maskPath.value;
    
    var targetLayer;
    
    ${params.createNewLayer !== false ? `
      // Create new shape layer
      targetLayer = comp.layers.addShape();
      targetLayer.name = sourceLayer.name + " - " + mask.name + " Shape";
      
      // Match transform
      targetLayer.property("Position").setValue(sourceLayer.property("Position").value);
      targetLayer.property("Scale").setValue(sourceLayer.property("Scale").value);
      targetLayer.property("Rotation").setValue(sourceLayer.property("Rotation").value);
    ` : `
      // Add to existing shape layer
      targetLayer = comp.layer(${params.targetLayerIndex});
      if (!targetLayer || !(targetLayer instanceof ShapeLayer)) {
        throw new Error("Target must be a shape layer");
      }
    `}
    
    // Add shape path to shape layer
    var contents = targetLayer.property("ADBE Root Vectors Group");
    var shapeGroup = contents.addProperty("ADBE Vector Group");
    shapeGroup.name = mask.name + " Path";
    
    var shapePath = shapeGroup.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Group");
    shapePath.property("ADBE Vector Shape").setValue(shape);
    
    // Add fill
    var fill = shapeGroup.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
    fill.property("ADBE Vector Fill Color").setValue([1, 1, 1]);
    
    return {
      success: true,
      data: {
        sourceLayerName: sourceLayer.name,
        targetLayerName: targetLayer.name,
        targetLayerIndex: targetLayer.index,
        maskName: mask.name
      }
    };
  `
};