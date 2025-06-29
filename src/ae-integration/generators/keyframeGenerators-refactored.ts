import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';
import { generatorHelpers as gh } from './generatorHelpers.js';

/**
 * Example of refactored keyframeGenerators using the new helper functions
 * This demonstrates how to reduce code duplication
 */
export const keyframeGeneratorsRefactored: ScriptGeneratorModule = {
  setKeyframeAdvanced: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    time: number;
    value: any;
    interpolation?: {
      temporalEase?: string;
      spatialInterpolation?: string;
      customEase?: {
        easeIn?: { speed: number; influence: number };
        easeOut?: { speed: number; influence: number };
      };
    };
  }) => {
    let script = '';
    
    // Use helper for composition validation
    script += gh.getCompValidation(params.compId);
    
    // Use helper for layer validation
    script += gh.getLayerValidation(params.layerIndex);
    
    // Use helper for property navigation
    script += gh.navigatePropertyPath('"' + helpers.escapeString(params.propertyPath) + '"');
    
    // Check property capability
    script += gh.checkPropertyCapability('prop', 'animate');
    
    // Set the keyframe value
    script += '// Set keyframe at time ' + params.time + '\n';
    script += 'var keyIndex = prop.setValueAtTime(' + params.time + ', ' + JSON.stringify(params.value) + ');\n\n';
    
    // Handle interpolation if provided
    if (params.interpolation) {
      script += '// Apply interpolation settings\n';
      const interp = params.interpolation;
      
      if (interp.temporalEase) {
        script += '// Apply temporal ease\n';
        script += 'var easeIn, easeOut;\n';
        
        if (interp.temporalEase === 'custom' && interp.customEase) {
          script += 'easeIn = new KeyframeEase(' + 
            (interp.customEase.easeIn?.speed || 0) + ', ' + 
            (interp.customEase.easeIn?.influence || 33.333) + ');\n';
          script += 'easeOut = new KeyframeEase(' + 
            (interp.customEase.easeOut?.speed || 0) + ', ' + 
            (interp.customEase.easeOut?.influence || 33.333) + ');\n';
        } else {
          // Use predefined ease values
          script += 'switch("' + interp.temporalEase + '") {\n';
          script += '  case "linear":\n';
          script += '    easeIn = easeOut = new KeyframeEase(0, 0.1);\n';
          script += '    break;\n';
          script += '  case "easeIn":\n';
          script += '    easeIn = new KeyframeEase(0, 33.333);\n';
          script += '    easeOut = new KeyframeEase(0, 0.1);\n';
          script += '    break;\n';
          script += '  case "easeOut":\n';
          script += '    easeIn = new KeyframeEase(0, 0.1);\n';
          script += '    easeOut = new KeyframeEase(0, 33.333);\n';
          script += '    break;\n';
          script += '  case "easeInOut":\n';
          script += '  default:\n';
          script += '    easeIn = easeOut = new KeyframeEase(0, 33.333);\n';
          script += '    break;\n';
          script += '}\n\n';
        }
        
        script += gh.wrapInTryCatch(
          '  prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);\n',
          '  // Could not set temporal ease\n'
        );
      }
      
      if (interp.spatialInterpolation && params.propertyPath.includes('Position')) {
        script += '// Apply spatial interpolation\n';
        script += 'if ("' + interp.spatialInterpolation + '" === "bezier") {\n';
        script += '  prop.setSpatialTangentsAtKey(keyIndex, [0, 0], [0, 0]);\n';
        script += '} else if ("' + interp.spatialInterpolation + '" === "auto") {\n';
        script += '  prop.setSpatialAutoBezierAtKey(keyIndex, true);\n';
        script += '}\n\n';
      }
    }
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    keyIndex: keyIndex,\n    time: ' + params.time + ',\n    property: "' + helpers.escapeString(params.propertyPath) + '"\n  }');
    
    return script;
  },

  applyEasyEase: (params: {
    compId: number;
    layerIndex: number;
    propertyPath: string;
    keyframeIndices?: number[];
    easeType?: string;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId, 'Composition not found with ID: ' + params.compId);
    script += gh.getLayerValidation(params.layerIndex, 'Layer not found at index: ' + params.layerIndex);
    
    // Get layer info for error messages
    script += gh.getLayerInfoVar();
    
    // Navigate to property
    script += 'var propertyPath = "' + helpers.escapeString(params.propertyPath) + '";\n';
    script += gh.navigatePropertyPath('propertyPath');
    
    // Check capabilities
    script += gh.checkPropertyCapability('prop', 'animate');
    
    // Check if property has keyframes
    script += '// Check if property has keyframes\n';
    script += 'if (prop.numKeys === 0) {\n';
    script += '  var errorMsg = "Property \\\\\\"" + propertyPath + "\\\\\\" has no keyframes. ";\n';
    script += '  errorMsg += layerInfo + ". ";\n';
    script += '  errorMsg += "Please add keyframes using set_keyframe before applying easing.";\n';
    script += '  throw new Error(errorMsg);\n';
    script += '}\n\n';
    
    // Handle keyframe indices
    script += 'var keyIndices = ' + gh.getValueOrDefault('params.keyframeIndices', null) + ';\n';
    script += 'var easeType = ' + gh.getValueOrDefault('params.easeType', 'ease') + ';\n\n';
    
    script += '// If no specific keys, apply to all\n';
    script += 'if (!keyIndices) {\n';
    script += '  keyIndices = [];\n';
    script += '  for (var i = 1; i <= prop.numKeys; i++) {\n';
    script += '    keyIndices.push(i);\n';
    script += '  }\n';
    script += '}\n\n';
    
    // Define ease values
    script += '// Define ease values\n';
    script += 'var easeIn, easeOut;\n';
    script += 'switch(easeType) {\n';
    script += '  case "easeIn":\n';
    script += '    easeIn = new KeyframeEase(0, 33.333);\n';
    script += '    easeOut = new KeyframeEase(0, 0.1);\n';
    script += '    break;\n';
    script += '  case "easeOut":\n';
    script += '    easeIn = new KeyframeEase(0, 0.1);\n';
    script += '    easeOut = new KeyframeEase(0, 33.333);\n';
    script += '    break;\n';
    script += '  case "ease":\n';
    script += '  default:\n';
    script += '    easeIn = easeOut = new KeyframeEase(0, 33.333);\n';
    script += '    break;\n';
    script += '}\n\n';
    
    // Apply to each keyframe
    script += 'var modifiedCount = 0;\n\n';
    script += '// Apply to each keyframe\n';
    script += 'for (var i = 0; i < keyIndices.length; i++) {\n';
    script += '  var keyIndex = keyIndices[i];\n';
    script += '  if (keyIndex > 0 && keyIndex <= prop.numKeys) {\n';
    script += gh.wrapInTryCatch(
      '      // Apply ease based on property dimensions\n' +
      '      if (prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL ||\n' +
      '          prop.propertyValueType === PropertyValueType.ThreeD) {\n' +
      '        prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn, easeIn], [easeOut, easeOut, easeOut]);\n' +
      '      } else if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL ||\n' +
      '                 prop.propertyValueType === PropertyValueType.TwoD) {\n' +
      '        prop.setTemporalEaseAtKey(keyIndex, [easeIn, easeIn], [easeOut, easeOut]);\n' +
      '      } else {\n' +
      '        prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);\n' +
      '      }\n' +
      '      modifiedCount++;\n',
      '      // Could not modify keyframe \n'
    );
    script += '  }\n';
    script += '}\n\n';
    
    // Return success
    script += gh.generateSuccessReturn('{\n    property: propertyPath,\n    modifiedKeyframes: modifiedCount,\n    totalKeyframes: prop.numKeys,\n    layerInfo: layerInfo\n  }');
    
    return script;
  }
};