export const READ_ONLY_AE_COMMANDS = new Set([
  'ping',
  'getAeVersion',
  'get_ae_version',
  'getProjectInfo',
  'get_project_info',
  'listCompositions',
  'list_compositions',
  'getCompositionInfo',
  'get_composition_info',
  'getLayerInfo',
  'get_layer_info',
  'getExpression',
  'get_expression',
  'getRenderQueue',
  'get_render_queue',
  'getMaskInfo',
  'get_mask_info'
]);

export function aeCommandUsesUndo(command: string): boolean {
  return !READ_ONLY_AE_COMMANDS.has(command);
}
