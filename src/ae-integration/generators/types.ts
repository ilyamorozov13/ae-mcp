export interface ScriptGeneratorModule {
  [key: string]: (params: any) => string;
}

export interface ScriptGeneratorHelpers {
  escapeString: (str: string) => string;
  stringify: (value: any) => string;
}