// Stub CSInterface for CEP extensions
// In production, this would be loaded from Adobe's CEP runtime

class CSInterface {
    constructor() {
        this.hostEnvironment = {
            appName: 'AEFT',
            appVersion: '2020'
        };
    }
    
    getSystemPath(pathType) {
        // Return dummy paths for testing
        if (pathType === SystemPath.EXTENSION) {
            return '/path/to/extension';
        }
        return '';
    }
    
    evalScript(script, callback) {
        // In real CEP, this would execute ExtendScript
        console.log('EvalScript:', script);
        if (callback) {
            callback('{}');
        }
    }
    
    addEventListener(type, handler) {
        // Event listener stub
        console.log('Added event listener:', type);
    }
    
    dispatchEvent(event) {
        // Event dispatch stub
        console.log('Dispatched event:', event);
    }
}

class CSXSEvent {
    constructor() {
        this.type = '';
        this.data = '';
    }
    
    dispatch() {
        console.log('CSXSEvent dispatched:', this.type, this.data);
    }
}

const SystemPath = {
    EXTENSION: 'extension',
    USER_DATA: 'userData'
};