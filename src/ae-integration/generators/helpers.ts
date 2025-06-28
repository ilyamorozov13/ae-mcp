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
  }
};