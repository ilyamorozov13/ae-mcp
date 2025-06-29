export interface AEErrorContext {
  command?: string;
  params?: any;
  scriptSnippet?: string;
  layerInfo?: any;
  propertyInfo?: any;
}

export class AEError extends Error {
  code: string;
  details?: any;
  context?: AEErrorContext;
  
  constructor(message: string, code: string = 'AE_ERROR', details?: any, context?: AEErrorContext) {
    super(message);
    this.name = 'AEError';
    this.code = code;
    this.details = details;
    this.context = context;
  }
}

export class AEErrorHandler {
  private static readonly AE_ERROR_CODES: { [key: number]: string } = {
    1: 'AE_GENERAL_ERROR',
    2: 'AE_OUT_OF_MEMORY',
    3: 'AE_CANT_OPEN_FILE',
    4: 'AE_CANT_SAVE_FILE',
    5: 'AE_CANT_CREATE_FILE',
    6: 'AE_FILE_NOT_FOUND',
    7: 'AE_PERMISSION_DENIED',
    8: 'AE_DISK_FULL',
    9: 'AE_USER_CANCELLED',
    10: 'AE_MISSING_PLUGIN',
    11: 'AE_VERSION_MISMATCH',
    12: 'AE_CORRUPT_PROJECT',
    90: 'AE_INVALID_ITEM_TYPE',
    91: 'AE_INVALID_LAYER_TYPE',
    92: 'AE_INVALID_PROPERTY',
    93: 'AE_PROPERTY_NOT_FOUND',
    94: 'AE_KEYFRAME_INDEX_OUT_OF_RANGE',
    95: 'AE_NO_KEYFRAMES',
    96: 'AE_EXPRESSION_ERROR',
    97: 'AE_SCRIPT_ERROR',
    98: 'AE_RENDER_ERROR',
    99: 'AE_INVALID_TIME'
  };

  static formatError(error: any, context?: AEErrorContext): AEError {
    const message = error.message || error.toString();
    const code = error.code || error.number || this.mapErrorCode(message);
    const details = error.details || {};

    if (error.number && this.AE_ERROR_CODES[error.number]) {
      return new AEError(message, this.AE_ERROR_CODES[error.number], details, context);
    }

    return new AEError(message, code, details, context);
  }

  private static mapErrorCode(message: string): string {
    if (message.includes('No such file') || message.includes('File not found')) {
      return 'FILE_NOT_FOUND';
    }
    if (message.includes('Permission denied')) {
      return 'PERMISSION_DENIED';
    }
    if (message.includes('Composition not found')) {
      return 'COMP_NOT_FOUND';
    }
    if (message.includes('Layer not found')) {
      return 'LAYER_NOT_FOUND';
    }
    if (message.includes('Project not open')) {
      return 'NO_PROJECT';
    }
    if (message.includes('Invalid parameter')) {
      return 'INVALID_PARAM';
    }
    if (message.includes('property is hidden') || message.includes('parent property is hidden')) {
      return 'TIME_REMAP_NOT_ENABLED';
    }
    if (message.includes('Property not found') || message.includes('Property has no keyframes')) {
      return 'PROPERTY_ERROR';
    }
    if (message.includes('keyframe') || message.includes('Keyframe')) {
      return 'KEYFRAME_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  static createDetailedError(
    baseMessage: string,
    command: string,
    params: any,
    additionalInfo?: any
  ): string {
    const parts = [baseMessage];
    parts.push(`Command: ${command}`);

    const relevantParams = this.extractRelevantParams(command, params);
    if (Object.keys(relevantParams).length > 0) {
      parts.push(`Parameters: ${JSON.stringify(relevantParams, null, 2)}`);
    }

    if (additionalInfo) {
      parts.push(`Additional Info: ${JSON.stringify(additionalInfo, null, 2)}`);
    }

    return parts.join('\n');
  }

  private static extractRelevantParams(command: string, params: any): any {
    const relevant: any = {};
    const alwaysInclude = ['compId', 'layerIndex', 'propertyPath', 'tool', 'id'];
    
    alwaysInclude.forEach(key => {
      if (params[key] !== undefined) {
        relevant[key] = params[key];
      }
    });

    switch (command) {
      case 'setKeyframe':
      case 'setKeyframeAdvanced':
        if (params.time !== undefined) relevant.time = params.time;
        if (params.value !== undefined) relevant.value = params.value;
        break;
      
      case 'applyEasyEase':
      case 'apply_easy_ease':
        if (params.easeType !== undefined) relevant.easeType = params.easeType;
        if (params.keyframeIndices !== undefined) relevant.keyframeIndices = params.keyframeIndices;
        break;
      
      case 'applyEffect':
      case 'apply_effect':
        if (params.effectName !== undefined) relevant.effectName = params.effectName;
        break;
      
      case 'batchExecute':
      case 'batch_execute':
        if (params.commands !== undefined) relevant.commandCount = params.commands.length;
        if (params.sequential !== undefined) relevant.sequential = params.sequential;
        break;
    }

    return relevant;
  }

  static validateParams(command: string, params: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Commands that don't require any parameters
    const noParamCommands = [
      'list_compositions',
      'listCompositions',
      'get_project_info',
      'getProjectInfo',
      'get_ae_version',
      'getAeVersion',
      'get_render_queue',
      'getRenderQueue',
      'start_render',
      'startRender',
      'pause_render',
      'pauseRender',
      'stop_render',
      'stopRender',
      'ping'
    ];

    // Skip validation for commands that don't require parameters
    if (noParamCommands.includes(command)) {
      return { valid: true, errors: [] };
    }

    if (params.compId !== undefined && (typeof params.compId !== 'number' || params.compId < 1)) {
      errors.push('compId must be a positive number');
    }

    if (params.layerIndex !== undefined && (typeof params.layerIndex !== 'number' || params.layerIndex < 1)) {
      errors.push('layerIndex must be a positive number (1-based)');
    }

    switch (command) {
      case 'setKeyframe':
      case 'setKeyframeAdvanced':
      case 'set_keyframe':
      case 'set_keyframe_advanced':
        if (params.time === undefined || typeof params.time !== 'number') {
          errors.push('time is required and must be a number');
        }
        if (params.value === undefined) {
          errors.push('value is required');
        }
        break;

      case 'applyEasyEase':
      case 'apply_easy_ease':
        if (!params.propertyPath || typeof params.propertyPath !== 'string') {
          errors.push('propertyPath is required and must be a string');
        }
        if (params.easeType && !['ease', 'easeIn', 'easeOut'].includes(params.easeType)) {
          errors.push('easeType must be one of: ease, easeIn, easeOut');
        }
        break;

      case 'batchExecute':
      case 'batch_execute':
        if (!Array.isArray(params.commands) || params.commands.length === 0) {
          errors.push('commands must be a non-empty array');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export function mapAEError(error: any): AEError {
  if (error instanceof AEError) {
    return error;
  }
  
  return AEErrorHandler.formatError(error);
}