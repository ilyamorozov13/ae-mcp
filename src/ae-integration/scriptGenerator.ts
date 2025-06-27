export class ScriptGenerator {
  generate(command: string, params: any): string {
    const generator = this.generators[command];
    if (!generator) {
      throw new Error(`Unknown command: ${command}`);
    }
    
    return this.wrapInTryCatch(generator.call(this, params));
  }
  
  private wrapInTryCatch(script: string): string {
    return `
      (function() {
        try {
          ${script}
        } catch (error) {
          return { 
            success: false, 
            error: { 
              message: error.toString(), 
              code: error.number || 'UNKNOWN' 
            } 
          };
        }
      })();
    `;
  }
  
  private escapeString(str: string): string {
    return str.replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
  }
  
  private generators: { [key: string]: (params: any) => string } = {
    // Map underscore names to camelCase implementations
    create_project: (params: any) => this.generators.createProject(params),
    open_project: (params: any) => this.generators.openProject(params),
    save_project: (params: any) => this.generators.saveProject(params),
    get_project_info: (params: any) => this.generators.getProjectInfo(params),
    create_composition: (params: any) => this.generators.createComposition(params),
    modify_composition: (params: any) => this.generators.modifyComposition(params),
    list_compositions: (params: any) => this.generators.listCompositions(params),
    get_composition_info: (params: any) => this.generators.getCompositionInfo(params),
    add_solid_layer: (params: any) => this.generators.addSolidLayer(params),
    add_text_layer: (params: any) => this.generators.addTextLayer(params),
    add_shape_layer: (params: any) => this.generators.addShapeLayer(params),
    create_layer: (params: any) => this.generators.createLayer(params),
    modify_layer_properties: (params: any) => this.generators.modifyLayerProperties(params),
    set_keyframe: (params: any) => this.generators.setKeyframe(params),
    add_to_render_queue: (params: any) => this.generators.addToRenderQueue(params),
    start_render: (params: any) => this.generators.startRender(params),
    get_render_queue: (params: any) => this.generators.getRenderQueue(params),
    
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
        ${params.width || 1920},
        ${params.height || 1080},
        1.0,
        ${params.duration || 10},
        ${params.frameRate || 30}
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
        [${params.color?.join(',') || '1,1,1'}],
        "${this.escapeString(params.name || 'Solid')}",
        ${params.width || 'comp.width'},
        ${params.height || 'comp.height'},
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
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layers.addShape();
      ${params.name ? `layer.name = "${this.escapeString(params.name)}";` : ''}
      
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
          layer = comp.layers.addSolid(color, "${params.name || 'Solid'}", comp.width, comp.height, 1);
          break;
        case "text":
          layer = comp.layers.addText("${this.escapeString(params.text || 'Text')}");
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
      
      ${params.properties.position ? `layer.property("Position").setValue([${params.properties.position.join(',')}]);` : ''}
      ${params.properties.scale ? `layer.property("Scale").setValue([${params.properties.scale.join(',')}]);` : ''}
      ${params.properties.rotation ? `layer.property("Rotation").setValue(${params.properties.rotation});` : ''}
      ${params.properties.opacity ? `layer.property("Opacity").setValue(${params.properties.opacity});` : ''}
      
      return {
        success: true,
        data: {
          index: layer.index,
          name: layer.name
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
      var normalizedProperty = propertyMap[propertyName.toLowerCase()] || propertyName;
      
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
        var template = "${this.escapeString(params.outputModule)}";
        outputModule.applyTemplate(template);
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
    `
  };
}