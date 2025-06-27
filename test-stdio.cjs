#!/usr/bin/env node
// Test script to verify stdio server functionality

const { spawn } = require('child_process');
const path = require('path');

console.log('Testing Adobe After Effects MCP Server...\n');

const serverPath = path.join(__dirname, 'dist', 'stdio-server.js');
const server = spawn('node', [serverPath], {
  env: { ...process.env, AE_BRIDGE_PORT: '8080', LOG_LEVEL: 'debug' }
});

let responseBuffer = '';

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  const lines = responseBuffer.split('\n');
  
  // Process complete lines
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].trim()) {
      try {
        const response = JSON.parse(lines[i]);
        console.log('Response:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('Raw output:', lines[i]);
      }
    }
  }
  
  // Keep the incomplete line in buffer
  responseBuffer = lines[lines.length - 1];
});

server.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Send test messages
setTimeout(() => {
  console.log('\nSending initialize request...');
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  server.stdin.write(JSON.stringify(initRequest) + '\n');
}, 1000);

setTimeout(() => {
  console.log('\nSending initialized notification...');
  const initializedNotification = {
    jsonrpc: '2.0',
    method: 'initialized',
    params: {}
  };
  server.stdin.write(JSON.stringify(initializedNotification) + '\n');
}, 2000);

setTimeout(() => {
  console.log('\nSending tools/list request...');
  const toolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  server.stdin.write(JSON.stringify(toolsRequest) + '\n');
}, 3000);

setTimeout(() => {
  console.log('\nTest complete. Closing server...');
  server.stdin.end();
}, 5000);