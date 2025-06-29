/**
 * Test suite for After Effects MCP commands
 * Tests command validation, parameter handling, and ES3 compatibility
 */

import { describe, it, expect } from '@jest/globals';
import { AEErrorHandler } from '../ae-integration/errorHandler';
import { ScriptGenerator } from '../ae-integration/scriptGeneratorNew';

interface TestCase {
  command: string;
  params: any;
  shouldPass: boolean;
  expectedErrors?: string[];
  description: string;
}

// Test cases for parameter validation
const validationTests: TestCase[] = [
  // Composition tests
  {
    command: 'create_composition',
    params: { name: 'Test Comp' },
    shouldPass: true,
    description: 'Create composition with minimum params'
  },
  {
    command: 'create_composition',
    params: { name: 'Test Comp', width: 1920, height: 1080, frameRate: 30, duration: 10 },
    shouldPass: true,
    description: 'Create composition with all params'
  },
  {
    command: 'modify_composition',
    params: { compId: 0 },
    shouldPass: false,
    expectedErrors: ['compId must be a positive number'],
    description: 'Invalid compId (0)'
  },
  
  // Layer tests
  {
    command: 'add_solid_layer',
    params: { compId: 1 },
    shouldPass: true,
    description: 'Add solid layer with minimum params'
  },
  {
    command: 'modify_layer_properties',
    params: { compId: 1, layerIndex: 0, properties: {} },
    shouldPass: false,
    expectedErrors: ['layerIndex must be a positive number (1-based)'],
    description: 'Invalid layer index (0)'
  },
  
  // Keyframe tests
  {
    command: 'set_keyframe',
    params: { compId: 1, layerIndex: 1, property: 'Position', time: 0, value: [960, 540] },
    shouldPass: true,
    description: 'Set keyframe with valid params'
  },
  {
    command: 'set_keyframe',
    params: { compId: 1, layerIndex: 1, property: 'Position', value: [960, 540] },
    shouldPass: false,
    expectedErrors: ['time is required and must be a number'],
    description: 'Missing time parameter'
  },
  {
    command: 'set_keyframe_advanced',
    params: { compId: 1, layerIndex: 1, propertyPath: 'Transform.Position' },
    shouldPass: false,
    expectedErrors: ['time is required and must be a number', 'value is required'],
    description: 'Missing required parameters'
  },
  
  // Easy Ease tests
  {
    command: 'apply_easy_ease',
    params: { compId: 1, layerIndex: 1 },
    shouldPass: false,
    expectedErrors: ['propertyPath is required and must be a string'],
    description: 'Missing propertyPath'
  },
  {
    command: 'apply_easy_ease',
    params: { compId: 1, layerIndex: 1, propertyPath: 'Transform.Position' },
    shouldPass: true,
    description: 'Valid easy ease params'
  },
  {
    command: 'apply_easy_ease',
    params: { compId: 1, layerIndex: 1, propertyPath: 'Transform.Position', easeType: 'invalid' },
    shouldPass: false,
    expectedErrors: ['easeType must be one of: ease, easeIn, easeOut'],
    description: 'Invalid ease type'
  },
  
  // Batch execute tests
  {
    command: 'batch_execute',
    params: { commands: [] },
    shouldPass: false,
    expectedErrors: ['commands must be a non-empty array'],
    description: 'Empty commands array'
  },
  {
    command: 'batch_execute',
    params: { commands: null },
    shouldPass: false,
    expectedErrors: ['commands must be a non-empty array'],
    description: 'Null commands'
  },
  {
    command: 'batch_execute',
    params: { 
      commands: [
        { tool: 'set_keyframe', params: { compId: 1, layerIndex: 1, property: 'Position', time: 0, value: [0, 0] } }
      ] 
    },
    shouldPass: true,
    description: 'Valid batch execute'
  }
];

// Test ES3 compatibility of generated scripts
const es3CompatibilityTests = [
  {
    name: 'No template literals in generated scripts',
    test: (script: string) => {
      return !script.includes('${');
    }
  },
  {
    name: 'No arrow functions',
    test: (script: string) => {
      return !script.includes('=>');
    }
  },
  {
    name: 'No const/let keywords',
    test: (script: string) => {
      return !script.includes('const ') && !script.includes('let ');
    }
  },
  {
    name: 'No destructuring',
    test: (script: string) => {
      return !script.match(/\{[^}]+\}\s*=/);
    }
  },
  {
    name: 'Proper error handling structure',
    test: (script: string) => {
      return script.includes('try {') && script.includes('} catch (error)');
    }
  }
];

