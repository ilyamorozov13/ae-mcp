export class ScriptGenerator {
  constructor() {
    // Set up aliases after object is created
    this.generators.create_project = this.generators.createProject;
    this.generators.open_project = this.generators.openProject;
    this.generators.save_project = this.generators.saveProject;
    this.generators.get_project_info = this.generators.getProjectInfo;
    this.generators.create_composition = this.generators.createComposition;
    this.generators.modify_composition = this.generators.modifyComposition;
    this.generators.list_compositions = this.generators.listCompositions;
    this.generators.get_composition_info = this.generators.getCompositionInfo;
    this.generators.add_solid_layer = this.generators.addSolidLayer;
    this.generators.add_text_layer = this.generators.addTextLayer;
    this.generators.add_shape_layer = this.generators.addShapeLayer;
    this.generators.create_layer = this.generators.createLayer;
    this.generators.modify_layer_properties = this.generators.modifyLayerProperties;
    this.generators.duplicate_layer = this.generators.duplicateLayer;
    this.generators.delete_layer = this.generators.deleteLayer;
    this.generators.reorder_layers = this.generators.reorderLayers;
    this.generators.set_keyframe = this.generators.setKeyframe;
    this.generators.apply_effect = this.generators.applyEffect;
    this.generators.add_to_render_queue = this.generators.addToRenderQueue;
    this.generators.start_render = this.generators.startRender;
    this.generators.get_render_queue = this.generators.getRenderQueue;
    this.generators.batch_execute = this.generators.batchExecute;
    this.generators.batch_keyframes = this.generators.batchKeyframes;
    this.generators.batch_create_layers = this.generators.batchCreateLayers;
    this.generators.close_project = this.generators.closeProject;
    this.generators.import_footage = this.generators.importFootage;
    this.generators.pause_render = this.generators.pauseRender;
    this.generators.stop_render = this.generators.stopRender;
    this.generators.clear_render_queue = this.generators.clearRenderQueue;
    this.generators.export_frame = this.generators.exportFrame;
    this.generators.batch_render = this.generators.batchRender;
    this.generators.duplicate_composition = this.generators.duplicateComposition;
    this.generators.delete_composition = this.generators.deleteComposition;
    
    // Advanced layer tool aliases
    this.generators.add_null_layer = this.generators.addNullLayer;
    this.generators.add_adjustment_layer = this.generators.addAdjustmentLayer;
    this.generators.add_camera_layer = this.generators.addCameraLayer;
    this.generators.add_light_layer = this.generators.addLightLayer;
    this.generators.set_layer_parent = this.generators.setLayerParent;
    this.generators.set_layer_blend_mode = this.generators.setLayerBlendMode;
    this.generators.set_track_matte = this.generators.setTrackMatte;
    this.generators.set_layer_3d = this.generators.setLayer3d;
    this.generators.modify_layer_3d_properties = this.generators.modifyLayer3dProperties;
    this.generators.set_layer_quality = this.generators.setLayerQuality;
    this.generators.set_motion_blur = this.generators.setMotionBlur;
    this.generators.set_layer_visibility = this.generators.setLayerVisibility;
    this.generators.set_time_remapping = this.generators.setTimeRemapping;
    this.generators.get_layer_info = this.generators.getLayerInfo;
    
    // Expression tool aliases
    this.generators.set_expression = this.generators.setExpression;
    this.generators.get_expression = this.generators.getExpression;
    this.generators.remove_expression = this.generators.removeExpression;
    this.generators.enable_expression = this.generators.enableExpression;
    this.generators.batch_set_expressions = this.generators.batchSetExpressions;
    this.generators.add_expression_control = this.generators.addExpressionControl;
    this.generators.link_properties_with_expression = this.generators.linkPropertiesWithExpression;
    this.generators.add_wiggle_expression = this.generators.addWiggleExpression;
    this.generators.add_loop_expression = this.generators.addLoopExpression;
    this.generators.execute_script = this.generators.executeScript;
    
    // Mask tool aliases
    this.generators.add_mask = this.generators.addMask;
    this.generators.add_rectangular_mask = this.generators.addRectangularMask;
    this.generators.add_elliptical_mask = this.generators.addEllipticalMask;
    this.generators.modify_mask_path = this.generators.modifyMaskPath;
    this.generators.set_mask_properties = this.generators.setMaskProperties;
    this.generators.delete_mask = this.generators.deleteMask;
    this.generators.get_mask_info = this.generators.getMaskInfo;
    this.generators.animate_mask_path = this.generators.animateMaskPath;
    this.generators.add_shape_path = this.generators.addShapePath;
    this.generators.modify_shape_path = this.generators.modifyShapePath;
    this.generators.create_shape_from_path = this.generators.createShapeFromPath;
    this.generators.convert_mask_to_shape = this.generators.convertMaskToShape;
    
    // Text tool aliases
    this.generators.add_text_layer_advanced = this.generators.addTextLayerAdvanced;
    this.generators.modify_text_properties = this.generators.modifyTextProperties;
    this.generators.add_text_animator = this.generators.addTextAnimator;
    
    // Keyframe tool aliases
    this.generators.set_keyframe_advanced = this.generators.setKeyframeAdvanced;
    this.generators.apply_easy_ease = this.generators.applyEasyEase;
    this.generators.set_temporal_ease = this.generators.setTemporalEase;
    this.generators.set_spatial_tangent = this.generators.setSpatialTangent;
    this.generators.create_animation_curve = this.generators.createAnimationCurve;
  }

  generate(command: string, params: any): string {
    const generator = this.generators[command];
    if (!generator) {
      throw new Error(`Unknown command: ${command}`);
    }
    
    // Call the generator function with 'this' context
    const script = generator.call(this, params);
    return this.wrapInTryCatch(script);
  }
  
  private wrapInTryCatch(script: string): string {
    return `(function() {
  try {
${script.split('\n').map(line => '    ' + line).join('\n')}
  } catch (error) {
    return { 
      success: false, 
      error: { 
        message: error.toString(), 
        code: error.number ? error.number : 'UNKNOWN' 
      } 
    };
  }
})();`; // Note: No extra whitespace, IIFE is executed and returns value
  }
  
  private escapeString(str: string): string {
    return str.replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
  }
  
  private generators: { [key: string]: (params: any) => string } = {
    // System/diagnostic commands
    ping: () => `
      var now = new Date();
      var timestamp = now.getFullYear() + '-' + 
                     ('0' + (now.getMonth() + 1)).slice(-2) + '-' + 
                     ('0' + now.getDate()).slice(-2) + 'T' + 
                     ('0' + now.getHours()).slice(-2) + ':' + 
                     ('0' + now.getMinutes()).slice(-2) + ':' + 
                     ('0' + now.getSeconds()).slice(-2) + '.' + 
                     ('00' + now.getMilliseconds()).slice(-3) + 'Z';
      
      return {
        success: true,
        data: {
          message: "pong",
          timestamp: timestamp
        }
      };
    `,
    
    get_ae_version: () => `
      return {
        success: true,
        data: {
          version: app.version,
          buildNumber: app.buildNumber,
          buildName: app.buildName,
          language: app.language,
          locale: app.locale,
          memoryInUse: app.memoryInUse,
          projectName: app.project ? app.project.name : null
        }
      };
    `,
    
    // These will be set up as aliases in the constructor
    
    // Original camelCase implementations
    createProject: (params: { name: string; settings?: any }) => `
      var project = app.newProject();
      if (project) {
        project.name = "${this.escapeString(params.name)}";
        return {
          success: true,
          data: {
            name: project.name,
            file: project.file ? project.file.fsName : null,
            numItems: project.numItems
          }
        };
      }
      throw new Error("Failed to create project");
    `,
    
    openProject: (params: { filePath: string }) => `
      var file = new File("${this.escapeString(params.filePath)}");
      if (!file.exists) {
        throw new Error("File not found: " + file.fsName);
      }
      
      var project = app.open(file);
      if (project) {
        return {
          success: true,
          data: {
            name: project.file.name,
            file: project.file.fsName,
            numItems: project.numItems
          }
        };
      }
      throw new Error("Failed to open project");
    `,
    
    saveProject: (params: { filePath?: string }) => `
      if (!app.project) {
        throw new Error("No project is open");
      }
      
      ${params.filePath ? `
        var file = new File("${this.escapeString(params.filePath)}");
        app.project.save(file);
      ` : `
        if (!app.project.file) {
          throw new Error("Project has not been saved before, please provide a file path");
        }
        app.project.save();
      `}
      
      return {
        success: true,
        data: {
          file: app.project.file.fsName
        }
      };
    `,
    
    getProjectInfo: () => `
      if (!app.project) {
        throw new Error("No project is open");
      }
      
      var comps = [];
      var footage = [];
      
      for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem) {
          comps.push({
            id: item.id,
            name: item.name,
            width: item.width,
            height: item.height,
            duration: item.duration,
            frameRate: item.frameRate
          });
        } else if (item instanceof FootageItem) {
          footage.push({
            id: item.id,
            name: item.name,
            width: item.width,
            height: item.height,
            duration: item.duration
          });
        }
      }
      
      return {
        success: true,
        data: {
          name: app.project.file ? app.project.file.name : "Untitled",
          file: app.project.file ? app.project.file.fsName : null,
          numItems: app.project.numItems,
          compositions: comps,
          footage: footage
        }
      };
    `,
    
    createComposition: (params: {
      name: string;
      width?: number;
      height?: number;
      duration?: number;
      frameRate?: number;
    }) => `
      if (!app.project) {
        throw new Error("No project is open");
      }
      
      var comp = app.project.items.addComp(
        "${this.escapeString(params.name)}",
        ${params.width ? params.width : 1920},
        ${params.height ? params.height : 1080},
        1.0,
        ${params.duration ? params.duration : 10},
        ${params.frameRate ? params.frameRate : 30}
      );
      
      return {
        success: true,
        data: {
          id: comp.id,
          name: comp.name,
          width: comp.width,
          height: comp.height,
          duration: comp.duration,
          frameRate: comp.frameRate
        }
      };
    `,
    
    modifyComposition: (params: {
      compId: number;
      properties: {
        name?: string;
        width?: number;
        height?: number;
        duration?: number;
        backgroundColor?: number[];
      };
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      ${params.properties.name ? `comp.name = "${this.escapeString(params.properties.name)}";` : ''}
      ${params.properties.width ? `comp.width = ${params.properties.width};` : ''}
      ${params.properties.height ? `comp.height = ${params.properties.height};` : ''}
      ${params.properties.duration ? `comp.duration = ${params.properties.duration};` : ''}
      ${params.properties.backgroundColor ? `comp.bgColor = [${params.properties.backgroundColor.join(',')}];` : ''}
      
      return {
        success: true,
        data: {
          id: comp.id,
          name: comp.name,
          width: comp.width,
          height: comp.height,
          duration: comp.duration,
          frameRate: comp.frameRate
        }
      };
    `,
    
    listCompositions: () => `
      if (!app.project) {
        throw new Error("No project is open");
      }
      
      var comps = [];
      for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem) {
          comps.push({
            id: item.id,
            name: item.name,
            width: item.width,
            height: item.height,
            duration: item.duration,
            frameRate: item.frameRate,
            numLayers: item.numLayers
          });
        }
      }
      
      return {
        success: true,
        data: comps
      };
    `,
    
    getCompositionInfo: (params: { compId: number }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      // Get layer information
      var layers = [];
      for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        layers.push({
          index: i,
          name: layer.name,
          locked: layer.locked,
          shy: layer.shy,
          solo: layer.solo,
          startTime: layer.startTime,
          inPoint: layer.inPoint,
          outPoint: layer.outPoint
        });
      }
      
      return {
        success: true,
        data: {
          id: comp.id,
          name: comp.name,
          width: comp.width,
          height: comp.height,
          pixelAspect: comp.pixelAspect,
          duration: comp.duration,
          frameRate: comp.frameRate,
          time: comp.time,
          bgColor: comp.bgColor,
          numLayers: comp.numLayers,
          layers: layers
        }
      };
    `,
    
    addSolidLayer: (params: {
      compId: number;
      name?: string;
      color?: number[];
      width?: number;
      height?: number;
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layers.addSolid(
        [${params.color ? params.color.join(',') : '1,1,1'}],
        "${this.escapeString(params.name ? params.name : 'Solid')}",
        ${params.width ? params.width : 'comp.width'},
        ${params.height ? params.height : 'comp.height'},
        1.0
      );
      
      return {
        success: true,
        data: {
          index: layer.index,
          name: layer.name
        }
      };
    `,
    
    addTextLayer: (params: {
      compId: number;
      text: string;
      name?: string;
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layers.addText("${this.escapeString(params.text)}");
      ${params.name ? `layer.name = "${this.escapeString(params.name)}";` : ''}
      
      return {
        success: true,
        data: {
          index: layer.index,
          name: layer.name
        }
      };
    `,
    
    addShapeLayer: (params: {
      compId: number;
      name?: string;
      shapeType?: string;
      properties?: any;
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layers.addShape();
      ${params.name ? `layer.name = "${this.escapeString(params.name)}";` : ''}
      
      // Parse properties
      var props = ${params.properties ? JSON.stringify(params.properties) : '{}'};
      var shapeType = "${params.shapeType ? params.shapeType : 'rectangle'}";
      
      // Add shape content directly to the root vectors group
      var contents = layer.property("ADBE Root Vectors Group");
      
      // Add the shape path based on type
      var shapePath;
      if (shapeType === "rectangle") {
        shapePath = contents.addProperty("ADBE Vector Shape - Rect");
        var size = props.size || [100, 100];
        shapePath.property("ADBE Vector Rect Size").setValue(size);
        
        // Add corner radius if specified
        if (props.cornerRadius && props.cornerRadius > 0) {
          shapePath.property("ADBE Vector Rect Roundness").setValue(props.cornerRadius);
        }
      } else if (shapeType === "ellipse") {
        shapePath = contents.addProperty("ADBE Vector Shape - Ellipse");
        var size = props.size || [100, 100];
        shapePath.property("ADBE Vector Ellipse Size").setValue(size);
      } else if (shapeType === "polygon" || shapeType === "star") {
        shapePath = contents.addProperty("ADBE Vector Shape - Star");
        // Set type after creation
        if (shapeType === "polygon") {
          shapePath.property("ADBE Vector Star Type").setValue(1); // 1 = polygon
        } else {
          shapePath.property("ADBE Vector Star Type").setValue(2); // 2 = star
        }
        
        // Set points
        if (props.points) {
          shapePath.property("ADBE Vector Star Points").setValue(props.points);
        } else {
          shapePath.property("ADBE Vector Star Points").setValue(5);
        }
        
        // Set radii
        if (props.outerRadius) {
          shapePath.property("ADBE Vector Star Outer Radius").setValue(props.outerRadius);
        } else {
          shapePath.property("ADBE Vector Star Outer Radius").setValue(100);
        }
        
        if (shapeType === "star" && props.innerRadius) {
          shapePath.property("ADBE Vector Star Inner Radius").setValue(props.innerRadius);
        } else if (shapeType === "star") {
          shapePath.property("ADBE Vector Star Inner Radius").setValue(50);
        }
      }
      
      // Add fill to make the shape visible - MUST come after shape path
      var fill = contents.addProperty("ADBE Vector Graphic - Fill");
      if (props.fillColor) {
        fill.property("ADBE Vector Fill Color").setValue(props.fillColor);
      } else {
        // Default red fill
        fill.property("ADBE Vector Fill Color").setValue([1, 0, 0]);
      }
      
      // Add stroke if specified - comes after fill
      if (props.strokeWidth && props.strokeWidth > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Width").setValue(props.strokeWidth);
        if (props.strokeColor) {
          stroke.property("ADBE Vector Stroke Color").setValue(props.strokeColor);
        }
      }
      
      // Set transform properties
      var position = props.position || [comp.width/2, comp.height/2];
      layer.property("Position").setValue(position);
      
      if (props.scale) {
        layer.property("Scale").setValue(props.scale);
      }
      
      if (props.rotation !== undefined) {
        layer.property("Rotation").setValue(props.rotation);
      }
      
      if (props.opacity !== undefined) {
        layer.property("Opacity").setValue(props.opacity);
      }
      
      return {
        success: true,
        data: {
          index: layer.index,
          name: layer.name
        }
      };
    `,
    
    createLayer: (params: {
      compId: number;
      type: string;
      name?: string;
      color?: number[];
      text?: string;
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer;
      var type = "${params.type}".toLowerCase();
      
      switch(type) {
        case "solid":
          var color = ${params.color ? `[${params.color.join(',')}]` : '[0, 0, 0]'};
          layer = comp.layers.addSolid(color, "${params.name ? params.name : 'Solid'}", comp.width, comp.height, 1);
          break;
        case "text":
          layer = comp.layers.addText("${this.escapeString(params.text ? params.text : 'Text')}");
          ${params.name ? `layer.name = "${this.escapeString(params.name)}";` : ''}
          break;
        case "shape":
          layer = comp.layers.addShape();
          ${params.name ? `layer.name = "${this.escapeString(params.name)}";` : ''}
          break;
        case "null":
          layer = comp.layers.addNull();
          ${params.name ? `layer.name = "${this.escapeString(params.name)}";` : ''}
          break;
        default:
          throw new Error("Unknown layer type: " + type);
      }
      
      return {
        success: true,
        data: {
          index: layer.index,
          name: layer.name,
          type: type
        }
      };
    `,
    
    modifyLayerProperties: (params: {
      compId: number;
      layerIndex: number;
      properties: {
        position?: number[];
        scale?: number[];
        rotation?: number;
        opacity?: number;
      };
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // Helper function to set property value, handling keyframes
      function setPropertyValue(prop, value) {
        if (prop.numKeys > 0) {
          // Property has keyframes, use setValueAtTime at current comp time
          prop.setValueAtTime(comp.time, value);
        } else {
          // No keyframes, use setValue
          prop.setValue(value);
        }
      }
      
      ${params.properties.position ? `
      var positionProp = layer.property("Position");
      setPropertyValue(positionProp, [${params.properties.position.join(',')}]);
      ` : ''}
      
      ${params.properties.scale ? `
      var scaleProp = layer.property("Scale");
      setPropertyValue(scaleProp, [${params.properties.scale.join(',')}]);
      ` : ''}
      
      ${params.properties.rotation ? `
      var rotationProp = layer.property("Rotation");
      setPropertyValue(rotationProp, ${params.properties.rotation});
      ` : ''}
      
      ${params.properties.opacity ? `
      var opacityProp = layer.property("Opacity");
      setPropertyValue(opacityProp, ${params.properties.opacity});
      ` : ''}
      
      return {
        success: true,
        data: {
          index: layer.index,
          name: layer.name,
          modifiedAt: comp.time
        }
      };
    `,
    
    setKeyframe: (params: {
      compId: number;
      layerIndex: number;
      property: string;
      time: number;
      value: any;
    }) => {
      // Build the time assignment based on whether time is provided
      const timeAssignment = params.time !== undefined && params.time !== null 
        ? `var time = ${params.time};`
        : `var time = comp.time;`;
      
      return `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // Get time value - use provided time or current comp time
      ${timeAssignment}
      
      // Time validation will happen later
      
      // Normalize property name - AE uses specific casing
      var propertyName = "${this.escapeString(params.property)}";
      var propertyMap = {
        "position": "Position",
        "scale": "Scale", 
        "rotation": "Rotation",
        "opacity": "Opacity"
      };
      
      // Use mapped name if available, otherwise use as-is
      var normalizedProperty = propertyMap[propertyName.toLowerCase()] ? propertyMap[propertyName.toLowerCase()] : propertyName;
      
      var prop = layer.property(normalizedProperty);
      if (!prop) {
        // Try Transform group for transform properties
        if (["Position", "Scale", "Rotation"].indexOf(normalizedProperty) !== -1) {
          var transform = layer.property("Transform");
          if (transform) {
            prop = transform.property(normalizedProperty);
          }
        }
        
        if (!prop) {
          throw new Error("Property not found: " + normalizedProperty + " (original: " + propertyName + ")");
        }
      }
      
      // Check if property can have keyframes
      if (!prop.canVaryOverTime) {
        throw new Error("Property cannot be keyframed: ${this.escapeString(params.property)}");
      }
      
      // Get value
      var value = ${params.value !== undefined && params.value !== null 
        ? (Array.isArray(params.value) ? `[${params.value.join(',')}]` : params.value) 
        : 'prop.value'};
      
      // Removed debug output that uses string concatenation
      
      // Final validation before calling setValueAtTime
      if (time === undefined || time === null) {
        throw new Error("Time is still undefined after all checks!");
      }
      
      if (value === undefined || value === null) {
        throw new Error("Value is undefined!");
      }
      
      // Validate array values for Position, Scale
      var arrayProps = ["Position", "Scale"];
      if (arrayProps.indexOf(normalizedProperty) !== -1) {
        if (!(value instanceof Array)) {
          throw new Error(normalizedProperty + " requires an array value, got: " + typeof value);
        }
        if (value.length < 2 || value.length > 3) {
          throw new Error(normalizedProperty + " requires 2 or 3 values, got " + value.length + ": [" + value.join(", ") + "]");
        }
        
        // Prevent zero scale values
        if (normalizedProperty === "Scale") {
          for (var i = 0; i < value.length; i++) {
            if (value[i] === 0) {
              // Replace zero with small value to avoid divide by zero
              value[i] = 0.1; // Use 0.1% instead of 0%
            }
          }
        }
      }
      
      try {
        // Ensure time is a number
        var numTime = parseFloat(time);
        if (isNaN(numTime)) {
          throw new Error("Time is not a valid number: " + time);
        }
        
        // Remove debug line that contains string concatenation with + that might be seen as division
        prop.setValueAtTime(numTime, value);
      } catch (e) {
        throw new Error("Failed to set keyframe at time " + time + " with value " + value + ": " + e.toString());
      }
      
      return {
        success: true,
        data: {
          property: "${this.escapeString(params.property)}",
          time: time,
          value: value,
          numKeys: prop.numKeys
        }
      };
    `;
    },
    
    duplicateLayer: (params: {
      compId: number;
      layerIndex: number;
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      var duplicated = layer.duplicate();
      
      return {
        success: true,
        data: {
          originalIndex: layer.index,
          duplicatedIndex: duplicated.index,
          name: duplicated.name
        }
      };
    `,
    
    deleteLayer: (params: {
      compId: number;
      layerIndex: number;
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      var layerName = layer.name;
      layer.remove();
      
      return {
        success: true,
        data: {
          deletedLayerName: layerName,
          deletedLayerIndex: ${params.layerIndex}
        }
      };
    `,
    
    reorderLayers: (params: {
      compId: number;
      layerIndex: number;
      newIndex: number;
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // After Effects uses moveBefore/moveAfter methods
      // If newIndex is less than current, we need to move before
      // If newIndex is greater, we need to move after
      var currentIndex = layer.index;
      var targetIndex = ${params.newIndex};
      
      if (targetIndex < 1 || targetIndex > comp.numLayers) {
        throw new Error("New index out of range");
      }
      
      if (targetIndex !== currentIndex) {
        if (targetIndex < currentIndex) {
          // Moving up (smaller index number)
          var targetLayer = comp.layer(targetIndex);
          layer.moveBefore(targetLayer);
        } else {
          // Moving down (larger index number)
          // When moving down, we need to account for the shift
          var adjustedTarget = targetIndex;
          if (targetIndex === comp.numLayers) {
            layer.moveToEnd();
          } else {
            var targetLayer = comp.layer(adjustedTarget + 1);
            layer.moveAfter(targetLayer);
          }
        }
      }
      
      return {
        success: true,
        data: {
          layerName: layer.name,
          oldIndex: currentIndex,
          newIndex: layer.index
        }
      };
    `,
    
    applyEffect: (params: {
      compId: number;
      layerIndex: number;
      effectName: string;
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // Apply the effect
      var effect = layer.property("Effects").addProperty("${this.escapeString(params.effectName)}");
      
      if (!effect) {
        throw new Error("Failed to apply effect: " + "${this.escapeString(params.effectName)}");
      }
      
      return {
        success: true,
        data: {
          layerName: layer.name,
          effectName: effect.name,
          effectIndex: effect.propertyIndex
        }
      };
    `,
    
    addToRenderQueue: (params: {
      compId: number;
      outputPath: string;
      outputModule?: string;
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var item = app.project.renderQueue.items.add(comp);
      var outputModule = item.outputModule(1);
      
      var file = new File("${this.escapeString(params.outputPath)}");
      outputModule.file = file;
      
      ${params.outputModule ? `
        try {
          var template = "${this.escapeString(params.outputModule)}";
          outputModule.applyTemplate(template);
        } catch (templateError) {
          // Template doesn't exist, provide helpful error message
          throw new Error("Invalid output module template: '" + template + "'. Common templates include: 'Lossless', 'High Quality', 'HDTV 1080 29.97', 'H.264 - Match Render Settings', etc. Check Edit > Templates > Output Module for available templates in your AE installation.");
        }
      ` : ''}
      
      return {
        success: true,
        data: {
          index: item.index,
          status: item.status,
          outputPath: file.fsName
        }
      };
    `,
    
    startRender: () => `
      if (app.project.renderQueue.numItems === 0) {
        throw new Error("Render queue is empty");
      }
      
      app.project.renderQueue.render();
      
      return {
        success: true,
        data: {
          message: "Render started"
        }
      };
    `,
    
    getRenderQueue: () => `
      var items = [];
      for (var i = 1; i <= app.project.renderQueue.numItems; i++) {
        var item = app.project.renderQueue.item(i);
        items.push({
          index: item.index,
          comp: item.comp.name,
          status: item.status,
          startTime: item.startTime,
          elapsedSeconds: item.elapsedSeconds
        });
      }
      
      return {
        success: true,
        data: {
          numItems: app.project.renderQueue.numItems,
          items: items
        }
      };
    `,
    
    batchExecute: (params: { commands: any[], sequential?: boolean }) => {
      // For batch execute, we'll process each command individually
      // The file bridge will handle them in parallel
      throw new Error("batch_execute should be handled at the server level, not in script generation");
    },
    
    batchKeyframes: (params: { compId: number, keyframes: any[] }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var results = [];
      var keyframes = ${JSON.stringify(params.keyframes)};
      
      for (var i = 0; i < keyframes.length; i++) {
        var kf = keyframes[i];
        try {
          var layer = comp.layer(kf.layerIndex);
          if (!layer) {
            results.push({success: false, error: "Layer " + kf.layerIndex + " not found"});
            continue;
          }
          
          // Property name normalization
          var propertyMap = {
            "position": "Position",
            "scale": "Scale",
            "rotation": "Rotation",
            "opacity": "Opacity"
          };
          var propName = propertyMap[kf.property.toLowerCase()] ? propertyMap[kf.property.toLowerCase()] : kf.property;
          
          var prop = layer.property(propName);
          if (!prop) {
            // Try under Transform
            var transform = layer.property("Transform");
            if (transform) {
              prop = transform.property(propName);
            }
          }
          
          if (!prop) {
            results.push({success: false, error: "Property " + propName + " not found on layer " + kf.layerIndex});
            continue;
          }
          
          // Fix zero scale values
          var value = kf.value;
          if (propName === "Scale" && value instanceof Array) {
            for (var j = 0; j < value.length; j++) {
              if (value[j] === 0) value[j] = 0.1;
            }
          }
          
          prop.setValueAtTime(kf.time, value);
          results.push({success: true, layer: kf.layerIndex, property: propName, time: kf.time});
          
        } catch (e) {
          results.push({success: false, error: e.toString(), layer: kf.layerIndex});
        }
      }
      
      var successCount = 0;
      for (var i = 0; i < results.length; i++) {
        if (results[i].success) successCount++;
      }
      
      return {
        success: true,
        data: {
          total: keyframes.length,
          successful: successCount,
          results: results
        }
      };
    `,
    
    batchCreateLayers: (params: { compId: number, layers: any[] }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var results = [];
      var layers = ${JSON.stringify(params.layers)};
      
      for (var i = 0; i < layers.length; i++) {
        var layerDef = layers[i];
        try {
          var layer;
          var type = layerDef.type.toLowerCase();
          
          switch(type) {
            case "solid":
              var color = [0, 0, 0];
              if (layerDef.properties && layerDef.properties.color) {
                color = layerDef.properties.color;
              }
              layer = comp.layers.addSolid(color, layerDef.name, comp.width, comp.height, 1);
              break;
              
            case "text":
              var text = layerDef.name;
              if (layerDef.properties && layerDef.properties.text) {
                text = layerDef.properties.text;
              }
              layer = comp.layers.addText(text);
              layer.name = layerDef.name;
              break;
              
            case "shape":
              layer = comp.layers.addShape();
              layer.name = layerDef.name;
              
              // Add default shape content if not empty
              var contents = layer.property("ADBE Root Vectors Group");
              var props = layerDef.properties || {};
              
              // Determine shape type from properties or use default
              var shapeType = props.shapeType || "rectangle";
              
              // Add the shape path based on type
              var shapePath;
              if (shapeType === "rectangle") {
                shapePath = contents.addProperty("ADBE Vector Shape - Rect");
                var size = props.size || [100, 100];
                shapePath.property("ADBE Vector Rect Size").setValue(size);
                
                // Add corner radius if specified
                if (props.cornerRadius && props.cornerRadius > 0) {
                  shapePath.property("ADBE Vector Rect Roundness").setValue(props.cornerRadius);
                }
              } else if (shapeType === "ellipse") {
                shapePath = contents.addProperty("ADBE Vector Shape - Ellipse");
                var size = props.size || [100, 100];
                shapePath.property("ADBE Vector Ellipse Size").setValue(size);
              } else if (shapeType === "polygon" || shapeType === "star") {
                shapePath = contents.addProperty("ADBE Vector Shape - Star");
                if (shapeType === "polygon") {
                  shapePath.property("ADBE Vector Star Type").setValue(1); // polygon
                } else {
                  shapePath.property("ADBE Vector Star Type").setValue(2); // star
                }
                
                // Set points
                var points = props.points || 5;
                shapePath.property("ADBE Vector Star Points").setValue(points);
                
                // Set radii
                var outerRadius = props.outerRadius || 100;
                shapePath.property("ADBE Vector Star Outer Radius").setValue(outerRadius);
                
                if (shapeType === "star") {
                  var innerRadius = props.innerRadius || 50;
                  shapePath.property("ADBE Vector Star Inner Radius").setValue(innerRadius);
                }
              }
              
              // Add stroke if specified
              if (props.strokeWidth && props.strokeWidth > 0) {
                var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
                stroke.property("ADBE Vector Stroke Width").setValue(props.strokeWidth);
                if (props.strokeColor) {
                  stroke.property("ADBE Vector Stroke Color").setValue(props.strokeColor);
                }
              }
              
              // Add fill to make the shape visible
              var fill = contents.addProperty("ADBE Vector Graphic - Fill");
              if (props.fillColor) {
                fill.property("ADBE Vector Fill Color").setValue(props.fillColor);
              } else if (props.color) {
                // Backwards compatibility
                fill.property("ADBE Vector Fill Color").setValue(props.color);
              } else {
                // Default red fill
                fill.property("ADBE Vector Fill Color").setValue([1, 0, 0]);
              }
              
              // Initial position (will be overridden by general properties if specified)
              if (!props.position) {
                layer.property("Position").setValue([comp.width/2, comp.height/2]);
              }
              break;
              
            case "null":
              layer = comp.layers.addNull();
              layer.name = layerDef.name;
              break;
              
            case "adjustment":
              layer = comp.layers.addSolid([0, 0, 0], layerDef.name, comp.width, comp.height, 1);
              layer.adjustmentLayer = true;
              break;
              
            default:
              throw new Error("Unknown layer type: " + type);
          }
          
          // Apply initial properties if provided
          if (layerDef.properties) {
            var props = layerDef.properties;
            if (props.position) layer.property("Position").setValue(props.position);
            if (props.scale) layer.property("Scale").setValue(props.scale);
            if (props.rotation) layer.property("Rotation").setValue(props.rotation);
            if (props.opacity) layer.property("Opacity").setValue(props.opacity);
          }
          
          results.push({
            success: true,
            name: layer.name,
            index: layer.index,
            type: type
          });
          
        } catch (e) {
          results.push({
            success: false,
            error: e.toString(),
            name: layerDef.name
          });
        }
      }
      
      var successCount = 0;
      for (var i = 0; i < results.length; i++) {
        if (results[i].success) successCount++;
      }
      
      return {
        success: true,
        data: {
          total: layers.length,
          successful: successCount,
          results: results
        }
      };
    `,
    
    batchModifyLayerProperties: (params: { compId: number, modifications: any[] }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var results = [];
      var modifications = ${JSON.stringify(params.modifications)};
      
      for (var i = 0; i < modifications.length; i++) {
        var mod = modifications[i];
        try {
          var layer = comp.layer(mod.layerIndex);
          if (!layer) {
            throw new Error("Layer at index " + mod.layerIndex + " not found");
          }
          
          // Apply properties
          var props = mod.properties;
          if (props.position) layer.property("Position").setValue(props.position);
          if (props.scale) layer.property("Scale").setValue(props.scale);
          if (typeof props.rotation !== 'undefined') layer.property("Rotation").setValue(props.rotation);
          if (typeof props.opacity !== 'undefined') layer.property("Opacity").setValue(props.opacity);
          
          results.push({
            success: true,
            layerIndex: mod.layerIndex,
            layerName: layer.name,
            appliedProperties: Object.keys(props)
          });
          
        } catch (e) {
          results.push({
            success: false,
            layerIndex: mod.layerIndex,
            error: e.toString()
          });
        }
      }
      
      var successCount = 0;
      for (var i = 0; i < results.length; i++) {
        if (results[i].success) successCount++;
      }
      
      return {
        success: true,
        data: {
          total: modifications.length,
          successful: successCount,
          results: results
        }
      };
    `,
    
    // System/diagnostic commands
    pingCommand: () => `
      var now = new Date();
      var timestamp = now.getFullYear() + '-' + 
                     ('0' + (now.getMonth() + 1)).slice(-2) + '-' + 
                     ('0' + now.getDate()).slice(-2) + 'T' + 
                     ('0' + now.getHours()).slice(-2) + ':' + 
                     ('0' + now.getMinutes()).slice(-2) + ':' + 
                     ('0' + now.getSeconds()).slice(-2) + '.' + 
                     ('00' + now.getMilliseconds()).slice(-3) + 'Z';
      
      return {
        success: true,
        data: {
          message: "Pong! CEP extension is active and processing commands.",
          timestamp: timestamp,
          aeVersion: app.version,
          buildNumber: app.buildNumber
        }
      };
    `,
    
    closeProject: (params: { saveChanges?: boolean }) => `
      if (app.project) {
        if (${params.saveChanges ? params.saveChanges : false}) {
          app.project.save();
        }
        app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        return {
          success: true,
          data: { message: "Project closed" }
        };
      }
      throw new Error("No project to close");
    `,
    
    importFootage: (params: { filePath: string; folderName?: string }) => `
      if (!app.project) {
        throw new Error("No project is open");
      }
      
      var file = new File("${this.escapeString(params.filePath)}");
      if (!file.exists) {
        throw new Error("File not found: " + file.fsName);
      }
      
      var importOptions = new ImportOptions(file);
      var footage = app.project.importFile(importOptions);
      
      ${params.folderName ? `
      // Find or create folder
      var folder = null;
      for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof FolderItem && item.name === "${this.escapeString(params.folderName)}") {
          folder = item;
          break;
        }
      }
      if (!folder) {
        folder = app.project.items.addFolder("${this.escapeString(params.folderName)}");
      }
      footage.parentFolder = folder;
      ` : ''}
      
      return {
        success: true,
        data: {
          id: footage.id,
          name: footage.name,
          width: footage.width ? footage.width : 0,
          height: footage.height ? footage.height : 0,
          duration: footage.duration ? footage.duration : 0
        }
      };
    `,
    
    pauseRender: () => `
      app.project.renderQueue.pauseRendering();
      return {
        success: true,
        data: { message: "Render paused" }
      };
    `,
    
    stopRender: () => `
      app.project.renderQueue.stopRendering();
      return {
        success: true,
        data: { message: "Render stopped" }
      };
    `,
    
    clearRenderQueue: (params: { confirmClear: boolean }) => `
      if (!${params.confirmClear}) {
        throw new Error("confirmClear must be true to clear the render queue");
      }
      
      var rq = app.project.renderQueue;
      while (rq.numItems > 0) {
        rq.item(rq.numItems).remove();
      }
      
      return {
        success: true,
        data: { message: "Render queue cleared" }
      };
    `,
    
    exportFrame: (params: { compId: number; time: number; outputPath: string }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      comp.time = ${params.time};
      comp.saveFrameToPng(comp.time, new File("${this.escapeString(params.outputPath)}"));
      
      return {
        success: true,
        data: {
          outputPath: "${this.escapeString(params.outputPath)}",
          time: ${params.time}
        }
      };
    `,
    
    batchRender: (params: { compIds: number[]; outputDirectory: string; outputFormat?: string; outputModule?: string }) => `
      var results = [];
      var format = "${params.outputFormat ? params.outputFormat : 'mp4'}";
      
      for (var i = 0; i < ${JSON.stringify(params.compIds)}.length; i++) {
        var compId = ${JSON.stringify(params.compIds)}[i];
        var comp = app.project.itemByID(compId);
        
        if (!comp || !(comp instanceof CompItem)) {
          results.push({
            compId: compId,
            success: false,
            error: "Composition not found"
          });
          continue;
        }
        
        var outputPath = "${this.escapeString(params.outputDirectory)}" + "/" + comp.name + "." + format;
        var rqItem = app.project.renderQueue.items.add(comp);
        
        ${params.outputModule ? `rqItem.outputModule(1).applyTemplate("${this.escapeString(params.outputModule)}");` : ''}
        
        rqItem.outputModule(1).file = new File(outputPath);
        
        results.push({
          compId: compId,
          success: true,
          queueIndex: rqItem.index,
          outputPath: outputPath
        });
      }
      
      var queuedCount = 0;
      var failedCount = 0;
      for (var i = 0; i < results.length; i++) {
        if (results[i].success) {
          queuedCount++;
        } else {
          failedCount++;
        }
      }
      
      return {
        success: true,
        data: {
          queued: queuedCount,
          failed: failedCount,
          results: results
        }
      };
    `,
    
    duplicateComposition: (params: { compId: number; newName: string }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var duplicate = comp.duplicate();
      duplicate.name = "${this.escapeString(params.newName)}";
      
      return {
        success: true,
        data: {
          id: duplicate.id,
          name: duplicate.name,
          width: duplicate.width,
          height: duplicate.height,
          duration: duplicate.duration,
          frameRate: duplicate.frameRate
        }
      };
    `,
    
    deleteComposition: (params: { compId: number; confirmDelete: boolean }) => `
      if (!${params.confirmDelete}) {
        throw new Error("confirmDelete must be true to delete a composition");
      }
      
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var compName = comp.name;
      comp.remove();
      
      return {
        success: true,
        data: { message: "Composition '" + compName + "' deleted" }
      };
    `,

    // Advanced Layer Tools
    addNullLayer: (params: { compId: number; name?: string; is3D?: boolean }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var nullLayer = comp.layers.addNull();
      nullLayer.name = "${this.escapeString(params.name || 'Null Object')}";
      
      if (${params.is3D || false}) {
        nullLayer.threeDLayer = true;
      }
      
      return {
        success: true,
        data: {
          layerIndex: nullLayer.index,
          name: nullLayer.name,
          is3D: nullLayer.threeDLayer
        }
      };
    `,

    addAdjustmentLayer: (params: { compId: number; name?: string }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var adjustmentLayer = comp.layers.addSolid([0, 0, 0], "${this.escapeString(params.name || 'Adjustment Layer')}", comp.width, comp.height, 1);
      adjustmentLayer.adjustmentLayer = true;
      
      return {
        success: true,
        data: {
          layerIndex: adjustmentLayer.index,
          name: adjustmentLayer.name
        }
      };
    `,

    addCameraLayer: (params: { compId: number; name?: string; preset?: string; focalLength?: number }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var cameraName = "${this.escapeString(params.name || 'Camera')}";
      var cameraLayer;
      
      if (${params.preset === 'Custom' && params.focalLength}) {
        // Create camera with custom focal length
        var centerPoint = [comp.width/2, comp.height/2];
        cameraLayer = comp.layers.addCamera(cameraName, centerPoint);
        cameraLayer.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(${params.focalLength});
      } else {
        // Use preset
        var preset = "${this.escapeString(params.preset || '50mm')}";
        var centerPoint = [comp.width/2, comp.height/2];
        cameraLayer = comp.layers.addCamera(cameraName, centerPoint);
        
        // Set focal length based on preset
        var focalLengths = {
          "15mm": 15,
          "20mm": 20,
          "24mm": 24,
          "28mm": 28,
          "35mm": 35,
          "50mm": 50,
          "80mm": 80,
          "135mm": 135,
          "200mm": 200
        };
        
        if (focalLengths[preset]) {
          cameraLayer.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(focalLengths[preset]);
        }
      }
      
      return {
        success: true,
        data: {
          layerIndex: cameraLayer.index,
          name: cameraLayer.name
        }
      };
    `,

    addLightLayer: (params: { compId: number; name?: string; lightType?: string; color?: number[]; intensity?: number }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var lightName = "${this.escapeString(params.name || 'Light')}";
      var centerPoint = [comp.width/2, comp.height/2];
      var lightLayer = comp.layers.addLight(lightName, centerPoint);
      
      // Set light type
      var lightType = "${params.lightType || 'point'}";
      var lightTypeValues = {
        "parallel": 1,
        "spot": 2,
        "point": 3,
        "ambient": 4
      };
      
      if (lightTypeValues[lightType]) {
        lightLayer.property("ADBE Light Options Group").property("ADBE Light Type").setValue(lightTypeValues[lightType]);
      }
      
      // Set color
      var color = ${JSON.stringify(params.color || [1, 1, 1])};
      lightLayer.property("ADBE Light Options Group").property("ADBE Light Color").setValue(color);
      
      // Set intensity
      var intensity = ${params.intensity || 100};
      lightLayer.property("ADBE Light Options Group").property("ADBE Light Intensity").setValue(intensity);
      
      return {
        success: true,
        data: {
          layerIndex: lightLayer.index,
          name: lightLayer.name,
          lightType: lightType
        }
      };
    `,

    setLayerParent: (params: { compId: number; childLayerIndex: number; parentLayerIndex?: number }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var childLayer = comp.layer(${params.childLayerIndex});
      if (!childLayer) {
        throw new Error("Child layer not found");
      }
      
      ${params.parentLayerIndex != null ? `
        var parentLayer = comp.layer(${params.parentLayerIndex});
        if (!parentLayer) {
          throw new Error("Parent layer not found");
        }
        childLayer.parent = parentLayer;
      ` : `
        childLayer.parent = null;
      `}
      
      return {
        success: true,
        data: {
          childLayerIndex: childLayer.index,
          parentLayerIndex: childLayer.parent ? childLayer.parent.index : null
        }
      };
    `,

    setLayerBlendMode: (params: { compId: number; layerIndex: number; blendMode: string }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      var blendModes = {
        "normal": BlendingMode.NORMAL,
        "dissolve": BlendingMode.DISSOLVE,
        "darken": BlendingMode.DARKEN,
        "multiply": BlendingMode.MULTIPLY,
        "colorBurn": BlendingMode.COLOR_BURN,
        "linearBurn": BlendingMode.LINEAR_BURN,
        "darkerColor": BlendingMode.DARKER_COLOR,
        "add": BlendingMode.ADD,
        "lighten": BlendingMode.LIGHTEN,
        "screen": BlendingMode.SCREEN,
        "colorDodge": BlendingMode.COLOR_DODGE,
        "linearDodge": BlendingMode.LINEAR_DODGE,
        "lighterColor": BlendingMode.LIGHTER_COLOR,
        "overlay": BlendingMode.OVERLAY,
        "softLight": BlendingMode.SOFT_LIGHT,
        "hardLight": BlendingMode.HARD_LIGHT,
        "linearLight": BlendingMode.LINEAR_LIGHT,
        "vividLight": BlendingMode.VIVID_LIGHT,
        "pinLight": BlendingMode.PIN_LIGHT,
        "hardMix": BlendingMode.HARD_MIX,
        "difference": BlendingMode.DIFFERENCE,
        "exclusion": BlendingMode.EXCLUSION,
        "subtract": BlendingMode.SUBTRACT,
        "divide": BlendingMode.DIVIDE,
        "hue": BlendingMode.HUE,
        "saturation": BlendingMode.SATURATION,
        "color": BlendingMode.COLOR,
        "luminosity": BlendingMode.LUMINOSITY
      };
      
      var mode = blendModes["${params.blendMode}"];
      if (!mode) {
        throw new Error("Invalid blend mode: ${params.blendMode}");
      }
      
      layer.blendingMode = mode;
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          blendMode: "${params.blendMode}"
        }
      };
    `,

    setTrackMatte: (params: { compId: number; layerIndex: number; matteType: string }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      var trackMatteTypes = {
        "none": TrackMatteType.NO_TRACK_MATTE,
        "alpha": TrackMatteType.ALPHA,
        "alphaInverted": TrackMatteType.ALPHA_INVERTED,
        "luma": TrackMatteType.LUMA,
        "lumaInverted": TrackMatteType.LUMA_INVERTED
      };
      
      var matteType = trackMatteTypes["${params.matteType}"];
      if (matteType === undefined) {
        throw new Error("Invalid track matte type: ${params.matteType}");
      }
      
      layer.trackMatteType = matteType;
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          trackMatteType: "${params.matteType}"
        }
      };
    `,

    setLayer3d: (params: { compId: number; layerIndex: number; is3D: boolean }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      if (layer instanceof CameraLayer || layer instanceof LightLayer) {
        throw new Error("Cannot change 3D state of camera or light layers");
      }
      
      layer.threeDLayer = ${params.is3D};
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          is3D: layer.threeDLayer
        }
      };
    `,

    modifyLayer3dProperties: (params: { compId: number; layerIndex: number; properties: any }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      if (!layer.threeDLayer && !(layer instanceof CameraLayer) && !(layer instanceof LightLayer)) {
        throw new Error("Layer is not 3D");
      }
      
      var props = ${JSON.stringify(params.properties)};
      
      // Set orientation
      if (props.orientation) {
        layer.property("ADBE Transform Group").property("ADBE Orientation").setValue(props.orientation);
      }
      
      // Set individual rotations
      if (props.xRotation !== undefined) {
        layer.property("ADBE Transform Group").property("ADBE Rotate X").setValue(props.xRotation);
      }
      if (props.yRotation !== undefined) {
        layer.property("ADBE Transform Group").property("ADBE Rotate Y").setValue(props.yRotation);
      }
      if (props.zRotation !== undefined) {
        layer.property("ADBE Transform Group").property("ADBE Rotate Z").setValue(props.zRotation);
      }
      
      // Set material options
      if (props.materialOptions && layer instanceof AVLayer) {
        var matOpts = props.materialOptions;
        var materialGroup = layer.property("ADBE Material Options Group");
        
        if (matOpts.castsShadows !== undefined) {
          materialGroup.property("ADBE Casts Shadows").setValue(matOpts.castsShadows ? 1 : 0);
        }
        if (matOpts.acceptsShadows !== undefined) {
          materialGroup.property("ADBE Accepts Shadows").setValue(matOpts.acceptsShadows ? 1 : 0);
        }
        if (matOpts.acceptsLights !== undefined) {
          materialGroup.property("ADBE Accepts Lights").setValue(matOpts.acceptsLights ? 1 : 0);
        }
        if (matOpts.ambientCoefficient !== undefined) {
          materialGroup.property("ADBE Ambient Coefficient").setValue(matOpts.ambientCoefficient);
        }
        if (matOpts.diffuseCoefficient !== undefined) {
          materialGroup.property("ADBE Diffuse Coefficient").setValue(matOpts.diffuseCoefficient);
        }
        if (matOpts.specularCoefficient !== undefined) {
          materialGroup.property("ADBE Specular Coefficient").setValue(matOpts.specularCoefficient);
        }
        if (matOpts.shininess !== undefined) {
          materialGroup.property("ADBE Specular Shininess").setValue(matOpts.shininess);
        }
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          is3D: layer.threeDLayer
        }
      };
    `,

    setLayerQuality: (params: { compId: number; layerIndex: number; quality: string }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof AVLayer)) {
        throw new Error("Layer not found or not an AV layer");
      }
      
      var qualityValues = {
        "best": LayerQuality.BEST,
        "draft": LayerQuality.DRAFT,
        "wireframe": LayerQuality.WIREFRAME
      };
      
      var quality = qualityValues["${params.quality}"];
      if (!quality) {
        throw new Error("Invalid quality: ${params.quality}");
      }
      
      layer.quality = quality;
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          quality: "${params.quality}"
        }
      };
    `,

    setMotionBlur: (params: { compId: number; layerIndex: number; enabled: boolean; adjustmentLayer?: boolean }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof AVLayer)) {
        throw new Error("Layer not found or not an AV layer");
      }
      
      layer.motionBlur = ${params.enabled};
      
      if (${params.adjustmentLayer === true} && layer.adjustmentLayer) {
        // Motion blur for adjustment layers affects layers below
        layer.motionBlur = ${params.enabled};
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          motionBlur: layer.motionBlur
        }
      };
    `,

    setLayerVisibility: (params: { compId: number; layerIndex: number; visible?: boolean; solo?: boolean; shy?: boolean; locked?: boolean }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      if (${params.visible !== undefined}) {
        layer.enabled = ${params.visible};
      }
      
      if (${params.solo !== undefined}) {
        layer.solo = ${params.solo};
      }
      
      if (${params.shy !== undefined}) {
        layer.shy = ${params.shy};
      }
      
      if (${params.locked !== undefined}) {
        layer.locked = ${params.locked};
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          visible: layer.enabled,
          solo: layer.solo,
          shy: layer.shy,
          locked: layer.locked
        }
      };
    `,

    setTimeRemapping: (params: { compId: number; layerIndex: number; enabled: boolean }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof AVLayer)) {
        throw new Error("Layer not found or not an AV layer");
      }
      
      if (${params.enabled}) {
        if (!layer.timeRemapEnabled) {
          layer.timeRemapEnabled = true;
        }
      } else {
        if (layer.timeRemapEnabled) {
          layer.timeRemapEnabled = false;
        }
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          timeRemapEnabled: layer.timeRemapEnabled
        }
      };
    `,

    // Expression Tools
    setExpression: (params: { compId: number; layerIndex: number; propertyPath: string; expression: string; enabled?: boolean }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // Navigate property path
      var propertyPath = "${this.escapeString(params.propertyPath)}";
      var pathParts = propertyPath.split(".");
      var property = layer;
      
      for (var i = 0; i < pathParts.length; i++) {
        var part = pathParts[i];
        // Handle common property name variations
        if (part === "Transform") part = "ADBE Transform Group";
        else if (part === "Position") part = "ADBE Position";
        else if (part === "Scale") part = "ADBE Scale";
        else if (part === "Rotation") part = "ADBE Rotate Z";
        else if (part === "Opacity") part = "ADBE Opacity";
        else if (part === "Effects") part = "ADBE Effect Parade";
        
        property = property.property(part);
        if (!property) {
          throw new Error("Property not found: " + propertyPath);
        }
      }
      
      if (!property.canSetExpression) {
        throw new Error("Cannot set expression on this property");
      }
      
      property.expression = "${this.escapeString(params.expression)}";
      
      if (${params.enabled === false}) {
        property.expressionEnabled = false;
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          propertyPath: propertyPath,
          expression: property.expression,
          enabled: property.expressionEnabled
        }
      };
    `,

    getExpression: (params: { compId: number; layerIndex: number; propertyPath: string }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // Navigate property path
      var propertyPath = "${this.escapeString(params.propertyPath)}";
      var pathParts = propertyPath.split(".");
      var property = layer;
      
      for (var i = 0; i < pathParts.length; i++) {
        var part = pathParts[i];
        // Handle common property name variations
        if (part === "Transform") part = "ADBE Transform Group";
        else if (part === "Position") part = "ADBE Position";
        else if (part === "Scale") part = "ADBE Scale";
        else if (part === "Rotation") part = "ADBE Rotate Z";
        else if (part === "Opacity") part = "ADBE Opacity";
        else if (part === "Effects") part = "ADBE Effect Parade";
        
        property = property.property(part);
        if (!property) {
          throw new Error("Property not found: " + propertyPath);
        }
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          propertyPath: propertyPath,
          expression: property.expression,
          enabled: property.expressionEnabled,
          hasExpression: property.expression !== "",
          canSetExpression: property.canSetExpression
        }
      };
    `,

    removeExpression: (params: { compId: number; layerIndex: number; propertyPath: string }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // Navigate property path
      var propertyPath = "${this.escapeString(params.propertyPath)}";
      var pathParts = propertyPath.split(".");
      var property = layer;
      
      for (var i = 0; i < pathParts.length; i++) {
        var part = pathParts[i];
        // Handle common property name variations
        if (part === "Transform") part = "ADBE Transform Group";
        else if (part === "Position") part = "ADBE Position";
        else if (part === "Scale") part = "ADBE Scale";
        else if (part === "Rotation") part = "ADBE Rotate Z";
        else if (part === "Opacity") part = "ADBE Opacity";
        else if (part === "Effects") part = "ADBE Effect Parade";
        
        property = property.property(part);
        if (!property) {
          throw new Error("Property not found: " + propertyPath);
        }
      }
      
      property.expression = "";
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          propertyPath: propertyPath
        }
      };
    `,

    enableExpression: (params: { compId: number; layerIndex: number; propertyPath: string; enabled: boolean }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // Navigate property path
      var propertyPath = "${this.escapeString(params.propertyPath)}";
      var pathParts = propertyPath.split(".");
      var property = layer;
      
      for (var i = 0; i < pathParts.length; i++) {
        var part = pathParts[i];
        // Handle common property name variations
        if (part === "Transform") part = "ADBE Transform Group";
        else if (part === "Position") part = "ADBE Position";
        else if (part === "Scale") part = "ADBE Scale";
        else if (part === "Rotation") part = "ADBE Rotate Z";
        else if (part === "Opacity") part = "ADBE Opacity";
        else if (part === "Effects") part = "ADBE Effect Parade";
        
        property = property.property(part);
        if (!property) {
          throw new Error("Property not found: " + propertyPath);
        }
      }
      
      if (!property.expression) {
        throw new Error("Property has no expression");
      }
      
      property.expressionEnabled = ${params.enabled};
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          propertyPath: propertyPath,
          enabled: property.expressionEnabled
        }
      };
    `,

    batchSetExpressions: (params: { compId: number; expressions: any[] }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var results = [];
      var expressions = ${JSON.stringify(params.expressions)};
      
      for (var i = 0; i < expressions.length; i++) {
        var expr = expressions[i];
        try {
          var layer = comp.layer(expr.layerIndex);
          if (!layer) {
            throw new Error("Layer not found");
          }
          
          // Navigate property path
          var pathParts = expr.propertyPath.split(".");
          var property = layer;
          
          for (var j = 0; j < pathParts.length; j++) {
            var part = pathParts[j];
            // Handle common property name variations
            if (part === "Transform") part = "ADBE Transform Group";
            else if (part === "Position") part = "ADBE Position";
            else if (part === "Scale") part = "ADBE Scale";
            else if (part === "Rotation") part = "ADBE Rotate Z";
            else if (part === "Opacity") part = "ADBE Opacity";
            else if (part === "Effects") part = "ADBE Effect Parade";
            
            property = property.property(part);
            if (!property) {
              throw new Error("Property not found: " + expr.propertyPath);
            }
          }
          
          if (!property.canSetExpression) {
            throw new Error("Cannot set expression on this property");
          }
          
          property.expression = expr.expression;
          
          if (expr.enabled === false) {
            property.expressionEnabled = false;
          }
          
          results.push({
            success: true,
            layerIndex: expr.layerIndex,
            propertyPath: expr.propertyPath
          });
          
        } catch (e) {
          results.push({
            success: false,
            error: e.toString(),
            layerIndex: expr.layerIndex,
            propertyPath: expr.propertyPath
          });
        }
      }
      
      var successCount = 0;
      for (var i = 0; i < results.length; i++) {
        if (results[i].success) successCount++;
      }
      
      return {
        success: true,
        data: {
          total: expressions.length,
          successful: successCount,
          results: results
        }
      };
    `,

    addExpressionControl: (params: { compId: number; layerIndex: number; controlType: string; name: string; value?: any }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      var effectName;
      switch("${params.controlType}") {
        case "slider":
          effectName = "ADBE Slider Control";
          break;
        case "point":
          effectName = "ADBE Point Control";
          break;
        case "angle":
          effectName = "ADBE Angle Control";
          break;
        case "checkbox":
          effectName = "ADBE Checkbox Control";
          break;
        case "color":
          effectName = "ADBE Color Control";
          break;
        case "layer":
          effectName = "ADBE Layer Control";
          break;
        case "point3d":
          effectName = "ADBE Point3D Control";
          break;
        default:
          throw new Error("Unknown control type: ${params.controlType}");
      }
      
      var effect = layer.Effects.addProperty(effectName);
      effect.name = "${this.escapeString(params.name)}";
      
      // Set initial value if provided
      if (${params.value !== undefined}) {
        var value = ${JSON.stringify(params.value)};
        var controlProp = effect.property(1);
        
        if (controlProp && controlProp.canSetValue) {
          controlProp.setValue(value);
        }
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          effectIndex: effect.propertyIndex,
          effectName: effect.name,
          controlType: "${params.controlType}"
        }
      };
    `,

    linkPropertiesWithExpression: (params: { compId: number; sourceLayer: number; sourceProperty: string; targetLayer: number; targetProperty: string; linkType?: string; offsetValue?: any; multiplier?: number; customExpression?: string }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var sourceLayer = comp.layer(${params.sourceLayer});
      var targetLayer = comp.layer(${params.targetLayer});
      
      if (!sourceLayer || !targetLayer) {
        throw new Error("Source or target layer not found");
      }
      
      // Navigate to target property
      var targetPath = "${this.escapeString(params.targetProperty)}";
      var targetParts = targetPath.split(".");
      var targetProp = targetLayer;
      
      for (var i = 0; i < targetParts.length; i++) {
        var part = targetParts[i];
        // Handle common property name variations
        if (part === "Transform") part = "ADBE Transform Group";
        else if (part === "Position") part = "ADBE Position";
        else if (part === "Scale") part = "ADBE Scale";
        else if (part === "Rotation") part = "ADBE Rotate Z";
        else if (part === "Opacity") part = "ADBE Opacity";
        else if (part === "Effects") part = "ADBE Effect Parade";
        
        targetProp = targetProp.property(part);
        if (!targetProp) {
          throw new Error("Target property not found: " + targetPath);
        }
      }
      
      var linkType = "${params.linkType || 'direct'}";
      var expression = "";
      var sourceRef = "thisComp.layer(" + ${params.sourceLayer} + ").";
      
      // Build source property reference
      var sourcePath = "${this.escapeString(params.sourceProperty)}".split(".");
      for (var i = 0; i < sourcePath.length; i++) {
        if (sourcePath[i] === "Transform") {
          sourceRef += "transform.";
        } else {
          sourceRef += sourcePath[i].toLowerCase() + (i < sourcePath.length - 1 ? "." : "");
        }
      }
      
      switch(linkType) {
        case "direct":
          expression = sourceRef;
          break;
        case "inverse":
          expression = "-" + sourceRef;
          break;
        case "offset":
          var offset = ${JSON.stringify(params.offsetValue || 0)};
          if (typeof offset === "number") {
            expression = sourceRef + " + " + offset;
          } else {
            expression = sourceRef + " + [" + offset.join(", ") + "]";
          }
          break;
        case "multiply":
          expression = sourceRef + " * " + ${params.multiplier || 1};
          break;
        case "custom":
          expression = "${this.escapeString(params.customExpression || '')}";
          break;
        default:
          expression = sourceRef;
      }
      
      targetProp.expression = expression;
      
      return {
        success: true,
        data: {
          sourceLayer: ${params.sourceLayer},
          sourceProperty: "${params.sourceProperty}",
          targetLayer: ${params.targetLayer},
          targetProperty: "${params.targetProperty}",
          expression: expression
        }
      };
    `,

    addWiggleExpression: (params: { compId: number; layerIndex: number; propertyPath: string; frequency?: number; amplitude?: number; octaves?: number; ampMultiplier?: number; time?: number }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // Navigate property path
      var propertyPath = "${this.escapeString(params.propertyPath)}";
      var pathParts = propertyPath.split(".");
      var property = layer;
      
      for (var i = 0; i < pathParts.length; i++) {
        var part = pathParts[i];
        // Handle common property name variations
        if (part === "Transform") part = "ADBE Transform Group";
        else if (part === "Position") part = "ADBE Position";
        else if (part === "Scale") part = "ADBE Scale";
        else if (part === "Rotation") part = "ADBE Rotate Z";
        else if (part === "Opacity") part = "ADBE Opacity";
        else if (part === "Effects") part = "ADBE Effect Parade";
        
        property = property.property(part);
        if (!property) {
          throw new Error("Property not found: " + propertyPath);
        }
      }
      
      var freq = ${params.frequency || 5};
      var amp = ${params.amplitude || 50};
      var expression = "wiggle(" + freq + ", " + amp;
      
      if (${params.octaves !== undefined || params.ampMultiplier !== undefined || params.time !== undefined}) {
        var octaves = ${params.octaves || 1};
        var ampMult = ${params.ampMultiplier || 0.5};
        expression += ", " + octaves + ", " + ampMult;
        
        if (${params.time !== undefined}) {
          expression += ", " + ${params.time};
        }
      }
      
      expression += ")";
      property.expression = expression;
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          propertyPath: propertyPath,
          expression: expression
        }
      };
    `,

    addLoopExpression: (params: { compId: number; layerIndex: number; propertyPath: string; loopType?: string; numKeyframes?: number }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // Navigate property path
      var propertyPath = "${this.escapeString(params.propertyPath)}";
      var pathParts = propertyPath.split(".");
      var property = layer;
      
      for (var i = 0; i < pathParts.length; i++) {
        var part = pathParts[i];
        // Handle common property name variations
        if (part === "Transform") part = "ADBE Transform Group";
        else if (part === "Position") part = "ADBE Position";
        else if (part === "Scale") part = "ADBE Scale";
        else if (part === "Rotation") part = "ADBE Rotate Z";
        else if (part === "Opacity") part = "ADBE Opacity";
        else if (part === "Effects") part = "ADBE Effect Parade";
        
        property = property.property(part);
        if (!property) {
          throw new Error("Property not found: " + propertyPath);
        }
      }
      
      var loopType = "${params.loopType || 'cycle'}";
      var numKeys = ${params.numKeyframes || 0};
      var expression = "";
      
      switch(loopType) {
        case "cycle":
          expression = "loopOut(\\"cycle\\"" + (numKeys > 0 ? ", " + numKeys : "") + ")";
          break;
        case "pingpong":
          expression = "loopOut(\\"pingpong\\"" + (numKeys > 0 ? ", " + numKeys : "") + ")";
          break;
        case "offset":
          expression = "loopOut(\\"offset\\"" + (numKeys > 0 ? ", " + numKeys : "") + ")";
          break;
        case "continue":
          expression = "loopOut(\\"continue\\"" + (numKeys > 0 ? ", " + numKeys : "") + ")";
          break;
        default:
          expression = "loopOut(\\"cycle\\")";
      }
      
      property.expression = expression;
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          propertyPath: propertyPath,
          expression: expression,
          loopType: loopType
        }
      };
    `,

    executeScript: (params: { script: string; wrapInTransaction?: boolean; undoGroupName?: string }) => `
      ${params.wrapInTransaction !== false ? `app.beginUndoGroup("${this.escapeString(params.undoGroupName || 'Script Execution')}");` : ''}
      
      try {
        ${params.script}
        
        ${params.wrapInTransaction !== false ? 'app.endUndoGroup();' : ''}
        
        return {
          success: true,
          data: {
            message: "Script executed successfully"
          }
        };
      } catch (error) {
        ${params.wrapInTransaction !== false ? 'app.endUndoGroup();' : ''}
        throw error;
      }
    `,

    getLayerInfo: (params: { compId: number; layerIndex: number }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      var info = {
        index: layer.index,
        name: layer.name,
        locked: layer.locked,
        shy: layer.shy,
        solo: layer.solo,
        enabled: layer.enabled,
        hasVideo: layer.hasVideo,
        hasAudio: layer.hasAudio,
        inPoint: layer.inPoint,
        outPoint: layer.outPoint,
        startTime: layer.startTime,
        stretch: layer.stretch
      };
      
      // Add layer type
      if (layer instanceof TextLayer) {
        info.type = "text";
      } else if (layer instanceof ShapeLayer) {
        info.type = "shape";
      } else if (layer instanceof CameraLayer) {
        info.type = "camera";
      } else if (layer instanceof LightLayer) {
        info.type = "light";
      } else if (layer instanceof AVLayer) {
        if (layer.adjustmentLayer) {
          info.type = "adjustment";
        } else if (layer.nullLayer) {
          info.type = "null";
        } else if (layer.source instanceof SolidSource) {
          info.type = "solid";
        } else {
          info.type = "av";
        }
      } else {
        info.type = "unknown";
      }
      
      // Add AV layer specific properties
      if (layer instanceof AVLayer) {
        info.adjustmentLayer = layer.adjustmentLayer;
        info.nullLayer = layer.nullLayer;
        info.threeDLayer = layer.threeDLayer;
        info.blendingMode = layer.blendingMode.toString();
        info.trackMatteType = layer.trackMatteType.toString();
        info.quality = layer.quality.toString();
        info.motionBlur = layer.motionBlur;
        info.timeRemapEnabled = layer.timeRemapEnabled;
        
        if (layer.parent) {
          info.parentIndex = layer.parent.index;
        }
      }
      
      // Add transform properties
      var transform = layer.property("ADBE Transform Group");
      if (transform) {
        info.position = transform.property("ADBE Position").value;
        info.scale = transform.property("ADBE Scale").value;
        info.rotation = transform.property("ADBE Rotate Z").value;
        info.opacity = transform.property("ADBE Opacity").value;
        
        if (layer.threeDLayer) {
          info.orientation = transform.property("ADBE Orientation").value;
          info.xRotation = transform.property("ADBE Rotate X").value;
          info.yRotation = transform.property("ADBE Rotate Y").value;
        }
      }
      
      return {
        success: true,
        data: info
      };
    `,

    // Mask Tools
    addMask: (params: { compId: number; layerIndex: number; name?: string; maskShape?: any }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof AVLayer)) {
        throw new Error("Layer not found or cannot have masks");
      }
      
      var mask = layer.Masks.addProperty("ADBE Mask Atom");
      mask.name = "${this.escapeString(params.name || 'Mask')}";
      
      if (${params.maskShape != null}) {
        var shape = ${JSON.stringify(params.maskShape)};
        var maskShape = mask.property("ADBE Mask Shape");
        
        if (shape.vertices) {
          var myShape = new Shape();
          myShape.vertices = shape.vertices;
          
          if (shape.inTangents) {
            myShape.inTangents = shape.inTangents;
          }
          if (shape.outTangents) {
            myShape.outTangents = shape.outTangents;
          }
          
          myShape.closed = shape.closed !== false;
          maskShape.setValue(myShape);
        }
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          maskIndex: mask.propertyIndex,
          maskName: mask.name
        }
      };
    `,

    addRectangularMask: (params: { compId: number; layerIndex: number; name?: string; bounds: any; roundness?: number }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof AVLayer)) {
        throw new Error("Layer not found or cannot have masks");
      }
      
      var mask = layer.Masks.addProperty("ADBE Mask Atom");
      mask.name = "${this.escapeString(params.name || 'Rectangle Mask')}";
      
      var bounds = ${JSON.stringify(params.bounds)};
      var roundness = ${params.roundness || 0};
      
      // Create rectangle vertices
      var vertices = [
        [bounds.left, bounds.top],
        [bounds.left + bounds.width, bounds.top],
        [bounds.left + bounds.width, bounds.top + bounds.height],
        [bounds.left, bounds.top + bounds.height]
      ];
      
      var myShape = new Shape();
      myShape.vertices = vertices;
      myShape.closed = true;
      
      // Handle roundness by adjusting tangents
      if (roundness > 0) {
        var tangentLength = roundness * 0.5523; // Magic number for circular bezier
        myShape.inTangents = [
          [-tangentLength, 0],
          [0, -tangentLength],
          [tangentLength, 0],
          [0, tangentLength]
        ];
        myShape.outTangents = [
          [0, -tangentLength],
          [tangentLength, 0],
          [0, tangentLength],
          [-tangentLength, 0]
        ];
      }
      
      mask.property("ADBE Mask Shape").setValue(myShape);
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          maskIndex: mask.propertyIndex,
          maskName: mask.name
        }
      };
    `,

    addEllipticalMask: (params: { compId: number; layerIndex: number; name?: string; center: number[]; radius: number[] }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof AVLayer)) {
        throw new Error("Layer not found or cannot have masks");
      }
      
      var mask = layer.Masks.addProperty("ADBE Mask Atom");
      mask.name = "${this.escapeString(params.name || 'Ellipse Mask')}";
      
      var center = ${JSON.stringify(params.center)};
      var radius = ${JSON.stringify(params.radius)};
      
      // Create ellipse using bezier approximation
      var c = 0.5523; // Magic number for circular bezier curves
      
      // Four vertices for ellipse
      var vertices = [
        [center[0], center[1] - radius[1]], // top
        [center[0] + radius[0], center[1]], // right
        [center[0], center[1] + radius[1]], // bottom
        [center[0] - radius[0], center[1]]  // left
      ];
      
      // Tangents for smooth ellipse
      var inTangents = [
        [-radius[0] * c, 0],
        [0, -radius[1] * c],
        [radius[0] * c, 0],
        [0, radius[1] * c]
      ];
      
      var outTangents = [
        [radius[0] * c, 0],
        [0, radius[1] * c],
        [-radius[0] * c, 0],
        [0, -radius[1] * c]
      ];
      
      var myShape = new Shape();
      myShape.vertices = vertices;
      myShape.inTangents = inTangents;
      myShape.outTangents = outTangents;
      myShape.closed = true;
      
      mask.property("ADBE Mask Shape").setValue(myShape);
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          maskIndex: mask.propertyIndex,
          maskName: mask.name
        }
      };
    `,

    modifyMaskPath: (params: { compId: number; layerIndex: number; maskIndex: number; maskShape: any; setKeyframe?: boolean }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof AVLayer)) {
        throw new Error("Layer not found or cannot have masks");
      }
      
      var mask = layer.mask(${params.maskIndex});
      if (!mask) {
        throw new Error("Mask not found");
      }
      
      var shape = ${JSON.stringify(params.maskShape)};
      var maskShape = mask.property("ADBE Mask Shape");
      
      var myShape = new Shape();
      myShape.vertices = shape.vertices;
      
      if (shape.inTangents) {
        myShape.inTangents = shape.inTangents;
      }
      if (shape.outTangents) {
        myShape.outTangents = shape.outTangents;
      }
      
      myShape.closed = shape.closed !== false;
      
      if (${params.setKeyframe === true}) {
        maskShape.setValueAtTime(comp.time, myShape);
      } else {
        maskShape.setValue(myShape);
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          maskIndex: mask.propertyIndex
        }
      };
    `,

    setMaskProperties: (params: { compId: number; layerIndex: number; maskIndex: number; properties: any }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof AVLayer)) {
        throw new Error("Layer not found or cannot have masks");
      }
      
      var mask = layer.mask(${params.maskIndex});
      if (!mask) {
        throw new Error("Mask not found");
      }
      
      var props = ${JSON.stringify(params.properties)};
      
      // Set mask mode
      if (props.maskMode) {
        var maskModes = {
          "none": MaskMode.NONE,
          "add": MaskMode.ADD,
          "subtract": MaskMode.SUBTRACT,
          "intersect": MaskMode.INTERSECT,
          "lighten": MaskMode.LIGHTEN,
          "darken": MaskMode.DARKEN,
          "difference": MaskMode.DIFFERENCE
        };
        
        var mode = maskModes[props.maskMode];
        if (mode) {
          mask.maskMode = mode;
        }
      }
      
      // Set other properties
      if (props.inverted !== undefined) {
        mask.inverted = props.inverted;
      }
      
      if (props.maskFeather) {
        mask.property("ADBE Mask Feather").setValue(props.maskFeather);
      }
      
      if (props.maskOpacity !== undefined) {
        mask.property("ADBE Mask Opacity").setValue(props.maskOpacity);
      }
      
      if (props.maskExpansion !== undefined) {
        mask.property("ADBE Mask Offset").setValue(props.maskExpansion);
      }
      
      if (props.locked !== undefined) {
        mask.locked = props.locked;
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          maskIndex: mask.propertyIndex
        }
      };
    `,

    deleteMask: (params: { compId: number; layerIndex: number; maskIndex: number }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof AVLayer)) {
        throw new Error("Layer not found or cannot have masks");
      }
      
      var mask = layer.mask(${params.maskIndex});
      if (!mask) {
        throw new Error("Mask not found");
      }
      
      mask.remove();
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          message: "Mask deleted"
        }
      };
    `,

    getMaskInfo: (params: { compId: number; layerIndex: number; maskIndex?: number }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof AVLayer)) {
        throw new Error("Layer not found or cannot have masks");
      }
      
      var masks = [];
      
      if (${params.maskIndex !== undefined}) {
        // Get specific mask
        var mask = layer.mask(${params.maskIndex});
        if (mask) {
          var maskShape = mask.property("ADBE Mask Shape").value;
          masks.push({
            index: mask.propertyIndex,
            name: mask.name,
            maskMode: mask.maskMode.toString(),
            inverted: mask.inverted,
            locked: mask.locked,
            shape: {
              vertices: maskShape.vertices,
              inTangents: maskShape.inTangents,
              outTangents: maskShape.outTangents,
              closed: maskShape.closed
            },
            feather: mask.property("ADBE Mask Feather").value,
            opacity: mask.property("ADBE Mask Opacity").value,
            expansion: mask.property("ADBE Mask Offset").value
          });
        }
      } else {
        // Get all masks
        for (var i = 1; i <= layer.Masks.numProperties; i++) {
          var mask = layer.mask(i);
          var maskShape = mask.property("ADBE Mask Shape").value;
          masks.push({
            index: mask.propertyIndex,
            name: mask.name,
            maskMode: mask.maskMode.toString(),
            inverted: mask.inverted,
            locked: mask.locked,
            shape: {
              vertices: maskShape.vertices,
              inTangents: maskShape.inTangents,
              outTangents: maskShape.outTangents,
              closed: maskShape.closed
            },
            feather: mask.property("ADBE Mask Feather").value,
            opacity: mask.property("ADBE Mask Opacity").value,
            expansion: mask.property("ADBE Mask Offset").value
          });
        }
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          maskCount: layer.Masks.numProperties,
          masks: masks
        }
      };
    `,

    animateMaskPath: (params: { compId: number; layerIndex: number; maskIndex: number; keyframes: any[] }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof AVLayer)) {
        throw new Error("Layer not found or cannot have masks");
      }
      
      var mask = layer.mask(${params.maskIndex});
      if (!mask) {
        throw new Error("Mask not found");
      }
      
      var maskShape = mask.property("ADBE Mask Shape");
      var keyframes = ${JSON.stringify(params.keyframes)};
      
      // Remove existing keyframes
      while (maskShape.numKeys > 0) {
        maskShape.removeKey(1);
      }
      
      // Add new keyframes
      for (var i = 0; i < keyframes.length; i++) {
        var kf = keyframes[i];
        var myShape = new Shape();
        myShape.vertices = kf.maskShape.vertices;
        
        if (kf.maskShape.inTangents) {
          myShape.inTangents = kf.maskShape.inTangents;
        }
        if (kf.maskShape.outTangents) {
          myShape.outTangents = kf.maskShape.outTangents;
        }
        
        myShape.closed = kf.maskShape.closed !== false;
        maskShape.setValueAtTime(kf.time, myShape);
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          maskIndex: mask.propertyIndex,
          keyframeCount: maskShape.numKeys
        }
      };
    `,

    addShapePath: (params: { compId: number; layerIndex: number; groupName?: string; path: any; fillColor?: number[]; strokeColor?: number[]; strokeWidth?: number }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof ShapeLayer)) {
        throw new Error("Layer not found or not a shape layer");
      }
      
      var contents = layer.property("ADBE Root Vectors Group");
      var group;
      
      if (${params.groupName != null}) {
        group = contents.addProperty("ADBE Vector Group");
        group.name = "${this.escapeString(params.groupName || '')}";
        contents = group.property("ADBE Vectors Group");
      }
      
      // Add path
      var pathGroup = contents.addProperty("ADBE Vector Shape - Group");
      var pathProp = pathGroup.property("ADBE Vector Shape");
      
      var path = ${JSON.stringify(params.path)};
      var myShape = new Shape();
      myShape.vertices = path.vertices;
      
      if (path.inTangents) {
        myShape.inTangents = path.inTangents;
      }
      if (path.outTangents) {
        myShape.outTangents = path.outTangents;
      }
      
      myShape.closed = path.closed === true;
      pathProp.setValue(myShape);
      
      // Add stroke if specified
      if (${params.strokeWidth} && ${params.strokeWidth} > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Width").setValue(${params.strokeWidth});
        if (${params.strokeColor != null}) {
          var strokeColor = ${JSON.stringify(params.strokeColor || [0, 0, 0])};
          stroke.property("ADBE Vector Stroke Color").setValue(strokeColor);
        }
      }
      
      // Add fill
      var fill = contents.addProperty("ADBE Vector Graphic - Fill");
      if (${params.fillColor != null}) {
        var fillColor = ${JSON.stringify(params.fillColor)};
        fill.property("ADBE Vector Fill Color").setValue(fillColor);
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          groupName: group ? group.name : null
        }
      };
    `,

    modifyShapePath: (params: { compId: number; layerIndex: number; pathPropertyPath: string; path: any; setKeyframe?: boolean }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof ShapeLayer)) {
        throw new Error("Layer not found or not a shape layer");
      }
      
      // Navigate to path property
      var pathParts = "${this.escapeString(params.pathPropertyPath)}".split(".");
      var property = layer;
      
      for (var i = 0; i < pathParts.length; i++) {
        property = property.property(pathParts[i]);
        if (!property) {
          throw new Error("Path property not found: " + "${this.escapeString(params.pathPropertyPath)}");
        }
      }
      
      // Get the actual path property
      var pathProp = property.property("ADBE Vector Shape");
      if (!pathProp) {
        throw new Error("Not a valid path property");
      }
      
      var path = ${JSON.stringify(params.path)};
      var myShape = new Shape();
      myShape.vertices = path.vertices;
      
      if (path.inTangents) {
        myShape.inTangents = path.inTangents;
      }
      if (path.outTangents) {
        myShape.outTangents = path.outTangents;
      }
      
      if (path.closed !== undefined) {
        myShape.closed = path.closed;
      }
      
      if (${params.setKeyframe === true}) {
        pathProp.setValueAtTime(comp.time, myShape);
      } else {
        pathProp.setValue(myShape);
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          pathPropertyPath: "${this.escapeString(params.pathPropertyPath)}"
        }
      };
    `,

    createShapeFromPath: (params: { compId: number; name?: string; paths: any[] }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var shapeLayer = comp.layers.addShape();
      shapeLayer.name = "${this.escapeString(params.name || 'Shape Path')}";
      
      var contents = shapeLayer.property("ADBE Root Vectors Group");
      var paths = ${JSON.stringify(params.paths)};
      
      for (var i = 0; i < paths.length; i++) {
        var pathData = paths[i];
        
        // Create a group for each path
        var group = contents.addProperty("ADBE Vector Group");
        group.name = pathData.name || "Path " + (i + 1);
        
        var groupContents = group.property("ADBE Vectors Group");
        
        // Add path
        var pathGroup = groupContents.addProperty("ADBE Vector Shape - Group");
        var pathProp = pathGroup.property("ADBE Vector Shape");
        
        var myShape = new Shape();
        myShape.vertices = pathData.vertices;
        
        if (pathData.inTangents) {
          myShape.inTangents = pathData.inTangents;
        }
        if (pathData.outTangents) {
          myShape.outTangents = pathData.outTangents;
        }
        
        myShape.closed = pathData.closed === true;
        pathProp.setValue(myShape);
        
        // Add stroke if specified
        if (pathData.strokeWidth && pathData.strokeWidth > 0) {
          var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
          stroke.property("ADBE Vector Stroke Width").setValue(pathData.strokeWidth);
          if (pathData.strokeColor) {
            stroke.property("ADBE Vector Stroke Color").setValue(pathData.strokeColor);
          }
        }
        
        // Add fill
        if (pathData.fillColor) {
          var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
          fill.property("ADBE Vector Fill Color").setValue(pathData.fillColor);
        }
      }
      
      // Center in comp
      shapeLayer.property("Position").setValue([comp.width/2, comp.height/2]);
      
      return {
        success: true,
        data: {
          layerIndex: shapeLayer.index,
          layerName: shapeLayer.name,
          pathCount: paths.length
        }
      };
    `,

    // Text Tools
    addTextLayerAdvanced: (params: { compId: number; text: string; name?: string; sourceText?: any; position?: number[]; anchor?: number[] }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var textLayer = comp.layers.addText("${this.escapeString(params.text)}");
      if (${params.name != null}) {
        textLayer.name = "${this.escapeString(params.name || '')}";
      }
      
      // Set text document properties
      var textProp = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
      var textDoc = textProp.value;
      
      if (${params.sourceText != null}) {
        var props = ${JSON.stringify(params.sourceText)};
        
        if (props.font) textDoc.font = props.font;
        if (props.fontSize !== undefined) textDoc.fontSize = props.fontSize;
        if (props.fillColor) textDoc.fillColor = props.fillColor;
        if (props.strokeColor) textDoc.strokeColor = props.strokeColor;
        if (props.strokeWidth !== undefined) textDoc.strokeWidth = props.strokeWidth;
        if (props.strokeOverFill !== undefined) textDoc.strokeOverFill = props.strokeOverFill;
        
        // Handle justification
        if (props.justification) {
          var justificationMap = {
            "left": ParagraphJustification.LEFT_JUSTIFY,
            "center": ParagraphJustification.CENTER_JUSTIFY,
            "right": ParagraphJustification.RIGHT_JUSTIFY,
            "justifyLeft": ParagraphJustification.FULL_JUSTIFY_LASTLINE_LEFT,
            "justifyCenter": ParagraphJustification.FULL_JUSTIFY_LASTLINE_CENTER,
            "justifyRight": ParagraphJustification.FULL_JUSTIFY_LASTLINE_RIGHT,
            "justifyAll": ParagraphJustification.FULL_JUSTIFY_LASTLINE_FULL
          };
          var just = justificationMap[props.justification];
          if (just) textDoc.justification = just;
        }
        
        if (props.tracking !== undefined) textDoc.tracking = props.tracking;
        if (props.leading !== undefined) textDoc.leading = props.leading;
        if (props.baselineShift !== undefined) textDoc.baselineShift = props.baselineShift;
        if (props.verticalScale !== undefined) textDoc.verticalScale = props.verticalScale / 100;
        if (props.horizontalScale !== undefined) textDoc.horizontalScale = props.horizontalScale / 100;
        if (props.smallCaps !== undefined) textDoc.smallCaps = props.smallCaps;
        if (props.allCaps !== undefined) textDoc.allCaps = props.allCaps;
        
        textProp.setValue(textDoc);
      }
      
      // Set position if specified
      if (${params.position != null}) {
        textLayer.property("ADBE Transform Group").property("ADBE Position").setValue(${JSON.stringify(params.position)});
      }
      
      // Set anchor if specified
      if (${params.anchor != null}) {
        textLayer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue(${JSON.stringify(params.anchor)});
      }
      
      return {
        success: true,
        data: {
          layerIndex: textLayer.index,
          name: textLayer.name
        }
      };
    `,

    modifyTextProperties: (params: { compId: number; layerIndex: number; properties: any }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof TextLayer)) {
        throw new Error("Layer not found or not a text layer");
      }
      
      var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
      var textDoc = textProp.value;
      var props = ${JSON.stringify(params.properties)};
      
      // Update text content if provided
      if (props.text !== undefined) {
        layer.property("ADBE Text Properties").property("ADBE Text Document").setValue(props.text);
        textDoc = textProp.value; // Refresh after text change
      }
      
      // Update formatting properties
      if (props.font) textDoc.font = props.font;
      if (props.fontSize !== undefined) textDoc.fontSize = props.fontSize;
      if (props.fillColor) textDoc.fillColor = props.fillColor;
      if (props.strokeColor) textDoc.strokeColor = props.strokeColor;
      if (props.strokeWidth !== undefined) textDoc.strokeWidth = props.strokeWidth;
      if (props.strokeOverFill !== undefined) textDoc.strokeOverFill = props.strokeOverFill;
      
      // Handle justification
      if (props.justification) {
        var justificationMap = {
          "left": ParagraphJustification.LEFT_JUSTIFY,
          "center": ParagraphJustification.CENTER_JUSTIFY,
          "right": ParagraphJustification.RIGHT_JUSTIFY,
          "justifyLeft": ParagraphJustification.FULL_JUSTIFY_LASTLINE_LEFT,
          "justifyCenter": ParagraphJustification.FULL_JUSTIFY_LASTLINE_CENTER,
          "justifyRight": ParagraphJustification.FULL_JUSTIFY_LASTLINE_RIGHT,
          "justifyAll": ParagraphJustification.FULL_JUSTIFY_LASTLINE_FULL
        };
        var just = justificationMap[props.justification];
        if (just) textDoc.justification = just;
      }
      
      if (props.tracking !== undefined) textDoc.tracking = props.tracking;
      if (props.leading !== undefined) textDoc.leading = props.leading;
      if (props.baselineShift !== undefined) textDoc.baselineShift = props.baselineShift;
      if (props.verticalScale !== undefined) textDoc.verticalScale = props.verticalScale / 100;
      if (props.horizontalScale !== undefined) textDoc.horizontalScale = props.horizontalScale / 100;
      if (props.applyFill !== undefined) textDoc.applyFill = props.applyFill;
      if (props.applyStroke !== undefined) textDoc.applyStroke = props.applyStroke;
      
      textProp.setValue(textDoc);
      
      return {
        success: true,
        data: {
          layerIndex: layer.index
        }
      };
    `,

    addTextAnimator: (params: { compId: number; layerIndex: number; animatorName?: string; properties: string[]; selector?: any }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer || !(layer instanceof TextLayer)) {
        throw new Error("Layer not found or not a text layer");
      }
      
      var textAnimators = layer.property("ADBE Text Properties").property("ADBE Text Animators");
      var animator = textAnimators.addProperty("ADBE Text Animator");
      animator.name = "${this.escapeString(params.animatorName || 'Animator')}";
      
      // Add properties to animate
      var animatorProps = animator.property("ADBE Text Animator Properties");
      var properties = ${JSON.stringify(params.properties)};
      
      for (var i = 0; i < properties.length; i++) {
        var propName = properties[i];
        var propMatch = {
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
        
        if (propMatch[propName]) {
          animatorProps.addProperty(propMatch[propName]);
        }
      }
      
      // Configure selector
      var selectors = animator.property("ADBE Text Selectors");
      var rangeSelector = selectors.property(1); // Default range selector
      
      if (${params.selector != null}) {
        var sel = ${JSON.stringify(params.selector)};
        
        if (sel.start !== undefined) {
          rangeSelector.property("ADBE Text Index Start").setValue(sel.start);
        }
        if (sel.end !== undefined) {
          rangeSelector.property("ADBE Text Index End").setValue(sel.end);
        }
        if (sel.offset !== undefined) {
          rangeSelector.property("ADBE Text Range Offset").setValue(sel.offset);
        }
        
        // Set based on
        if (sel.basedOn) {
          var basedOnMap = {
            "characters": 1,
            "charactersExcludingSpaces": 2,
            "words": 3,
            "lines": 4
          };
          var basedOnValue = basedOnMap[sel.basedOn];
          if (basedOnValue) {
            rangeSelector.property("ADBE Text Range Units").setValue(basedOnValue);
          }
        }
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          animatorIndex: animator.propertyIndex
        }
      };
    `,

    // Keyframe Interpolation Tools
    setKeyframeAdvanced: (params: { compId: number; layerIndex: number; propertyPath: string; time: number; value: any; interpolation?: any }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // Navigate property path
      var propertyPath = "${this.escapeString(params.propertyPath)}";
      var pathParts = propertyPath.split(".");
      var property = layer;
      
      for (var i = 0; i < pathParts.length; i++) {
        var part = pathParts[i];
        // Handle common property name variations
        if (part === "Transform") part = "ADBE Transform Group";
        else if (part === "Position") part = "ADBE Position";
        else if (part === "Scale") part = "ADBE Scale";
        else if (part === "Rotation") part = "ADBE Rotate Z";
        else if (part === "Opacity") part = "ADBE Opacity";
        
        property = property.property(part);
        if (!property) {
          throw new Error("Property not found: " + propertyPath);
        }
      }
      
      // Set keyframe
      property.setValueAtTime(${params.time}, ${JSON.stringify(params.value)});
      var keyIndex = property.nearestKeyIndex(${params.time});
      
      // Apply interpolation if specified
      if (${params.interpolation != null}) {
        var interp = ${JSON.stringify(params.interpolation)};
        
        if (interp.temporalEase) {
          var easeIn, easeOut;
          
          switch(interp.temporalEase) {
            case "linear":
              easeIn = new KeyframeEase(0, 33.333);
              easeOut = new KeyframeEase(0, 33.333);
              break;
            case "easeIn":
              easeIn = new KeyframeEase(0, 33.333);
              easeOut = new KeyframeEase(0, 75);
              break;
            case "easeOut":
              easeIn = new KeyframeEase(0, 75);
              easeOut = new KeyframeEase(0, 33.333);
              break;
            case "easeInOut":
              easeIn = new KeyframeEase(0, 75);
              easeOut = new KeyframeEase(0, 75);
              break;
            case "hold":
              property.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.HOLD);
              break;
            case "custom":
              if (interp.customEase) {
                var ce = interp.customEase;
                if (ce.easeIn) {
                  easeIn = new KeyframeEase(ce.easeIn.speed || 0, ce.easeIn.influence || 33.333);
                }
                if (ce.easeOut) {
                  easeOut = new KeyframeEase(ce.easeOut.speed || 0, ce.easeOut.influence || 33.333);
                }
              }
              break;
          }
          
          if (easeIn && easeOut && interp.temporalEase !== "hold") {
            if (property.value.length) {
              // Multi-dimensional property
              var easeInArray = [];
              var easeOutArray = [];
              for (var j = 0; j < property.value.length; j++) {
                easeInArray.push(easeIn);
                easeOutArray.push(easeOut);
              }
              property.setTemporalEaseAtKey(keyIndex, easeInArray, easeOutArray);
            } else {
              // Single dimension
              property.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);
            }
          }
        }
        
        // Set spatial interpolation for position
        if (interp.spatialInterpolation && property.propertyValueType === PropertyValueType.ThreeD_SPATIAL || 
            property.propertyValueType === PropertyValueType.TwoD_SPATIAL) {
          switch(interp.spatialInterpolation) {
            case "linear":
              property.setSpatialTangentsAtKey(keyIndex, [0, 0], [0, 0]);
              break;
            case "auto":
              property.setSpatialAutoBezierAtKey(keyIndex, true);
              break;
            // "bezier" uses default or custom tangents
          }
        }
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          propertyPath: propertyPath,
          keyframeIndex: keyIndex
        }
      };
    `,

    applyEasyEase: (params: { compId: number; layerIndex: number; propertyPath: string; keyframeIndices?: number[]; easeType?: string }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // Navigate property path
      var propertyPath = "${this.escapeString(params.propertyPath)}";
      var pathParts = propertyPath.split(".");
      var property = layer;
      
      for (var i = 0; i < pathParts.length; i++) {
        var part = pathParts[i];
        if (part === "Transform") part = "ADBE Transform Group";
        else if (part === "Position") part = "ADBE Position";
        else if (part === "Scale") part = "ADBE Scale";
        else if (part === "Rotation") part = "ADBE Rotate Z";
        else if (part === "Opacity") part = "ADBE Opacity";
        
        property = property.property(part);
        if (!property) {
          throw new Error("Property not found: " + propertyPath);
        }
      }
      
      var easeType = "${params.easeType || 'ease'}";
      var keyIndices = ${params.keyframeIndices ? JSON.stringify(params.keyframeIndices) : 'null'};
      
      // Define ease values
      var easeIn, easeOut;
      switch(easeType) {
        case "ease":
          easeIn = new KeyframeEase(0, 33.333);
          easeOut = new KeyframeEase(0, 33.333);
          break;
        case "easeIn":
          easeIn = new KeyframeEase(0, 10);
          easeOut = new KeyframeEase(0, 66.667);
          break;
        case "easeOut":
          easeIn = new KeyframeEase(0, 66.667);
          easeOut = new KeyframeEase(0, 10);
          break;
      }
      
      // Apply to specified keyframes or all
      if (keyIndices) {
        for (var i = 0; i < keyIndices.length; i++) {
          var keyIndex = keyIndices[i];
          if (property.value.length) {
            // Multi-dimensional
            var easeInArray = [];
            var easeOutArray = [];
            for (var j = 0; j < property.value.length; j++) {
              easeInArray.push(easeIn);
              easeOutArray.push(easeOut);
            }
            property.setTemporalEaseAtKey(keyIndex, easeInArray, easeOutArray);
          } else {
            property.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);
          }
        }
      } else {
        // Apply to all keyframes
        for (var i = 1; i <= property.numKeys; i++) {
          if (property.value.length) {
            var easeInArray = [];
            var easeOutArray = [];
            for (var j = 0; j < property.value.length; j++) {
              easeInArray.push(easeIn);
              easeOutArray.push(easeOut);
            }
            property.setTemporalEaseAtKey(i, easeInArray, easeOutArray);
          } else {
            property.setTemporalEaseAtKey(i, [easeIn], [easeOut]);
          }
        }
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          propertyPath: propertyPath,
          appliedTo: keyIndices || "all keyframes"
        }
      };
    `,

    setTemporalEase: (params: { compId: number; layerIndex: number; propertyPath: string; keyframeIndex: number; easeIn?: any[]; easeOut?: any[] }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // Navigate property path
      var propertyPath = "${this.escapeString(params.propertyPath)}";
      var pathParts = propertyPath.split(".");
      var property = layer;
      
      for (var i = 0; i < pathParts.length; i++) {
        var part = pathParts[i];
        if (part === "Transform") part = "ADBE Transform Group";
        else if (part === "Position") part = "ADBE Position";
        else if (part === "Scale") part = "ADBE Scale";
        else if (part === "Rotation") part = "ADBE Rotate Z";
        else if (part === "Opacity") part = "ADBE Opacity";
        
        property = property.property(part);
        if (!property) {
          throw new Error("Property not found: " + propertyPath);
        }
      }
      
      var keyIndex = ${params.keyframeIndex};
      if (keyIndex < 1 || keyIndex > property.numKeys) {
        throw new Error("Invalid keyframe index");
      }
      
      // Create ease arrays
      var easeInArray = [];
      var easeOutArray = [];
      
      if (${params.easeIn != null}) {
        var easeInData = ${JSON.stringify(params.easeIn)};
        for (var i = 0; i < easeInData.length; i++) {
          var e = easeInData[i];
          easeInArray.push(new KeyframeEase(e.speed || 0, e.influence || 33.333));
        }
      } else {
        // Use current values
        easeInArray = property.keyInTemporalEase(keyIndex);
      }
      
      if (${params.easeOut != null}) {
        var easeOutData = ${JSON.stringify(params.easeOut)};
        for (var i = 0; i < easeOutData.length; i++) {
          var e = easeOutData[i];
          easeOutArray.push(new KeyframeEase(e.speed || 0, e.influence || 33.333));
        }
      } else {
        // Use current values
        easeOutArray = property.keyOutTemporalEase(keyIndex);
      }
      
      property.setTemporalEaseAtKey(keyIndex, easeInArray, easeOutArray);
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          propertyPath: propertyPath,
          keyframeIndex: keyIndex
        }
      };
    `,

    setSpatialTangent: (params: { compId: number; layerIndex: number; keyframeIndex: number; inTangent?: number[]; outTangent?: number[] }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      var property = layer.property("ADBE Transform Group").property("ADBE Position");
      var keyIndex = ${params.keyframeIndex};
      
      if (keyIndex < 1 || keyIndex > property.numKeys) {
        throw new Error("Invalid keyframe index");
      }
      
      var inTangent = ${params.inTangent ? JSON.stringify(params.inTangent) : 'property.keyInSpatialTangent(keyIndex)'};
      var outTangent = ${params.outTangent ? JSON.stringify(params.outTangent) : 'property.keyOutSpatialTangent(keyIndex)'};
      
      property.setSpatialTangentsAtKey(keyIndex, inTangent, outTangent);
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          keyframeIndex: keyIndex
        }
      };
    `,

    createAnimationCurve: (params: { compId: number; layerIndex: number; propertyPath: string; keyframes: any[]; clearExisting?: boolean }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      // Navigate property path
      var propertyPath = "${this.escapeString(params.propertyPath)}";
      var pathParts = propertyPath.split(".");
      var property = layer;
      
      for (var i = 0; i < pathParts.length; i++) {
        var part = pathParts[i];
        if (part === "Transform") part = "ADBE Transform Group";
        else if (part === "Position") part = "ADBE Position";
        else if (part === "Scale") part = "ADBE Scale";
        else if (part === "Rotation") part = "ADBE Rotate Z";
        else if (part === "Opacity") part = "ADBE Opacity";
        
        property = property.property(part);
        if (!property) {
          throw new Error("Property not found: " + propertyPath);
        }
      }
      
      // Clear existing keyframes if requested
      if (${params.clearExisting !== false}) {
        while (property.numKeys > 0) {
          property.removeKey(1);
        }
      }
      
      var keyframes = ${JSON.stringify(params.keyframes)};
      
      // Add keyframes with easing
      for (var i = 0; i < keyframes.length; i++) {
        var kf = keyframes[i];
        property.setValueAtTime(kf.time, kf.value);
        
        var keyIndex = property.nearestKeyIndex(kf.time);
        
        // Apply easing if specified
        if (kf.easeIn || kf.easeOut) {
          var easeInArray = [];
          var easeOutArray = [];
          
          if (property.value.length) {
            // Multi-dimensional property
            for (var j = 0; j < property.value.length; j++) {
              if (kf.easeIn) {
                easeInArray.push(new KeyframeEase(kf.easeIn.speed || 0, kf.easeIn.influence || 33.333));
              } else {
                easeInArray.push(new KeyframeEase(0, 33.333));
              }
              
              if (kf.easeOut) {
                easeOutArray.push(new KeyframeEase(kf.easeOut.speed || 0, kf.easeOut.influence || 33.333));
              } else {
                easeOutArray.push(new KeyframeEase(0, 33.333));
              }
            }
          } else {
            // Single dimension
            if (kf.easeIn) {
              easeInArray = [new KeyframeEase(kf.easeIn.speed || 0, kf.easeIn.influence || 33.333)];
            } else {
              easeInArray = [new KeyframeEase(0, 33.333)];
            }
            
            if (kf.easeOut) {
              easeOutArray = [new KeyframeEase(kf.easeOut.speed || 0, kf.easeOut.influence || 33.333)];
            } else {
              easeOutArray = [new KeyframeEase(0, 33.333)];
            }
          }
          
          property.setTemporalEaseAtKey(keyIndex, easeInArray, easeOutArray);
        }
      }
      
      return {
        success: true,
        data: {
          layerIndex: layer.index,
          propertyPath: propertyPath,
          keyframeCount: property.numKeys
        }
      };
    `,

    convertMaskToShape: (params: { compId: number; layerIndex: number; maskIndex: number; createNewLayer?: boolean; targetLayerIndex?: number }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var sourceLayer = comp.layer(${params.layerIndex});
      if (!sourceLayer || !(sourceLayer instanceof AVLayer)) {
        throw new Error("Source layer not found or cannot have masks");
      }
      
      var mask = sourceLayer.mask(${params.maskIndex});
      if (!mask) {
        throw new Error("Mask not found");
      }
      
      // Get mask shape
      var maskShape = mask.property("ADBE Mask Shape").value;
      
      var targetLayer;
      if (${params.createNewLayer !== false}) {
        // Create new shape layer
        targetLayer = comp.layers.addShape();
        targetLayer.name = sourceLayer.name + " - " + mask.name;
      } else if (${params.targetLayerIndex != null}) {
        targetLayer = comp.layer(${params.targetLayerIndex});
        if (!targetLayer || !(targetLayer instanceof ShapeLayer)) {
          throw new Error("Target layer not found or not a shape layer");
        }
      } else {
        throw new Error("Must specify target layer or create new layer");
      }
      
      // Add path to shape layer
      var contents = targetLayer.property("ADBE Root Vectors Group");
      var group = contents.addProperty("ADBE Vector Group");
      group.name = mask.name;
      
      var groupContents = group.property("ADBE Vectors Group");
      var pathGroup = groupContents.addProperty("ADBE Vector Shape - Group");
      var pathProp = pathGroup.property("ADBE Vector Shape");
      
      pathProp.setValue(maskShape);
      
      // Add fill to make it visible
      var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
      fill.property("ADBE Vector Fill Color").setValue([1, 1, 1]);
      
      return {
        success: true,
        data: {
          sourceLayerIndex: sourceLayer.index,
          targetLayerIndex: targetLayer.index,
          targetLayerName: targetLayer.name
        }
      };
    `
  };
}