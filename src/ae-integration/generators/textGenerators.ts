import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';
import { generatorHelpers as gh } from './generatorHelpers.js';

export const textGenerators: ScriptGeneratorModule = {
  addTextLayerAdvanced: (params: {
    compId: number;
    text: string;
    name?: string;
    position?: number[];
    anchor?: number[];
    sourceText?: {
      font?: string;
      fontSize?: number;
      fillColor?: number[];
      strokeColor?: number[];
      strokeWidth?: number;
      strokeOverFill?: boolean;
      justification?: string;
      tracking?: number;
      leading?: number;
      baselineShift?: number;
      verticalScale?: number;
      horizontalScale?: number;
      allCaps?: boolean;
      smallCaps?: boolean;
    };
  }) => {
    let script = '';
    
    // Use helper for composition validation
    script += gh.getCompValidation(params.compId);
    
    script += 'var textLayer = comp.layers.addText();\n';
    if (params.name) {
      script += gh.setStringProperty('textLayer', 'name', params.name);
    }
    script += '\n';
    
    script += 'var textProp = textLayer.property("Source Text");\n';
    script += 'var textDocument = textProp.value;\n\n';
    
    script += '// Set text content\n';
    script += 'textDocument.text = "' + helpers.escapeString(params.text) + '";\n\n';
    
    // Apply text formatting
    if (params.sourceText) {
      script += '// Apply text formatting\n';
      script += 'var sourceText = ' + JSON.stringify(params.sourceText) + ';\n\n';
      
      if (params.sourceText.font) {
        // After Effects requires PostScript name for fonts with spaces
        script += gh.wrapInTryCatch(
          '  // Try setting font directly first\n' +
          '  textDocument.font = "' + helpers.escapeString(params.sourceText.font) + '";\n',
          '  // If that fails, try removing spaces (common for fonts like "Arial Black" -> "ArialBlack")\n' +
          '  var fontNameNoSpaces = "' + helpers.escapeString(params.sourceText.font) + '".replace(/ /g, "");\n' +
          '  try {\n' +
          '    textDocument.font = fontNameNoSpaces;\n' +
          '  } catch (e2) {\n' +
          '    // If both fail, try with hyphen (e.g., "Arial Black" -> "Arial-Black")\n' +
          '    var fontNameHyphen = "' + helpers.escapeString(params.sourceText.font) + '".replace(/ /g, "-");\n' +
          '    textDocument.font = fontNameHyphen;\n' +
          '  }\n'
        );
      }
      if (params.sourceText.fontSize !== undefined) {
        script += 'textDocument.fontSize = ' + params.sourceText.fontSize + ';\n';
      }
      if (params.sourceText.fillColor) {
        script += 'textDocument.fillColor = [' + params.sourceText.fillColor.join(',') + '];\n';
        script += 'textDocument.applyFill = true;\n';
      }
      if (params.sourceText.strokeColor) {
        script += 'textDocument.strokeColor = [' + params.sourceText.strokeColor.join(',') + '];\n';
        script += 'textDocument.applyStroke = true;\n';
        if (params.sourceText.strokeWidth !== undefined) {
          script += 'textDocument.strokeWidth = ' + params.sourceText.strokeWidth + ';\n';
        }
        if (params.sourceText.strokeOverFill !== undefined) {
          script += 'textDocument.strokeOverFill = ' + params.sourceText.strokeOverFill + ';\n';
        }
      }
      
      if (params.sourceText.justification) {
        script += '\n';
        script += 'var justificationMap = {\n';
        script += '  "left": ParagraphJustification.LEFT_JUSTIFY,\n';
        script += '  "center": ParagraphJustification.CENTER_JUSTIFY,\n';
        script += '  "right": ParagraphJustification.RIGHT_JUSTIFY,\n';
        script += '  "justifyLeft": ParagraphJustification.FULL_JUSTIFY_LASTLINE_LEFT,\n';
        script += '  "justifyCenter": ParagraphJustification.FULL_JUSTIFY_LASTLINE_CENTER,\n';
        script += '  "justifyRight": ParagraphJustification.FULL_JUSTIFY_LASTLINE_RIGHT,\n';
        script += '  "justifyAll": ParagraphJustification.FULL_JUSTIFY_LASTLINE_FULL\n';
        script += '};\n';
        script += 'var justification = justificationMap["' + params.sourceText.justification + '"];\n';
        script += 'if (justification) {\n';
        script += '  textDocument.justification = justification;\n';
        script += '}\n';
      }
      
      if (params.sourceText.tracking !== undefined) {
        script += 'textDocument.tracking = ' + params.sourceText.tracking + ';\n';
      }
      if (params.sourceText.leading !== undefined) {
        script += 'textDocument.leading = ' + params.sourceText.leading + ';\n';
      }
      if (params.sourceText.baselineShift !== undefined) {
        script += 'textDocument.baselineShift = ' + params.sourceText.baselineShift + ';\n';
      }
      if (params.sourceText.verticalScale !== undefined) {
        script += 'textDocument.verticalScale = ' + params.sourceText.verticalScale + ';\n';
      }
      if (params.sourceText.horizontalScale !== undefined) {
        script += 'textDocument.horizontalScale = ' + params.sourceText.horizontalScale + ';\n';
      }
      if (params.sourceText.allCaps !== undefined) {
        script += 'textDocument.allCaps = ' + params.sourceText.allCaps + ';\n';
      }
      if (params.sourceText.smallCaps !== undefined) {
        script += 'textDocument.smallCaps = ' + params.sourceText.smallCaps + ';\n';
      }
    }
    
    script += '\n// Apply the text document back to the property\n';
    script += 'textProp.setValue(textDocument);\n\n';
    
    // Set transform properties
    if (params.position) {
      script += '// Set position\n';
      script += 'textLayer.property("Position").setValue([' + params.position.join(',') + ']);\n';
    }
    if (params.anchor) {
      script += '// Set anchor point\n';
      script += 'textLayer.property("Anchor Point").setValue([' + params.anchor.join(',') + ']);\n';
    }
    script += '\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    index: textLayer.index,\n    name: textLayer.name\n  }');
    
    return script;
  },
  
  modifyTextProperties: (params: {
    compId: number;
    layerIndex: number;
    properties: {
      text?: string;
      font?: string;
      fontSize?: number;
      fillColor?: number[];
      strokeColor?: number[];
      strokeWidth?: number;
      strokeOverFill?: boolean;
      justification?: string;
      tracking?: number;
      leading?: number;
      baselineShift?: number;
      verticalScale?: number;
      horizontalScale?: number;
      applyFill?: boolean;
      applyStroke?: boolean;
    };
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex, 'Layer at index ' + params.layerIndex + ' not found in composition');
    script += gh.validateLayerType('TextLayer');
    
    script += 'var textProp = layer.property("Source Text");\n';
    script += 'var textDocument = textProp.value;\n\n';
    
    script += 'var props = ' + JSON.stringify(params.properties) + ';\n\n';
    
    // Update text content if provided
    if (params.properties.text) {
      script += '// Update text content if provided\n';
      script += 'textDocument.text = "' + helpers.escapeString(params.properties.text) + '";\n';
    }
    
    // Update font properties
    script += '\n// Update font properties\n';
    if (params.properties.font) {
      // After Effects requires PostScript name for fonts with spaces
      script += gh.wrapInTryCatch(
        '  // Try setting font directly first\n' +
        '  textDocument.font = "' + helpers.escapeString(params.properties.font) + '";\n',
        '  // If that fails, try removing spaces (common for fonts like "Arial Black" -> "ArialBlack")\n' +
        '  var fontNameNoSpaces = "' + helpers.escapeString(params.properties.font) + '".replace(/ /g, "");\n' +
        '  try {\n' +
        '    textDocument.font = fontNameNoSpaces;\n' +
        '  } catch (e2) {\n' +
        '    // If both fail, try with hyphen (e.g., "Arial Black" -> "Arial-Black")\n' +
        '    var fontNameHyphen = "' + helpers.escapeString(params.properties.font) + '".replace(/ /g, "-");\n' +
        '    textDocument.font = fontNameHyphen;\n' +
        '  }\n'
      );
    }
    if (params.properties.fontSize !== undefined) {
      script += 'textDocument.fontSize = ' + params.properties.fontSize + ';\n';
    }
    
    // Update fill properties
    script += '\n// Update fill properties\n';
    if (params.properties.fillColor) {
      script += 'textDocument.fillColor = [' + params.properties.fillColor.join(',') + '];\n';
    }
    if (params.properties.applyFill !== undefined) {
      script += 'textDocument.applyFill = ' + params.properties.applyFill + ';\n';
    }
    
    // Update stroke properties
    script += '\n// Update stroke properties\n';
    if (params.properties.strokeColor) {
      script += 'textDocument.strokeColor = [' + params.properties.strokeColor.join(',') + '];\n';
    }
    if (params.properties.strokeWidth !== undefined) {
      script += 'textDocument.strokeWidth = ' + params.properties.strokeWidth + ';\n';
    }
    if (params.properties.strokeOverFill !== undefined) {
      script += 'textDocument.strokeOverFill = ' + params.properties.strokeOverFill + ';\n';
    }
    if (params.properties.applyStroke !== undefined) {
      script += 'textDocument.applyStroke = ' + params.properties.applyStroke + ';\n';
    }
    
    // Update paragraph properties
    if (params.properties.justification) {
      script += '\n// Update paragraph properties\n';
      script += 'var justificationMap = {\n';
      script += '  "left": ParagraphJustification.LEFT_JUSTIFY,\n';
      script += '  "center": ParagraphJustification.CENTER_JUSTIFY,\n';
      script += '  "right": ParagraphJustification.RIGHT_JUSTIFY,\n';
      script += '  "justifyLeft": ParagraphJustification.FULL_JUSTIFY_LASTLINE_LEFT,\n';
      script += '  "justifyCenter": ParagraphJustification.FULL_JUSTIFY_LASTLINE_CENTER,\n';
      script += '  "justifyRight": ParagraphJustification.FULL_JUSTIFY_LASTLINE_RIGHT,\n';
      script += '  "justifyAll": ParagraphJustification.FULL_JUSTIFY_LASTLINE_FULL\n';
      script += '};\n';
      script += 'var justification = justificationMap["' + params.properties.justification + '"];\n';
      script += 'if (justification) {\n';
      script += '  textDocument.justification = justification;\n';
      script += '}\n';
    }
    
    if (params.properties.tracking !== undefined) {
      script += 'textDocument.tracking = ' + params.properties.tracking + ';\n';
    }
    if (params.properties.leading !== undefined) {
      script += 'textDocument.leading = ' + params.properties.leading + ';\n';
    }
    if (params.properties.baselineShift !== undefined) {
      script += 'textDocument.baselineShift = ' + params.properties.baselineShift + ';\n';
    }
    if (params.properties.verticalScale !== undefined) {
      script += 'textDocument.verticalScale = ' + params.properties.verticalScale + ';\n';
    }
    if (params.properties.horizontalScale !== undefined) {
      script += 'textDocument.horizontalScale = ' + params.properties.horizontalScale + ';\n';
    }
    
    script += '\n// Apply the text document back to the property\n';
    script += 'textProp.setValue(textDocument);\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: layer.name,\n    layerIndex: layer.index\n  }');
    
    return script;
  },
  
  addTextAnimator: (params: {
    compId: number;
    layerIndex: number;
    animatorName?: string;
    properties: string[];
    selector?: {
      type?: string;
      basedOn?: string;
      start?: number;
      end?: number;
      offset?: number;
    };
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    script += gh.validateLayerType('TextLayer', 'Layer is not a text layer');
    
    script += '// Get text animators\n';
    script += 'var textProp = layer.property("Text");\n';
    script += 'var animators = textProp.property("Animators");\n';
    script += 'if (!animators) {\n';
    script += '  throw new Error("Cannot access Text Animators");\n';
    script += '}\n\n';
    
    script += '// Add new animator\n';
    script += 'var animator = animators.addProperty("ADBE Text Animator");\n';
    script += 'animator.name = ' + gh.getParamWithDefault(params.animatorName, 'Animator') + ';\n\n';
    
    script += '// Add properties to animator\n';
    script += 'var animatorProps = animator.property("ADBE Text Animator Properties");\n';
    script += 'var properties = ' + JSON.stringify(params.properties) + ';\n';
    script += 'var addedProps = [];\n\n';
    
    script += 'for (var i = 0; i < properties.length; i++) {\n';
    script += '  var propName = properties[i];\n';
    script += '  var propToAdd = null;\n';
    script += '  \n';
    script += '  switch(propName.toLowerCase()) {\n';
    script += '    case "position":\n';
    script += '      propToAdd = animatorProps.addProperty("ADBE Text Position 3D");\n';
    script += '      break;\n';
    script += '    case "scale":\n';
    script += '      propToAdd = animatorProps.addProperty("ADBE Text Scale 3D");\n';
    script += '      break;\n';
    script += '    case "rotation":\n';
    script += '      propToAdd = animatorProps.addProperty("ADBE Text Rotation");\n';
    script += '      break;\n';
    script += '    case "opacity":\n';
    script += '      propToAdd = animatorProps.addProperty("ADBE Text Opacity");\n';
    script += '      break;\n';
    script += '    case "anchorpoint":\n';
    script += '      propToAdd = animatorProps.addProperty("ADBE Text Anchor Point 3D");\n';
    script += '      break;\n';
    script += '    case "fillcolor":\n';
    script += '      propToAdd = animatorProps.addProperty("ADBE Text Fill Color");\n';
    script += '      break;\n';
    script += '    case "strokecolor":\n';
    script += '      propToAdd = animatorProps.addProperty("ADBE Text Stroke Color");\n';
    script += '      break;\n';
    script += '    case "strokewidth":\n';
    script += '      propToAdd = animatorProps.addProperty("ADBE Text Stroke Width");\n';
    script += '      break;\n';
    script += '    case "tracking":\n';
    script += '      propToAdd = animatorProps.addProperty("ADBE Text Tracking Amount");\n';
    script += '      break;\n';
    script += '    case "lineanchor":\n';
    script += '      propToAdd = animatorProps.addProperty("ADBE Text Line Anchor");\n';
    script += '      break;\n';
    script += '    case "blur":\n';
    script += '      propToAdd = animatorProps.addProperty("ADBE Text Blur");\n';
    script += '      break;\n';
    script += '  }\n';
    script += '  \n';
    script += '  if (propToAdd) {\n';
    script += '    addedProps.push(propName);\n';
    script += '  }\n';
    script += '}\n\n';
    
    // Configure selector if provided
    if (params.selector) {
      script += '// Configure selector\n';
      script += 'var selectors = animator.property("ADBE Text Selectors");\n';
      script += 'var selector = selectors.property(1); // Default range selector\n\n';
      
      script += 'if (selector) {\n';
      script += '  var selectorProps = ' + JSON.stringify(params.selector) + ';\n';
      script += '  \n';
      if (params.selector.start !== undefined) {
        script += '  selector.property("ADBE Text Index Start").setValue(' + params.selector.start + ');\n';
      }
      if (params.selector.end !== undefined) {
        script += '  selector.property("ADBE Text Index End").setValue(' + params.selector.end + ');\n';
      }
      if (params.selector.offset !== undefined) {
        script += '  selector.property("ADBE Text Range Offset").setValue(' + params.selector.offset + ');\n';
      }
      if (params.selector.basedOn) {
        script += '  var basedOnMap = {\n';
        script += '    "characters": 1,\n';
        script += '    "charactersExcludingSpaces": 2,\n';
        script += '    "words": 3,\n';
        script += '    "lines": 4\n';
        script += '  };\n';
        script += '  var basedOnValue = basedOnMap["' + params.selector.basedOn + '"];\n';
        script += '  if (basedOnValue) {\n';
        script += '    selector.property("ADBE Text Range Type2").setValue(basedOnValue);\n';
        script += '  }\n';
      }
      script += '}\n\n';
    }
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    animatorName: animator.name,\n    propertiesAdded: addedProps,\n    layerName: layer.name\n  }');
    
    return script;
  },
  
  convertTextToShape: (params: {
    compId: number;
    layerIndex: number;
    keepOriginal?: boolean;
  }) => {
    let script = '';
    
    // Use helpers for validation
    script += gh.getCompValidation(params.compId);
    script += gh.getLayerValidation(params.layerIndex);
    script += gh.validateLayerType('TextLayer', 'Layer is not a text layer');
    
    script += '// Store original layer info\n';
    script += 'var originalName = layer.name;\n';
    script += 'var originalIndex = layer.index;\n\n';
    
    script += '// Create outlines (this creates a new shape layer)\n';
    script += 'var shapeLayer = layer.createOutlines();\n\n';
    
    script += '// The new shape layer is created above the text layer\n';
    script += 'if (shapeLayer) {\n';
    script += '  shapeLayer.name = originalName + " Outlines";\n';
    script += '  \n';
    if (!params.keepOriginal) {
      script += '  // Remove the original text layer\n';
      script += '  layer.remove();\n';
    }
    script += '} else {\n';
    script += '  throw new Error("Failed to create outlines from text layer");\n';
    script += '}\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    originalLayerName: originalName,\n    shapeLayerName: shapeLayer.name,\n    shapeLayerIndex: shapeLayer.index,\n    originalKept: ' + (params.keepOriginal ? 'true' : 'false') + '\n  }');
    
    return script;
  },
  
  createTextOnPath: (params: {
    compId: number;
    text: string;
    path: {
      vertices: number[][];
      inTangents?: number[][];
      outTangents?: number[][];
      closed?: boolean;
    };
    textProperties?: any;
  }) => {
    let script = '';
    
    // Use helper for composition validation
    script += gh.getCompValidation(params.compId);
    
    script += '// Create text layer\n';
    script += 'var textLayer = comp.layers.addText("' + helpers.escapeString(params.text) + '");\n';
    script += 'textLayer.name = "Text on Path";\n\n';
    
    // Apply text properties if provided
    if (params.textProperties) {
      script += '// Apply text properties\n';
      script += 'var textProp = textLayer.property("Source Text");\n';
      script += 'var textDocument = textProp.value;\n';
      script += 'var props = ' + JSON.stringify(params.textProperties) + ';\n';
      
      // Apply properties similar to modifyTextProperties
      script += 'if (props.font) textDocument.font = props.font;\n';
      script += 'if (props.fontSize) textDocument.fontSize = props.fontSize;\n';
      script += 'if (props.fillColor) {\n';
      script += '  textDocument.fillColor = props.fillColor;\n';
      script += '  textDocument.applyFill = true;\n';
      script += '}\n';
      script += 'textProp.setValue(textDocument);\n\n';
    }
    
    script += '// Create mask for path\n';
    script += 'var mask = textLayer.property("Masks").addProperty("Mask");\n';
    script += 'mask.name = "Text Path";\n\n';
    
    script += '// Set mask path\n';
    script += 'var maskPath = mask.property("Mask Path");\n';
    script += 'var path = ' + JSON.stringify(params.path) + ';\n\n';
    
    script += '// Create shape for mask\n';
    script += 'var myShape = new Shape();\n';
    script += 'myShape.vertices = path.vertices;\n';
    script += 'myShape.inTangents = path.inTangents || [];\n';
    script += 'myShape.outTangents = path.outTangents || [];\n';
    script += 'myShape.closed = path.closed || false;\n';
    script += 'maskPath.setValue(myShape);\n\n';
    
    script += '// Set up text path options\n';
    script += 'var textPathOptions = textLayer.property("Text").property("Path Options");\n';
    script += 'textPathOptions.property("Path").setValue(1); // Set to mask 1\n\n';
    
    // Use helper for return value
    script += gh.generateSuccessReturn('{\n    layerName: textLayer.name,\n    layerIndex: textLayer.index\n  }');
    
    return script;
  }
};