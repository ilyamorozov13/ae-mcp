import { helpers } from './helpers.js';

/**
 * Common helper functions for code generation to reduce duplication
 * All functions return ES3-compatible script strings
 */

export const generatorHelpers = {
  /**
   * Generate composition validation code
   */
  getCompValidation: (compId: number, customError?: string): string => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("' + (customError || 'Composition not found') + '");\n';
    script += '}\n\n';
    return script;
  },

  /**
   * Generate layer validation code
   */
  getLayerValidation: (layerIndex: number, customError?: string): string => {
    let script = '';
    script += 'var layer = comp.layer(' + layerIndex + ');\n';
    script += 'if (!layer) {\n';
    script += '  throw new Error("' + (customError || 'Layer not found') + '");\n';
    script += '}\n\n';
    return script;
  },

  /**
   * Generate layer type validation code
   */
  validateLayerType: (layerType: string, errorMessage?: string): string => {
    let script = '';
    const typeCheck = {
      'TextLayer': 'TextLayer',
      'ShapeLayer': 'ShapeLayer',
      'AVLayer': 'AVLayer',
      'CameraLayer': 'CameraLayer',
      'LightLayer': 'LightLayer'
    }[layerType] || layerType;
    
    script += 'if (!(layer instanceof ' + typeCheck + ')) {\n';
    if (errorMessage) {
      script += '  throw new Error("' + errorMessage + '");\n';
    } else {
      // Generate detailed error message with layer type info (using dynamic layer.index)
      const layerTypeName = layerType === 'TextLayer' ? 'text' : 
                           layerType === 'ShapeLayer' ? 'shape' :
                           layerType === 'AVLayer' ? 'AV' :
                           layerType === 'CameraLayer' ? 'camera' :
                           layerType === 'LightLayer' ? 'light' :
                           layerType.toLowerCase();
      script += '  throw new Error("Layer at index " + layer.index + " is not a ' + layerTypeName + ' layer (it is a " + layer.constructor.name + ")");\n';
    }
    script += '}\n\n';
    return script;
  },

  /**
   * Generate success return object
   */
  generateSuccessReturn: (dataObject: string): string => {
    let script = '';
    script += 'var returnObj = {};\n';
    script += 'returnObj.success = true;\n';
    script += 'returnObj.data = ' + dataObject + ';\n';
    script += 'return returnObj;';
    return script;
  },

  /**
   * Generate setPropertyValue helper function
   */
  getSetPropertyValueHelper: (): string => {
    let script = '';
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
    return script;
  },

  /**
   * Generate property path navigation code
   */
  navigatePropertyPath: (propertyPathVar: string, startObject: string = 'layer'): string => {
    let script = '';
    script += '// Navigate property path\n';
    script += 'var pathParts = ' + propertyPathVar + '.split(".");\n';
    script += 'var prop = ' + startObject + ';\n\n';
    
    script += 'for (var i = 0; i < pathParts.length; i++) {\n';
    script += '  var part = pathParts[i];\n';
    script += '  \n';
    script += '  // Handle common property groups\n';
    script += '  if (part === "Transform" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Transform Group");\n';
    script += '  } else if (part === "Effects" && prop === layer) {\n';
    script += '    prop = prop.property("ADBE Effect Parade");\n';
    script += '  } else if (part === "Position" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Position");\n';
    script += '  } else if (part === "Scale" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Scale");\n';
    script += '  } else if (part === "Rotation" && i > 0 && pathParts[i-1] === "Transform") {\n';
    script += '    prop = prop.property("ADBE Rotate Z");\n';
    script += '  } else if (part === "Opacity") {\n';
    script += '    // Opacity is at layer level, not under Transform\n';
    script += '    if (prop === layer || (i > 0 && pathParts[i-1] === "Transform")) {\n';
    script += '      prop = layer.property("ADBE Opacity");\n';
    script += '    } else {\n';
    script += '      prop = prop.property("ADBE Opacity");\n';
    script += '    }\n';
    script += '  } else {\n';
    script += '    prop = prop.property(part);\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (!prop) {\n';
    script += '    throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'if (!prop) {\n';
    script += '  throw new Error("Property not found: " + ' + propertyPathVar + ');\n';
    script += '}\n\n';
    
    return script;
  },

  /**
   * Generate property normalization code
   */
  normalizePropertyName: (propertyVar: string): string => {
    let script = '';
    script += '// Normalize property name\n';
    script += 'var propertyMap = {\n';
    script += '  "position": "Position",\n';
    script += '  "scale": "Scale",\n';
    script += '  "rotation": "Rotation",\n';
    script += '  "opacity": "Opacity"\n';
    script += '};\n';
    script += 'var normalizedProperty = propertyMap[' + propertyVar + '.toLowerCase()] || ' + propertyVar + ';\n\n';
    return script;
  },

  /**
   * Generate array value validation
   */
  validateArrayValue: (valueVar: string, propertyName: string, minLength: number, maxLength: number): string => {
    let script = '';
    script += 'if (!(' + valueVar + ' instanceof Array)) {\n';
    script += '  throw new Error("' + propertyName + ' requires an array value");\n';
    script += '}\n';
    script += 'if (' + valueVar + '.length < ' + minLength + ' || ' + valueVar + '.length > ' + maxLength + ') {\n';
    script += '  throw new Error("' + propertyName + ' requires ' + minLength + ' to ' + maxLength + ' values");\n';
    script += '}\n\n';
    return script;
  },

  /**
   * Generate try-catch wrapper for property access
   */
  wrapInTryCatch: (code: string, fallbackCode?: string): string => {
    let script = '';
    script += 'try {\n';
    script += code;
    script += '} catch (e) {\n';
    if (fallbackCode) {
      script += fallbackCode;
    } else {
      script += '  // Continue on error\n';
    }
    script += '}\n';
    return script;
  },

  /**
   * Generate string value assignment with proper escaping
   */
  setStringProperty: (object: string, property: string, value: string): string => {
    return object + '.' + property + ' = "' + helpers.escapeString(value) + '";\n';
  },

  /**
   * Generate safe JSON.stringify for object parameters
   */
  stringifyObject: (paramName: string, defaultValue: string = '{}'): string => {
    return (paramName ? 'JSON.stringify(' + paramName + ')' : defaultValue);
  },

  /**
   * Generate layer info string for error messages
   */
  getLayerInfoVar: (): string => {
    let script = '';
    script += 'var layerInfo = "Layer: " + layer.name + " [" + layer.index + "]";\n';
    return script;
  },

  /**
   * Generate property capability check
   */
  checkPropertyCapability: (propVar: string, capability: string): string => {
    let script = '';
    const capabilities: Record<string, string> = {
      'animate': 'canSetExpression',
      'setValue': 'canSetValue',
      'expression': 'canSetExpression'
    };
    
    const checkMethod = capabilities[capability] || capability;
    script += 'if (!' + propVar + '.' + checkMethod + ') {\n';
    script += '  throw new Error("Property does not support ' + capability + '");\n';
    script += '}\n\n';
    return script;
  },

  /**
   * Generate null/undefined check with default value
   * For use in generated ExtendScript code, not TypeScript
   */
  getValueOrDefault: (paramPath: string, defaultValue: any): string => {
    if (typeof defaultValue === 'string') {
      return '(' + paramPath + ' !== undefined ? ' + paramPath + ' : "' + helpers.escapeString(defaultValue) + '")';
    } else if (typeof defaultValue === 'number' || typeof defaultValue === 'boolean') {
      return '(' + paramPath + ' !== undefined ? ' + paramPath + ' : ' + defaultValue + ')';
    } else if (Array.isArray(defaultValue)) {
      return '(' + paramPath + ' || [' + defaultValue.join(', ') + '])';
    } else {
      return '(' + paramPath + ' || ' + JSON.stringify(defaultValue) + ')';
    }
  },
  
  /**
   * Generate value or default directly in TypeScript generator context
   */
  getParamWithDefault: (param: any, defaultValue: any): string => {
    if (param !== undefined) {
      if (typeof param === 'string') {
        return '"' + helpers.escapeString(param) + '"';
      } else if (Array.isArray(param)) {
        return '[' + param.join(', ') + ']';
      } else {
        return String(param);
      }
    } else {
      if (typeof defaultValue === 'string') {
        return '"' + helpers.escapeString(defaultValue) + '"';
      } else if (Array.isArray(defaultValue)) {
        return '[' + defaultValue.join(', ') + ']';
      } else {
        return String(defaultValue);
      }
    }
  },

  /**
   * Generate batch operation loop structure
   */
  generateBatchLoop: (arrayVar: string, itemVar: string, processCode: string): string => {
    let script = '';
    script += 'var results = [];\n';
    script += 'for (var i = 0; i < ' + arrayVar + '.length; i++) {\n';
    script += '  var ' + itemVar + ' = ' + arrayVar + '[i];\n';
    script += '  try {\n';
    script += processCode;
    script += '    results.push({\n';
    script += '      success: true,\n';
    script += '      index: i\n';
    script += '    });\n';
    script += '  } catch (e) {\n';
    script += '    results.push({\n';
    script += '      success: false,\n';
    script += '      error: String(e),\n';
    script += '      index: i\n';
    script += '    });\n';
    script += '  }\n';
    script += '}\n\n';
    return script;
  }
};