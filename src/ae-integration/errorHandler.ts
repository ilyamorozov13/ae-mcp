export class AEError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'AE_ERROR') {
    super(message);
    this.name = 'AEError';
    this.code = code;
  }
}

export function mapAEError(error: any): AEError {
  if (error instanceof AEError) {
    return error;
  }
  
  const message = error.message || error.toString();
  
  if (message.includes('No such file')) {
    return new AEError('File not found', 'FILE_NOT_FOUND');
  }
  
  if (message.includes('Permission denied')) {
    return new AEError('Permission denied', 'PERMISSION_DENIED');
  }
  
  if (message.includes('Composition not found')) {
    return new AEError('Composition not found', 'COMP_NOT_FOUND');
  }
  
  if (message.includes('Layer not found')) {
    return new AEError('Layer not found', 'LAYER_NOT_FOUND');
  }
  
  if (message.includes('Project not open')) {
    return new AEError('No project is currently open', 'NO_PROJECT');
  }
  
  if (message.includes('Invalid parameter')) {
    return new AEError('Invalid parameter provided', 'INVALID_PARAM');
  }
  
  return new AEError(message, 'UNKNOWN_ERROR');
}