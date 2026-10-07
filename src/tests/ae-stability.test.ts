import { describe, it, expect } from '@jest/globals';
import { utilityGenerators } from '../ae-integration/generators/utilityGenerators';
import { ScriptGenerator } from '../ae-integration/scriptGeneratorNew';
import { aeCommandUsesUndo, READ_ONLY_AE_COMMANDS } from '../ae-integration/readOnlyCommands';

describe('AE agent stability', () => {
  it('does not nest undo groups in execute_script by default', () => {
    const script = utilityGenerators.executeScript({
      script: 'return "ok";'
    });

    expect(script).not.toContain('app.beginUndoGroup');
    expect(script).toContain('mcpScriptResult = (function()');
    expect(script).toContain('app.endSuppressDialogs(false)');
    expect(script).not.toMatch(/\b(const|let)\s+/);
    expect(script).not.toContain('=>');
    expect(script).not.toContain('`');
  });

  it('keeps cleanup if the user script returns early', () => {
    const script = utilityGenerators.executeScript({
      script: 'app.beginSuppressDialogs();\nreturn "done";'
    });

    const iifeIndex = script.indexOf('mcpScriptResult = (function()');
    const finallyIndex = script.indexOf('} finally {');
    const dialogsIndex = script.indexOf('app.endSuppressDialogs(false)');

    expect(iifeIndex).toBeGreaterThan(-1);
    expect(finallyIndex).toBeGreaterThan(iifeIndex);
    expect(dialogsIndex).toBeGreaterThan(finallyIndex);
  });

  it('only wraps undo when wrapInTransaction is explicitly true', () => {
    const wrapped = utilityGenerators.executeScript({
      script: 'return 1;',
      wrapInTransaction: true,
      undoGroupName: 'Test Group'
    });

    expect(wrapped).toContain('app.beginUndoGroup("Test Group")');
    expect(wrapped).toContain('app.endUndoGroup()');
  });

  it('marks inspection commands as read-only', () => {
    expect(aeCommandUsesUndo('ping')).toBe(false);
    expect(aeCommandUsesUndo('get_project_info')).toBe(false);
    expect(aeCommandUsesUndo('list_compositions')).toBe(false);
    expect(aeCommandUsesUndo('execute_script')).toBe(true);
    expect(aeCommandUsesUndo('import_footage')).toBe(true);
    expect(READ_ONLY_AE_COMMANDS.has('get_layer_info')).toBe(true);
  });

  it('wraps generated execute_script in an IIFE without extra undo groups', () => {
    const generator = new ScriptGenerator();
    const wrapped = generator.generate('execute_script', {
      script: 'return "ok";'
    });

    expect(wrapped).toContain('(function()');
    expect(wrapped).not.toContain('app.beginUndoGroup');
  });

  it('does not leave a Startup scheduleTask poller in the bridge', () => {
    const fs = require('fs');
    const path = require('path');
    const root = path.resolve(__dirname, '../../cep-extension');
    const host = fs.readFileSync(path.join(root, 'jsx/host.jsx'), 'utf8');
    const panel = fs.readFileSync(path.join(root, 'jsx/mcp-bridge-panel.jsx'), 'utf8');
    const main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
    const kick = fs.readFileSync(path.join(__dirname, '../ae-integration/aeKick.ts'), 'utf8');

    expect(host).toContain('mcpSleepBackgroundPoller');
    expect(host).not.toMatch(/app\.purge\s*\(/);
    expect(host).not.toContain('PurgeTarget');
    expect(panel).not.toMatch(/app\.scheduleTask\s*\(/);
    expect(main).toContain('Must never fall back to evalScript');
    expect(kick).toContain('kickAfterEffectsIfNeeded');
    expect(kick).toContain('DoScript');
    expect(kick).not.toContain('scheduleTask');
  });
});
