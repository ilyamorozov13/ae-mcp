import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

export const effectsAndKeyframeGenerators: ScriptGeneratorModule = {
  applyEffect: (params: {
    compId: number;
    layerIndex: number;
    effectName: string;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Apply the effect
    var effect = layer.property("Effects").addProperty("${helpers.escapeString(params.effectName)}");
    
    if (!effect) {
      throw new Error("Failed to apply effect: " + "${params.effectName}");
    }
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        effectName: effect.name,
        effectIndex: effect.propertyIndex
      }
    };
  `,
  
  setKeyframe: (params: {
    compId: number;
    layerIndex: number;
    property: string;
    time: number;
    value: any;
  }) => {
    // Build the time assignment based on whether time is provided
    const timeAssignment = params.time !== undefined && params.time !== null 
      ? `var time = ${params.time};`
      : `var time = comp.time;`;
    
    return `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Get time value - use provided time or current comp time
    ${timeAssignment}
    
    // Normalize property name - AE uses specific casing
    var propertyName = "${helpers.escapeString(params.property)}";
    var propertyMap = {
      "position": "Position",
      "scale": "Scale", 
      "rotation": "Rotation",
      "opacity": "Opacity"
    };
    
    // Use mapped name if available, otherwise use as-is
    var normalizedProperty = propertyMap[propertyName.toLowerCase()] ? propertyMap[propertyName.toLowerCase()] : propertyName;
    
    var prop = layer.property(normalizedProperty);
    if (!prop) {
      // Try Transform group for transform properties
      if (["Position", "Scale", "Rotation"].indexOf(normalizedProperty) !== -1) {
        var transform = layer.property("Transform");
        if (transform) {
          prop = transform.property(normalizedProperty);
        }
      }
      
      if (!prop) {
        throw new Error("Property not found: " + normalizedProperty + " (original: " + propertyName + ")");
      }
    }
    
    // Check if property can have keyframes
    if (!prop.canVaryOverTime) {
      throw new Error("Property cannot be keyframed: ${helpers.escapeString(params.property)}");
    }
    
    // Get value
    var value = ${params.value !== undefined && params.value !== null 
      ? (Array.isArray(params.value) ? `[${params.value.join(',')}]` : params.value) 
      : 'prop.value'};
    
    // Final validation before calling setValueAtTime
    if (time === undefined || time === null) {
      throw new Error("Time is still undefined after all checks!");
    }
    
    if (value === undefined || value === null) {
      throw new Error("Value is undefined!");
    }
    
    // Validate array values for Position, Scale
    var arrayProps = ["Position", "Scale"];
    if (arrayProps.indexOf(normalizedProperty) !== -1) {
      if (!(value instanceof Array)) {
        throw new Error(normalizedProperty + " requires an array value, got: " + typeof value);
      }
      if (value.length < 2 || value.length > 3) {
        throw new Error(normalizedProperty + " requires 2 or 3 values, got " + value.length + ": [" + value.join(", ") + "]");
      }
      
      // Prevent zero scale values
      if (normalizedProperty === "Scale") {
        for (var i = 0; i < value.length; i++) {
          if (value[i] === 0) {
            // Replace zero with small value to avoid divide by zero
            value[i] = 0.1; // Use 0.1% instead of 0%
          }
        }
      }
    }
    
    try {
      // Ensure time is a number
      var numTime = parseFloat(time);
      if (isNaN(numTime)) {
        throw new Error("Time is not a valid number: " + time);
      }
      
      prop.setValueAtTime(numTime, value);
    } catch (e) {
      throw new Error("Failed to set keyframe at time " + time + " with value " + value + ": " + e.toString());
    }
    
    return {
      success: true,
      data: {
        property: "${helpers.escapeString(params.property)}",
        time: time,
        value: value,
        numKeys: prop.numKeys
      }
    };
  `;
  },
  
  batchKeyframes: (params: { compId: number, keyframes: any[] }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var results = [];
    var keyframes = ${JSON.stringify(params.keyframes)};
    
    for (var i = 0; i < keyframes.length; i++) {
      var kf = keyframes[i];
      try {
        var layer = comp.layer(kf.layerIndex);
        if (!layer) {
          results.push({success: false, error: "Layer " + kf.layerIndex + " not found"});
          continue;
        }
        
        // Property name normalization
        var propertyMap = {
          "position": "Position",
          "scale": "Scale",
          "rotation": "Rotation",
          "opacity": "Opacity"
        };
        var propName = propertyMap[kf.property.toLowerCase()] ? propertyMap[kf.property.toLowerCase()] : kf.property;
        
        var prop = layer.property(propName);
        if (!prop) {
          // Try under Transform
          var transform = layer.property("Transform");
          if (transform) {
            prop = transform.property(propName);
          }
        }
        
        if (!prop) {
          results.push({success: false, error: "Property " + propName + " not found on layer " + kf.layerIndex});
          continue;
        }
        
        // Fix zero scale values
        var value = kf.value;
        if (propName === "Scale" && value instanceof Array) {
          for (var j = 0; j < value.length; j++) {
            if (value[j] === 0) value[j] = 0.1;
          }
        }
        
        prop.setValueAtTime(kf.time, value);
        results.push({success: true, layer: kf.layerIndex, property: propName, time: kf.time});
        
      } catch (e) {
        results.push({success: false, error: e.toString(), layer: kf.layerIndex});
      }
    }
    
    var successCount = 0;
    for (var i = 0; i < results.length; i++) {
      if (results[i].success) successCount++;
    }
    
    return {
      success: true,
      data: {
        total: keyframes.length,
        successful: successCount,
        results: results
      }
    };
  `
};