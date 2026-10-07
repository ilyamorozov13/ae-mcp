import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  isCepHeartbeatFresh,
  buildKickJsx,
  buildDoScript,
  CEP_HEARTBEAT_MAX_AGE_MS,
  resetKickDebounceForTests
} from '../ae-integration/aeKick';

describe('AE MCP AppleScript kick', () => {
  beforeEach(() => {
    resetKickDebounceForTests();
  });

  it('treats a CEP heartbeat younger than 8s as alive', () => {
    expect(isCepHeartbeatFresh(1000, 1000 + CEP_HEARTBEAT_MAX_AGE_MS, CEP_HEARTBEAT_MAX_AGE_MS)).toBe(true);
    expect(isCepHeartbeatFresh(1000, 1000 + CEP_HEARTBEAT_MAX_AGE_MS + 1, CEP_HEARTBEAT_MAX_AGE_MS)).toBe(false);
  });

  it('builds ES3 kick JSX that loads host and processes once', () => {
    const jsx = buildKickJsx('/Users/me/cep-extension/jsx/host.jsx');
    expect(jsx).toContain("var host = new File('/Users/me/cep-extension/jsx/host.jsx');");
    expect(jsx).toContain('$.evalFile(host);');
    expect(jsx).toContain('initializeMCPBridge()');
    expect(jsx).toContain('processCommands(false)');
    expect(jsx).toContain('mcpSleepBackgroundPoller()');
    expect(jsx).not.toContain('app.scheduleTask');
    expect(jsx).not.toMatch(/\b(const|let)\s+/);
    expect(jsx).not.toContain('=>');
    expect(jsx).not.toContain('`');
  });

  it('builds AppleScript DoScript without a background poller', () => {
    const script = buildDoScript(
      'Adobe After Effects 2026',
      '/Users/me/Documents/ae-mcp-commands/_kick_process.jsx'
    );
    expect(script).toContain('tell application "Adobe After Effects 2026"');
    expect(script).toContain('DoScript');
    expect(script).toContain('_kick_process.jsx');
    expect(script).not.toContain('scheduleTask');
  });
});
