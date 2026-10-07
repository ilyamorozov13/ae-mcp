import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';

export const CEP_HEARTBEAT_FILE = '_cep_alive.txt';
export const CEP_HEARTBEAT_MAX_AGE_MS = 8000;
export const KICK_SCRIPT_NAME = '_kick_process.jsx';

const KICK_DEBOUNCE_MS = 400;
let lastKickAt = 0;

export type KickLogger = {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  debug?: (msg: string) => void;
};

export function isCepHeartbeatFresh(
  mtimeMs: number,
  nowMs: number,
  maxAgeMs: number = CEP_HEARTBEAT_MAX_AGE_MS
): boolean {
  return nowMs - mtimeMs <= maxAgeMs;
}

export function isCepPanelAlive(commandsDir: string, nowMs: number = Date.now()): boolean {
  const heartbeatPath = path.join(commandsDir, CEP_HEARTBEAT_FILE);
  try {
    const stat = fs.statSync(heartbeatPath);
    return isCepHeartbeatFresh(stat.mtimeMs, nowMs);
  } catch {
    return false;
  }
}

export function buildKickJsx(hostJsxPath: string): string {
  const escaped = hostJsxPath.replace(/\\/g, '/').replace(/'/g, "\\'");
  let script = '';
  script += '(function () {\n';
  script += "    var host = new File('" + escaped + "');\n";
  script += '    if (host.exists) {\n';
  script += '        $.evalFile(host);\n';
  script += '    }\n';
  script += '    if (typeof initializeMCPBridge === "function") {\n';
  script += '        initializeMCPBridge();\n';
  script += '    }\n';
  script += '    var raw = "no-processCommands";\n';
  script += '    if (typeof processCommands === "function") {\n';
  script += '        raw = processCommands(false);\n';
  script += '    }\n';
  script += '    if (typeof mcpSleepBackgroundPoller === "function") {\n';
  script += '        mcpSleepBackgroundPoller();\n';
  script += '    }\n';
  script += '    return raw;\n';
  script += '})();\n';
  return script;
}

export function findAfterEffectsAppName(): string | null {
  const years = ['2027', '2026', '2025', '2024'];
  for (let i = 0; i < years.length; i++) {
    const name = 'Adobe After Effects ' + years[i];
    if (fs.existsSync('/Applications/' + name + '/' + name + '.app')) {
      return name;
    }
  }
  return null;
}

export function resolveHostJsxPath(fromDir?: string): string | null {
  const home = os.homedir();
  const candidates = [
    fromDir ? path.resolve(fromDir, '../../cep-extension/jsx/host.jsx') : '',
    path.join(process.cwd(), 'cep-extension/jsx/host.jsx'),
    path.join(home, 'Library/Application Support/Adobe/CEP/extensions/com.aemcp.bridge/jsx/host.jsx'),
    path.join(home, 'Documents/Adobe/After Effects 2026/Scripts/(support)/ae-mcp-host.jsx'),
    path.join(home, 'Documents/Adobe/After Effects 2025/Scripts/(support)/ae-mcp-host.jsx'),
    path.join(home, 'Documents/Adobe/After Effects 2027/Scripts/(support)/ae-mcp-host.jsx')
  ];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function buildDoScript(appName: string, kickJsxPath: string): string {
  const posix = kickJsxPath.replace(/\\/g, '/');
  return 'tell application "' + appName + '" to DoScript "$.evalFile(\\"' + posix + '\\");"';
}

export function kickAfterEffectsIfNeeded(options: {
  commandsDir: string;
  hostJsxPath?: string | null;
  fromDir?: string;
  logger?: KickLogger;
  nowMs?: number;
}): boolean {
  if (isCepPanelAlive(options.commandsDir, options.nowMs)) {
    if (options.logger && options.logger.debug) {
      options.logger.debug('CEP heartbeat fresh — skip AppleScript kick');
    }
    return false;
  }

  const now = options.nowMs || Date.now();
  if (now - lastKickAt < KICK_DEBOUNCE_MS) {
    return false;
  }
  lastKickAt = now;

  const host = options.hostJsxPath || resolveHostJsxPath(options.fromDir);
  if (!host) {
    if (options.logger) {
      options.logger.warn('Cannot kick After Effects: host.jsx not found');
    }
    return false;
  }

  const appName = findAfterEffectsAppName();
  if (!appName) {
    if (options.logger) {
      options.logger.warn('Cannot kick After Effects: app not found in /Applications');
    }
    return false;
  }

  const kickPath = path.join(options.commandsDir, KICK_SCRIPT_NAME);
  try {
    fs.writeFileSync(kickPath, buildKickJsx(host), 'utf8');
  } catch (err) {
    if (options.logger) {
      options.logger.warn('Failed to write kick script: ' + String(err));
    }
    return false;
  }

  const appleScript = buildDoScript(appName, kickPath);
  if (options.logger) {
    options.logger.info('CEP panel not alive — kicking After Effects via AppleScript to process MCP commands');
  }

  execFile('osascript', ['-e', appleScript], { timeout: 20000 }, function (err) {
    if (err && options.logger) {
      options.logger.warn('AppleScript AE kick failed: ' + err.message);
    }
  });

  return true;
}

export function resetKickDebounceForTests() {
  lastKickAt = 0;
}
