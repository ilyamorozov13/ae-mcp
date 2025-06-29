import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

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
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var textLayer = comp.layers.addText();\n';
    if (params.name) {
      script += 'textLayer.name = "' + helpers.escapeString(params.name) + '";\n';
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
        script += 'try {\n';
        script += '  // Try setting font directly first\n';
        script += '  textDocument.font = "' + helpers.escapeString(params.sourceText.font) + '";\n';
        script += '} catch (e) {\n';
        script += '  // If that fails, try removing spaces (common for fonts like "Arial Black" -> "ArialBlack")\n';
        script += '  var fontNameNoSpaces = "' + helpers.escapeString(params.sourceText.font) + '".replace(/ /g, "");\n';
        script += '  try {\n';
        script += '    textDocument.font = fontNameNoSpaces;\n';
        script += '  } catch (e2) {\n';
        script += '    // If both fail, try with hyphen (e.g., "Arial Black" -> "Arial-Black")\n';
        script += '    var fontNameHyphen = "' + helpers.escapeString(params.sourceText.font) + '".replace(/ /g, "-");\n';
        script += '    textDocument.font = fontNameHyphen;\n';
        script += '  }\n';
        script += '}\n';
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
      script += '// Note: allCaps and smallCaps are read-only properties in After Effects and cannot be set directly\n';
      script += '\n';
    }
    
    script += '// Apply the text document\n';
    script += 'textProp.setValue(textDocument);\n\n';
    
    // Set transform properties
    if (params.position) {
      script += 'textLayer.property("Position").setValue([' + params.position.join(',') + ']);\n';
    }
    if (params.anchor) {
      script += 'textLayer.property("Anchor Point").setValue([' + params.anchor.join(',') + ']);\n';
    }
    script += '\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    index: textLayer.index,\n';
    script += '    name: textLayer.name\n';
    script += '  }\n';
    script += '};';
    
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
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer || !(layer instanceof TextLayer)) {\n';
    script += '  throw new Error("Text layer not found");\n';
    script += '}\n\n';
    
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
      script += 'try {\n';
      script += '  // Try setting font directly first\n';
      script += '  textDocument.font = "' + helpers.escapeString(params.properties.font) + '";\n';
      script += '} catch (e) {\n';
      script += '  // If that fails, try removing spaces (common for fonts like "Arial Black" -> "ArialBlack")\n';
      script += '  var fontNameNoSpaces = "' + helpers.escapeString(params.properties.font) + '".replace(/ /g, "");\n';
      script += '  try {\n';
      script += '    textDocument.font = fontNameNoSpaces;\n';
      script += '  } catch (e2) {\n';
      script += '    // If both fail, try with hyphen (e.g., "Arial Black" -> "Arial-Black")\n';
      script += '    var fontNameHyphen = "' + helpers.escapeString(params.properties.font) + '".replace(/ /g, "-");\n';
      script += '    textDocument.font = fontNameHyphen;\n';
      script += '  }\n';
      script += '}\n';
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
    
    script += '\n// Apply the updated text document\n';
    script += 'textProp.setValue(textDocument);\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    layerName: layer.name,\n';
    script += '    layerIndex: layer.index\n';
    script += '  }\n';
    script += '};';
    
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
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!layer || !(layer instanceof TextLayer)) {\n';
    script += '  throw new Error("Text layer not found");\n';
    script += '}\n\n';
    
    script += 'var textAnimators = layer.property("Text").property("Animators");\n';
    script += 'var animator = textAnimators.addProperty("ADBE Text Animator");\n';
    if (params.animatorName) {
      script += 'animator.name = "' + helpers.escapeString(params.animatorName) + '";\n';
    }
    script += '\n';
    
    script += '// Add properties to animate\n';
    script += 'var animatorProperties = animator.property("ADBE Text Animator Properties");\n';
    script += 'var properties = ' + JSON.stringify(params.properties) + ';\n\n';
    
    script += 'for (var i = 0; i < properties.length; i++) {\n';
    script += '  var propName = properties[i];\n';
    script += '  var propMap = {\n';
    script += '    "position": "ADBE Text Position 3D",\n';
    script += '    "scale": "ADBE Text Scale 3D",\n';
    script += '    "rotation": "ADBE Text Rotation",\n';
    script += '    "opacity": "ADBE Text Opacity",\n';
    script += '    "anchorPoint": "ADBE Text Anchor Point 3D",\n';
    script += '    "fillColor": "ADBE Text Fill Color",\n';
    script += '    "strokeColor": "ADBE Text Stroke Color",\n';
    script += '    "strokeWidth": "ADBE Text Stroke Width",\n';
    script += '    "tracking": "ADBE Text Tracking Amount",\n';
    script += '    "lineAnchor": "ADBE Text Line Anchor",\n';
    script += '    "blur": "ADBE Text Blur"\n';
    script += '  };\n';
    script += '  \n';
    script += '  var aePropertyName = propMap[propName];\n';
    script += '  if (aePropertyName) {\n';
    script += '    try {\n';
    script += '      animatorProperties.addProperty(aePropertyName);\n';
    script += '    } catch (e) {\n';
    script += '      // Property might not be available in this AE version\n';
    script += '    }\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += '// Configure selector\n';
    script += 'var selectors = animator.property("ADBE Text Selectors");\n\n';
    
    script += '// Check if there\'s already a default selector\n';
    script += 'var selector = null;\n';
    script += 'if (selectors.numProperties > 0) {\n';
    script += '  selector = selectors.property(1);\n';
    script += '} else {\n';
    script += '  // Add a range selector if none exists\n';
    script += '  selector = selectors.addProperty("ADBE Text Selector");\n';
    script += '}\n';
    
    if (params.selector) {
      script += '\n';
      script += 'var selectorConfig = ' + JSON.stringify(params.selector) + ';\n\n';
      
      // Set selector type
      if (params.selector.type === 'wiggly') {
        script += '// Replace with wiggly selector if requested\n';
        script += 'if (selector) {\n';
        script += '  selector.remove();\n';
        script += '}\n';
        script += 'selector = selectors.addProperty("ADBE Text Wiggly Selector");\n';
      }
      
      script += '\n// Configure range selector properties\n';
      script += 'if (selector && selector.matchName === "ADBE Text Selector") {\n';
      script += '  try {\n';
      
      if (params.selector.basedOn) {
        script += '    var basedOnMap = {\n';
        script += '      "characters": 1,\n';
        script += '      "charactersExcludingSpaces": 2,\n';
        script += '      "words": 3,\n';
        script += '      "lines": 4\n';
        script += '    };\n';
        script += '    var basedOn = basedOnMap["' + params.selector.basedOn + '"];\n';
        script += '    if (basedOn) {\n';
        script += '      var rangeUnits = selector.property("ADBE Text Range Units");\n';
        script += '      if (rangeUnits) {\n';
        script += '        rangeUnits.setValue(basedOn);\n';
        script += '      }\n';
        script += '    }\n';
      }
      
      if (params.selector.start !== undefined) {
        script += '    \n';
        script += '    var rangeStart = selector.property("ADBE Text Range Start");\n';
        script += '    if (rangeStart) {\n';
        script += '      rangeStart.setValue(' + params.selector.start + ');\n';
        script += '    }\n';
      }
      if (params.selector.end !== undefined) {
        script += '    var rangeEnd = selector.property("ADBE Text Range End");\n';
        script += '    if (rangeEnd) {\n';
        script += '      rangeEnd.setValue(' + params.selector.end + ');\n';
        script += '    }\n';
      }
      if (params.selector.offset !== undefined) {
        script += '    var rangeOffset = selector.property("ADBE Text Range Offset");\n';
        script += '    if (rangeOffset) {\n';
        script += '      rangeOffset.setValue(' + params.selector.offset + ');\n';
        script += '    }\n';
      }
      
      script += '  } catch (e) {\n';
      script += '    // Ignore selector configuration errors\n';
      script += '  }\n';
      script += '}\n';
    }
    script += '\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    layerName: layer.name,\n';
    script += '    animatorIndex: animator.propertyIndex,\n';
    script += '    animatorName: animator.name,\n';
    script += '    propertiesAdded: properties.length\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },

  convertTextToShape: (params: {
    compId: number;
    layerIndex: number;
    keepOriginal?: boolean;
  }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var textLayer = comp.layer(' + params.layerIndex + ');\n';
    script += 'if (!textLayer || !(textLayer instanceof TextLayer)) {\n';
    script += '  throw new Error("Text layer not found");\n';
    script += '}\n\n';
    
    script += 'var originalName = textLayer.name;\n';
    script += 'var originalIndex = textLayer.index;\n\n';
    
    script += '// Store current time\n';
    script += 'var currentTime = comp.time;\n\n';
    
    script += '// Create shape from text\n';
    script += 'textLayer.selected = true;\n';
    script += 'app.executeCommand(3781); // Create Shapes from Text command ID\n\n';
    
    script += '// The new shape layer is created above the text layer\n';
    script += 'var shapeLayer = comp.layer(originalIndex);\n';
    script += 'shapeLayer.name = originalName + " Outlines";\n\n';
    
    if (!params.keepOriginal) {
      script += '// Remove original text layer\n';
      script += 'textLayer.remove();\n';
    } else {
      script += '// Keep original but disable it\n';
      script += 'textLayer.enabled = false;\n';
      script += 'textLayer.name = originalName + " (Original)";\n';
    }
    script += '\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    originalLayerName: originalName,\n';
    script += '    shapeLayerIndex: shapeLayer.index,\n';
    script += '    shapeLayerName: shapeLayer.name,\n';
    script += '    originalKept: ' + (params.keepOriginal ? 'true' : 'false') + '\n';
    script += '  }\n';
    script += '};';
    
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
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += '// Create text layer\n';
    script += 'var textLayer = comp.layers.addText("' + helpers.escapeString(params.text) + '");\n';
    script += 'textLayer.name = "Text on Path";\n\n';
    
    // Apply text properties if provided
    if (params.textProperties) {
      script += '// Apply text properties if provided\n';
      script += 'var textProp = textLayer.property("Source Text");\n';
      script += 'var textDocument = textProp.value;\n';
      script += 'var textProps = ' + JSON.stringify(params.textProperties) + ';\n\n';
      
      script += '// Apply all text properties similar to modifyTextProperties\n';
      script += 'if (textProps.font) textDocument.font = textProps.font;\n';
      script += 'if (textProps.fontSize !== undefined) textDocument.fontSize = textProps.fontSize;\n';
      script += 'if (textProps.fillColor) {\n';
      script += '  textDocument.fillColor = textProps.fillColor;\n';
      script += '  textDocument.applyFill = true;\n';
      script += '}\n\n';
      
      script += 'textProp.setValue(textDocument);\n\n';
    }
    
    script += '// Create mask from path\n';
    script += 'var mask = textLayer.property("Masks").addProperty("Mask");\n';
    script += 'mask.name = "Text Path";\n\n';
    
    script += 'var shape = new Shape();\n';
    script += 'shape.vertices = ' + JSON.stringify(params.path.vertices) + ';\n';
    if (params.path.inTangents) {
      script += 'shape.inTangents = ' + JSON.stringify(params.path.inTangents) + ';\n';
    }
    if (params.path.outTangents) {
      script += 'shape.outTangents = ' + JSON.stringify(params.path.outTangents) + ';\n';
    }
    script += 'shape.closed = ' + (params.path.closed ? 'true' : 'false') + ';\n\n';
    
    script += 'mask.property("Mask Path").setValue(shape);\n\n';
    
    script += '// Set mask mode to None so it doesn\'t actually mask\n';
    script += 'mask.maskMode = MaskMode.NONE;\n\n';
    
    script += '// Add path options to text\n';
    script += 'var textProp = textLayer.property("Text");\n';
    script += 'var pathOptions = textProp.property("Path Options");\n';
    script += 'pathOptions.property("Path").setValue(1); // First mask\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    layerIndex: textLayer.index,\n';
    script += '    layerName: textLayer.name,\n';
    script += '    maskIndex: mask.propertyIndex\n';
    script += '  }\n';
    script += '};';
    
    return script;
  }
};