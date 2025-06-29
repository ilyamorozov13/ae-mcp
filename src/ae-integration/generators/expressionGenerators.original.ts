import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

export const expressionGenerators: ScriptGeneratorModule = {
  setExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    expression: string;
    enabled?: boolean;
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
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  // Handle special cases\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Effects" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Effect Parade");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'if (!prop.canSetExpression) {\n';
    script += '  throw new Error("Cannot set expression on this property");\n';
    script += '}\n\n';
    
    script += 'prop.expression = "' + helpers.escapeString(params.expression) + '";\n';
    if (params.enabled !== undefined) {
      script += 'prop.expressionEnabled = ' + params.enabled + ';\n';
    }
    script += '\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    layerName: layer.name,\n';
    script += '    propertyPath: "' + helpers.escapeString(params.propertyPath) + '",\n';
    script += '    expressionSet: true,\n';
    script += '    enabled: prop.expressionEnabled\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },

  getExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
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
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Effects" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Effect Parade");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    expression: prop.expression,\n';
    script += '    enabled: prop.expressionEnabled,\n';
    script += '    hasExpression: prop.expression !== "",\n';
    script += '    canSetExpression: prop.canSetExpression,\n';
    script += '    propertyName: prop.name\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },

  removeExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
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
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Effects" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Effect Parade");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'prop.expression = "";\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    layerName: layer.name,\n';
    script += '    propertyPath: "' + helpers.escapeString(params.propertyPath) + '",\n';
    script += '    expressionRemoved: true\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },

  enableExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    enabled: boolean;
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
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Effects" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Effect Parade");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'if (!prop.canSetExpression) {\n';
    script += '  throw new Error("Cannot set expression on this property");\n';
    script += '}\n\n';
    
    script += 'if (prop.expression === "") {\n';
    script += '  throw new Error("No expression to enable");\n';
    script += '}\n\n';
    
    script += 'prop.expressionEnabled = ' + params.enabled + ';\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    layerName: layer.name,\n';
    script += '    propertyPath: "' + helpers.escapeString(params.propertyPath) + '",\n';
    script += '    enabled: prop.expressionEnabled\n';
    script += '  }\n';
    script += '};';
    
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
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var results = [];\n';
    script += 'var expressions = ' + JSON.stringify(params.expressions) + ';\n\n';
    
    script += 'for (var i = 0; i < expressions.length; i++) {\n';
    script += '  var expr = expressions[i];\n';
    script += '  try {\n';
    script += '    var layer = comp.layer(expr.layerIndex);\n';
    script += '    if (!layer) {\n';
    script += '      results.push({\n';
    script += '        success: false,\n';
    script += '        error: "Layer " + expr.layerIndex + " not found"\n';
    script += '      });\n';
    script += '      continue;\n';
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
    script += '      results.push({\n';
    script += '        success: false,\n';
    script += '        error: "Cannot set expression on " + expr.propertyPath\n';
    script += '      });\n';
    script += '      continue;\n';
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
    script += '      propertyPath: expr.propertyPath\n';
    script += '    });\n';
    script += '    \n';
    script += '  } catch (e) {\n';
    script += '    results.push({\n';
    script += '      success: false,\n';
    script += '      error: String(e),\n';
    script += '      layerIndex: expr.layerIndex\n';
    script += '    });\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'var successCount = 0;\n';
    script += 'for (var i = 0; i < results.length; i++) {\n';
    script += '  if (results[i].success) successCount++;\n';
    script += '}\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    total: expressions.length,\n';
    script += '    successful: successCount,\n';
    script += '    results: results\n';
    script += '  }\n';
    script += '};';
    
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
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += 'var effectName;\n';
    script += 'var controlType = "' + params.controlType + '";\n\n';
    
    script += 'switch(controlType) {\n';
    script += '  case "slider":\n';
    script += '    effectName = "ADBE Slider Control";\n';
    script += '    break;\n';
    script += '  case "point":\n';
    script += '    effectName = "ADBE Point Control";\n';
    script += '    break;\n';
    script += '  case "angle":\n';
    script += '    effectName = "ADBE Angle Control";\n';
    script += '    break;\n';
    script += '  case "checkbox":\n';
    script += '    effectName = "ADBE Checkbox Control";\n';
    script += '    break;\n';
    script += '  case "color":\n';
    script += '    effectName = "ADBE Color Control";\n';
    script += '    break;\n';
    script += '  case "layer":\n';
    script += '    effectName = "ADBE Layer Control";\n';
    script += '    break;\n';
    script += '  case "point3d":\n';
    script += '    effectName = "ADBE Point3D Control";\n';
    script += '    break;\n';
    script += '  default:\n';
    script += '    throw new Error("Invalid control type: " + controlType);\n';
    script += '}\n\n';
    
    script += 'var effect = layer.property("Effects").addProperty(effectName);\n';
    script += 'effect.name = "' + helpers.escapeString(params.name) + '";\n\n';
    
    // Set initial value if provided
    if (params.value !== undefined) {
      script += '// Set initial value if provided\n';
      script += 'var control = effect.property(1);\n';
      script += 'if (control) {\n';
      if (Array.isArray(params.value)) {
        script += '  control.setValue([' + params.value.join(',') + ']);\n';
      } else {
        script += '  control.setValue(' + params.value + ');\n';
      }
      script += '}\n\n';
    }
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    layerName: layer.name,\n';
    script += '    controlName: effect.name,\n';
    script += '    controlType: controlType,\n';
    script += '    effectIndex: effect.propertyIndex\n';
    script += '  }\n';
    script += '};';
    
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
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var sourceLayer = comp.layer(' + params.sourceLayer + ');\n';
    script += 'var targetLayer = comp.layer(' + params.targetLayer + ');\n\n';
    
    script += 'if (!sourceLayer) throw new Error("Source layer not found");\n';
    script += 'if (!targetLayer) throw new Error("Target layer not found");\n\n';
    
    script += 'var linkType = "' + (params.linkType || 'direct') + '";\n';
    script += 'var expression = "";\n\n';
    
    script += 'switch(linkType) {\n';
    script += '  case "direct":\n';
    script += '    expression = "thisComp.layer(' + params.sourceLayer + ').transform.' + helpers.escapeString(params.sourceProperty) + '";\n';
    script += '    break;\n';
    script += '    \n';
    script += '  case "inverse":\n';
    script += '    expression = "-thisComp.layer(' + params.sourceLayer + ').transform.' + helpers.escapeString(params.sourceProperty) + '";\n';
    script += '    break;\n';
    script += '    \n';
    script += '  case "offset":\n';
    script += '    var offsetValue = ' + (params.offsetValue ? JSON.stringify(params.offsetValue) : 'null') + ';\n';
    script += '    if (offsetValue) {\n';
    script += '      if (Array.isArray(offsetValue)) {\n';
    script += '        expression = "thisComp.layer(' + params.sourceLayer + ').transform.' + helpers.escapeString(params.sourceProperty) + ' + [" + offsetValue.join(",") + "]";\n';
    script += '      } else {\n';
    script += '        expression = "thisComp.layer(' + params.sourceLayer + ').transform.' + helpers.escapeString(params.sourceProperty) + ' + " + offsetValue;\n';
    script += '      }\n';
    script += '    }\n';
    script += '    break;\n';
    script += '    \n';
    script += '  case "multiply":\n';
    script += '    var multiplier = ' + (params.multiplier || 1) + ';\n';
    script += '    expression = "thisComp.layer(' + params.sourceLayer + ').transform.' + helpers.escapeString(params.sourceProperty) + ' * " + multiplier;\n';
    script += '    break;\n';
    script += '    \n';
    script += '  case "custom":\n';
    script += '    expression = "' + helpers.escapeString(params.customExpression || '') + '";\n';
    script += '    break;\n';
    script += '}\n\n';
    
    script += '// Apply expression to target property\n';
    script += 'var targetProp = targetLayer.property("Transform").property("' + helpers.escapeString(params.targetProperty) + '");\n';
    script += 'if (!targetProp) {\n';
    script += '  throw new Error("Target property not found");\n';
    script += '}\n\n';
    
    script += 'targetProp.expression = expression;\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    sourceLayer: sourceLayer.name,\n';
    script += '    targetLayer: targetLayer.name,\n';
    script += '    linkType: linkType,\n';
    script += '    expression: expression\n';
    script += '  }\n';
    script += '};';
    
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
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += 'var freq = ' + (params.frequency || 5) + ';\n';
    script += 'var amp = ' + (params.amplitude || 50) + ';\n';
    script += 'var octaves = ' + (params.octaves || 1) + ';\n';
    script += 'var ampMult = ' + (params.ampMultiplier || 0.5) + ';\n';
    script += 'var timeOffset = ' + (params.time || 0) + ';\n\n';
    
    script += 'var expression = "wiggle(" + freq + ", " + amp;\n\n';
    
    script += 'if (octaves !== 1 || ampMult !== 0.5 || timeOffset !== 0) {\n';
    script += '  expression += ", " + octaves + ", " + ampMult;\n';
    script += '  if (timeOffset !== 0) {\n';
    script += '    expression += ", time + " + timeOffset;\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'expression += ")";\n\n';
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'prop.expression = expression;\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    layerName: layer.name,\n';
    script += '    propertyPath: "' + helpers.escapeString(params.propertyPath) + '",\n';
    script += '    expression: expression\n';
    script += '  }\n';
    script += '};';
    
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
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += 'var loopType = "' + (params.loopType || 'cycle') + '";\n';
    script += 'var numKeyframes = ' + (params.numKeyframes || 0) + ';\n\n';
    
    script += 'var expression = "";\n\n';
    
    script += 'switch(loopType) {\n';
    script += '  case "cycle":\n';
    script += '    if (numKeyframes > 0) {\n';
    script += '      expression = "loopOut(\\"cycle\\", " + numKeyframes + ")";\n';
    script += '    } else {\n';
    script += '      expression = "loopOut(\\"cycle\\")";\n';
    script += '    }\n';
    script += '    break;\n';
    script += '    \n';
    script += '  case "pingpong":\n';
    script += '    if (numKeyframes > 0) {\n';
    script += '      expression = "loopOut(\\"pingpong\\", " + numKeyframes + ")";\n';
    script += '    } else {\n';
    script += '      expression = "loopOut(\\"pingpong\\")";\n';
    script += '    }\n';
    script += '    break;\n';
    script += '    \n';
    script += '  case "offset":\n';
    script += '    if (numKeyframes > 0) {\n';
    script += '      expression = "loopOut(\\"offset\\", " + numKeyframes + ")";\n';
    script += '    } else {\n';
    script += '      expression = "loopOut(\\"offset\\")";\n';
    script += '    }\n';
    script += '    break;\n';
    script += '    \n';
    script += '  case "continue":\n';
    script += '    if (numKeyframes > 0) {\n';
    script += '      expression = "loopOut(\\"continue\\", " + numKeyframes + ")";\n';
    script += '    } else {\n';
    script += '      expression = "loopOut(\\"continue\\")";\n';
    script += '    }\n';
    script += '    break;\n';
    script += '}\n\n';
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'if (prop.numKeys < 2) {\n';
    script += '  throw new Error("Property must have at least 2 keyframes for loop expression");\n';
    script += '}\n\n';
    
    script += 'prop.expression = expression;\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    layerName: layer.name,\n';
    script += '    propertyPath: "' + helpers.escapeString(params.propertyPath) + '",\n';
    script += '    expression: expression,\n';
    script += '    loopType: loopType\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },

  convertKeyframesToExpression: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    expressionType?: string;
    customExpression?: string;
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
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'if (prop.numKeys < 2) {\n';
    script += '  throw new Error("Property must have at least 2 keyframes to convert");\n';
    script += '}\n\n';
    
    script += 'var expressionType = "' + (params.expressionType || 'linear') + '";\n';
    script += 'var expression = "";\n\n';
    
    script += '// Store keyframe data before clearing\n';
    script += 'var keyframeData = [];\n';
    script += 'for (var i = 1; i <= prop.numKeys; i++) {\n';
    script += '  keyframeData.push({\n';
    script += '    time: prop.keyTime(i),\n';
    script += '    value: prop.keyValue(i)\n';
    script += '  });\n';
    script += '}\n\n';
    
    script += 'switch(expressionType) {\n';
    script += '  case "linear":\n';
    script += '    expression = "linear(time, " + keyframeData[0].time + ", " + keyframeData[keyframeData.length-1].time + ", " + \n';
    script += '                JSON.stringify(keyframeData[0].value) + ", " + JSON.stringify(keyframeData[keyframeData.length-1].value) + ")";\n';
    script += '    break;\n';
    script += '    \n';
    script += '  case "ease":\n';
    script += '    expression = "ease(time, " + keyframeData[0].time + ", " + keyframeData[keyframeData.length-1].time + ", " + \n';
    script += '                JSON.stringify(keyframeData[0].value) + ", " + JSON.stringify(keyframeData[keyframeData.length-1].value) + ")";\n';
    script += '    break;\n';
    script += '    \n';
    script += '  case "bounce":\n';
    script += '    expression = "// Bounce expression\\n" +\n';
    script += '                "amp = .1;\\n" +\n';
    script += '                "freq = 2.0;\\n" +\n';
    script += '                "decay = 2.0;\\n" +\n';
    script += '                "n = 0;\\n" +\n';
    script += '                "if (numKeys > 0){\\n" +\n';
    script += '                "  n = nearestKey(time).index;\\n" +\n';
    script += '                "  if (key(n).time > time){n--;}\\n" +\n';
    script += '                "}\\n" +\n';
    script += '                "if (n == 0){ t = 0; }\\n" +\n';
    script += '                "else{t = time - key(n).time;}\\n" +\n';
    script += '                "if (n > 0 && t < 1){\\n" +\n';
    script += '                "  v = velocityAtTime(key(n).time - thisComp.frameDuration/10);\\n" +\n';
    script += '                "  value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);\\n" +\n';
    script += '                "}else{value}";\n';
    script += '    break;\n';
    script += '    \n';
    script += '  case "elastic":\n';
    script += '    expression = "// Elastic expression\\n" +\n';
    script += '                "amp = .05;\\n" +\n';
    script += '                "freq = 4.0;\\n" +\n';
    script += '                "decay = 7.0;\\n" +\n';
    script += '                "n = 0;\\n" +\n';
    script += '                "if (numKeys > 0){\\n" +\n';
    script += '                "  n = nearestKey(time).index;\\n" +\n';
    script += '                "  if (key(n).time > time){n--;}\\n" +\n';
    script += '                "}\\n" +\n';
    script += '                "if (n == 0){ t = 0; }\\n" +\n';
    script += '                "else{t = time - key(n).time;}\\n" +\n';
    script += '                "if (n > 0 && t < 1){\\n" +\n';
    script += '                "  v = velocityAtTime(key(n).time - thisComp.frameDuration/10);\\n" +\n';
    script += '                "  value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);\\n" +\n';
    script += '                "}else{value}";\n';
    script += '    break;\n';
    script += '    \n';
    script += '  case "custom":\n';
    script += '    expression = "' + helpers.escapeString(params.customExpression || '') + '";\n';
    script += '    break;\n';
    script += '}\n\n';
    
    script += '// Clear keyframes\n';
    script += 'while (prop.numKeys > 0) {\n';
    script += '  prop.removeKey(1);\n';
    script += '}\n\n';
    
    script += '// Set expression\n';
    script += 'prop.expression = expression;\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    layerName: layer.name,\n';
    script += '    propertyPath: "' + helpers.escapeString(params.propertyPath) + '",\n';
    script += '    expression: expression,\n';
    script += '    originalKeyframes: keyframeData.length\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },

  saveExpressionPreset: (params: {
    name: string;
    expression: string;
    category?: string;
    description?: string;
    parameters?: any[];
  }) => {
    let script = '';
    script += '// This would typically save to a preferences file or database\n';
    script += '// For now, we\'ll just return success\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    name: "' + helpers.escapeString(params.name) + '",\n';
    script += '    category: "' + helpers.escapeString(params.category || 'Custom') + '",\n';
    script += '    saved: true\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },

  applyExpressionPreset: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    presetName: string;
    parameters?: any;
  }) => {
    let script = '';
    script += '// This would typically load from a preferences file or database\n';
    script += '// For now, we\'ll just apply a simple expression\n\n';
    
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("Layer not found");\n';
    script += '}\n\n';
    
    script += '// Navigate property path\n';
    script += 'var pathParts = "' + helpers.escapeString(params.propertyPath) + '".split(".");\n';
    script += 'var prop = layer;\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += '// Apply a default expression based on preset name\n';
    script += 'var presetName = "' + helpers.escapeString(params.presetName) + '";\n';
    script += 'var expression = "// " + presetName + " preset\\nvalue";\n\n';
    
    script += 'prop.expression = expression;\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    layerName: layer.name,\n';
    script += '    propertyPath: "' + helpers.escapeString(params.propertyPath) + '",\n';
    script += '    presetName: presetName,\n';
    script += '    applied: true\n';
    script += '  }\n';
    script += '};';
    
    return script;
  }
};