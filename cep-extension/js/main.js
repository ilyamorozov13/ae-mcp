/**
 * AE MCP Bridge Panel - Main JavaScript
 */

(function() {
    'use strict';
    
    // Initialize CSInterface
    var csInterface = new CSInterface();
    
    // State variables
    var autoProcess = true;
    var processInterval = null;
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
    });
    
    /**
     * Cache DOM elements
     */
    function initializeElements() {
        elements = {
            status: document.getElementById('status'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            btnProcess: document.getElementById('btnProcess'),
            btnClearLog: document.getElementById('btnClearLog'),
            btnOpenFolder: document.getElementById('btnOpenFolder'),
            btnToggleAuto: document.getElementById('btnToggleAuto'),
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
        elements.btnProcess.addEventListener('click', processCommands);
        elements.btnClearLog.addEventListener('click', clearLog);
        elements.btnOpenFolder.addEventListener('click', openCommandsFolder);
        elements.btnToggleAuto.addEventListener('click', toggleAutoProcess);
    }
    
    /**
     * Initialize ExtendScript
     */
    function initializeExtendScript() {
        csInterface.evalScript('initializeMCPBridge()', function(result) {
            if (result === 'success') {
                addLogEntry('MCP Bridge initialized successfully', 'success');
            } else {
                addLogEntry('Failed to initialize MCP Bridge: ' + result, 'error');
            }
        });
    }
    
    /**
     * Process commands manually
     */
    function processCommands() {
        csInterface.evalScript('processCommands()', function(result) {
            try {
                var response = JSON.parse(result);
                
                if (response.success) {
                    // Only update status if we actually processed something
                    if (response.processed > 0) {
                        setStatus('processing', 'Processing...');
                        stats.processed += response.processed;
                        addLogEntry('Processed ' + response.processed + ' command(s)', 'success');
                        
                        // Log each processed command
                        if (response.commands) {
                            response.commands.forEach(function(cmd) {
                                addLogEntry('  → ' + cmd, 'info');
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
     * Start auto-processing
     */
    function startAutoProcessing() {
        if (processInterval) {
            clearInterval(processInterval);
        }
        
        if (autoProcess) {
            processInterval = setInterval(function() {
                processCommands();
                updateLastCheck();
            }, 500); // Process every 500ms (reduced frequency)
        }
    }
    
    /**
     * Stop auto-processing
     */
    function stopAutoProcessing() {
        if (processInterval) {
            clearInterval(processInterval);
            processInterval = null;
        }
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