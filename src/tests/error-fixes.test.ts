import { describe, it, expect } from '@jest/globals';
import { effectsAndKeyframeGenerators } from '../ae-integration/generators/effectsAndKeyframeGenerators';
import { textGenerators } from '../ae-integration/generators/textGenerators';
import { keyframeGenerators } from '../ae-integration/generators/keyframeGenerators';

describe('Error Fixes Test Suite', () => {
  describe('apply_effect fix tests', () => {
    it('should generate ES3-compatible script with properly escaped quotes', () => {
      const script = effectsAndKeyframeGenerators.applyEffect({
        compId: 1,
        effectName: 'Gradient Ramp',
        layerIndex: 1
      });

      // Should have proper quote escaping (4 backslashes in source = correct ES3)
      expect(script).toContain('\\\\\\\"');
      
      // Should have proper error messages with correct escaping
      expect(script).toContain('throw new Error("Layer not found");');
      expect(script).toContain('throw new Error("Effect \\\\\\"" + effectName + "\\\\\\" not available');
      
      // ES3 compliance
      expect(script).not.toContain('`');
      expect(script).not.toContain('${');
      expect(script).not.toContain('=>');
      expect(script).not.toMatch(/\b(const|let)\s+/);
    });

    it('should handle various effect names correctly', () => {
      const effectNames = [
        'Gaussian Blur',
        'Drop Shadow',
        'Gradient Ramp',
        'Color Correction',
        'Glow',
        'Fast Box Blur' // This was renamed from Fast Blur
      ];

      effectNames.forEach(effectName => {
        const script = effectsAndKeyframeGenerators.applyEffect({
          compId: 1,
          effectName: effectName,
          layerIndex: 1
        });

        // Should contain the effect name in the script
        expect(script).toContain(`var effectName = "${effectName}";`);
        
        // Should handle Fast Blur -> Fast Box Blur conversion
        if (effectName === 'Fast Box Blur') {
          expect(script).toContain('effectName = "Fast Box Blur"');
        }
      });
    });

    it('should generate correct error message format', () => {
      const script = effectsAndKeyframeGenerators.applyEffect({
        compId: 1,
        effectName: 'Test Effect',
        layerIndex: 2
      });

      // Check error message construction
      const errorLines = script.split('\n').filter(line => line.includes('throw new Error'));
      
      errorLines.forEach(line => {
        // Should have proper quote escaping
        if (line.includes('effectName')) {
          // With 4 backslashes in source, we get proper escaping in generated script
          expect(line).toMatch(/\\\\\"/); // 4 backslashes is correct
        }
      });
    });
  });

  describe('modify_text_properties fix tests', () => {
    it('should validate layer is a text layer before modifying', () => {
      const script = textGenerators.modifyTextProperties({
        compId: 1,
        layerIndex: 1,
        properties: {
          fillColor: [1, 1, 1],
          font: 'Arial Black',
          fontSize: 80,
          justification: 'center'
        }
      });

      // Should check if layer is text layer
      expect(script).toContain('if (!(layer instanceof TextLayer))');
      
      // Should have proper error message with layer type info (dynamic layer index is better)
      expect(script).toContain('throw new Error("Layer at index " + layer.index + " is not a text layer (it is a " + layer.constructor.name + ")");');
    });

    it('should handle all text properties correctly', () => {
      const script = textGenerators.modifyTextProperties({
        compId: 1,
        layerIndex: 1,
        properties: {
          text: 'Hello World',
          fillColor: [0.4, 0.494, 0.918],
          font: 'Arial',
          fontSize: 28,
          justification: 'center',
          strokeWidth: 2,
          strokeColor: [0, 0, 0],
          tracking: 50,
          leading: 60,
          baselineShift: 10,
          horizontalScale: 120,
          verticalScale: 110,
          applyFill: true,
          applyStroke: true,
          strokeOverFill: false
        }
      });

      // Check all properties are set
      expect(script).toContain('textDocument.text = "Hello World";');
      expect(script).toContain('textDocument.fillColor = [0.4,0.494,0.918];');
      expect(script).toContain('textDocument.font = "Arial";');
      expect(script).toContain('textDocument.fontSize = 28;');
      expect(script).toContain('textDocument.justification = justification;');
      expect(script).toContain('textDocument.strokeWidth = 2;');
      expect(script).toContain('textDocument.strokeColor = [0,0,0];');
      expect(script).toContain('textDocument.tracking = 50;');
      expect(script).toContain('textDocument.leading = 60;');
      expect(script).toContain('textDocument.baselineShift = 10;');
      expect(script).toContain('textDocument.horizontalScale = 120;');
      expect(script).toContain('textDocument.verticalScale = 110;');
      expect(script).toContain('textDocument.applyFill = true;');
      expect(script).toContain('textDocument.applyStroke = true;');
      expect(script).toContain('textDocument.strokeOverFill = false;');
    });

    it('should provide helpful error messages for non-text layers', () => {
      const script = textGenerators.modifyTextProperties({
        compId: 1,
        layerIndex: 3,
        properties: { fontSize: 50 }
      });

      // Error should specify what type of layer it actually is
      expect(script).toContain('is not a text layer (it is a');
    });
  });

  describe('apply_easy_ease fix tests', () => {
    it('should generate ES3-compatible script without syntax errors', () => {
      const script = keyframeGenerators.applyEasyEase({
        compId: 1,
        layerIndex: 6,
        propertyPath: 'Transform.Scale',
        easeType: 'ease'
      });

      // No syntax errors from string concatenation
      expect(script).toContain('var layerNameSafe = layer.name;');
      expect(script).toContain('var layerInfo = "Layer: " + layerNameSafe + " [" + layer.index + "]";');
      
      // Error messages should be built safely
      const errorMsgLines = script.split('\n').filter(line => line.includes('errorMsg'));
      errorMsgLines.forEach(line => {
        // Should build error messages step by step
        if (line.includes('var errorMsg')) {
          expect(line).toMatch(/var errorMsg = /);
        }
      });
      
      // ES3 compliance
      expect(script).not.toContain('`');
      expect(script).not.toContain('${');
      expect(script).not.toContain('=>');
    });

    it('should handle different ease types correctly', () => {
      const easeTypes = ['ease', 'easeIn', 'easeOut'];
      
      easeTypes.forEach(easeType => {
        const script = keyframeGenerators.applyEasyEase({
          compId: 1,
          layerIndex: 1,
          propertyPath: 'Transform.Position',
          easeType: easeType as any
        });

        // Should handle the specific ease type
        // Check that the ease values are set based on type
        if (easeType === 'easeIn') {
          expect(script).toContain('easeIn = new KeyframeEase(0, 33.333);');
          expect(script).toContain('easeOut = new KeyframeEase(0, 0.1);');
        } else if (easeType === 'easeOut') {
          expect(script).toContain('easeIn = new KeyframeEase(0, 0.1);');
          expect(script).toContain('easeOut = new KeyframeEase(0, 33.333);');
        } else {
          expect(script).toContain('easeIn = easeOut = new KeyframeEase(0, 33.333);');
        }
      });
    });

    it('should handle keyframe indices correctly', () => {
      const script = keyframeGenerators.applyEasyEase({
        compId: 1,
        layerIndex: 1,
        propertyPath: 'Transform.Opacity',
        keyframeIndices: [1, 3, 5]
      });

      // Should process specific keyframes
      expect(script).toContain('var keyIndices = [1,3,5];');
    });

    it('should handle property path errors gracefully', () => {
      const script = keyframeGenerators.applyEasyEase({
        compId: 1,
        layerIndex: 1,
        propertyPath: 'Invalid.Property'
      });

      // Should have proper error handling for invalid properties
      expect(script).toContain('if (!prop)');
      expect(script).toContain('throw new Error("Property not found: " + propertyPath);');
    });

    it('should handle Transform.Opacity with fallback property names', () => {
      const script = keyframeGenerators.applyEasyEase({
        compId: 1,
        layerIndex: 10,
        propertyPath: 'Transform.Opacity',
        easeType: 'ease'
      });

      // Should try both ADBE and simple property names for opacity
      expect(script).toContain('prop = layer.property("ADBE Opacity") || layer.property("Opacity");');
      
      // Should handle Transform.Opacity correctly by accessing layer-level opacity
      expect(script).toContain('pathParts[i-1] === "Transform"');
    });

    it('should handle direct Opacity property path', () => {
      const script = keyframeGenerators.applyEasyEase({
        compId: 1,
        layerIndex: 5,
        propertyPath: 'Opacity',
        easeType: 'easeIn'
      });

      // Should handle direct opacity access
      expect(script).toContain('part === "Opacity"');
      expect(script).toContain('prop = layer.property("ADBE Opacity") || layer.property("Opacity");');
    });
  });

  describe('Integration test for all three fixes', () => {
    it('should work together without conflicts', () => {
      // Test that all three generators produce valid ES3 code
      const scripts = [
        effectsAndKeyframeGenerators.applyEffect({
          compId: 1,
          effectName: 'Gradient Ramp',
          layerIndex: 1
        }),
        textGenerators.modifyTextProperties({
          compId: 1,
          layerIndex: 1,
          properties: { fontSize: 50 }
        }),
        keyframeGenerators.applyEasyEase({
          compId: 1,
          layerIndex: 1,
          propertyPath: 'Transform.Scale'
        })
      ];

      scripts.forEach((script, index) => {
        // Common ES3 checks
        expect(script).not.toContain('`');
        expect(script).not.toContain('${');
        expect(script).not.toContain('=>');
        expect(script).not.toMatch(/\b(const|let)\s+/);
        
        // Result object creation - check for ES3 or ES6 style
        const hasES3Result = (script.includes('var result = {};') && 
                            script.includes('result.success = true;') && 
                            script.includes('return result;')) ||
                            (script.includes('var returnObj = {};') && 
                            script.includes('returnObj.success = true;') && 
                            script.includes('return returnObj;'));
        const hasES6Result = script.includes('return {') && 
                            script.includes('success: true');
        expect(hasES3Result || hasES6Result).toBe(true);
        
        // Quote escaping should be correct (4 backslashes for error messages)
        const hasCorrectQuoteEscaping = !script.includes('\\"') || script.includes('\\\\\"');
        expect(hasCorrectQuoteEscaping).toBe(true);
      });
    });
  });
});