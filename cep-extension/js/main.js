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
            logCount: document.getElementById('logCount')
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
        setStatus('processing', 'Processing...');
        
        csInterface.evalScript('processCommands()', function(result) {
            try {
                var response = JSON.parse(result);
                
                if (response.success) {
                    if (response.processed > 0) {
                        stats.processed += response.processed;
                        addLogEntry('Processed ' + response.processed + ' command(s)', 'success');
                        
                        // Log each processed command
                        if (response.commands) {
                            response.commands.forEach(function(cmd) {
                                addLogEntry('  → ' + cmd, 'info');
                            });
                        }
                    }
                    
                    if (response.errors > 0) {
                        stats.errors += response.errors;
                        addLogEntry('Encountered ' + response.errors + ' error(s)', 'error');
                    }
                    
                    setStatus('ready', 'Ready');
                } else {
                    addLogEntry('Error: ' + response.error, 'error');
                    setStatus('error', 'Error');
                    stats.errors++;
                }
            } catch (e) {
                addLogEntry('Failed to process commands: ' + e.message, 'error');
                setStatus('error', 'Error');
                stats.errors++;
            }
            
            updateStats();
        });
    }
    
    /**
     * Clear the log
     */
    function clearLog() {
        logEntries = [];
        elements.log.innerHTML = '';
        elements.logCount.textContent = '0 entries';
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
            }, 200); // Process every 200ms
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
     * Set status indicator
     */
    function setStatus(state, text) {
        elements.statusIndicator.className = 'status-indicator ' + state;
        elements.statusText.textContent = text;
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