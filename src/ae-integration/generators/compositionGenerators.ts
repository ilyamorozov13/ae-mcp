import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

export const compositionGenerators: ScriptGeneratorModule = {
  createComposition: (params: {
    name: string;
    width?: number;
    height?: number;
    frameRate?: number;
    duration?: number;
  }) => {
    let script = '';
    script += 'var comp = app.project.items.addComp(\n';
    script += '  "' + helpers.escapeString(params.name) + '",\n';
    script += '  ' + (params.width !== undefined ? params.width : 1920) + ',\n';
    script += '  ' + (params.height !== undefined ? params.height : 1080) + ',\n';
    script += '  1.0,  // pixel aspect ratio\n';
    script += '  ' + (params.duration !== undefined ? params.duration : 10) + ',\n';
    script += '  ' + (params.frameRate !== undefined ? params.frameRate : 30) + '\n';
    script += ');\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    id: comp.id,\n';
    script += '    name: comp.name,\n';
    script += '    width: comp.width,\n';
    script += '    height: comp.height,\n';
    script += '    duration: comp.duration,\n';
    script += '    frameRate: comp.frameRate\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  modifyComposition: (params: {
    compId: number;
    properties: {
      name?: string;
      width?: number;
      height?: number;
      duration?: number;
      backgroundColor?: number[];
    };
  }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    if (params.properties.name) {
      script += 'comp.name = "' + helpers.escapeString(params.properties.name) + '";\n';
    }
    if (params.properties.width) {
      script += 'comp.width = ' + params.properties.width + ';\n';
    }
    if (params.properties.height) {
      script += 'comp.height = ' + params.properties.height + ';\n';
    }
    if (params.properties.duration) {
      script += 'comp.duration = ' + params.properties.duration + ';\n';
    }
    if (params.properties.backgroundColor) {
      script += 'comp.bgColor = [' + params.properties.backgroundColor.join(',') + '];\n';
    }
    script += '\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    id: comp.id,\n';
    script += '    name: comp.name,\n';
    script += '    width: comp.width,\n';
    script += '    height: comp.height,\n';
    script += '    duration: comp.duration,\n';
    script += '    frameRate: comp.frameRate\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  duplicateComposition: (params: { compId: number; newName: string }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var duplicate = comp.duplicate();\n';
    script += 'duplicate.name = "' + helpers.escapeString(params.newName) + '";\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    id: duplicate.id,\n';
    script += '    name: duplicate.name,\n';
    script += '    originalId: comp.id\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  deleteComposition: (params: { compId: number; confirmDelete: boolean }) => {
    let script = '';
    script += 'if (!' + params.confirmDelete + ') {\n';
    script += '  throw new Error("Deletion not confirmed. Set confirmDelete to true.");\n';
    script += '}\n\n';
    
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var name = comp.name;\n';
    script += 'comp.remove();\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    deletedCompName: name,\n';
    script += '    deletedCompId: ' + params.compId + '\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  listCompositions: () => {
    let script = '';
    script += 'var comps = [];\n';
    script += 'for (var i = 1; i <= app.project.numItems; i++) {\n';
    script += '  var item = app.project.item(i);\n';
    script += '  if (item instanceof CompItem) {\n';
    script += '    comps.push({\n';
    script += '      id: item.id,\n';
    script += '      name: item.name,\n';
    script += '      width: item.width,\n';
    script += '      height: item.height,\n';
    script += '      duration: item.duration,\n';
    script += '      frameRate: item.frameRate,\n';
    script += '      numLayers: item.numLayers\n';
    script += '    });\n';
    script += '  }\n';
    script += '}\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    count: comps.length,\n';
    script += '    compositions: comps\n';
    script += '  }\n';
    script += '};';
    
    return script;
  },
  
  getCompositionInfo: (params: { compId: number }) => {
    let script = '';
    script += 'var comp = app.project.itemByID(' + params.compId + ');\n';
    script += 'if (!comp || !(comp instanceof CompItem)) {\n';
    script += '  throw new Error("Composition not found");\n';
    script += '}\n\n';
    
    script += 'var layers = [];\n';
    script += 'for (var i = 1; i <= comp.numLayers; i++) {\n';
    script += '  var layer = comp.layer(i);\n';
    script += '  layers.push({\n';
    script += '    index: layer.index,\n';
    script += '    name: layer.name,\n';
    script += '    locked: layer.locked,\n';
    script += '    shy: layer.shy,\n';
    script += '    solo: layer.solo,\n';
    script += '    enabled: layer.enabled,\n';
    script += '    hasVideo: layer.hasVideo,\n';
    script += '    active: layer.active,\n';
    script += '    nullLayer: layer.nullLayer,\n';
    script += '    threeDLayer: layer.threeDLayer,\n';
    script += '    startTime: layer.startTime,\n';
    script += '    inPoint: layer.inPoint,\n';
    script += '    outPoint: layer.outPoint\n';
    script += '  });\n';
    script += '}\n\n';
    
    script += 'return {\n';
    script += '  success: true,\n';
    script += '  data: {\n';
    script += '    id: comp.id,\n';
    script += '    name: comp.name,\n';
    script += '    width: comp.width,\n';
    script += '    height: comp.height,\n';
    script += '    pixelAspect: comp.pixelAspect,\n';
    script += '    duration: comp.duration,\n';
    script += '    frameRate: comp.frameRate,\n';
    script += '    time: comp.time,\n';
    script += '    bgColor: comp.bgColor,\n';
    script += '    numLayers: comp.numLayers,\n';
    script += '    layers: layers\n';
    script += '  }\n';
    script += '};';
    
    return script;
  }
};