import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

export const layerGenerators: ScriptGeneratorModule = {
  addSolidLayer: (params: {
    compId: number;
    name?: string;
    color?: number[];
    width?: number;
    height?: number;
  }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layers.addSolid(\n';
    script += '  [' + (params.color ? params.color.join(',') : '1,1,1') + '],\n';
    script += '  "' + helpers.escapeString(params.name ? params.name : 'Solid') + '",\n';
    script += '  ' + (params.width ? params.width : 'comp.width') + ',\n';
    script += '  ' + (params.height ? params.height : 'comp.height') + ',\n';
    script += '  1.0\n';
    script += ');\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  addTextLayer: (params: {
    compId: number;
    text: string;
    name?: string;
  }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layers.addText("' + helpers.escapeString(params.text) + '");\n';
    if (params.name) {
      script += 'layer.name = "' + helpers.escapeString(params.name) + '";\n';
    }
    script += '\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  addShapeLayer: (params: {
    compId: number;
    name?: string;
    shapeType?: string;
    properties?: any;
  }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layers.addShape();\n';
    if (params.name) {
      script += 'layer.name = "' + helpers.escapeString(params.name) + '";\n';
    }
    script += '\n';
    
    script += '// Parse properties\n';
    script += 'var props = ' + (params.properties ? JSON.stringify(params.properties) : '{}') + ';\n';
    script += 'var shapeType = "' + (params.shapeType ? params.shapeType : 'rectangle') + '";\n\n';
    
    script += '// Add shape content directly to the root vectors group\n';
    script += 'var contents = layer.property("ADBE Root Vectors Group");\n\n';
    
    script += '// Add the shape path based on type\n';
    script += 'var shapePath;\n';
    script += 'if (shapeType === "rectangle") {\n';
    script += '  shapePath = contents.addProperty("ADBE Vector Shape - Rect");\n';
    script += '  var size = props.size || [100, 100];\n';
    script += '  shapePath.property("ADBE Vector Rect Size").setValue(size);\n';
    script += '  \n';
    script += '  // Add corner radius if specified\n';
    script += '  if (props.cornerRadius && props.cornerRadius > 0) {\n';
    script += '    shapePath.property("ADBE Vector Rect Roundness").setValue(props.cornerRadius);\n';
    script += '  }\n';
    script += '} else if (shapeType === "ellipse") {\n';
    script += '  shapePath = contents.addProperty("ADBE Vector Shape - Ellipse");\n';
    script += '  var size = props.size || [100, 100];\n';
    script += '  shapePath.property("ADBE Vector Ellipse Size").setValue(size);\n';
    script += '} else if (shapeType === "polygon" || shapeType === "star") {\n';
    script += '  shapePath = contents.addProperty("ADBE Vector Shape - Star");\n';
    script += '  // Set type after creation\n';
    script += '  if (shapeType === "polygon") {\n';
    script += '    shapePath.property("ADBE Vector Star Type").setValue(1); // 1 = polygon\n';
    script += '  } else {\n';
    script += '    shapePath.property("ADBE Vector Star Type").setValue(2); // 2 = star\n';
    script += '  }\n';
    script += '  \n';
    script += '  // Set points\n';
    script += '  if (props.points) {\n';
    script += '    shapePath.property("ADBE Vector Star Points").setValue(props.points);\n';
    script += '  } else {\n';
    script += '    shapePath.property("ADBE Vector Star Points").setValue(5);\n';
    script += '  }\n';
    script += '  \n';
    script += '  // Set radii\n';
    script += '  if (props.outerRadius) {\n';
    script += '    shapePath.property("ADBE Vector Star Outer Radius").setValue(props.outerRadius);\n';
    script += '  } else {\n';
    script += '    shapePath.property("ADBE Vector Star Outer Radius").setValue(100);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (shapeType === "star" && props.innerRadius) {\n';
    script += '    shapePath.property("ADBE Vector Star Inner Radius").setValue(props.innerRadius);\n';
    script += '  } else if (shapeType === "star") {\n';
    script += '    shapePath.property("ADBE Vector Star Inner Radius").setValue(50);\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += '// Add fill to make the shape visible - MUST come after shape path\n';
    script += 'var fill = contents.addProperty("ADBE Vector Graphic - Fill");\n';
    script += 'if (props.fillColor) {\n';
    script += '  fill.property("ADBE Vector Fill Color").setValue(props.fillColor);\n';
    script += '} else {\n';
    script += '  // Default red fill\n';
    script += '  fill.property("ADBE Vector Fill Color").setValue([1, 0, 0]);\n';
    script += '}\n\n';
    
    script += '// Add stroke if specified - comes after fill\n';
    script += 'if (props.strokeWidth && props.strokeWidth > 0) {\n';
    script += '  var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");\n';
    script += '  stroke.property("ADBE Vector Stroke Width").setValue(props.strokeWidth);\n';
    script += '  if (props.strokeColor) {\n';
    script += '    stroke.property("ADBE Vector Stroke Color").setValue(props.strokeColor);\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += '// Set transform properties\n';
    script += 'var position = props.position || [comp.width/2, comp.height/2];\n';
    script += 'layer.property("Position").setValue(position);\n\n';
    
    script += 'if (props.scale) {\n';
    script += '  layer.property("Scale").setValue(props.scale);\n';
    script += '}\n\n';
    
    script += 'if (props.rotation !== undefined) {\n';
    script += '  layer.property("Rotation").setValue(props.rotation);\n';
    script += '}\n\n';
    
    script += 'if (props.opacity !== undefined) {\n';
    script += '  layer.property("Opacity").setValue(props.opacity);\n';
    script += '}\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  addNullLayer: (params: { compId: number; name?: string; is3D?: boolean }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layers.addNull();\n';
    if (params.name) {
      script += 'layer.name = "' + helpers.escapeString(params.name) + '";\n';
    }
    if (params.is3D) {
      script += 'layer.threeDLayer = true;\n';
    }
    script += '\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  addAdjustmentLayer: (params: { compId: number; name?: string }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layers.addSolid([1,1,1], "' + helpers.escapeString(params.name || 'Adjustment Layer') + '", comp.width, comp.height, comp.pixelAspect);\n';
    script += 'layer.adjustmentLayer = true;\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  modifyLayerProperties: (params: {
    compId: number;
    layerIndex: number;
    properties: {
      position?: number[];
      scale?: number[];
      rotation?: number;
      opacity?: number;
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
    
    script += '// Helper function to set property value, handling keyframes\n';
    script += 'function setPropertyValue(prop, value) {\n';
    script += '  if (prop.numKeys > 0) {\n';
    script += '    // Property has keyframes, use setValueAtTime at current comp time\n';
    script += '    prop.setValueAtTime(comp.time, value);\n';
    script += '  } else {\n';
    script += '    // No keyframes, use setValue\n';
    script += '    prop.setValue(value);\n';
    script += '  }\n';
    script += '}\n\n';
    
    if (params.properties.position) {
      script += 'var positionProp = layer.property("Position");\n';
      script += 'setPropertyValue(positionProp, [' + params.properties.position.join(',') + ']);\n\n';
    }
    
    if (params.properties.scale) {
      script += 'var scaleProp = layer.property("Scale");\n';
      script += 'setPropertyValue(scaleProp, [' + params.properties.scale.join(',') + ']);\n\n';
    }
    
    if (params.properties.rotation !== undefined) {
      script += 'var rotationProp = layer.property("Rotation");\n';
      script += 'setPropertyValue(rotationProp, ' + params.properties.rotation + ');\n\n';
    }
    
    if (params.properties.opacity !== undefined) {
      script += 'var opacityProp = layer.property("Opacity");\n';
      script += 'setPropertyValue(opacityProp, ' + params.properties.opacity + ');\n\n';
    }
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name,\n';
    script += '    modifiedAt: comp.time\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  duplicateLayer: (params: { compId: number; layerIndex: number }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += 'var duplicated = layer.duplicate();\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    originalIndex: layer.index,\n';
    script += '    duplicatedIndex: duplicated.index,\n';
    script += '    name: duplicated.name\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  deleteLayer: (params: { compId: number; layerIndex: number }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += 'var layerName = layer.name;\n';
    script += 'layer.remove();\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    deletedLayerName: layerName,\n';
    script += '    deletedLayerIndex: ' + params.layerIndex + '\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  reorderLayers: (params: { compId: number; layerIndex: number; newIndex: number }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += '// After Effects uses moveBefore/moveAfter methods\n';
    script += '// If newIndex is less than current, we need to move before\n';
    script += '// If newIndex is greater, we need to move after\n';
    script += 'var currentIndex = layer.index;\n';
    script += 'var targetIndex = ' + params.newIndex + ';\n\n';
    
    script += 'if (targetIndex < 1 || targetIndex > comp.numLayers) {\n';
    script += '  throw new Error("New index out of range");\n';
    script += '}\n\n';
    
    script += 'if (targetIndex !== currentIndex) {\n';
    script += '  if (targetIndex < currentIndex) {\n';
    script += '    // Moving up (smaller index number)\n';
    script += '    var targetLayer = comp.layer(targetIndex);\n';
    script += '    layer.moveBefore(targetLayer);\n';
    script += '  } else {\n';
    script += '    // Moving down (larger index number)\n';
    script += '    // When moving down, we need to account for the shift\n';
    script += '    var adjustedTarget = targetIndex;\n';
    script += '    if (targetIndex === comp.numLayers) {\n';
    script += '      layer.moveToEnd();\n';
    script += '    } else {\n';
    script += '      var targetLayer = comp.layer(adjustedTarget + 1);\n';
    script += '      layer.moveAfter(targetLayer);\n';
    script += '    }\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    layerName: layer.name,\n';
    script += '    oldIndex: currentIndex,\n';
    script += '    newIndex: layer.index\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  getLayerInfo: (params: { compId: number; layerIndex: number }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += 'var info = {\n';
    script += '  index: layer.index,\n';
    script += '  name: layer.name,\n';
    script += '  enabled: layer.enabled,\n';
    script += '  solo: layer.solo,\n';
    script += '  shy: layer.shy,\n';
    script += '  locked: layer.locked,\n';
    script += '  hasVideo: layer.hasVideo,\n';
    script += '  active: layer.active,\n';
    script += '  nullLayer: layer.nullLayer,\n';
    script += '  threeDLayer: layer.threeDLayer,\n';
    script += '  startTime: layer.startTime,\n';
    script += '  stretch: layer.stretch,\n';
    script += '  inPoint: layer.inPoint,\n';
    script += '  outPoint: layer.outPoint,\n';
    script += '  parent: layer.parent ? layer.parent.index : null,\n';
    script += '  timeRemapEnabled: layer.timeRemapEnabled\n';
    script += '};\n\n';
    
    script += '// Get transform properties\n';
    script += 'var transform = {\n';
    script += '  position: layer.property("Position").value,\n';
    script += '  scale: layer.property("Scale").value,\n';
    script += '  rotation: layer.property("Rotation").value,\n';
    script += '  opacity: layer.property("Opacity").value\n';
    script += '};\n\n';
    
    script += 'if (layer.threeDLayer) {\n';
    script += '  transform.orientation = layer.property("Orientation").value;\n';
    script += '  transform.xRotation = layer.property("X Rotation").value;\n';
    script += '  transform.yRotation = layer.property("Y Rotation").value;\n';
    script += '  transform.zRotation = layer.property("Z Rotation").value;\n';
    script += '}\n\n';
    
    script += 'info.transform = transform;\n\n';
    
    script += '// Layer specific info\n';
    script += 'if (layer instanceof TextLayer) {\n';
    script += '  info.layerType = "text";\n';
    script += '  info.text = layer.property("Source Text").value.text;\n';
    script += '} else if (layer instanceof ShapeLayer) {\n';
    script += '  info.layerType = "shape";\n';
    script += '} else if (layer instanceof AVLayer) {\n';
    script += '  if (layer.source instanceof CompItem) {\n';
    script += '    info.layerType = "precomp";\n';
    script += '    info.sourceId = layer.source.id;\n';
    script += '  } else {\n';
    script += '    info.layerType = "av";\n';
    script += '  }\n';
    script += '} else if (layer.nullLayer) {\n';
    script += '  info.layerType = "null";\n';
    script += '}\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: info\n';
    script += '};';
    
    return script;
  }
};