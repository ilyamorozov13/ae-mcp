/**
 * AE MCP Bridge Panel - Main JavaScript
 */

(function() {
    'use strict';
    
    // Initialize CSInterface
    var csInterface = new CSInterface();
    
    // State variables
    var autoProcess = true;
    var debugMode = localStorage.getItem('mcpDebugMode') === 'true';
    var processInterval = null;
    var processingLock = false;
    var idleTicks = 0;
    var ACTIVE_POLL_MS = 400;
    var IDLE_POLL_MS = 2000;
    var stats = {
        processed: 0,
        errors: 0
    };
    var logEntries = [];
    var maxLogEntries = 100;
    var recentErrors = []; // Track recent errors for persistent display
    var maxRecentErrors = 5;
    
    // Status management
    var statusTimer = null;
    var lastStatus = 'ready';
    var minStatusDuration = 500; // Minimum time to show a status
    
    // DOM elements
    var elements = {};
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeElements();
        setupEventListeners();
        startAutoProcessing();
        initializeExtendScript();
        updateUI();
        
        // Initialize debug mode button state
        if (debugMode) {
            elements.btnToggleDebug.textContent = 'Debug Mode: ON';
            elements.btnToggleDebug.classList.add('active');
        }
    });
    
    /**
     * Cache DOM elements
     */
    function initializeElements() {
        elements = {
            status: document.getElementById('status'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            btnClearLog: document.getElementById('btnClearLog'),
            btnOpenFolder: document.getElementById('btnOpenFolder'),
            btnToggleAuto: document.getElementById('btnToggleAuto'),
            btnToggleDebug: document.getElementById('btnToggleDebug'),
            statProcessed: document.getElementById('statProcessed'),
            statErrors: document.getElementById('statErrors'),
            statLastCheck: document.getElementById('statLastCheck'),
            log: document.getElementById('log'),
            logCount: document.getElementById('logCount'),
            recentErrors: document.getElementById('recentErrors')
        };
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        elements.btnClearLog.addEventListener('click', clearLog);
        elements.btnOpenFolder.addEventListener('click', openCommandsFolder);
        elements.btnToggleAuto.addEventListener('click', toggleAutoProcess);
        elements.btnToggleDebug.addEventListener('click', toggleDebugMode);
    }
    
    /**
     * Initialize ExtendScript
     */
    function initializeExtendScript() {
        csInterface.evalScript('initializeMCPBridge(); mcpSleepBackgroundPoller(); "success"', function(result) {
            if (result === 'success' || result === '"success"') {
                addLogEntry('MCP Bridge sleeping — After Effects is safe to edit', 'success');
                setStatus('ready', 'Sleeping — safe to edit');
            } else {
                addLogEntry('Failed to initialize MCP Bridge: ' + result, 'error');
            }
        });
    }
    
    /**
     * Command folder listing from Chromium/Node only.
     * Must never fall back to evalScript — that is what crashes AE
     * when the user replaces a photo (BEE_WorkQueue PreCloseProject).
     */
    function getCommandsDir() {
        return csInterface.getSystemPath(CSInterface.SystemPath.MY_DOCUMENTS) + '/ae-mcp-commands';
    }

    function listCommandFiles() {
        var dir = getCommandsDir();
        try {
            if (window.cep && window.cep.fs && typeof window.cep.fs.readdir === 'function') {
                var listing = window.cep.fs.readdir(dir);
                if (listing && listing.err === 0 && listing.data) {
                    return listing.data;
                }
            }
        } catch (cepErr) {}
        try {
            var nodeFs = window.require && window.require('fs');
            if (nodeFs && typeof nodeFs.readdirSync === 'function') {
                return nodeFs.readdirSync(dir);
            }
        } catch (nodeErr) {}
        return null;
    }

    function hasPendingCommandFiles() {
        var names = listCommandFiles();
        if (!names) {
            return false;
        }
        for (var i = 0; i < names.length; i++) {
            var name = names[i];
            if (name.indexOf('.json') === -1) {
                continue;
            }
            if (name.indexOf('.response') !== -1 || name.indexOf('.processed') !== -1) {
                continue;
            }
            if (name.indexOf('_') === 0) {
                continue;
            }
            return true;
        }
        return false;
    }

    function writeCepAlive(status) {
        try {
            var path = getCommandsDir() + '/_cep_alive.txt';
            var body = String(Date.now()) + ' ' + String(status || 'Sleeping');
            if (window.cep && window.cep.fs && typeof window.cep.fs.writeFile === 'function') {
                window.cep.fs.writeFile(path, body);
            } else {
                var nodeFs = window.require && window.require('fs');
                if (nodeFs && typeof nodeFs.writeFileSync === 'function') {
                    nodeFs.writeFileSync(path, body);
                }
            }
        } catch (e) {}
    }

    /**
     * Process commands manually
     */
    function processCommands() {
        if (processingLock) {
            return;
        }

        if (!hasPendingCommandFiles()) {
            idleTicks++;
            writeCepAlive('Sleeping');
            if (idleTicks === 1) {
                setStatus('ready', 'Sleeping — safe to edit');
            }
            return;
        }

        idleTicks = 0;
        processingLock = true;
        writeCepAlive('Processing');
        var startTime = Date.now();
        csInterface.evalScript('processCommands(' + debugMode + ')', function(result) {
            processingLock = false;
            writeCepAlive('Sleeping');
            csInterface.evalScript('mcpSleepBackgroundPoller(); "ok"');
            try {
                if (!result || result === 'undefined') {
                    return;
                }

                var response = JSON.parse(result);
                if (typeof response.success !== 'boolean') {
                    if (typeof response.processed === 'number' &&
                        typeof response.errors === 'number' &&
                        response.commands instanceof Array) {
                        response.success = true;
                    } else {
                        throw new Error('Invalid host response: ' + String(result).substring(0, 200));
                    }
                }
                
                if (response.success) {
                    // Only update status if we actually processed something
                    if (response.processed > 0) {
                        var elapsedTime = Date.now() - startTime;
                        setStatus('processing', 'Processing...');
                        stats.processed += response.processed;
                        
                        if (debugMode) {
                            addLogEntry('Processed ' + response.processed + ' command(s) in ' + elapsedTime + 'ms', 'success');
                        } else {
                            addLogEntry('Processed ' + response.processed + ' command(s)', 'success');
                        }
                        
                        // Log each processed command
                        if (response.commands) {
                            response.commands.forEach(function(cmd) {
                                if (typeof cmd === 'object' && debugMode) {
                                    // In debug mode, show detailed command info
                                    addLogEntry('  → Command: ' + cmd.file, 'info');
                                    if (cmd.content) {
                                        addLogEntry('    JSON: ' + cmd.content, 'debug');
                                    }
                                    if (cmd.executionTime) {
                                        addLogEntry('    Execution time: ' + cmd.executionTime + 'ms', 'debug');
                                    }
                                } else {
                                    addLogEntry('  → ' + cmd, 'info');
                                }
                            });
                        }
                        
                        // Set back to ready after a delay
                        setTimeout(function() {
                            setStatus('ready', 'Ready');
                        }, minStatusDuration);
                    }
                    
                    if (response.errors > 0) {
                        stats.errors += response.errors;
                        var errorMsg = 'Encountered ' + response.errors + ' error(s)';
                        addLogEntry(errorMsg, 'error');
                        
                        // In debug mode, show detailed error information
                        if (debugMode && response.errorDetails) {
                            response.errorDetails.forEach(function(error) {
                                addLogEntry('  → Error in ' + error.file + ': ' + error.message, 'error');
                                if (error.stack) {
                                    addLogEntry('    Stack: ' + error.stack, 'debug');
                                }
                            });
                        }
                        
                        addRecentError(errorMsg);
                        setStatus('error', 'Error: ' + errorMsg);
                        
                        // Keep error status visible longer (5 seconds)
                        setTimeout(function() {
                            if (lastStatus === 'error') {
                                setStatus('ready', 'Ready');
                            }
                        }, 5000);
                    }
                } else {
                    var errorMsg = 'Error: ' + response.error;
                    addLogEntry(errorMsg, 'error');
                    addRecentError(errorMsg);
                    setStatus('error', errorMsg);
                    stats.errors++;
                    
                    // Keep error status visible longer (5 seconds)
                    setTimeout(function() {
                        if (lastStatus === 'error') {
                            setStatus('ready', 'Ready');
                        }
                    }, 5000);
                }
            } catch (e) {
                var errorMsg = 'Failed to process commands: ' + e.message;
                addLogEntry(errorMsg, 'error');
                addRecentError(errorMsg);
                setStatus('error', 'Parse Error: ' + e.message);
                stats.errors++;
                
                // Keep error status visible longer (5 seconds)
                setTimeout(function() {
                    if (lastStatus === 'error') {
                        setStatus('ready', 'Ready');
                    }
                }, 5000);
            }
            
            updateStats();
        });
    }
    
    /**
     * Clear the log
     */
    function clearLog() {
        logEntries = [];
        recentErrors = [];
        elements.log.innerHTML = '';
        elements.logCount.textContent = '0 entries';
        renderRecentErrors();
        addLogEntry('Log cleared', 'info');
    }
    
    /**
     * Open commands folder
     */
    function openCommandsFolder() {
        csInterface.evalScript('openCommandsFolder()', function(result) {
            if (result !== 'success') {
                addLogEntry('Failed to open commands folder', 'error');
            }
        });
    }
    
    /**
     * Toggle auto-processing
     */
    function toggleAutoProcess() {
        autoProcess = !autoProcess;
        
        if (autoProcess) {
            elements.btnToggleAuto.textContent = 'Auto Process: ON';
            elements.btnToggleAuto.classList.add('active');
            startAutoProcessing();
            addLogEntry('Auto-processing enabled', 'info');
        } else {
            elements.btnToggleAuto.textContent = 'Auto Process: OFF';
            elements.btnToggleAuto.classList.remove('active');
            stopAutoProcessing();
            addLogEntry('Auto-processing disabled', 'info');
        }
    }
    
    /**
     * Toggle debug mode
     */
    function toggleDebugMode() {
        debugMode = !debugMode;
        localStorage.setItem('mcpDebugMode', debugMode);
        
        if (debugMode) {
            elements.btnToggleDebug.textContent = 'Debug Mode: ON';
            elements.btnToggleDebug.classList.add('active');
            addLogEntry('Debug mode enabled - showing detailed command information', 'info');
        } else {
            elements.btnToggleDebug.textContent = 'Debug Mode: OFF';
            elements.btnToggleDebug.classList.remove('active');
            addLogEntry('Debug mode disabled', 'info');
        }
    }
    
    /**
     * Start auto-processing
     */
    function startAutoProcessing() {
        if (processInterval) {
            clearTimeout(processInterval);
            processInterval = null;
        }
        
        function tick() {
            if (!autoProcess) {
                return;
            }
            processCommands();
            updateLastCheck();
            var delay = (idleTicks > 2) ? IDLE_POLL_MS : ACTIVE_POLL_MS;
            processInterval = setTimeout(tick, delay);
        }
        tick();
    }
    
    /**
     * Stop auto-processing
     */
    function stopAutoProcessing() {
        if (processInterval) {
            clearTimeout(processInterval);
            processInterval = null;
        }
        processingLock = false;
    }
    
    /**
     * Add entry to log
     */
    function addLogEntry(message, type) {
        var entry = {
            time: new Date().toLocaleTimeString(),
            message: message,
            type: type || 'info'
        };
        
        logEntries.unshift(entry);
        
        // Limit log entries
        if (logEntries.length > maxLogEntries) {
            logEntries = logEntries.slice(0, maxLogEntries);
        }
        
        renderLog();
    }
    
    /**
     * Add error to recent errors list
     */
    function addRecentError(message) {
        var error = {
            time: new Date().toLocaleTimeString(),
            message: message
        };
        
        recentErrors.unshift(error);
        
        // Limit recent errors
        if (recentErrors.length > maxRecentErrors) {
            recentErrors = recentErrors.slice(0, maxRecentErrors);
        }
        
        renderRecentErrors();
    }
    
    /**
     * Render log entries
     */
    function renderLog() {
        var html = logEntries.map(function(entry) {
            return '<div class="log-entry ' + entry.type + '">' +
                   '<span class="log-time">' + entry.time + '</span>' +
                   '<span class="log-message">' + escapeHtml(entry.message) + '</span>' +
                   '</div>';
        }).join('');
        
        elements.log.innerHTML = html;
        elements.logCount.textContent = logEntries.length + ' ' + 
                                       (logEntries.length === 1 ? 'entry' : 'entries');
    }
    
    /**
     * Render recent errors
     */
    function renderRecentErrors() {
        if (!elements.recentErrors) {
            return;
        }
        
        if (recentErrors.length === 0) {
            elements.recentErrors.style.display = 'none';
            return;
        }
        
        var html = '<div class="recent-errors-header">Recent Errors:</div>' +
                   recentErrors.map(function(error) {
                       return '<div class="recent-error-item">' +
                              '<span class="error-time">' + error.time + '</span> ' +
                              '<span class="error-message">' + escapeHtml(error.message) + '</span>' +
                              '</div>';
                   }).join('');
        
        elements.recentErrors.innerHTML = html;
        elements.recentErrors.style.display = 'block';
    }
    
    /**
     * Set status indicator with debouncing
     */
    function setStatus(state, text) {
        // Clear any pending status change
        if (statusTimer) {
            clearTimeout(statusTimer);
            statusTimer = null;
        }
        
        // Don't update if it's the same status
        if (lastStatus === state && elements.statusText.textContent === text) {
            return;
        }
        
        // Update immediately for error states
        if (state === 'error') {
            elements.statusIndicator.className = 'status-indicator ' + state;
            elements.statusText.textContent = text;
            lastStatus = state;
        } else {
            // For other states, use a small delay to prevent flashing
            statusTimer = setTimeout(function() {
                elements.statusIndicator.className = 'status-indicator ' + state;
                elements.statusText.textContent = text;
                lastStatus = state;
            }, 50);
        }
    }
    
    /**
     * Update statistics display
     */
    function updateStats() {
        elements.statProcessed.textContent = stats.processed;
        elements.statErrors.textContent = stats.errors;
    }
    
    /**
     * Update last check time
     */
    function updateLastCheck() {
        var now = new Date();
        var timeStr = now.toLocaleTimeString();
        elements.statLastCheck.textContent = timeStr;
    }
    
    /**
     * Update UI
     */
    function updateUI() {
        updateStats();
        renderLog();
    }
    
    /**
     * Escape HTML
     */
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Clean up on window unload
    window.addEventListener('beforeunload', function() {
        stopAutoProcessing();
    });
    
})();