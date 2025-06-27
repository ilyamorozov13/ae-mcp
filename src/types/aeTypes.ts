export interface AEProject {
  name: string;
  file: string | null;
  numItems: number;
  compositions: AEComposition[];
  footage: AEFootageItem[];
}

export interface AEComposition {
  id: number;
  name: string;
  width: number;
  height: number;
  duration: number;
  frameRate: number;
  numLayers?: number;
  bgColor?: number[];
}

export interface AELayer {
  index: number;
  name: string;
  type: 'solid' | 'text' | 'shape' | 'footage' | 'adjustment' | 'null';
  position?: number[];
  scale?: number[];
  rotation?: number;
  opacity?: number;
  startTime?: number;
  inPoint?: number;
  outPoint?: number;
}

export interface AEFootageItem {
  id: number;
  name: string;
  width: number;
  height: number;
  duration: number;
  filePath?: string;
  type: 'video' | 'image' | 'audio' | 'sequence';
}

export interface AERenderQueueItem {
  index: number;
  comp: string;
  status: 'QUEUED' | 'RENDERING' | 'DONE' | 'STOPPED' | 'ERR_STOPPED' | 'NEEDS_OUTPUT';
  startTime?: number;
  elapsedSeconds?: number;
  outputPath?: string;
}

export interface AEKeyframe {
  time: number;
  value: any;
  inInterpolationType?: 'linear' | 'bezier' | 'hold';
  outInterpolationType?: 'linear' | 'bezier' | 'hold';
}

export interface AEEffect {
  name: string;
  index: number;
  enabled: boolean;
  properties?: { [key: string]: any };
}

export interface AETextDocument {
  text: string;
  font?: string;
  fontSize?: number;
  fillColor?: number[];
  strokeColor?: number[];
  strokeWidth?: number;
  justification?: 'left' | 'center' | 'right';
}

export interface AEShape {
  type: 'rectangle' | 'ellipse' | 'polygon' | 'star' | 'path';
  size?: number[];
  position?: number[];
  fillColor?: number[];
  strokeColor?: number[];
  strokeWidth?: number;
}

export interface AEProjectSettings {
  frameRate?: number;
  resolution?: {
    width: number;
    height: number;
  };
  colorDepth?: 8 | 16 | 32;
  workingSpace?: string;
}

export interface AERenderSettings {
  quality?: 'best' | 'draft' | 'wireframe';
  resolution?: 'full' | 'half' | 'third' | 'quarter';
  frameRate?: number;
  fieldRender?: 'off' | 'upper' | 'lower';
}

export interface AEOutputModule {
  format?: string;
  codec?: string;
  quality?: number;
  channels?: 'rgb' | 'rgba' | 'alpha';
  audio?: boolean;
}