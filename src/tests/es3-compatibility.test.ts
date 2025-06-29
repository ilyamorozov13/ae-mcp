import { describe, it, expect } from '@jest/globals';
import { keyframeGenerators } from '../ae-integration/generators/keyframeGenerators';
import { advancedLayerGenerators } from '../ae-integration/generators/advancedLayerGenerators';
import { effectsAndKeyframeGenerators } from '../ae-integration/generators/effectsAndKeyframeGenerators';

describe('ES3 Compatibility Tests', () => {
  describe('Script Generation ES3 Compliance', () => {
    
    const testES3Compliance = (script: string, functionName: string) => {
      // ES3 compatibility checks
      const checks = [
        {
          name: 'No template literals',
          test: !script.includes('`'),
          error: 'Template literals (backticks) are not supported in ES3'
        },
        {
          name: 'No ES6 object literals in generated script',
          test: !script.match(/return\s*\{\s*\w+:/),
          error: 'ES6 object literal syntax found in return statement'
        },
        {
          name: 'No ES6 object shorthand properties',
          test: !script.match(/\{\s*\w+,|\{\s*\w+\s*\}/),
          error: 'ES6 object shorthand properties found'
        },
        {
          name: 'No arrow functions',
          test: !script.includes('=>'),
          error: 'Arrow functions are not supported in ES3'
        },
        {
          name: 'No const/let declarations',
          test: !script.match(/\b(const|let)\s+/),
          error: 'const/let declarations are not supported in ES3, use var'
        },
        {
          name: 'No spread operators',
          test: !script.includes('...'),
          error: 'Spread operators are not supported in ES3'
        },
        {
          name: 'No destructuring',
          test: !script.match(/\{\s*\w+\s*\}\s*=/),
          error: 'Destructuring assignment is not supported in ES3'
        },
        {
          name: 'No for...of loops',
          test: !script.match(/for\s*\(\s*\w+\s+of\s+/),
          error: 'for...of loops are not supported in ES3'
        },
        {
          name: 'Uses ES3-compatible object creation',
          test: script.includes('var result = {};') || script.includes('var ') && script.includes('.push'),
          error: 'Should use ES3-compatible object creation patterns'
        }
      ];

      checks.forEach(check => {
        if (!check.test) {
          throw new Error(`${functionName}: ${check.error}\nScript excerpt: ${script.substring(0, 200)}...`);
        }
      });
    };

    it('keyframeGenerators.applyEasyEase should be ES3 compatible', () => {
      const script = keyframeGenerators.applyEasyEase({
        compId: 1,
        layerIndex: 1,
        propertyPath: 'Transform.Scale',
        easeType: 'ease'
      });
      
      testES3Compliance(script, 'applyEasyEase');
      
      // Specific checks for applyEasyEase
      expect(script).toContain('var result = {};');
      expect(script).toContain('result.success = true;');
      expect(script).toContain('result.data = {};');
      expect(script).toContain('return result;');
      expect(script).not.toMatch(/return\s*\{/);
    });

    it('keyframeGenerators.setKeyframeAdvanced should be ES3 compatible', () => {
      const script = keyframeGenerators.setKeyframeAdvanced({
        compId: 1,
        layerIndex: 1,
        propertyPath: 'Transform.Position',
        time: 0,
        value: [100, 100]
      });
      
      testES3Compliance(script, 'setKeyframeAdvanced');
    });

    it('keyframeGenerators.createAnimationCurve should be ES3 compatible', () => {
      const script = keyframeGenerators.createAnimationCurve({
        compId: 1,
        layerIndex: 1,
        propertyPath: 'Transform.Opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1, value: 100 }
        ]
      });
      
      testES3Compliance(script, 'createAnimationCurve');
    });

    it('advancedLayerGenerators.animateTimeRemap should be ES3 compatible', () => {
      const script = advancedLayerGenerators.animateTimeRemap({
        compId: 1,
        layerIndex: 1,
        keyframes: [
          { time: 0, value: 0 },
          { time: 2, value: 4 }
        ]
      });
      
      testES3Compliance(script, 'animateTimeRemap');
      
      // Specific check for time remap keyframe creation
      expect(script).toContain('keyframes = [];');
      expect(script).toContain('keyframes[0] = {};');
      expect(script).toContain('keyframes[0].time = 0;');
      expect(script).toContain('keyframes[0].value = 0;');
      expect(script).not.toMatch(/\{time:\s*\d+,\s*value:\s*\d+\}/);
    });

    it('effectsAndKeyframeGenerators.setKeyframe should be ES3 compatible', () => {
      const script = effectsAndKeyframeGenerators.setKeyframe({
        compId: 1,
        layerIndex: 1,
        property: 'Transform.Position',
        time: 0,
        value: [100, 100]
      });
      
      testES3Compliance(script, 'setKeyframe');
    });
  });

  describe('Complex Script Generation Tests', () => {
    it('should handle nested object creation without ES6 syntax', () => {
      const script = keyframeGenerators.copyKeyframes({
        compId: 1,
        sourceLayer: 1,
        sourceProperty: 'Transform.Position',
        targetLayer: 2,
        targetProperty: 'Transform.Position',
        timeOffset: 1,
        reverseKeyframes: true
      });

      // Should not contain ES6 object literals
      expect(script).not.toMatch(/\{\s*\w+:\s*[^}]+,/);
      expect(script).not.toMatch(/return\s*\{/);
      
      // Should contain ES3-compatible patterns
      expect(script).toContain('var result = {};');
      expect(script).toContain('return result;');
    });

    it('should handle animation presets without ES6 syntax', () => {
      const script = keyframeGenerators.applyAnimationPreset({
        compId: 1,
        layerIndex: 1,
        preset: 'fadeIn',
        properties: ['opacity'],
        startTime: 0,
        duration: 1
      });

      const testES3ComplianceLocal = (script: string, functionName: string) => {
        // Local copy of the function to avoid scope issues
        const checks = [
          {
            name: 'No template literals',
            test: !script.includes('`'),
            error: 'Template literals (backticks) are not supported in ES3'
          },
          {
            name: 'No ES6 object literals in generated script',
            test: !script.match(/return\s*\{\s*\w+:/),
            error: 'ES6 object literal syntax found in return statement'
          },
          {
            name: 'Uses ES3-compatible object creation',
            test: script.includes('var result = {};') || (script.includes('var ') && script.includes('.push')),
            error: 'Should use ES3-compatible object creation patterns'
          }
        ];

        checks.forEach(check => {
          if (!check.test) {
            throw new Error(`${functionName}: ${check.error}\nScript excerpt: ${script.substring(0, 200)}...`);
          }
        });
      };
      
      testES3ComplianceLocal(script, 'applyAnimationPreset');
    });
  });

  describe('Error Handling ES3 Compliance', () => {
    it('should use proper error throwing syntax', () => {
      const script = keyframeGenerators.applyEasyEase({
        compId: 1,
        layerIndex: 1,
        propertyPath: 'Transform.Scale'
      });

      // Should use ES3-compatible error throwing
      expect(script).toMatch(/throw new Error\(/);
      expect(script).not.toMatch(/throw\s*\{/);
    });
  });

  describe('JSON.stringify Usage', () => {
    it('should handle JSON.stringify for simple data structures', () => {
      const script = keyframeGenerators.offsetKeyframes({
        compId: 1,
        layerIndex: 1,
        propertyPath: 'Transform.Position',
        offset: 1,
        keyframeIndices: [1, 2, 3]
      });

      // JSON.stringify is acceptable for simple arrays
      if (script.includes('JSON.stringify')) {
        // Verify it's used appropriately
        expect(script).toMatch(/JSON\.stringify\(\[[\d,\s]+\]\)/);
      }
    });
  });
});

describe('Script Validation Utilities', () => {
  const validateES3Script = (script: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check for common ES6+ patterns that aren't supported in ES3
    const patterns = [
      { regex: /`[^`]*`/, error: 'Template literals (backticks) not supported' },
      { regex: /=>\s*/, error: 'Arrow functions not supported' },
      { regex: /\b(const|let)\s+/, error: 'const/let not supported, use var' },
      { regex: /\.\.\.\w+/, error: 'Spread operator not supported' },
      { regex: /\{\s*\w+,\s*\w+\s*\}/, error: 'Object shorthand properties not supported' },
      { regex: /for\s*\(\s*\w+\s+of\s+/, error: 'for...of loops not supported' },
      { regex: /\{\s*\w+\s*\}\s*=/, error: 'Destructuring not supported' },
      { regex: /return\s*\{\s*\w+:\s*/, error: 'Return object literals should use var result = {}' }
    ];

    patterns.forEach(({ regex, error }) => {
      if (regex.test(script)) {
        const match = script.match(regex);
        errors.push(`${error}: "${match?.[0]}"`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  };

  it('should provide a utility to validate ES3 compliance', () => {
    const goodScript = 'var result = {}; result.success = true; return result;';
    const badScript = 'return { success: true, data: { value: x => x * 2 } };';

    const goodResult = validateES3Script(goodScript);
    const badResult = validateES3Script(badScript);

    expect(goodResult.valid).toBe(true);
    expect(goodResult.errors).toHaveLength(0);

    expect(badResult.valid).toBe(false);
    expect(badResult.errors.length).toBeGreaterThan(0);
  });

  describe('animate_time_remap specific failing case', () => {
    it('should generate ES3-compatible script for the exact failing parameters', () => {
      const params = {
        compId: 931,
        layerIndex: 2,
        keyframes: [{"time":0,"value":0},{"time":2.5,"value":5}],
        clearExisting: true
      };

      const generatedScript = advancedLayerGenerators.animateTimeRemap(params);
      
      // Check for ES3 incompatible syntax
      expect(generatedScript).not.toMatch(/`[^`]*`/); // No template literals
      expect(generatedScript).not.toMatch(/\$\{[^}]*\}/); // No template interpolation
      expect(generatedScript).not.toMatch(/=>\s*{/); // No arrow functions
      expect(generatedScript).not.toMatch(/\bconst\s+/); // No const
      expect(generatedScript).not.toMatch(/\blet\s+/); // No let
      expect(generatedScript).not.toMatch(/\.\.\.[a-zA-Z_$]/); // No spread operator
      expect(generatedScript).not.toMatch(/for\s*\([^)]*\s+of\s+/); // No for...of
      
      // The keyframes should be created using ES3 array assignment syntax
      expect(generatedScript).toMatch(/keyframes\[0\] = \{\};/);
      expect(generatedScript).toMatch(/keyframes\[0\]\.time = 0;/);
      expect(generatedScript).toMatch(/keyframes\[0\]\.value = 0;/);
      expect(generatedScript).toMatch(/keyframes\[1\] = \{\};/);
      expect(generatedScript).toMatch(/keyframes\[1\]\.time = 2\.5;/);
      expect(generatedScript).toMatch(/keyframes\[1\]\.value = 5;/);
      
      // Verify the script contains proper return statement syntax
      expect(generatedScript).toMatch(/var result = \{\};/);
      expect(generatedScript).toMatch(/result\.success = true;/);
      expect(generatedScript).toMatch(/result\.data = \{\};/);
      expect(generatedScript).toMatch(/return result;/);
      
      console.log('Generated script preview (first 500 chars):');
      console.log(generatedScript.substring(0, 500) + '...');
    });

    it('should handle quote escaping correctly in error messages to avoid Expected: ; error', () => {
      // This is the likely culprit for the "Expected: ;" error
      const params = {
        compId: 931,
        layerIndex: 2,
        keyframes: [{"time":0,"value":0},{"time":2.5,"value":5}],
        clearExisting: true
      };

      const generatedScript = advancedLayerGenerators.animateTimeRemap(params);
      
      // Look for the exact line that's causing issues
      const errorMsgLines = generatedScript.split('\n').filter(line => line.includes('errorMsg'));
      
      console.log('Error message lines found:');
      errorMsgLines.forEach((line, index) => {
        console.log(`${index + 1}: ${line}`);
      });
      
      // The issue might be with the quote escaping - check for problematic patterns
      const problematicQuotePatterns = [
        /\\\\"/g,  // Double-escaped quotes
        /\\\\\\\\\"/g,  // Quadruple-escaped quotes 
        /".*".*".*"/g  // Multiple unescaped quotes in one string
      ];
      
      problematicQuotePatterns.forEach((pattern, index) => {
        const matches = generatedScript.match(pattern);
        if (matches) {
          console.log(`Problematic quote pattern ${index + 1} found:`, matches);
        }
      });

      // The specific line that might be causing "Expected: ;" should be properly formatted
      const problematicLine = generatedScript.split('\n').find(line => 
        line.includes('var errorMsg') && line.includes('Layer')
      );
      
      if (problematicLine) {
        console.log('Error message line found:', problematicLine);
        
        // The line should NOT contain escaped quotes like \"Layer \\\"\" which cause ES3 syntax errors
        expect(problematicLine).not.toMatch(/\\\\"/); // No escaped quotes within the string
        
        // The line should use simple string concatenation without problematic escaping
        expect(problematicLine).toMatch(/var errorMsg = "Layer " \+ layer\.name \+ " cannot have time remapping enabled\./);
      }
    });
  });
});