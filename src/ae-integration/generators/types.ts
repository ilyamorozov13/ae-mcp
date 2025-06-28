export interface ScriptGeneratorModule {
  [key: string]: (params: any) => string;
}

export interface ScriptGeneratorHelpers {
  escapeString: (str: string) => string;
  stringify: (value: any) => string;
  conditional: (condition: boolean | undefined | null, trueCode: string, falseCode?: string) => string;
  valueOrDefault: (value: any, defaultValue: any) => string;
  generatePropertyNavigation: (propertyPath: string) => string;
}