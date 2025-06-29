import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';
import { generatorHelpers as gh } from './generatorHelpers.js';

export const expressionGenerators: ScriptGeneratorModule = {
  setExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    expression: string;
    enabled?: boolean;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    // Use helper for property navigation
    script += gh.navigatePropertyPath('"' + helpers.escapeString(params.propertyPath) + '"');
    
    // Check capability
    script += gh.checkPropertyCapability('prop', 'expression');
    
    script += 'prop.expression = "' + helpers.escapeString(params.expression) + '";\n';
    if (params.enabled !== undefined) {
      script += 'prop.expressionEnabled = ' + params.enabled + ';\n';
    }
    script += '\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    propertyPath: "' + helpers.escapeString(params.propertyPath) + '",\n    expressionSet: true,\n    enabled: prop.expressionEnabled\n  }');
    
    return script;
  },

  getExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    // Use helper for property navigation
    script += gh.navigatePropertyPath('"' + helpers.escapeString(params.propertyPath) + '"');
    
    script += 'var result = {\n';
    script += '  hasExpression: prop.expressionEnabled,\n';
    script += '  expression: prop.expression,\n';
    script += '  enabled: prop.expressionEnabled,\n';
    script += '  canSetExpression: prop.canSetExpression,\n';
    script += '  propertyPath: "' + helpers.escapeString(params.propertyPath) + '",\n';
    script += '  layerName: layer.name\n';
    script += '};\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('result');
    
    return script;
  },

  removeExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    // Use helper for property navigation
    script += gh.navigatePropertyPath('"' + helpers.escapeString(params.propertyPath) + '"');
    
    script += 'if (!prop.expressionEnabled) {\n';
    script += '  throw new Error("Property does not have an expression");\n';
    script += '}\n\n';
    
    script += 'prop.expression = "";\n';
    script += 'prop.expressionEnabled = false;\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    propertyPath: "' + helpers.escapeString(params.propertyPath) + '",\n    expressionRemoved: true\n  }');
    
    return script;
  },

  enableExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    enabled: boolean;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    // Use helper for property navigation
    script += gh.navigatePropertyPath('"' + helpers.escapeString(params.propertyPath) + '"');
    
    script += 'if (prop.expression === "") {\n';
    script += '  throw new Error("Property does not have an expression to enable/disable");\n';
    script += '}\n\n';
    
    script += 'prop.expressionEnabled = ' + params.enabled + ';\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    propertyPath: "' + helpers.escapeString(params.propertyPath) + '",\n    expressionEnabled: ' + params.enabled + '\n  }');
    
    return script;
  },

  batchSetExpressions: (params: {
    compId: number;
    expressions: Array<{
      layerIndex: number;
      propertyPath: string;
      expression: string;
      enabled?: boolean;
    }>;
  }) => {
    let script = '';
    
    // Use helper for composition validation
    script += gh.getCompValidation(params.compId);
    
    script += 'var expressions = ' + JSON.stringify(params.expressions) + ';\n';
    script += 'var results = [];\n\n';
    
    script += 'for (var i = 0; i < expressions.length; i++) {\n';
    script += '  var expr = expressions[i];\n';
    script += '  \n';
    script += '  try {\n';
    script += '    var layer = comp.layer(expr.layerIndex);\n';
    script += '    if (!layer) {\n';
    script += '      throw new Error("Layer " + expr.layerIndex + " not found");\n';
    script += '    }\n';
    script += '    \n';
    script += '    // Navigate property path\n';
    script += '    var pathParts = expr.propertyPath.split(".");\n';
    script += '    var prop = layer;\n';
    script += '    \n';
    script += '    for (var j = 0; j < pathParts.length; j++) {\n';
    script += '      var part = pathParts[j];\n';
    script += '      if (part === "Transform" && prop === layer) {\n';
    script += '        prop = prop.property("ADBE Transform Group");\n';
    script += '      } else if (part === "Effects" && prop === layer) {\n';
    script += '        prop = prop.property("ADBE Effect Parade");\n';
    script += '      } else {\n';
    script += '        prop = prop.property(part);\n';
    script += '      }\n';
    script += '      \n';
    script += '      if (!prop) {\n';
    script += '        throw new Error("Property not found: " + pathParts.slice(0, j + 1).join("."));\n';
    script += '      }\n';
    script += '    }\n';
    script += '    \n';
    script += '    if (!prop.canSetExpression) {\n';
    script += '      throw new Error("Cannot set expression on property: " + expr.propertyPath);\n';
    script += '    }\n';
    script += '    \n';
    script += '    prop.expression = expr.expression;\n';
    script += '    if (expr.enabled !== undefined) {\n';
    script += '      prop.expressionEnabled = expr.enabled;\n';
    script += '    }\n';
    script += '    \n';
    script += '    results.push({\n';
    script += '      success: true,\n';
    script += '      layerIndex: expr.layerIndex,\n';
    script += '      propertyPath: expr.propertyPath,\n';
    script += '      layerName: layer.name\n';
    script += '    });\n';
    script += '  } catch (e) {\n';
    script += '    results.push({\n';
    script += '      success: false,\n';
    script += '      layerIndex: expr.layerIndex,\n';
    script += '      propertyPath: expr.propertyPath,\n';
    script += '      error: String(e)\n';
    script += '    });\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'var successCount = 0;\n';
    script += 'for (var i = 0; i < results.length; i++) {\n';
    script += '  if (results[i].success) successCount++;\n';
    script += '}\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    total: expressions.length,\n    successful: successCount,\n    results: results\n  }');
    
    return script;
  },

  addExpressionControl: (params: {
    compId: number;
    layerIndex: number;
    controlType: string;
    name: string;
    value?: any;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    script += '// Get Effects property\n';
    script += 'var effects = layer.property("Effects");\n';
    script += 'if (!effects) {\n';
    script += '  throw new Error("Cannot access Effects property");\n';
    script += '}\n\n';
    
    script += '// Map control types to effect names\n';
    script += 'var controlMap = {\n';
    script += '  "slider": "ADBE Slider Control",\n';
    script += '  "point": "ADBE Point Control",\n';
    script += '  "angle": "ADBE Angle Control",\n';
    script += '  "checkbox": "ADBE Checkbox Control",\n';
    script += '  "color": "ADBE Color Control",\n';
    script += '  "layer": "ADBE Layer Control",\n';
    script += '  "point3d": "ADBE Point3D Control"\n';
    script += '};\n\n';
    
    script += 'var effectName = controlMap["' + params.controlType + '"];\n';
    script += 'if (!effectName) {\n';
    script += '  throw new Error("Invalid control type: ' + params.controlType + '");\n';
    script += '}\n\n';
    
    script += '// Add the control\n';
    script += 'var control = effects.addProperty(effectName);\n';
    script += 'control.name = "' + helpers.escapeString(params.name) + '";\n\n';
    
    // Set initial value if provided
    if (params.value !== undefined) {
      script += '// Set initial value\n';
      script += 'var valueProp = control.property(1);\n';
      if (Array.isArray(params.value)) {
        script += 'valueProp.setValue([' + params.value.join(',') + ']);\n';
      } else {
        script += 'valueProp.setValue(' + params.value + ');\n';
      }
    }
    script += '\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    controlName: control.name,\n    controlType: "' + params.controlType + '",\n    effectIndex: control.propertyIndex,\n    layerName: layer.name\n  }');
    
    return script;
  },

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
  }) => {
    let script = '';
    
    // Use helper for composition validation
    script += gh.getCompValidation(params.compId);
    
    script += '// Get source layer\n';
    script += 'var sourceLayer = comp.layer(' + params.sourceLayer + ');\n';
    script += 'if (!sourceLayer) {\n';
    script += '  throw new Error("Source layer not found at index ' + params.sourceLayer + '");\n';
    script += '}\n\n';
    
    script += '// Get target layer\n';
    script += 'var targetLayer = comp.layer(' + params.targetLayer + ');\n';
    script += 'if (!targetLayer) {\n';
    script += '  throw new Error("Target layer not found at index ' + params.targetLayer + '");\n';
    script += '}\n\n';
    
    script += '// Build expression based on link type\n';
    script += 'var expression = "";\n';
    script += 'var linkType = "' + (params.linkType || 'direct') + '";\n\n';
    
    script += 'switch(linkType) {\n';
    script += '  case "direct":\n';
    script += '    expression = "comp.layer(\\\\\\"" + sourceLayer.name + "\\\\\\").transform.' + params.sourceProperty.toLowerCase() + '";\n';
    script += '    break;\n';
    script += '  \n';
    script += '  case "inverse":\n';
    script += '    expression = "-comp.layer(\\\\\\"" + sourceLayer.name + "\\\\\\").transform.' + params.sourceProperty.toLowerCase() + '";\n';
    script += '    break;\n';
    script += '  \n';
    script += '  case "offset":\n';
    if (params.offsetValue !== undefined) {
      if (Array.isArray(params.offsetValue)) {
        script += '    var offset = [' + params.offsetValue.join(',') + '];\n';
        script += '    expression = "comp.layer(\\\\\\"" + sourceLayer.name + "\\\\\\").transform.' + params.sourceProperty.toLowerCase() + ' + [" + offset.join(",") + "]";\n';
      } else {
        script += '    expression = "comp.layer(\\\\\\"" + sourceLayer.name + "\\\\\\").transform.' + params.sourceProperty.toLowerCase() + ' + ' + params.offsetValue + '";\n';
      }
    } else {
      script += '    expression = "comp.layer(\\\\\\"" + sourceLayer.name + "\\\\\\").transform.' + params.sourceProperty.toLowerCase() + '";\n';
    }
    script += '    break;\n';
    script += '  \n';
    script += '  case "multiply":\n';
    script += '    var multiplier = ' + (params.multiplier || 1) + ';\n';
    script += '    expression = "comp.layer(\\\\\\"" + sourceLayer.name + "\\\\\\").transform.' + params.sourceProperty.toLowerCase() + ' * " + multiplier;\n';
    script += '    break;\n';
    script += '  \n';
    script += '  case "custom":\n';
    if (params.customExpression) {
      script += '    expression = "' + helpers.escapeString(params.customExpression) + '";\n';
    } else {
      script += '    throw new Error("Custom expression type requires customExpression parameter");\n';
    }
    script += '    break;\n';
    script += '  \n';
    script += '  default:\n';
    script += '    throw new Error("Invalid link type: " + linkType);\n';
    script += '}\n\n';
    
    script += '// Navigate to target property and set expression\n';
    script += 'var targetProp = targetLayer.property("Transform").property("' + params.targetProperty + '");\n';
    script += 'if (!targetProp) {\n';
    script += '  throw new Error("Target property not found: ' + params.targetProperty + '");\n';
    script += '}\n\n';
    
    script += 'if (!targetProp.canSetExpression) {\n';
    script += '  throw new Error("Cannot set expression on target property");\n';
    script += '}\n\n';
    
    script += 'targetProp.expression = expression;\n';
    script += 'targetProp.expressionEnabled = true;\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    sourceLayer: sourceLayer.name,\n    targetLayer: targetLayer.name,\n    linkType: linkType,\n    expression: expression\n  }');
    
    return script;
  },

  addWiggleExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    frequency?: number;
    amplitude?: number;
    octaves?: number;
    ampMultiplier?: number;
    time?: number;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    // Use helper for property navigation
    script += gh.navigatePropertyPath('"' + helpers.escapeString(params.propertyPath) + '"');
    
    // Check capability
    script += gh.checkPropertyCapability('prop', 'expression');
    
    script += '// Build wiggle expression\n';
    script += 'var freq = ' + (params.frequency || 5) + ';\n';
    script += 'var amp = ' + (params.amplitude || 50) + ';\n';
    script += 'var octaves = ' + (params.octaves || 1) + ';\n';
    script += 'var ampMult = ' + (params.ampMultiplier || 0.5) + ';\n';
    
    script += 'var expression = "wiggle(" + freq + ", " + amp'
    if (params.octaves !== undefined || params.ampMultiplier !== undefined || params.time !== undefined) {
      script += ' + ", " + octaves';
      if (params.ampMultiplier !== undefined || params.time !== undefined) {
        script += ' + ", " + ampMult';
        if (params.time !== undefined) {
          script += ' + ", " + ' + params.time;
        }
      }
    }
    script += ' + ")";\n\n';
    
    script += 'prop.expression = expression;\n';
    script += 'prop.expressionEnabled = true;\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    propertyPath: "' + helpers.escapeString(params.propertyPath) + '",\n    expression: expression\n  }');
    
    return script;
  },

  addLoopExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    loopType?: string;
    numKeyframes?: number;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    
    // Use helper for property navigation
    script += gh.navigatePropertyPath('"' + helpers.escapeString(params.propertyPath) + '"');
    
    // Check capability
    script += gh.checkPropertyCapability('prop', 'expression');
    
    script += '// Check if property has keyframes\n';
    script += 'if (prop.numKeys < 2) {\n';
    script += '  throw new Error("Property must have at least 2 keyframes for loop expression");\n';
    script += '}\n\n';
    
    script += '// Build loop expression\n';
    script += 'var loopType = "' + (params.loopType || 'cycle') + '";\n';
    script += 'var numKeyframes = ' + (params.numKeyframes || 0) + ';\n';
    script += 'var expression = "";\n\n';
    
    script += 'switch(loopType) {\n';
    script += '  case "cycle":\n';
    script += '    expression = numKeyframes > 0 ? "loopOut(\\\\\\"cycle\\\\\\", " + numKeyframes + ")" : "loopOut(\\\\\\"cycle\\\\\\")";\n';
    script += '    break;\n';
    script += '  case "pingpong":\n';
    script += '    expression = numKeyframes > 0 ? "loopOut(\\\\\\"pingpong\\\\\\", " + numKeyframes + ")" : "loopOut(\\\\\\"pingpong\\\\\\")";\n';
    script += '    break;\n';
    script += '  case "offset":\n';
    script += '    expression = numKeyframes > 0 ? "loopOut(\\\\\\"offset\\\\\\", " + numKeyframes + ")" : "loopOut(\\\\\\"offset\\\\\\")";\n';
    script += '    break;\n';
    script += '  case "continue":\n';
    script += '    expression = "loopOut(\\\\\\"continue\\\\\\")";\n';
    script += '    break;\n';
    script += '  default:\n';
    script += '    throw new Error("Invalid loop type: " + loopType);\n';
    script += '}\n\n';
    
    script += 'prop.expression = expression;\n';
    script += 'prop.expressionEnabled = true;\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    propertyPath: "' + helpers.escapeString(params.propertyPath) + '",\n    expression: expression,\n    loopType: loopType\n  }');
    
    return script;
  }
};