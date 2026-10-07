/**
 * AE MCP Bridge - ScriptUI / Startup host
 * Works without CEP (After Effects 2025/2026 CEP 12).
 *
 * If this file is concatenated after host.jsx, the host functions already exist.
 * Otherwise host.jsx is loaded in THIS scope (not inside a nested function).
 */

(function (thisObj) {
    if (typeof initializeMCPBridge !== "function") {
        var here = new File($.fileName);
        var scriptsDir = here.parent.parent;
        var hostFile = new File(scriptsDir.fsName + "/(support)/ae-mcp-host.jsx");
        if (!hostFile.exists) {
            hostFile = new File(here.parent.fsName + "/ae-mcp-bridge/host.jsx");
        }
        if (hostFile.exists) {
            $.evalFile(hostFile);
        }
    }

    if (typeof initializeMCPBridge !== "function" || typeof processCommands !== "function") {
        return;
    }

    $.global.mcpInitializeMCPBridge = initializeMCPBridge;
    $.global.mcpProcessCommands = processCommands;
    $.global.mcpHasPendingCommands = mcpHasPendingCommands;
    $.global.mcpParseFn = mcpParse;
    $.global.mcpOpenCommandsFolder = openCommandsFolder;
    $.global.mcpSleepBackgroundPoller = mcpSleepBackgroundPoller;

    var initResult = initializeMCPBridge();
    if (initResult !== "success") {
        $.global.mcpBridgeLastStatus = String(initResult);
        return;
    }

    $.global.mcpWriteAlive = function (status) {
        try {
            var alive = new File(Folder.myDocuments.fsName + "/ae-mcp-commands/_bridge_alive.txt");
            alive.encoding = "UTF-8";
            if (alive.open("w")) {
                alive.write(String(new Date().getTime()) + " " + String(status || "Sleeping"));
                alive.close();
            }
        } catch (aliveErr) {}
    };

    // NEVER start app.scheduleTask here. A background ExtendScript loop
    // crashes AE when the user replaces footage (BEE_WorkQueue PreCloseProject).
    // CEP Chromium watches the command folder without touching the AE engine.
    $.global.mcpBridgeAutoProcess = false;
    $.global.mcpBridgeProcessed = $.global.mcpBridgeProcessed || 0;
    $.global.mcpBridgeErrors = $.global.mcpBridgeErrors || 0;
    mcpSleepBackgroundPoller();
    $.global.mcpWriteAlive("Sleeping");

    function buildUI(container) {
        var pal = (container instanceof Panel) ? container : new Window("palette", "AE MCP Bridge", undefined, { resizeable: true });
        pal.orientation = "column";
        pal.alignChildren = ["fill", "top"];
        pal.spacing = 8;
        pal.margins = 12;

        var statusRow = pal.add("group");
        statusRow.orientation = "row";
        statusRow.alignChildren = ["left", "center"];
        var statusLabel = statusRow.add("statictext", undefined, "Status: Ready");
        statusLabel.characters = 36;

        var statsRow = pal.add("group");
        statsRow.orientation = "row";
        var processedLabel = statsRow.add("statictext", undefined, "Processed: 0");
        processedLabel.characters = 16;
        var errorsLabel = statsRow.add("statictext", undefined, "Errors: 0");
        errorsLabel.characters = 14;

        var btnRow = pal.add("group");
        btnRow.orientation = "row";
        btnRow.alignChildren = ["fill", "center"];
        var processBtn = btnRow.add("button", undefined, "Process Now");
        var folderBtn = btnRow.add("button", undefined, "Open Folder");

        processBtn.onClick = function () {
            try {
                var raw = $.global.mcpProcessCommands(false);
                var parsed = $.global.mcpParseFn(raw);
                if (parsed && parsed.processed) {
                    $.global.mcpBridgeProcessed += parsed.processed;
                }
                if (parsed && parsed.errors) {
                    $.global.mcpBridgeErrors += parsed.errors;
                }
                $.global.mcpBridgeLastStatus = "Sleeping";
                if (typeof mcpSleepBackgroundPoller === "function") {
                    mcpSleepBackgroundPoller();
                }
            } catch (e) {
                $.global.mcpBridgeLastStatus = String(e);
            }
        };

        folderBtn.onClick = function () {
            try {
                $.global.mcpOpenCommandsFolder();
            } catch (e) {}
        };

        pal.onActivate = function () {
            try {
                statusLabel.text = "Status: " + ($.global.mcpBridgeLastStatus || "Ready");
                processedLabel.text = "Processed: " + ($.global.mcpBridgeProcessed || 0);
                errorsLabel.text = "Errors: " + ($.global.mcpBridgeErrors || 0);
            } catch (e) {}
        };

        if (pal instanceof Window) {
            pal.center();
            pal.show();
        } else {
            pal.layout.layout(true);
        }
        return pal;
    }

    var parentName = "";
    try {
        parentName = new File($.fileName).parent.name;
    } catch (e) {
        parentName = "";
    }

    var isDockable = (thisObj instanceof Panel);
    var isStartup = (parentName === "Startup");

    if (isDockable) {
        buildUI(thisObj);
    } else if (!isStartup) {
        buildUI(thisObj);
    }
})(this);
