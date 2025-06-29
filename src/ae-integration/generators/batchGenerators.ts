import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';
import { generatorHelpers as gh } from './generatorHelpers.js';

export const batchGenerators: ScriptGeneratorModule = {
  batchExecute: (params: { commands: any[], sequential?: boolean }) => {
    // For batch execute, we'll process each command individually
    // The file bridge will handle them in parallel
    throw new Error("batch_execute should be handled at the server level, not in script generation");
  },
  
  batchCreateLayers: (params: { compId: number, layers: any[] }) => {
    let script = '';
    
    // Use helper for composition validation
    script += gh.getCompValidation(params.compId);
    
    script += 'var results = [];\n';
    script += 'var createdLayers = [];\n';
    script += 'var layers = ' + JSON.stringify(params.layers) + ';\n\n';
    
    script += 'for (var i = 0; i < layers.length; i++) {\n';
    script += '  var layerDef = layers[i];\n';
    script += '  try {\n';
    script += '    var layer;\n';
    script += '    var type = layerDef.type.toLowerCase();\n';
    script += '    \n';
    script += '    switch(type) {\n';
    script += '      case "solid":\n';
    script += '        var color = [0, 0, 0];\n';
    script += '        if (layerDef.properties && layerDef.properties.color) {\n';
    script += '          color = layerDef.properties.color;\n';
    script += '        }\n';
    script += '        layer = comp.layers.addSolid(color, layerDef.name || "Solid", comp.width, comp.height, 1);\n';
    script += '        break;\n';
    script += '        \n';
    script += '      case "text":\n';
    script += '        var text = "";\n';
    script += '        if (layerDef.properties && layerDef.properties.text) {\n';
    script += '          text = layerDef.properties.text;\n';
    script += '        }\n';
    script += '        layer = comp.layers.addText(text);\n';
    script += '        if (layerDef.name) layer.name = layerDef.name;\n';
    script += '        break;\n';
    script += '        \n';
    script += '      case "shape":\n';
    script += '        layer = comp.layers.addShape();\n';
    script += '        if (layerDef.name) layer.name = layerDef.name;\n';
    script += '        \n';
    script += '        // Apply shape properties if provided\n';
    script += '        if (layerDef.properties) {\n';
    script += '          var props = layerDef.properties;\n';
    script += '          var shapeType = props.shapeType || "rectangle";\n';
    script += '          var contents = layer.property("ADBE Root Vectors Group");\n';
    script += '          \n';
    script += '          // Add shape path\n';
    script += '          var shapePath;\n';
    script += '          if (shapeType === "rectangle") {\n';
    script += '            shapePath = contents.addProperty("ADBE Vector Shape - Rect");\n';
    script += '            if (props.size) {\n';
    script += '              shapePath.property("ADBE Vector Rect Size").setValue(props.size);\n';
    script += '            }\n';
    script += '            if (props.cornerRadius) {\n';
    script += '              shapePath.property("ADBE Vector Rect Roundness").setValue(props.cornerRadius);\n';
    script += '            }\n';
    script += '          } else if (shapeType === "ellipse") {\n';
    script += '            shapePath = contents.addProperty("ADBE Vector Shape - Ellipse");\n';
    script += '            if (props.size) {\n';
    script += '              shapePath.property("ADBE Vector Ellipse Size").setValue(props.size);\n';
    script += '            }\n';
    script += '          } else if (shapeType === "polygon" || shapeType === "star") {\n';
    script += '            shapePath = contents.addProperty("ADBE Vector Shape - Star");\n';
    script += '            \n';
    script += '            // Set properties in specific order to avoid hidden property issues\n';
    script += gh.wrapInTryCatch(
      '              // First set the points - this is usually safe\n' +
      '              if (props.points) {\n' +
      '                shapePath.property("ADBE Vector Star Points").setValue(props.points);\n' +
      '              }\n' +
      '              \n' +
      '              // Then set the outer radius\n' +
      '              if (props.outerRadius) {\n' +
      '                shapePath.property("ADBE Vector Star Outer Radius").setValue(props.outerRadius);\n' +
      '              }\n' +
      '              \n' +
      '              // Set the type (polygon vs star) - do this AFTER setting basic properties\n' +
      '              shapePath.property("ADBE Vector Star Type").setValue(shapeType === "star" ? 2 : 1);\n' +
      '              \n' +
      '              // Only set inner radius for actual stars\n' +
      '              if (shapeType === "star" && props.innerRadius) {\n' +
      '                shapePath.property("ADBE Vector Star Inner Radius").setValue(props.innerRadius);\n' +
      '              }\n',
      '              // If any property fails, continue with defaults\n'
    );
    script += '          }\n';
    script += '          \n';
    script += '          // Add fill\n';
    script += '          var fill = contents.addProperty("ADBE Vector Graphic - Fill");\n';
    script += '          if (props.fillColor) {\n';
    script += '            fill.property("ADBE Vector Fill Color").setValue(props.fillColor);\n';
    script += '          }\n';
    script += '          \n';
    script += '          // Add stroke if specified\n';
    script += '          if (props.strokeWidth && props.strokeWidth > 0) {\n';
    script += '            var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");\n';
    script += '            stroke.property("ADBE Vector Stroke Width").setValue(props.strokeWidth);\n';
    script += '            if (props.strokeColor) {\n';
    script += '              stroke.property("ADBE Vector Stroke Color").setValue(props.strokeColor);\n';
    script += '            }\n';
    script += '          }\n';
    script += '        }\n';
    script += '        break;\n';
    script += '        \n';
    script += '      case "null":\n';
    script += '        layer = comp.layers.addNull();\n';
    script += '        if (layerDef.name) layer.name = layerDef.name;\n';
    script += '        break;\n';
    script += '        \n';
    script += '      case "adjustment":\n';
    script += '        layer = comp.layers.addSolid([1,1,1], layerDef.name || "Adjustment Layer", comp.width, comp.height, comp.pixelAspect);\n';
    script += '        layer.adjustmentLayer = true;\n';
    script += '        break;\n';
    script += '        \n';
    script += '      default:\n';
    script += '        throw new Error("Unknown layer type: " + type);\n';
    script += '    }\n';
    script += '    \n';
    script += '    // Apply common properties\n';
    script += '    if (layerDef.properties) {\n';
    script += '      var props = layerDef.properties;\n';
    script += gh.wrapInTryCatch(
      '        if (props.position) layer.property("Position").setValue(props.position);\n' +
      '        \n' +
      '        // Handle scale with zero-scale protection\n' +
      '        if (props.scale) {\n' +
      '          var scaleValue = props.scale;\n' +
      '          // Avoid exact zero scale which can cause property access issues\n' +
      '          if (scaleValue[0] === 0 && scaleValue[1] === 0) {\n' +
      '            scaleValue = [0.01, 0.01];\n' +
      '          }\n' +
      '          layer.property("Scale").setValue(scaleValue);\n' +
      '        }\n' +
      '        \n' +
      '        if (props.rotation !== undefined) layer.property("Rotation").setValue(props.rotation);\n' +
      '        if (props.opacity !== undefined) layer.property("Opacity").setValue(props.opacity);\n',
      '        // Continue even if some properties fail\n'
    );
    script += '    }\n';
    script += '    \n';
    script += '    // Store the layer reference and original index for later\n';
    script += '    createdLayers.push({\n';
    script += '      layer: layer,\n';
    script += '      originalIndex: i,\n';
    script += '      type: type,\n';
    script += '      name: layer.name\n';
    script += '    });\n';
    script += '    \n';
    script += '  } catch (e) {\n';
    script += '    results.push({\n';
    script += '      success: false,\n';
    script += '      error: String(e),\n';
    script += '      type: layerDef.type,\n';
    script += '      name: layerDef.name\n';
    script += '    });\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += '// After all layers are created, get their final indices\n';
    script += '// Since layers are added at the top, the last created layer will be at index 1\n';
    script += '// and the first created layer will be at the bottom\n';
    script += 'for (var i = 0; i < createdLayers.length; i++) {\n';
    script += '  var layerInfo = createdLayers[i];\n';
    script += '  // Calculate the correct index: layers created later have lower indices\n';
    script += '  var expectedIndex = createdLayers.length - i;\n';
    script += '  \n';
    script += '  results.push({\n';
    script += '    success: true,\n';
    script += '    index: expectedIndex,\n';
    script += '    name: layerInfo.name,\n';
    script += '    type: layerInfo.type,\n';
    script += '    originalOrder: layerInfo.originalIndex\n';
    script += '  });\n';
    script += '}\n\n';
    
    script += 'var successCount = createdLayers.length;\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    total: layers.length,\n    successful: successCount,\n    results: results,\n    layerOrder: "First in array = bottom layer (highest index), Last in array = top layer (index 1)"\n  }');
    
    return script;
  },
  
  batchModifyLayerProperties: (params: { compId: number, modifications: any[] }) => {
    let script = '';
    
    // Use helper for composition validation
    script += gh.getCompValidation(params.compId);
    
    script += 'var results = [];\n';
    script += 'var modifications = ' + JSON.stringify(params.modifications) + ';\n\n';
    
    // Add the setPropertyValue helper function
    script += gh.getSetPropertyValueHelper();
    
    script += 'for (var i = 0; i < modifications.length; i++) {\n';
    script += '  var mod = modifications[i];\n';
    script += '  try {\n';
    script += '    var layer = comp.layer(mod.layerIndex);\n';
    script += '    if (!layer) {\n';
    script += '      results.push({\n';
    script += '        success: false,\n';
    script += '        error: "Layer " + mod.layerIndex + " not found"\n';
    script += '      });\n';
    script += '      continue;\n';
    script += '    }\n';
    script += '    \n';
    script += '    var props = mod.properties;\n';
    script += '    \n';
    script += '    if (props.position) {\n';
    script += '      setPropertyValue(layer.property("Position"), props.position);\n';
    script += '    }\n';
    script += '    \n';
    script += '    if (props.scale) {\n';
    script += '      setPropertyValue(layer.property("Scale"), props.scale);\n';
    script += '    }\n';
    script += '    \n';
    script += '    if (props.rotation !== undefined) {\n';
    script += '      setPropertyValue(layer.property("Rotation"), props.rotation);\n';
    script += '    }\n';
    script += '    \n';
    script += '    if (props.opacity !== undefined) {\n';
    script += '      setPropertyValue(layer.property("Opacity"), props.opacity);\n';
    script += '    }\n';
    script += '    \n';
    script += '    results.push({\n';
    script += '      success: true,\n';
    script += '      layerIndex: mod.layerIndex,\n';
    script += '      layerName: layer.name\n';
    script += '    });\n';
    script += '    \n';
    script += '  } catch (e) {\n';
    script += '    results.push({\n';
    script += '      success: false,\n';
    script += '      error: String(e),\n';
    script += '      layerIndex: mod.layerIndex\n';
    script += '    });\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'var successCount = 0;\n';
    script += 'for (var i = 0; i < results.length; i++) {\n';
    script += '  if (results[i].success) successCount++;\n';
    script += '}\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    total: modifications.length,\n    successful: successCount,\n    results: results\n  }');
    
    return script;
  }
};