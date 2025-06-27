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
    add_solid_layer: (params: any) => this.generators.addSolidLayer(params),
    add_text_layer: (params: any) => this.generators.addTextLayer(params),
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
    }) => `
      var comp = app.project.itemByID(${params.compId});
      if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Composition not found");
      }
      
      var layer = comp.layer(${params.layerIndex});
      if (!layer) {
        throw new Error("Layer not found");
      }
      
      var prop = layer.property("${this.escapeString(params.property)}");
      if (!prop) {
        throw new Error("Property not found: ${this.escapeString(params.property)}");
      }
      
      prop.setValueAtTime(${params.time}, ${Array.isArray(params.value) ? `[${params.value.join(',')}]` : params.value});
      
      return {
        success: true,
        data: {
          property: "${this.escapeString(params.property)}",
          time: ${params.time},
          numKeys: prop.numKeys
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