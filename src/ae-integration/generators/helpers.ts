import { ScriptGeneratorHelpers } from './types';

export const helpers: ScriptGeneratorHelpers = {
  escapeString: (str: string): string => {
    if (str === undefined || str === null) return '';
    return str.replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
  },

  stringify: (value: any): string => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    return JSON.stringify(value);
  },
  
  // ES3-safe conditional code generation
  conditional: (condition: boolean | undefined | null, trueCode: string, falseCode: string = ''): string => {
    return condition ? trueCode : falseCode;
  },
  
  // ES3-safe value assignment
  valueOrDefault: (value: any, defaultValue: any): string => {
    return value !== undefined && value !== null ? helpers.stringify(value) : helpers.stringify(defaultValue);
  },
  
  // Generate property navigation code
  generatePropertyNavigation: (propertyPath: string): string => {
    return `
    // Navigate property path
    var pathParts = "${helpers.escapeString(propertyPath)}".split(".");
    var prop = layer;
    
    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part === "Transform" && prop === layer) {
        prop = prop.property("ADBE Transform Group");
      } else if (part === "Position" && prop.propertyGroup && prop.propertyGroup(1) === layer.property("ADBE Transform Group")) {
        prop = prop.property("ADBE Position");
      } else if (part === "Scale" && prop.propertyGroup && prop.propertyGroup(1) === layer.property("ADBE Transform Group")) {
        prop = prop.property("ADBE Scale");
      } else if (part === "Rotation" && prop.propertyGroup && prop.propertyGroup(1) === layer.property("ADBE Transform Group")) {
        prop = prop.property("ADBE Rotate Z");
      } else if (part === "Opacity" && prop === layer) {
        prop = prop.property("ADBE Opacity");
      } else {
        prop = prop.property(part);
      }
      
      if (!prop) {
        throw new Error("Property not found: " + pathParts.slice(0, i + 1).join("."));
      }
    }`;
  }
};