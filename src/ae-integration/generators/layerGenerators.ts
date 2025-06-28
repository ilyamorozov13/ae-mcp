import { ScriptGeneratorModule } from './types';
import { helpers } from './helpers';

export const layerGenerators: ScriptGeneratorModule = {
  addSolidLayer: (params: {
    compId: number;
    name?: string;
    color?: number[];
    width?: number;
    height?: number;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layers.addSolid(
      [${params.color ? params.color.join(',') : '1,1,1'}],
      "${helpers.escapeString(params.name ? params.name : 'Solid')}",
      ${params.width ? params.width : 'comp.width'},
      ${params.height ? params.height : 'comp.height'},
      1.0
    );
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name
      }
    };
  `,
  
  addTextLayer: (params: {
    compId: number;
    text: string;
    name?: string;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layers.addText("${helpers.escapeString(params.text)}");
    ${params.name ? `layer.name = "${helpers.escapeString(params.name)}";` : ''}
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name
      }
    };
  `,
  
  addShapeLayer: (params: {
    compId: number;
    name?: string;
    shapeType?: string;
    properties?: any;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layers.addShape();
    ${params.name ? `layer.name = "${helpers.escapeString(params.name)}";` : ''}
    
    // Parse properties
    var props = ${params.properties ? JSON.stringify(params.properties) : '{}'};
    var shapeType = "${params.shapeType ? params.shapeType : 'rectangle'}";
    
    // Add shape content directly to the root vectors group
    var contents = layer.property("ADBE Root Vectors Group");
    
    // Add the shape path based on type
    var shapePath;
    if (shapeType === "rectangle") {
      shapePath = contents.addProperty("ADBE Vector Shape - Rect");
      var size = props.size || [100, 100];
      shapePath.property("ADBE Vector Rect Size").setValue(size);
      
      // Add corner radius if specified
      if (props.cornerRadius && props.cornerRadius > 0) {
        shapePath.property("ADBE Vector Rect Roundness").setValue(props.cornerRadius);
      }
    } else if (shapeType === "ellipse") {
      shapePath = contents.addProperty("ADBE Vector Shape - Ellipse");
      var size = props.size || [100, 100];
      shapePath.property("ADBE Vector Ellipse Size").setValue(size);
    } else if (shapeType === "polygon" || shapeType === "star") {
      shapePath = contents.addProperty("ADBE Vector Shape - Star");
      // Set type after creation
      if (shapeType === "polygon") {
        shapePath.property("ADBE Vector Star Type").setValue(1); // 1 = polygon
      } else {
        shapePath.property("ADBE Vector Star Type").setValue(2); // 2 = star
      }
      
      // Set points
      if (props.points) {
        shapePath.property("ADBE Vector Star Points").setValue(props.points);
      } else {
        shapePath.property("ADBE Vector Star Points").setValue(5);
      }
      
      // Set radii
      if (props.outerRadius) {
        shapePath.property("ADBE Vector Star Outer Radius").setValue(props.outerRadius);
      } else {
        shapePath.property("ADBE Vector Star Outer Radius").setValue(100);
      }
      
      if (shapeType === "star" && props.innerRadius) {
        shapePath.property("ADBE Vector Star Inner Radius").setValue(props.innerRadius);
      } else if (shapeType === "star") {
        shapePath.property("ADBE Vector Star Inner Radius").setValue(50);
      }
    }
    
    // Add fill to make the shape visible - MUST come after shape path
    var fill = contents.addProperty("ADBE Vector Graphic - Fill");
    if (props.fillColor) {
      fill.property("ADBE Vector Fill Color").setValue(props.fillColor);
    } else {
      // Default red fill
      fill.property("ADBE Vector Fill Color").setValue([1, 0, 0]);
    }
    
    // Add stroke if specified - comes after fill
    if (props.strokeWidth && props.strokeWidth > 0) {
      var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
      stroke.property("ADBE Vector Stroke Width").setValue(props.strokeWidth);
      if (props.strokeColor) {
        stroke.property("ADBE Vector Stroke Color").setValue(props.strokeColor);
      }
    }
    
    // Set transform properties
    var position = props.position || [comp.width/2, comp.height/2];
    layer.property("Position").setValue(position);
    
    if (props.scale) {
      layer.property("Scale").setValue(props.scale);
    }
    
    if (props.rotation !== undefined) {
      layer.property("Rotation").setValue(props.rotation);
    }
    
    if (props.opacity !== undefined) {
      layer.property("Opacity").setValue(props.opacity);
    }
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name
      }
    };
  `,
  
  addNullLayer: (params: { compId: number; name?: string; is3D?: boolean }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layers.addNull();
    ${params.name ? `layer.name = "${helpers.escapeString(params.name)}";` : ''}
    ${params.is3D ? `layer.threeDLayer = true;` : ''}
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name
      }
    };
  `,
  
  addAdjustmentLayer: (params: { compId: number; name?: string }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layers.addSolid([1,1,1], "${helpers.escapeString(params.name || 'Adjustment Layer')}", comp.width, comp.height, comp.pixelAspect);
    layer.adjustmentLayer = true;
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name
      }
    };
  `,
  
  modifyLayerProperties: (params: {
    compId: number;
    layerIndex: number;
    properties: {
      position?: number[];
      scale?: number[];
      rotation?: number;
      opacity?: number;
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
    
    // Helper function to set property value, handling keyframes
    function setPropertyValue(prop, value) {
      if (prop.numKeys > 0) {
        // Property has keyframes, use setValueAtTime at current comp time
        prop.setValueAtTime(comp.time, value);
      } else {
        // No keyframes, use setValue
        prop.setValue(value);
      }
    }
    
    ${params.properties.position ? `
    var positionProp = layer.property("Position");
    setPropertyValue(positionProp, [${params.properties.position.join(',')}]);
    ` : ''}
    
    ${params.properties.scale ? `
    var scaleProp = layer.property("Scale");
    setPropertyValue(scaleProp, [${params.properties.scale.join(',')}]);
    ` : ''}
    
    ${params.properties.rotation ? `
    var rotationProp = layer.property("Rotation");
    setPropertyValue(rotationProp, ${params.properties.rotation});
    ` : ''}
    
    ${params.properties.opacity ? `
    var opacityProp = layer.property("Opacity");
    setPropertyValue(opacityProp, ${params.properties.opacity});
    ` : ''}
    
    return {
      success: true,
      data: {
        index: layer.index,
        name: layer.name,
        modifiedAt: comp.time
      }
    };
  `,
  
  duplicateLayer: (params: { compId: number; layerIndex: number }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var duplicated = layer.duplicate();
    
    return {
      success: true,
      data: {
        originalIndex: layer.index,
        duplicatedIndex: duplicated.index,
        name: duplicated.name
      }
    };
  `,
  
  deleteLayer: (params: { compId: number; layerIndex: number }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var layerName = layer.name;
    layer.remove();
    
    return {
      success: true,
      data: {
        deletedLayerName: layerName,
        deletedLayerIndex: ${params.layerIndex}
      }
    };
  `,
  
  reorderLayers: (params: { compId: number; layerIndex: number; newIndex: number }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // After Effects uses moveBefore/moveAfter methods
    // If newIndex is less than current, we need to move before
    // If newIndex is greater, we need to move after
    var currentIndex = layer.index;
    var targetIndex = ${params.newIndex};
    
    if (targetIndex < 1 || targetIndex > comp.numLayers) {
      throw new Error("New index out of range");
    }
    
    if (targetIndex !== currentIndex) {
      if (targetIndex < currentIndex) {
        // Moving up (smaller index number)
        var targetLayer = comp.layer(targetIndex);
        layer.moveBefore(targetLayer);
      } else {
        // Moving down (larger index number)
        // When moving down, we need to account for the shift
        var adjustedTarget = targetIndex;
        if (targetIndex === comp.numLayers) {
          layer.moveToEnd();
        } else {
          var targetLayer = comp.layer(adjustedTarget + 1);
          layer.moveAfter(targetLayer);
        }
      }
    }
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        oldIndex: currentIndex,
        newIndex: layer.index
      }
    };
  `,
  
  getLayerInfo: (params: { compId: number; layerIndex: number }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var info = {
      index: layer.index,
      name: layer.name,
      enabled: layer.enabled,
      solo: layer.solo,
      shy: layer.shy,
      locked: layer.locked,
      hasVideo: layer.hasVideo,
      active: layer.active,
      nullLayer: layer.nullLayer,
      threeDLayer: layer.threeDLayer,
      startTime: layer.startTime,
      stretch: layer.stretch,
      inPoint: layer.inPoint,
      outPoint: layer.outPoint,
      parent: layer.parent ? layer.parent.index : null,
      timeRemapEnabled: layer.timeRemapEnabled
    };
    
    // Get transform properties
    var transform = {
      position: layer.property("Position").value,
      scale: layer.property("Scale").value,
      rotation: layer.property("Rotation").value,
      opacity: layer.property("Opacity").value
    };
    
    if (layer.threeDLayer) {
      transform.orientation = layer.property("Orientation").value;
      transform.xRotation = layer.property("X Rotation").value;
      transform.yRotation = layer.property("Y Rotation").value;
      transform.zRotation = layer.property("Z Rotation").value;
    }
    
    info.transform = transform;
    
    // Layer specific info
    if (layer instanceof TextLayer) {
      info.layerType = "text";
      info.text = layer.property("Source Text").value.text;
    } else if (layer instanceof ShapeLayer) {
      info.layerType = "shape";
    } else if (layer instanceof AVLayer) {
      if (layer.source instanceof CompItem) {
        info.layerType = "precomp";
        info.sourceId = layer.source.id;
      } else {
        info.layerType = "av";
      }
    } else if (layer.nullLayer) {
      info.layerType = "null";
    }
    
    return {
      success: true,
      data: info
    };
  `
};