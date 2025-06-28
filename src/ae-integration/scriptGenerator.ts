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
      color?: number[];
      size?: number[];
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layers.addShape();
      ${params.name ? `layer.name = "${this.escapeString(params.name)}";` : ''}
      
      // Add shape content directly to the root vectors group
      var contents = layer.property("ADBE Root Vectors Group");
      var shapeType = "${params.shapeType ? params.shapeType : 'rectangle'}";
      
      // Add the shape path based on type
      var shapePath;
      if (shapeType === "rectangle") {
        shapePath = contents.addProperty("ADBE Vector Shape - Rect");
        // Set size if provided
        ${params.size ? `shapePath.property("ADBE Vector Rect Size").setValue([${params.size.join(',')}]);` : 
                       `shapePath.property("ADBE Vector Rect Size").setValue([100, 100]);`}
      } else if (shapeType === "ellipse") {
        shapePath = contents.addProperty("ADBE Vector Shape - Ellipse");
        // Set size if provided
        ${params.size ? `shapePath.property("ADBE Vector Ellipse Size").setValue([${params.size.join(',')}]);` : 
                       `shapePath.property("ADBE Vector Ellipse Size").setValue([100, 100]);`}
      } else if (shapeType === "polygon" || shapeType === "star") {
        shapePath = contents.addProperty("ADBE Vector Shape - Star");
        // Set type after creation
        if (shapeType === "polygon") {
          shapePath.property("ADBE Vector Star Type").setValue(1); // 1 = polygon
        } else {
          shapePath.property("ADBE Vector Star Type").setValue(2); // 2 = star
        }
        shapePath.property("ADBE Vector Star Points").setValue(5);
        shapePath.property("ADBE Vector Star Inner Radius").setValue(50);
        shapePath.property("ADBE Vector Star Outer Radius").setValue(100);
      }
      
      // Add fill to make the shape visible
      var fill = contents.addProperty("ADBE Vector Graphic - Fill");
      ${params.color ? `fill.property("ADBE Vector Fill Color").setValue([${params.color.join(',')}]);` : ''}
      
      // Set the layer position to center of comp
      layer.property("Position").setValue([comp.width/2, comp.height/2]);
      
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
              
              // Determine shape type from properties or use default
              var shapeType = "rectangle"; // default
              if (layerDef.properties && layerDef.properties.shapeType) {
                shapeType = layerDef.properties.shapeType;
              }
              
              // Add the shape path based on type
              var shapePath;
              if (shapeType === "rectangle") {
                shapePath = contents.addProperty("ADBE Vector Shape - Rect");
                // Set default size
                shapePath.property("ADBE Vector Rect Size").setValue([100, 100]);
              } else if (shapeType === "ellipse") {
                shapePath = contents.addProperty("ADBE Vector Shape - Ellipse");
                // Set default size
                shapePath.property("ADBE Vector Ellipse Size").setValue([100, 100]);
              } else if (shapeType === "polygon" || shapeType === "star") {
                shapePath = contents.addProperty("ADBE Vector Shape - Star");
                if (shapeType === "polygon") {
                  shapePath.property("ADBE Vector Star Type").setValue(1); // polygon
                } else {
                  shapePath.property("ADBE Vector Star Type").setValue(2); // star
                }
                shapePath.property("ADBE Vector Star Points").setValue(5);
                shapePath.property("ADBE Vector Star Inner Radius").setValue(50);
                shapePath.property("ADBE Vector Star Outer Radius").setValue(100);
              }
              
              // Add fill to make the shape visible
              var fill = contents.addProperty("ADBE Vector Graphic - Fill");
              // Use color from properties if provided
              if (layerDef.properties && layerDef.properties.color) {
                fill.property("ADBE Vector Fill Color").setValue(layerDef.properties.color);
              }
              
              // Center the layer in the comp
              layer.property("Position").setValue([comp.width/2, comp.height/2]);
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
    `
  };
}