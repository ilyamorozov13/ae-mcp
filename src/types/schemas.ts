import { z } from 'zod';

// Color schema (RGB values 0-1)
export const ColorSchema = z.array(z.number().min(0).max(1)).length(3);

// Resolution schema
export const ResolutionSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive()
});

// Project schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  settings: z.object({
    frameRate: z.number().positive().default(30),
    resolution: ResolutionSchema.default({ width: 1920, height: 1080 })
  }).optional()
});

export const OpenProjectSchema = z.object({
  filePath: z.string().min(1)
});

export const SaveProjectSchema = z.object({
  filePath: z.string().optional()
});

// Composition schemas
export const CreateCompositionSchema = z.object({
  name: z.string().min(1),
  width: z.number().positive().default(1920),
  height: z.number().positive().default(1080),
  duration: z.number().positive().default(10),
  frameRate: z.number().positive().default(30)
});

export const ModifyCompositionSchema = z.object({
  compId: z.number(),
  properties: z.object({
    name: z.string().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    duration: z.number().positive().optional(),
    backgroundColor: ColorSchema.optional()
  })
});

// Layer schemas
export const AddSolidLayerSchema = z.object({
  compId: z.number(),
  name: z.string().default('Solid'),
  color: ColorSchema.default([1, 1, 1]),
  width: z.number().positive().optional(),
  height: z.number().positive().optional()
});

export const AddTextLayerSchema = z.object({
  compId: z.number(),
  text: z.string(),
  name: z.string().optional()
});

export const ModifyLayerPropertiesSchema = z.object({
  compId: z.number(),
  layerIndex: z.number().positive(),
  properties: z.object({
    position: z.array(z.number()).min(2).max(3).optional(),
    scale: z.array(z.number()).min(2).max(3).optional(),
    rotation: z.number().optional(),
    opacity: z.number().min(0).max(100).optional()
  })
});

export const SetKeyframeSchema = z.object({
  compId: z.number(),
  layerIndex: z.number().positive(),
  property: z.enum(['Position', 'Scale', 'Rotation', 'Opacity']),
  time: z.number().min(0),
  value: z.union([
    z.number(),
    z.array(z.number()).min(2).max(3)
  ])
});

// Render schemas
export const AddToRenderQueueSchema = z.object({
  compId: z.number(),
  outputPath: z.string().min(1),
  outputModule: z.string().optional(),
  renderSettings: z.string().optional()
});

export const BatchRenderSchema = z.object({
  compIds: z.array(z.number()),
  outputDirectory: z.string().min(1),
  outputFormat: z.string().default('mp4'),
  outputModule: z.string().optional()
});

export const ExportFrameSchema = z.object({
  compId: z.number(),
  time: z.number().min(0),
  outputPath: z.string().min(1)
});

// Import schemas
export const ImportFootageSchema = z.object({
  filePath: z.string().min(1),
  folderName: z.string().optional()
});

// Effect schemas
export const ApplyEffectSchema = z.object({
  compId: z.number(),
  layerIndex: z.number().positive(),
  effectName: z.string().min(1)
});

// Validation function helper
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation error: ${messages.join(', ')}`);
    }
    throw error;
  }
}