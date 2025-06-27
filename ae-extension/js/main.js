// CEP Interface
const csInterface = new CSInterface();
const extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION);

// WebSocket connection
let socket = null;
let isConnected = false;

// UI Elements
const statusEl = document.getElementById('server-status');
const hostEl = document.getElementById('server-host');
const portEl = document.getElementById('server-port');
const connectBtn = document.getElementById('connect-btn');
const logEl = document.getElementById('log-content');

// Initialize
window.addEventListener('load', init);

function init() {
    // Load ExtendScript
    csInterface.evalScript(`$.evalFile("${extensionRoot}/js/ae-bridge.jsx")`);
    
    // Set up event listeners
    connectBtn.addEventListener('click', toggleConnection);
    
    // Listen for ExtendScript events
    csInterface.addEventListener('com.aemcp.log', handleExtendScriptLog);
    csInterface.addEventListener('com.aemcp.result', handleExtendScriptResult);
    
    // Log initialization
    log('AE MCP Bridge initialized', 'info');
}

function toggleConnection() {
    if (isConnected) {
        disconnect();
    } else {
        connect();
    }
}

function connect() {
    const host = hostEl.value || 'localhost';
    const port = portEl.value || '8080';
    
    log(`Connecting to ${host}:${port}...`, 'info');
    
    try {
        socket = new WebSocket(`ws://${host}:${port}`);
        
        socket.onopen = () => {
            isConnected = true;
            statusEl.textContent = 'Connected';
            statusEl.classList.add('connected');
            connectBtn.textContent = 'Disconnect';
            log('Connected to MCP server', 'success');
            
            // Notify ExtendScript
            csInterface.evalScript('setConnectionStatus(true)');
        };
        
        socket.onmessage = (event) => {
            handleServerMessage(event.data);
        };
        
        socket.onerror = (error) => {
            log(`Connection error: ${error}`, 'error');
        };
        
        socket.onclose = () => {
            isConnected = false;
            statusEl.textContent = 'Disconnected';
            statusEl.classList.remove('connected');
            connectBtn.textContent = 'Connect';
            log('Disconnected from MCP server', 'info');
            
            // Notify ExtendScript
            csInterface.evalScript('setConnectionStatus(false)');
        };
        
    } catch (error) {
        log(`Failed to connect: ${error.message}`, 'error');
    }
}

function disconnect() {
    if (socket) {
        socket.close();
        socket = null;
    }
}

function handleServerMessage(data) {
    try {
        const message = JSON.parse(data);
        log(`Received: ${message.id}`, 'info');
        
        // Execute script in After Effects
        if (message.script) {
            csInterface.evalScript(
                `executeScript(${JSON.stringify(message)})`,
                (result) => {
                    sendResponse(message.id, result);
                }
            );
        }
    } catch (error) {
        log(`Error handling message: ${error.message}`, 'error');
    }
}

function sendResponse(id, result) {
    if (!isConnected || !socket) {
        log('Cannot send response: not connected', 'error');
        return;
    }
    
    try {
        const response = {
            id: id,
            result: JSON.parse(result)
        };
        
        socket.send(JSON.stringify(response) + '\\n\\n');
        log(`Sent response for: ${id}`, 'info');
    } catch (error) {
        log(`Error sending response: ${error.message}`, 'error');
    }
}

function handleExtendScriptLog(event) {
    const data = JSON.parse(event.data);
    log(data.message, data.level || 'info');
}

function handleExtendScriptResult(event) {
    const data = JSON.parse(event.data);
    if (data.id && data.result) {
        sendResponse(data.id, JSON.stringify(data.result));
    }
}

function log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${level}`;
    entry.textContent = `[${timestamp}] ${message}`;
    
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
    
    // Limit log entries
    while (logEl.children.length > 100) {
        logEl.removeChild(logEl.firstChild);
    }
}