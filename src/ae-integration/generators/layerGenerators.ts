import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';
import { generatorHelpers as gh } from './generatorHelpers.js';

export const layerGenerators: ScriptGeneratorModule = {
  addSolidLayer: (params: {
    compId: number;
    name?: string;
    color?: number[];
    width?: number;
    height?: number;
  }) => {
    let script = '';
    
    // Use helper for composition validation
    script += gh.getCompValidation(params.compId);
    
    // Create solid layer with parameters
    script += 'var layer = comp.layers.addSolid(\n';
    script += '  ' + gh.getParamWithDefault(params.color, [1, 1, 1]) + ',\n';
    script += '  ' + gh.getParamWithDefault(params.name, 'Solid') + ',\n';
    script += '  ' + (params.width ? params.width : 'comp.width') + ',\n';
    script += '  ' + (params.height ? params.height : 'comp.height') + ',\n';
    script += '  1.0\n';
    script += ');\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    index: layer.index,\n    name: layer.name\n  }');
    
    return script;
  },
  
  addTextLayer: (params: {
    compId: number;
    text: string;
    name?: string;
  }) => {
    let script = '';
    
    // Use helper for composition validation
    script += gh.getCompValidation(params.compId);
    
    script += 'var layer = comp.layers.addText("' + helpers.escapeString(params.text) + '");\n';
    if (params.name) {
      script += gh.setStringProperty('layer', 'name', params.name);
    }
    script += '\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    index: layer.index,\n    name: layer.name\n  }');
    
    return script;
  },
  
  addShapeLayer: (params: {
    compId: number;
    name?: string;
    shapeType?: string;
    properties?: any;
  }) => {
    let script = '';
    
    // Use helper for composition validation
    script += gh.getCompValidation(params.compId);
    
    script += 'var layer = comp.layers.addShape();\n';
    if (params.name) {
      script += gh.setStringProperty('layer', 'name', params.name);
    }
    script += '\n';
    
    script += '// Parse properties\n';
    script += 'var props = ' + (params.properties ? JSON.stringify(params.properties) : '{}') + ';\n';
    script += 'var shapeType = ' + gh.getParamWithDefault(params.shapeType, 'rectangle') + ';\n\n';
    
    script += '// Add shape content - create a shape group for better control\n';
    script += 'var contents = layer.property("ADBE Root Vectors Group");\n';
    script += 'var shapeGroup = contents.addProperty("ADBE Vector Group");\n';
    script += 'shapeGroup.name = "Shape 1";\n\n';
    
    script += '// Get the vectors group within the shape group\n';
    script += 'var vectors = shapeGroup.property("ADBE Vectors Group");\n\n';
    
    script += '// Add the shape path based on type\n';
    script += 'var shapePath;\n';
    script += 'if (shapeType === "rectangle") {\n';
    script += '  shapePath = vectors.addProperty("ADBE Vector Shape - Rect");\n';
    script += '  var size = props.size || [100, 100];\n';
    script += '  shapePath.property("ADBE Vector Rect Size").setValue(size);\n';
    script += '  \n';
    script += '  // Add corner radius if specified\n';
    script += '  if (props.cornerRadius && props.cornerRadius > 0) {\n';
    script += '    shapePath.property("ADBE Vector Rect Roundness").setValue(props.cornerRadius);\n';
    script += '  }\n';
    script += '} else if (shapeType === "ellipse") {\n';
    script += '  shapePath = vectors.addProperty("ADBE Vector Shape - Ellipse");\n';
    script += '  var size = props.size || [100, 100];\n';
    script += '  shapePath.property("ADBE Vector Ellipse Size").setValue(size);\n';
    script += '} else if (shapeType === "polygon" || shapeType === "star") {\n';
    script += '  shapePath = vectors.addProperty("ADBE Vector Shape - Star");\n';
    script += '  \n';
    script += '  // Set properties in specific order to avoid hidden property issues\n';
    script += gh.wrapInTryCatch(
      '    // First set the points - this is usually safe\n' +
      '    shapePath.property("ADBE Vector Star Points").setValue(props.points || 5);\n' +
      '    \n' +
      '    // Then set the outer radius\n' +
      '    shapePath.property("ADBE Vector Star Outer Radius").setValue(props.outerRadius || 100);\n' +
      '    \n' +
      '    // Set the type (polygon vs star) - do this AFTER setting basic properties\n' +
      '    if (shapeType === "polygon") {\n' +
      '      shapePath.property("ADBE Vector Star Type").setValue(1); // 1 = polygon\n' +
      '    } else {\n' +
      '      shapePath.property("ADBE Vector Star Type").setValue(2); // 2 = star\n' +
      '      // Only set inner radius for actual stars\n' +
      '      shapePath.property("ADBE Vector Star Inner Radius").setValue(props.innerRadius || 50);\n' +
      '    }\n',
      '    // If any property fails, continue with defaults\n' +
      '    // The shape is still created\n'
    );
    script += '}\n\n';
    
    script += '// Add fill to make the shape visible - add to vectors group\n';
    script += 'var fill = vectors.addProperty("ADBE Vector Graphic - Fill");\n';
    script += 'if (props.fillColor) {\n';
    script += '  fill.property("ADBE Vector Fill Color").setValue(props.fillColor);\n';
    script += '} else {\n';
    script += '  // Default red fill\n';
    script += '  fill.property("ADBE Vector Fill Color").setValue([1, 0, 0]);\n';
    script += '}\n\n';
    
    script += '// Add stroke if specified - add to vectors group\n';
    script += 'if (props.strokeWidth && props.strokeWidth > 0) {\n';
    script += '  var stroke = vectors.addProperty("ADBE Vector Graphic - Stroke");\n';
    script += '  stroke.property("ADBE Vector Stroke Width").setValue(props.strokeWidth);\n';
    script += '  if (props.strokeColor) {\n';
    script += '    stroke.property("ADBE Vector Stroke Color").setValue(props.strokeColor);\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += '// Set transform properties through Transform group for better compatibility\n';
    script += gh.wrapInTryCatch(
      '  var transform = layer.property("ADBE Transform Group");\n' +
      '  if (!transform) {\n' +
      '    throw new Error("Could not access transform group");\n' +
      '  }\n\n' +
      '  // Set position with validation\n' +
      '  var position = props.position || [comp.width/2, comp.height/2];\n' +
      '  var positionProp = transform.property("ADBE Position");\n' +
      '  if (positionProp && positionProp.canSetValue) {\n' +
      '    positionProp.setValue(position);\n' +
      '  }\n\n' +
      '  // Set scale - avoid zero scale which can cause issues\n' +
      '  if (props.scale !== undefined) {\n' +
      '    var scaleProp = transform.property("ADBE Scale");\n' +
      '    if (scaleProp && scaleProp.canSetValue) {\n' +
      '      var scaleValue = props.scale;\n' +
      '      // Ensure scale is not exactly zero to avoid property access issues\n' +
      '      if (scaleValue[0] === 0 && scaleValue[1] === 0) {\n' +
      '        scaleValue = [0.01, 0.01];\n' +
      '      }\n' +
      '      scaleProp.setValue(scaleValue);\n' +
      '    }\n' +
      '  }\n\n' +
      '  // Set rotation with validation\n' +
      '  if (props.rotation !== undefined) {\n' +
      '    var rotationProp = transform.property("ADBE Rotate Z");\n' +
      '    if (rotationProp && rotationProp.canSetValue) {\n' +
      '      rotationProp.setValue(props.rotation);\n' +
      '    }\n' +
      '  }\n\n' +
      '  // Set opacity with validation\n' +
      '  if (props.opacity !== undefined) {\n' +
      '    var opacityProp = transform.property("ADBE Opacity");\n' +
      '    if (opacityProp && opacityProp.canSetValue) {\n' +
      '      opacityProp.setValue(props.opacity);\n' +
      '    }\n' +
      '  }\n',
      '  // If transform properties fail, layer is still created with defaults\n' +
      '  // This prevents the entire operation from failing\n'
    );
    script += '\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    index: layer.index,\n    name: layer.name\n  }');
    
    return script;
  },
  
  addNullLayer: (params: { compId: number; name?: string; is3D?: boolean }) => {
    let script = '';
    
    // Use helper for composition validation
    script += gh.getCompValidation(params.compId);
    
    script += 'var layer = comp.layers.addNull();\n';
    if (params.name) {
      script += gh.setStringProperty('layer', 'name', params.name);
    }
    if (params.is3D) {
      script += 'layer.threeDLayer = true;\n';
    }
    script += '\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    index: layer.index,\n    name: layer.name\n  }');
    
    return script;
  },
  
  addAdjustmentLayer: (params: { compId: number; name?: string }) => {
    let script = '';
    
    // Use helper for composition validation
    script += gh.getCompValidation(params.compId);
    
    script += 'var layer = comp.layers.addSolid([1,1,1], ' + 
      gh.getParamWithDefault(params.name, 'Adjustment Layer') + 
      ', comp.width, comp.height, comp.pixelAspect);\n';
    script += 'layer.adjustmentLayer = true;\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    index: layer.index,\n    name: layer.name\n  }');
    
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
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    // Add the setPropertyValue helper function
    script += gh.getSetPropertyValueHelper();
    
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
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    index: layer.index,\n    name: layer.name,\n    modifiedAt: comp.time\n  }');
    
    return script;
  },
  
  duplicateLayer: (params: { compId: number; layerIndex: number }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += 'var duplicated = layer.duplicate();\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    originalIndex: layer.index,\n    duplicatedIndex: duplicated.index,\n    name: duplicated.name\n  }');
    
    return script;
  },
  
  deleteLayer: (params: { compId: number; layerIndex: number }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += 'var layerName = layer.name;\n';
    script += 'layer.remove();\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    deletedLayerName: layerName,\n    deletedLayerIndex: ' + params.layerIndex + '\n  }');
    
    return script;
  },
  
  reorderLayers: (params: { compId: number; layerIndex: number; newIndex: number }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += '// After Effects uses moveBefore/moveAfter methods\n';
    script += '// If newIndex is less than current, we need to move before\n';
    script += '// If newIndex is greater, we need to move after\n';
    script += 'var currentIndex = layer.index;\n';
    script += 'var targetIndex = ' + params.newIndex + ';\n\n';
    
    script += 'if (targetIndex < 1 || targetIndex > comp.numLayers) {\n';
    script += '  throw new Error("New index " + targetIndex + " is out of range. Valid range is 1 to " + comp.numLayers + " (composition has " + comp.numLayers + " layers)");\n';
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
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    oldIndex: currentIndex,\n    newIndex: layer.index\n  }');
    
    return script;
  },
  
  getLayerInfo: (params: { compId: number; layerIndex: number }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
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
    
    // Use helper for return value
    script += gh.generateSuccessReturn('info');
    
    return script;
  }
};