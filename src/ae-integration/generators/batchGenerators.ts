import { ScriptGeneratorModule } from './types';
import { helpers } from './helpers';

export const batchGenerators: ScriptGeneratorModule = {
  batchExecute: (params: { commands: any[], sequential?: boolean }) => {
    // For batch execute, we'll process each command individually
    // The file bridge will handle them in parallel
    throw new Error("batch_execute should be handled at the server level, not in script generation");
  },
  
  batchCreateLayers: (params: { compId: number, layers: any[] }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var results = [];
    var layers = ${JSON.stringify(params.layers)};
    
    for (var i = 0; i < layers.length; i++) {
      var layerDef = layers[i];
      try {
        var layer;
        var type = layerDef.type.toLowerCase();
        
        switch(type) {
          case "solid":
            var color = [0, 0, 0];
            if (layerDef.properties && layerDef.properties.color) {
              color = layerDef.properties.color;
            }
            layer = comp.layers.addSolid(color, layerDef.name || "Solid", comp.width, comp.height, 1);
            break;
            
          case "text":
            var text = "";
            if (layerDef.properties && layerDef.properties.text) {
              text = layerDef.properties.text;
            }
            layer = comp.layers.addText(text);
            if (layerDef.name) layer.name = layerDef.name;
            break;
            
          case "shape":
            layer = comp.layers.addShape();
            if (layerDef.name) layer.name = layerDef.name;
            
            // Apply shape properties if provided
            if (layerDef.properties) {
              var props = layerDef.properties;
              var shapeType = props.shapeType || "rectangle";
              var contents = layer.property("ADBE Root Vectors Group");
              
              // Add shape path
              var shapePath;
              if (shapeType === "rectangle") {
                shapePath = contents.addProperty("ADBE Vector Shape - Rect");
                if (props.size) {
                  shapePath.property("ADBE Vector Rect Size").setValue(props.size);
                }
                if (props.cornerRadius) {
                  shapePath.property("ADBE Vector Rect Roundness").setValue(props.cornerRadius);
                }
              } else if (shapeType === "ellipse") {
                shapePath = contents.addProperty("ADBE Vector Shape - Ellipse");
                if (props.size) {
                  shapePath.property("ADBE Vector Ellipse Size").setValue(props.size);
                }
              } else if (shapeType === "polygon" || shapeType === "star") {
                shapePath = contents.addProperty("ADBE Vector Shape - Star");
                shapePath.property("ADBE Vector Star Type").setValue(shapeType === "star" ? 2 : 1);
                if (props.points) {
                  shapePath.property("ADBE Vector Star Points").setValue(props.points);
                }
                if (props.outerRadius) {
                  shapePath.property("ADBE Vector Star Outer Radius").setValue(props.outerRadius);
                }
                if (shapeType === "star" && props.innerRadius) {
                  shapePath.property("ADBE Vector Star Inner Radius").setValue(props.innerRadius);
                }
              }
              
              // Add fill
              var fill = contents.addProperty("ADBE Vector Graphic - Fill");
              if (props.fillColor) {
                fill.property("ADBE Vector Fill Color").setValue(props.fillColor);
              }
              
              // Add stroke if specified
              if (props.strokeWidth && props.strokeWidth > 0) {
                var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
                stroke.property("ADBE Vector Stroke Width").setValue(props.strokeWidth);
                if (props.strokeColor) {
                  stroke.property("ADBE Vector Stroke Color").setValue(props.strokeColor);
                }
              }
            }
            break;
            
          case "null":
            layer = comp.layers.addNull();
            if (layerDef.name) layer.name = layerDef.name;
            break;
            
          case "adjustment":
            layer = comp.layers.addSolid([1,1,1], layerDef.name || "Adjustment Layer", comp.width, comp.height, comp.pixelAspect);
            layer.adjustmentLayer = true;
            break;
            
          default:
            throw new Error("Unknown layer type: " + type);
        }
        
        // Apply common properties
        if (layerDef.properties) {
          var props = layerDef.properties;
          if (props.position) layer.property("Position").setValue(props.position);
          if (props.scale) layer.property("Scale").setValue(props.scale);
          if (props.rotation !== undefined) layer.property("Rotation").setValue(props.rotation);
          if (props.opacity !== undefined) layer.property("Opacity").setValue(props.opacity);
        }
        
        results.push({
          success: true,
          index: layer.index,
          name: layer.name,
          type: type
        });
        
      } catch (e) {
        results.push({
          success: false,
          error: e.toString(),
          type: layerDef.type,
          name: layerDef.name
        });
      }
    }
    
    var successCount = 0;
    for (var i = 0; i < results.length; i++) {
      if (results[i].success) successCount++;
    }
    
    return {
      success: true,
      data: {
        total: layers.length,
        successful: successCount,
        results: results
      }
    };
  `,
  
  batchModifyLayerProperties: (params: { compId: number, modifications: any[] }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var results = [];
    var modifications = ${JSON.stringify(params.modifications)};
    
    for (var i = 0; i < modifications.length; i++) {
      var mod = modifications[i];
      try {
        var layer = comp.layer(mod.layerIndex);
        if (!layer) {
          results.push({
            success: false,
            error: "Layer " + mod.layerIndex + " not found"
          });
          continue;
        }
        
        var props = mod.properties;
        
        // Helper function to set property value
        function setPropertyValue(prop, value) {
          if (prop.numKeys > 0) {
            prop.setValueAtTime(comp.time, value);
          } else {
            prop.setValue(value);
          }
        }
        
        if (props.position) {
          setPropertyValue(layer.property("Position"), props.position);
        }
        
        if (props.scale) {
          setPropertyValue(layer.property("Scale"), props.scale);
        }
        
        if (props.rotation !== undefined) {
          setPropertyValue(layer.property("Rotation"), props.rotation);
        }
        
        if (props.opacity !== undefined) {
          setPropertyValue(layer.property("Opacity"), props.opacity);
        }
        
        results.push({
          success: true,
          layerIndex: mod.layerIndex,
          layerName: layer.name
        });
        
      } catch (e) {
        results.push({
          success: false,
          error: e.toString(),
          layerIndex: mod.layerIndex
        });
      }
    }
    
    var successCount = 0;
    for (var i = 0; i < results.length; i++) {
      if (results[i].success) successCount++;
    }
    
    return {
      success: true,
      data: {
        total: modifications.length,
        successful: successCount,
        results: results
      }
    };
  `
};