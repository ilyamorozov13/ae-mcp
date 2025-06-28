import { ScriptGeneratorModule } from './types';
import { helpers } from './helpers';

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
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var textLayer = comp.layers.addText();
    ${params.name ? `textLayer.name = "${helpers.escapeString(params.name)}";` : ''}
    
    var textProp = textLayer.property("Source Text");
    var textDocument = textProp.value;
    
    // Set text content
    textDocument.text = "${helpers.escapeString(params.text)}";
    
    // Apply text formatting
    ${params.sourceText ? `
      var sourceText = ${JSON.stringify(params.sourceText)};
      
      ${params.sourceText.font ? `textDocument.font = "${helpers.escapeString(params.sourceText.font)}";` : ''}
      ${params.sourceText.fontSize !== undefined ? `textDocument.fontSize = ${params.sourceText.fontSize};` : ''}
      ${params.sourceText.fillColor ? `
        textDocument.fillColor = [${params.sourceText.fillColor.join(',')}];
        textDocument.applyFill = true;
      ` : ''}
      ${params.sourceText.strokeColor ? `
        textDocument.strokeColor = [${params.sourceText.strokeColor.join(',')}];
        textDocument.applyStroke = true;
        ${params.sourceText.strokeWidth !== undefined ? `textDocument.strokeWidth = ${params.sourceText.strokeWidth};` : ''}
        ${params.sourceText.strokeOverFill !== undefined ? `textDocument.strokeOverFill = ${params.sourceText.strokeOverFill};` : ''}
      ` : ''}
      
      ${params.sourceText.justification ? `
        var justificationMap = {
          "left": ParagraphJustification.LEFT_JUSTIFY,
          "center": ParagraphJustification.CENTER_JUSTIFY,
          "right": ParagraphJustification.RIGHT_JUSTIFY,
          "justifyLeft": ParagraphJustification.FULL_JUSTIFY_LASTLINE_LEFT,
          "justifyCenter": ParagraphJustification.FULL_JUSTIFY_LASTLINE_CENTER,
          "justifyRight": ParagraphJustification.FULL_JUSTIFY_LASTLINE_RIGHT,
          "justifyAll": ParagraphJustification.FULL_JUSTIFY_LASTLINE_FULL
        };
        var justification = justificationMap["${params.sourceText.justification}"];
        if (justification) {
          textDocument.justification = justification;
        }
      ` : ''}
      
      ${params.sourceText.tracking !== undefined ? `textDocument.tracking = ${params.sourceText.tracking};` : ''}
      ${params.sourceText.leading !== undefined ? `textDocument.leading = ${params.sourceText.leading};` : ''}
      ${params.sourceText.baselineShift !== undefined ? `textDocument.baselineShift = ${params.sourceText.baselineShift};` : ''}
      ${params.sourceText.verticalScale !== undefined ? `textDocument.verticalScale = ${params.sourceText.verticalScale};` : ''}
      ${params.sourceText.horizontalScale !== undefined ? `textDocument.horizontalScale = ${params.sourceText.horizontalScale};` : ''}
      ${params.sourceText.allCaps !== undefined ? `textDocument.allCaps = ${params.sourceText.allCaps};` : ''}
      ${params.sourceText.smallCaps !== undefined ? `textDocument.smallCaps = ${params.sourceText.smallCaps};` : ''}
    ` : ''}
    
    // Apply the text document
    textProp.setValue(textDocument);
    
    // Set transform properties
    ${params.position ? `textLayer.property("Position").setValue([${params.position.join(',')}]);` : ''}
    ${params.anchor ? `textLayer.property("Anchor Point").setValue([${params.anchor.join(',')}]);` : ''}
    
    return {
      success: true,
      data: {
        index: textLayer.index,
        name: textLayer.name
      }
    };
  `,

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
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer || !(layer instanceof TextLayer)) {
      throw new Error("Text layer not found");
    }
    
    var textProp = layer.property("Source Text");
    var textDocument = textProp.value;
    
    var props = ${JSON.stringify(params.properties)};
    
    // Update text content if provided
    ${params.properties.text ? `textDocument.text = "${helpers.escapeString(params.properties.text)}";` : ''}
    
    // Update font properties
    ${params.properties.font ? `textDocument.font = "${helpers.escapeString(params.properties.font)}";` : ''}
    ${params.properties.fontSize !== undefined ? `textDocument.fontSize = ${params.properties.fontSize};` : ''}
    
    // Update fill properties
    ${params.properties.fillColor ? `textDocument.fillColor = [${params.properties.fillColor.join(',')}];` : ''}
    ${params.properties.applyFill !== undefined ? `textDocument.applyFill = ${params.properties.applyFill};` : ''}
    
    // Update stroke properties
    ${params.properties.strokeColor ? `textDocument.strokeColor = [${params.properties.strokeColor.join(',')}];` : ''}
    ${params.properties.strokeWidth !== undefined ? `textDocument.strokeWidth = ${params.properties.strokeWidth};` : ''}
    ${params.properties.strokeOverFill !== undefined ? `textDocument.strokeOverFill = ${params.properties.strokeOverFill};` : ''}
    ${params.properties.applyStroke !== undefined ? `textDocument.applyStroke = ${params.properties.applyStroke};` : ''}
    
    // Update paragraph properties
    ${params.properties.justification ? `
      var justificationMap = {
        "left": ParagraphJustification.LEFT_JUSTIFY,
        "center": ParagraphJustification.CENTER_JUSTIFY,
        "right": ParagraphJustification.RIGHT_JUSTIFY,
        "justifyLeft": ParagraphJustification.FULL_JUSTIFY_LASTLINE_LEFT,
        "justifyCenter": ParagraphJustification.FULL_JUSTIFY_LASTLINE_CENTER,
        "justifyRight": ParagraphJustification.FULL_JUSTIFY_LASTLINE_RIGHT,
        "justifyAll": ParagraphJustification.FULL_JUSTIFY_LASTLINE_FULL
      };
      var justification = justificationMap["${params.properties.justification}"];
      if (justification) {
        textDocument.justification = justification;
      }
    ` : ''}
    
    ${params.properties.tracking !== undefined ? `textDocument.tracking = ${params.properties.tracking};` : ''}
    ${params.properties.leading !== undefined ? `textDocument.leading = ${params.properties.leading};` : ''}
    ${params.properties.baselineShift !== undefined ? `textDocument.baselineShift = ${params.properties.baselineShift};` : ''}
    ${params.properties.verticalScale !== undefined ? `textDocument.verticalScale = ${params.properties.verticalScale};` : ''}
    ${params.properties.horizontalScale !== undefined ? `textDocument.horizontalScale = ${params.properties.horizontalScale};` : ''}
    
    // Apply the updated text document
    textProp.setValue(textDocument);
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        layerIndex: layer.index
      }
    };
  `,

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
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layer = comp.layer(${params.layerIndex});
    if (!layer || !(layer instanceof TextLayer)) {
      throw new Error("Text layer not found");
    }
    
    var textAnimators = layer.property("Text").property("Animators");
    var animator = textAnimators.addProperty("ADBE Text Animator");
    ${params.animatorName ? `animator.name = "${helpers.escapeString(params.animatorName)}";` : ''}
    
    // Add properties to animate
    var animatorProperties = animator.property("ADBE Text Animator Properties");
    var properties = ${JSON.stringify(params.properties)};
    
    for (var i = 0; i < properties.length; i++) {
      var propName = properties[i];
      var propMap = {
        "position": "ADBE Text Position 3D",
        "scale": "ADBE Text Scale 3D",
        "rotation": "ADBE Text Rotation",
        "opacity": "ADBE Text Opacity",
        "anchorPoint": "ADBE Text Anchor Point 3D",
        "fillColor": "ADBE Text Fill Color",
        "strokeColor": "ADBE Text Stroke Color",
        "strokeWidth": "ADBE Text Stroke Width",
        "tracking": "ADBE Text Tracking Amount",
        "lineAnchor": "ADBE Text Line Anchor",
        "blur": "ADBE Text Blur"
      };
      
      var aePropertyName = propMap[propName];
      if (aePropertyName) {
        try {
          animatorProperties.addProperty(aePropertyName);
        } catch (e) {
          // Property might not be available in this AE version
        }
      }
    }
    
    // Configure selector
    var selectors = animator.property("ADBE Text Selectors");
    var selector = selectors.property(1); // Default range selector
    
    ${params.selector ? `
      var selectorConfig = ${JSON.stringify(params.selector)};
      
      // Set selector type
      ${params.selector.type === 'wiggly' ? `
        // Replace with wiggly selector
        selector.remove();
        selector = selectors.addProperty("ADBE Text Wiggly Selector");
      ` : ''}
      
      // Configure range selector properties
      if (selector.matchName === "ADBE Text Selector") {
        ${params.selector.basedOn ? `
          var basedOnMap = {
            "characters": 1,
            "charactersExcludingSpaces": 2,
            "words": 3,
            "lines": 4
          };
          var basedOn = basedOnMap["${params.selector.basedOn}"];
          if (basedOn) {
            selector.property("ADBE Text Range Units").setValue(basedOn);
          }
        ` : ''}
        
        ${params.selector.start !== undefined ? `selector.property("ADBE Text Range Start").setValue(${params.selector.start});` : ''}
        ${params.selector.end !== undefined ? `selector.property("ADBE Text Range End").setValue(${params.selector.end});` : ''}
        ${params.selector.offset !== undefined ? `selector.property("ADBE Text Range Offset").setValue(${params.selector.offset});` : ''}
      }
    ` : ''}
    
    return {
      success: true,
      data: {
        layerName: layer.name,
        animatorIndex: animator.propertyIndex,
        animatorName: animator.name,
        propertiesAdded: properties.length
      }
    };
  `,

  convertTextToShape: (params: {
    compId: number;
    layerIndex: number;
    keepOriginal?: boolean;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var textLayer = comp.layer(${params.layerIndex});
    if (!textLayer || !(textLayer instanceof TextLayer)) {
      throw new Error("Text layer not found");
    }
    
    var originalName = textLayer.name;
    var originalIndex = textLayer.index;
    
    // Store current time
    var currentTime = comp.time;
    
    // Create shape from text
    textLayer.selected = true;
    app.executeCommand(3781); // Create Shapes from Text command ID
    
    // The new shape layer is created above the text layer
    var shapeLayer = comp.layer(originalIndex);
    shapeLayer.name = originalName + " Outlines";
    
    ${!params.keepOriginal ? `
      // Remove original text layer
      textLayer.remove();
    ` : `
      // Keep original but disable it
      textLayer.enabled = false;
      textLayer.name = originalName + " (Original)";
    `}
    
    return {
      success: true,
      data: {
        originalLayerName: originalName,
        shapeLayerIndex: shapeLayer.index,
        shapeLayerName: shapeLayer.name,
        originalKept: ${params.keepOriginal ? 'true' : 'false'}
      }
    };
  `,

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
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    // Create text layer
    var textLayer = comp.layers.addText("${helpers.escapeString(params.text)}");
    textLayer.name = "Text on Path";
    
    // Apply text properties if provided
    ${params.textProperties ? `
      var textProp = textLayer.property("Source Text");
      var textDocument = textProp.value;
      var textProps = ${JSON.stringify(params.textProperties)};
      
      // Apply all text properties similar to modifyTextProperties
      if (textProps.font) textDocument.font = textProps.font;
      if (textProps.fontSize !== undefined) textDocument.fontSize = textProps.fontSize;
      if (textProps.fillColor) {
        textDocument.fillColor = textProps.fillColor;
        textDocument.applyFill = true;
      }
      
      textProp.setValue(textDocument);
    ` : ''}
    
    // Create mask from path
    var mask = textLayer.property("Masks").addProperty("Mask");
    mask.name = "Text Path";
    
    var shape = new Shape();
    shape.vertices = ${JSON.stringify(params.path.vertices)};
    ${params.path.inTangents ? `shape.inTangents = ${JSON.stringify(params.path.inTangents)};` : ''}
    ${params.path.outTangents ? `shape.outTangents = ${JSON.stringify(params.path.outTangents)};` : ''}
    shape.closed = ${params.path.closed ? 'true' : 'false'};
    
    mask.property("Mask Path").setValue(shape);
    
    // Set mask mode to None so it doesn't actually mask
    mask.maskMode = MaskMode.NONE;
    
    // Add path options to text
    var textProp = textLayer.property("Text");
    var pathOptions = textProp.property("Path Options");
    pathOptions.property("Path").setValue(1); // First mask
    
    return {
      success: true,
      data: {
        layerIndex: textLayer.index,
        layerName: textLayer.name,
        maskIndex: mask.propertyIndex
      }
    };
  `
};