export function runValidationTests() {
  console.log('Running parameter validation tests...\n');
  let passed = 0;
  let failed = 0;

  validationTests.forEach(testCase => {
    const result = AEErrorHandler.validateParams(testCase.command, testCase.params);
    const testPassed = result.valid === testCase.shouldPass;
    
    if (testPassed && testCase.expectedErrors) {
      // Check if expected errors match
      const errorsMatch = testCase.expectedErrors.every(expectedError => 
        result.errors.some(error => error.includes(expectedError))
      );
      
      if (!errorsMatch) {
        console.log(`❌ ${testCase.description}`);
        console.log(`   Expected errors: ${testCase.expectedErrors.join(', ')}`);
        console.log(`   Actual errors: ${result.errors.join(', ')}`);
        failed++;
        return;
      }
    }
    
    if (testPassed) {
      console.log(`✅ ${testCase.description}`);
      passed++;
    } else {
      console.log(`❌ ${testCase.description}`);
      console.log(`   Expected: ${testCase.shouldPass ? 'pass' : 'fail'}`);
      console.log(`   Actual: ${result.valid ? 'pass' : 'fail'}`);
      console.log(`   Errors: ${result.errors.join(', ')}`);
      failed++;
    }
  });

  console.log(`\nValidation Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

export function runES3CompatibilityTests() {
  console.log('Running ES3 compatibility tests...\n');
  let passed = 0;
  let failed = 0;

  const generator = new ScriptGenerator();
  
  // Test a few key commands for ES3 compatibility
  const testCommands = [
    { command: 'create_composition', params: { name: 'Test' } },
    { command: 'set_keyframe', params: { compId: 1, layerIndex: 1, property: 'Position', time: 0, value: [0, 0] } },
    { command: 'apply_easy_ease', params: { compId: 1, layerIndex: 1, propertyPath: 'Transform.Position' } },
    { command: 'add_wiggle_expression', params: { compId: 1, layerIndex: 1, propertyPath: 'Transform.Position' } }
  ];

  testCommands.forEach(({ command, params }) => {
    try {
      const script = generator.generate(command, params);
      
      console.log(`Testing ${command}...`);
      es3CompatibilityTests.forEach(test => {
        if (test.test(script)) {
          console.log(`  ✅ ${test.name}`);
          passed++;
        } else {
          console.log(`  ❌ ${test.name}`);
          failed++;
          // Show problematic line for debugging
          const lines = script.split('\n');
          lines.forEach((line, i) => {
            if (!test.test(line)) {
              console.log(`     Line ${i + 1}: ${line.trim()}`);
            }
          });
        }
      });
    } catch (error: any) {
      console.log(`  ❌ Failed to generate script for ${command}: ${error.message}`);
      failed += es3CompatibilityTests.length;
    }
    console.log('');
  });

  console.log(`ES3 Compatibility Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

export function runErrorMessageTests() {
  console.log('Running error message formatting tests...\n');
  let passed = 0;
  let failed = 0;

  const testCases = [
    {
      error: new Error('Test error'),
      command: 'set_keyframe',
      params: { compId: 1, layerIndex: 1, time: 0 },
      description: 'Basic error formatting'
    },
    {
      error: { message: 'AE Error', number: 93 },
      command: 'apply_effect',
      params: { compId: 1, layerIndex: 1, effectName: 'Blur' },
      description: 'AE error code mapping'
    }
  ];

  testCases.forEach(testCase => {
    try {
      const formatted = AEErrorHandler.formatError(testCase.error, {
        command: testCase.command,
        params: testCase.params
      });

      if (formatted.message && formatted.code) {
        console.log(`✅ ${testCase.description}`);
        console.log(`   Code: ${formatted.code}`);
        console.log(`   Message: ${formatted.message}`);
        passed++;
      } else {
        console.log(`❌ ${testCase.description} - Missing required fields`);
        failed++;
      }
    } catch (error: any) {
      console.log(`❌ ${testCase.description} - ${error.message}`);
      failed++;
    }
  });

  console.log(`\nError Message Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

// Run all tests
export function runAllTests() {
  console.log('=== After Effects MCP Test Suite ===\n');
  
  const validationResults = runValidationTests();
  const es3Results = runES3CompatibilityTests();
  const errorResults = runErrorMessageTests();
  
  const totalPassed = validationResults.passed + es3Results.passed + errorResults.passed;
  const totalFailed = validationResults.failed + es3Results.failed + errorResults.failed;
  
  console.log('=== Summary ===');
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);
  
  return totalFailed === 0;
}

// Jest test suites
describe('AE Commands Validation', () => {
  it('should validate parameters correctly', () => {
    const results = runValidationTests();
    expect(results.failed).toBe(0);
  });

  it('should generate ES3 compatible scripts', () => {
    const results = runES3CompatibilityTests();
    expect(results.failed).toBe(0);
  });

  it('should provide helpful error messages', () => {
    const results = runErrorMessageTests();
    expect(results.failed).toBe(0);
  });
});