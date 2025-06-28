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
  }
};