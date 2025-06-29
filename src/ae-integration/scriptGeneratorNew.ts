import { projectGenerators } from './generators/projectGenerators.js';
import { compositionGenerators } from './generators/compositionGenerators.js';
import { layerGenerators } from './generators/layerGenerators.js';
import { advancedLayerGenerators } from './generators/advancedLayerGenerators.js';
import { effectsAndKeyframeGenerators } from './generators/effectsAndKeyframeGenerators.js';
import { renderGenerators } from './generators/renderGenerators.js';
import { batchGenerators } from './generators/batchGenerators.js';
import { utilityGenerators } from './generators/utilityGenerators.js';
import { expressionGenerators } from './generators/expressionGenerators.js';
import { maskGenerators } from './generators/maskGenerators.js';
import { textGenerators } from './generators/textGenerators.js';
import { keyframeGenerators } from './generators/keyframeGenerators.js';
import { helpers } from './generators/helpers.js';

export class ScriptGenerator {
  private generators: Map<string, Function> = new Map();

  constructor() {
    this.initializeGenerators();
  }

  private initializeGenerators() {
    // Merge all generator modules
    const allGenerators = {
      ...projectGenerators,
      ...compositionGenerators,
      ...layerGenerators,
      ...advancedLayerGenerators,
      ...effectsAndKeyframeGenerators,
      ...renderGenerators,
      ...batchGenerators,
      ...utilityGenerators,
      ...expressionGenerators,
      ...maskGenerators,
      ...textGenerators,
      ...keyframeGenerators
    };

    // Register all generators
    Object.entries(allGenerators).forEach(([name, generator]) => {
      this.generators.set(name, generator);
    });

    // Create aliases for snake_case versions
    this.createAliases();
  }

  private createAliases() {
    // Create snake_case aliases for all camelCase methods
    const aliasMap: Record<string, string> = {
      // Project aliases
      'create_project': 'createProject',
      'open_project': 'openProject',
      'save_project': 'saveProject',
      'close_project': 'closeProject',
      'get_project_info': 'getProjectInfo',
      'import_footage': 'importFootage',
      
      // Composition aliases
      'create_composition': 'createComposition',
      'modify_composition': 'modifyComposition',
      'duplicate_composition': 'duplicateComposition',
      'delete_composition': 'deleteComposition',
      'list_compositions': 'listCompositions',
      'get_composition_info': 'getCompositionInfo',
      
      // Layer aliases
      'add_solid_layer': 'addSolidLayer',
      'add_text_layer': 'addTextLayer',
      'add_shape_layer': 'addShapeLayer',
      'add_null_layer': 'addNullLayer',
      'add_adjustment_layer': 'addAdjustmentLayer',
      'add_camera_layer': 'addCameraLayer',
      'add_light_layer': 'addLightLayer',
      'modify_layer_properties': 'modifyLayerProperties',
      'duplicate_layer': 'duplicateLayer',
      'delete_layer': 'deleteLayer',
      'reorder_layers': 'reorderLayers',
      'get_layer_info': 'getLayerInfo',
      
      // Advanced layer aliases
      'set_layer_parent': 'setLayerParent',
      'set_layer_blend_mode': 'setLayerBlendMode',
      'set_track_matte': 'setTrackMatte',
      'set_layer_3d': 'setLayer3d',
      'modify_layer_3d_properties': 'modifyLayer3dProperties',
      'set_layer_quality': 'setLayerQuality',
      'set_motion_blur': 'setMotionBlur',
      'set_layer_visibility': 'setLayerVisibility',
      'set_time_remapping': 'setTimeRemapping',
      'animate_time_remap': 'animateTimeRemap',
      
      // Effect and keyframe aliases
      'apply_effect': 'applyEffect',
      'set_keyframe': 'setKeyframe',
      'batch_keyframes': 'batchKeyframes',
      
      // Render aliases
      'add_to_render_queue': 'addToRenderQueue',
      'start_render': 'startRender',
      'pause_render': 'pauseRender',
      'stop_render': 'stopRender',
      'get_render_queue': 'getRenderQueue',
      'clear_render_queue': 'clearRenderQueue',
      'export_frame': 'exportFrame',
      'batch_render': 'batchRender',
      
      // Batch operation aliases
      'batch_execute': 'batchExecute',
      'batch_create_layers': 'batchCreateLayers',
      'batch_modify_layer_properties': 'batchModifyLayerProperties',
      
      // Utility aliases
      'get_ae_version': 'getAeVersion',
      'execute_script': 'executeScript',
      
      // Expression aliases
      'set_expression': 'setExpression',
      'get_expression': 'getExpression',
      'remove_expression': 'removeExpression',
      'enable_expression': 'enableExpression',
      'batch_set_expressions': 'batchSetExpressions',
      'add_expression_control': 'addExpressionControl',
      'link_properties_with_expression': 'linkPropertiesWithExpression',
      'add_wiggle_expression': 'addWiggleExpression',
      'add_loop_expression': 'addLoopExpression',
      'convert_keyframes_to_expression': 'convertKeyframesToExpression',
      'save_expression_preset': 'saveExpressionPreset',
      'apply_expression_preset': 'applyExpressionPreset',
      
      // Mask aliases
      'add_mask': 'addMask',
      'add_rectangular_mask': 'addRectangularMask',
      'add_elliptical_mask': 'addEllipticalMask',
      'modify_mask_path': 'modifyMaskPath',
      'set_mask_properties': 'setMaskProperties',
      'delete_mask': 'deleteMask',
      'get_mask_info': 'getMaskInfo',
      'animate_mask_path': 'animateMaskPath',
      'convert_mask_to_shape': 'convertMaskToShape',
      
      // Text aliases
      'add_text_layer_advanced': 'addTextLayerAdvanced',
      'modify_text_properties': 'modifyTextProperties',
      'add_text_animator': 'addTextAnimator',
      'convert_text_to_shape': 'convertTextToShape',
      'create_text_on_path': 'createTextOnPath',
      
      // Keyframe aliases
      'set_keyframe_advanced': 'setKeyframeAdvanced',
      'apply_easy_ease': 'applyEasyEase',
      'set_keyframe_velocity': 'setKeyframeVelocity',
      'set_temporal_ease': 'setTemporalEase',
      'set_spatial_tangent': 'setSpatialTangent',
      'set_keyframe_interpolation_type': 'setKeyframeInterpolationType',
      'create_animation_curve': 'createAnimationCurve',
      'copy_keyframes': 'copyKeyframes',
      'offset_keyframes': 'offsetKeyframes',
      'scale_keyframe_timing': 'scaleKeyframeTiming',
      'reverse_keyframes': 'reverseKeyframes',
      'apply_animation_preset': 'applyAnimationPreset'
    };

    Object.entries(aliasMap).forEach(([snakeCase, camelCase]) => {
      const generator = this.generators.get(camelCase);
      if (generator) {
        this.generators.set(snakeCase, generator);
      }
    });
  }

  generate(toolName: string, params: any): string {
    const generator = this.generators.get(toolName);
    if (!generator) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    // Generate the base script
    const baseScript = generator(params);

    // Wrap in error handling
    return this.wrapScript(baseScript);
  }

  private wrapScript(script: string): string {
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

  // Expose helper functions for external use
  escapeString = helpers.escapeString;
  stringify = helpers.stringify;
}