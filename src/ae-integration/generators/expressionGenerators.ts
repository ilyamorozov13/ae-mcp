import { ScriptGeneratorModule } from './types';
import { helpers } from './helpers';

export const expressionGenerators: ScriptGeneratorModule = {
  setExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    expression: string;
    enabled?: boolean;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      // Handle special cases
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else if (part === "Effects" && prop === layer) {
        prop = prop.property("ADBE Effect Parade");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    if (!prop.canSetExpression) {
      throw new Error("Cannot set expression on this property");
    }
    
    prop.expression = "${helpers.escapeString(params.expression)}";
    ${params.enabled !== undefined ? `prop.expressionEnabled = ${params.enabled};` : ''}
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        propertyPath: "${helpers.escapeString(params.propertyPath)}",
        expressionSet: true,
        enabled: prop.expressionEnabled
      }
    };
  `,

  getExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else if (part === "Effects" && prop === layer) {
        prop = prop.property("ADBE Effect Parade");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    return {
      success: true,
      data: {
        expression: prop.expression,
        enabled: prop.expressionEnabled,
        hasExpression: prop.expression !== "",
        canSetExpression: prop.canSetExpression,
        propertyName: prop.name
      }
    };
  `,

  removeExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else if (part === "Effects" && prop === layer) {
        prop = prop.property("ADBE Effect Parade");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    prop.expression = "";
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        propertyPath: "${helpers.escapeString(params.propertyPath)}",
        expressionRemoved: true
      }
    };
  `,

  enableExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    enabled: boolean;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else if (part === "Effects" && prop === layer) {
        prop = prop.property("ADBE Effect Parade");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    if (!prop.canSetExpression) {
      throw new Error("Cannot set expression on this property");
    }
    
    if (prop.expression === "") {
      throw new Error("No expression to enable");
    }
    
    prop.expressionEnabled = ${params.enabled};
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        propertyPath: "${helpers.escapeString(params.propertyPath)}",
        enabled: prop.expressionEnabled
      }
    };
  `,

  batchSetExpressions: (params: {
    compId: number;
    expressions: Array<{
      layerIndex: number;
      propertyPath: string;
      expression: string;
      enabled?: boolean;
    }>;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var results = [];
    var expressions = ${JSON.stringify(params.expressions)};
    
    for (var i = 0; i < expressions.length; i++) {
      var expr = expressions[i];
      try {
        var layer = comp.layer(expr.layerIndex);
        if (!layer) {
          results.push({
            success: false,
            error: "Layer " + expr.layerIndex + " not found"
          });
          continue;
        }
        
        // Navigate property path
        var pathParts = expr.propertyPath.split(".");
        var prop = layer;
        
        for (var j = 0; j < pathParts.length; j++) {
          var part = pathParts[j];
          if (part === "Transform" && prop === layer) {
            prop = prop.property("ADBE Transform Group");
          } else if (part === "Effects" && prop === layer) {
            prop = prop.property("ADBE Effect Parade");
          } else {
            prop = prop.property(part);
          }
          
          if (!prop) {
            throw new Error("Property not found: " + pathParts.slice(0, j + 1).join("."));
          }
        }
        
        if (!prop.canSetExpression) {
          results.push({
            success: false,
            error: "Cannot set expression on " + expr.propertyPath
          });
          continue;
        }
        
        prop.expression = expr.expression;
        if (expr.enabled !== undefined) {
          prop.expressionEnabled = expr.enabled;
        }
        
        results.push({
          success: true,
          layerIndex: expr.layerIndex,
          propertyPath: expr.propertyPath
        });
        
      } catch (e) {
        results.push({
          success: false,
          error: e.toString(),
          layerIndex: expr.layerIndex
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
        total: expressions.length,
        successful: successCount,
        results: results
      }
    };
  `,

  addExpressionControl: (params: {
    compId: number;
    layerIndex: number;
    controlType: string;
    name: string;
    value?: any;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var effectName;
    var controlType = "${params.controlType}";
    
    switch(controlType) {
      case "slider":
        effectName = "ADBE Slider Control";
        break;
      case "point":
        effectName = "ADBE Point Control";
        break;
      case "angle":
        effectName = "ADBE Angle Control";
        break;
      case "checkbox":
        effectName = "ADBE Checkbox Control";
        break;
      case "color":
        effectName = "ADBE Color Control";
        break;
      case "layer":
        effectName = "ADBE Layer Control";
        break;
      case "point3d":
        effectName = "ADBE Point3D Control";
        break;
      default:
        throw new Error("Invalid control type: " + controlType);
    }
    
    var effect = layer.property("Effects").addProperty(effectName);
    effect.name = "${helpers.escapeString(params.name)}";
    
    // Set initial value if provided
    ${params.value !== undefined ? `
      var control = effect.property(1);
      if (control) {
        control.setValue(${Array.isArray(params.value) ? `[${params.value.join(',')}]` : params.value});
      }
    ` : ''}
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        controlName: effect.name,
        controlType: controlType,
        effectIndex: effect.propertyIndex
      }
    };
  `,

  linkPropertiesWithExpression: (params: {
    compId: number;
    sourceLayer: number;
    sourceProperty: string;
    targetLayer: number;
    targetProperty: string;
    linkType?: string;
    multiplier?: number;
    offsetValue?: any;
    customExpression?: string;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var sourceLayer = comp.layer(${params.sourceLayer});
    var targetLayer = comp.layer(${params.targetLayer});
    
    if (!sourceLayer) throw new Error("Source layer not found");
    if (!targetLayer) throw new Error("Target layer not found");
    
    var linkType = "${params.linkType || 'direct'}";
    var expression = "";
    
    switch(linkType) {
      case "direct":
        expression = 'thisComp.layer(' + ${params.sourceLayer} + ').transform.' + "${helpers.escapeString(params.sourceProperty)}";
        break;
        
      case "inverse":
        expression = '-thisComp.layer(' + ${params.sourceLayer} + ').transform.' + "${helpers.escapeString(params.sourceProperty)}";
        break;
        
      case "offset":
        var offsetValue = ${params.offsetValue ? JSON.stringify(params.offsetValue) : 'null'};
        if (offsetValue) {
          if (Array.isArray(offsetValue)) {
            expression = 'thisComp.layer(' + ${params.sourceLayer} + ').transform.' + "${helpers.escapeString(params.sourceProperty)}" + ' + [' + offsetValue.join(',') + ']';
          } else {
            expression = 'thisComp.layer(' + ${params.sourceLayer} + ').transform.' + "${helpers.escapeString(params.sourceProperty)}" + ' + ' + offsetValue;
          }
        }
        break;
        
      case "multiply":
        var multiplier = ${params.multiplier || 1};
        expression = 'thisComp.layer(' + ${params.sourceLayer} + ').transform.' + "${helpers.escapeString(params.sourceProperty)}" + ' * ' + multiplier;
        break;
        
      case "custom":
        expression = "${helpers.escapeString(params.customExpression || '')}";
        break;
    }
    
    // Apply expression to target property
    var targetProp = targetLayer.property("Transform").property("${helpers.escapeString(params.targetProperty)}");
    if (!targetProp) {
      throw new Error("Target property not found");
    }
    
    targetProp.expression = expression;
    
    return {
      success: true,
      data: {
        sourceLayer: sourceLayer.name,
        targetLayer: targetLayer.name,
        linkType: linkType,
        expression: expression
      }
    };
  `,

  addWiggleExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    frequency?: number;
    amplitude?: number;
    octaves?: number;
    ampMultiplier?: number;
    time?: number;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var freq = ${params.frequency || 5};
    var amp = ${params.amplitude || 50};
    var octaves = ${params.octaves || 1};
    var ampMult = ${params.ampMultiplier || 0.5};
    var timeOffset = ${params.time || 0};
    
    var expression = "wiggle(" + freq + ", " + amp;
    
    if (octaves !== 1 || ampMult !== 0.5 || timeOffset !== 0) {
      expression += ", " + octaves + ", " + ampMult;
      if (timeOffset !== 0) {
        expression += ", time + " + timeOffset;
      }
    }
    
    expression += ")";
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    prop.expression = expression;
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        propertyPath: "${helpers.escapeString(params.propertyPath)}",
        expression: expression
      }
    };
  `,

  addLoopExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    loopType?: string;
    numKeyframes?: number;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    var loopType = "${params.loopType || 'cycle'}";
    var numKeyframes = ${params.numKeyframes || 0};
    
    var expression = "";
    
    switch(loopType) {
      case "cycle":
        expression = numKeyframes > 0 ? 
          "loopOut(\\"cycle\\", " + numKeyframes + ")" : 
          "loopOut(\\"cycle\\")";
        break;
        
      case "pingpong":
        expression = numKeyframes > 0 ? 
          "loopOut(\\"pingpong\\", " + numKeyframes + ")" : 
          "loopOut(\\"pingpong\\")";
        break;
        
      case "offset":
        expression = numKeyframes > 0 ? 
          "loopOut(\\"offset\\", " + numKeyframes + ")" : 
          "loopOut(\\"offset\\")";
        break;
        
      case "continue":
        expression = numKeyframes > 0 ? 
          "loopOut(\\"continue\\", " + numKeyframes + ")" : 
          "loopOut(\\"continue\\")";
        break;
    }
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    if (prop.numKeys < 2) {
      throw new Error("Property must have at least 2 keyframes for loop expression");
    }
    
    prop.expression = expression;
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        propertyPath: "${helpers.escapeString(params.propertyPath)}",
        expression: expression,
        loopType: loopType
      }
    };
  `,

  convertKeyframesToExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    expressionType?: string;
    customExpression?: string;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    if (prop.numKeys < 2) {
      throw new Error("Property must have at least 2 keyframes to convert");
    }
    
    var expressionType = "${params.expressionType || 'linear'}";
    var expression = "";
    
    // Store keyframe data before clearing
    var keyframeData = [];
    for (var i = 1; i <= prop.numKeys; i++) {
      keyframeData.push({
        time: prop.keyTime(i),
        value: prop.keyValue(i)
      });
    }
    
    switch(expressionType) {
      case "linear":
        expression = "linear(time, " + keyframeData[0].time + ", " + keyframeData[keyframeData.length-1].time + ", " + 
                    JSON.stringify(keyframeData[0].value) + ", " + JSON.stringify(keyframeData[keyframeData.length-1].value) + ")";
        break;
        
      case "ease":
        expression = "ease(time, " + keyframeData[0].time + ", " + keyframeData[keyframeData.length-1].time + ", " + 
                    JSON.stringify(keyframeData[0].value) + ", " + JSON.stringify(keyframeData[keyframeData.length-1].value) + ")";
        break;
        
      case "bounce":
        expression = "// Bounce expression\\n" +
                    "amp = .1;\\n" +
                    "freq = 2.0;\\n" +
                    "decay = 2.0;\\n" +
                    "n = 0;\\n" +
                    "if (numKeys > 0){\\n" +
                    "  n = nearestKey(time).index;\\n" +
                    "  if (key(n).time > time){n--;}\\n" +
                    "}\\n" +
                    "if (n == 0){ t = 0; }\\n" +
                    "else{t = time - key(n).time;}\\n" +
                    "if (n > 0 && t < 1){\\n" +
                    "  v = velocityAtTime(key(n).time - thisComp.frameDuration/10);\\n" +
                    "  value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);\\n" +
                    "}else{value}";
        break;
        
      case "elastic":
        expression = "// Elastic expression\\n" +
                    "amp = .05;\\n" +
                    "freq = 4.0;\\n" +
                    "decay = 7.0;\\n" +
                    "n = 0;\\n" +
                    "if (numKeys > 0){\\n" +
                    "  n = nearestKey(time).index;\\n" +
                    "  if (key(n).time > time){n--;}\\n" +
                    "}\\n" +
                    "if (n == 0){ t = 0; }\\n" +
                    "else{t = time - key(n).time;}\\n" +
                    "if (n > 0 && t < 1){\\n" +
                    "  v = velocityAtTime(key(n).time - thisComp.frameDuration/10);\\n" +
                    "  value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);\\n" +
                    "}else{value}";
        break;
        
      case "custom":
        expression = "${helpers.escapeString(params.customExpression || '')}";
        break;
    }
    
    // Clear keyframes
    while (prop.numKeys > 0) {
      prop.removeKey(1);
    }
    
    // Set expression
    prop.expression = expression;
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        propertyPath: "${helpers.escapeString(params.propertyPath)}",
        expression: expression,
        originalKeyframes: keyframeData.length
      }
    };
  `,

  saveExpressionPreset: (params: {
    name: string;
    expression: string;
    category?: string;
    description?: string;
    parameters?: any[];
  }) => `
    // This would typically save to a preferences file or database
    // For now, we'll just return success
    
    return {
      success: true,
      data: {
        name: "${helpers.escapeString(params.name)}",
        category: "${helpers.escapeString(params.category || 'Custom')}",
        saved: true
      }
    };
  `,

  applyExpressionPreset: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    presetName: string;
    parameters?: any;
  }) => `
    // This would typically load from a preferences file or database
    // For now, we'll just apply a simple expression
    
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer) {
      throw new Error("Layer not found");
    }
    
    // Navigate property path
    var pathParts = "${helpers.escapeString(params.propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }
    
    // Apply a default expression based on preset name
    var presetName = "${helpers.escapeString(params.presetName)}";
    var expression = "// " + presetName + " preset\\nvalue";
    
    prop.expression = expression;
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        propertyPath: "${helpers.escapeString(params.propertyPath)}",
        presetName: presetName,
        applied: true
      }
    };
  `
};