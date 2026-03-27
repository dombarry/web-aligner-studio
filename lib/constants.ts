export const PREFORM_BASE_URL = process.env.PREFORM_URL || 'http://localhost:44388';

export const DEFAULT_SCENE_SETTINGS = {
  machineType: 'FORM-4-0',
  materialCode: 'FLDLCO11',
  layerThicknessMm: 0.1,
  printSetting: 'DEFAULT',
};

export const DEFAULT_SUPPORT_SETTINGS = {
  density: 1.10,
  touchpointSizeMm: 1.00,
  slopeMultiplier: 1.35,
  raftType: 'MINI_RAFTS_ON_BP' as const,
};

export const DEFAULT_LABEL_SETTINGS: LabelSettings = {
  applicationMode: 'ENGRAVE',
  fontSizeMm: 3.0,
  depthMm: 0.5,
  verticalOffsetMm: 8.0,
  maxLabelLen: 16,
};

export interface LabelSettings {
  applicationMode: string;
  fontSizeMm: number;
  depthMm: number;
  verticalOffsetMm: number;
  maxLabelLen: number;
}

export const FILE_PAIR_REGEX = /^(.+?)\s+[LU]_Mold(?:Lower|Upper)\.stl$/i;

export const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
export const PREPARED_SCENES_DIR = process.env.PREPARED_SCENES_DIR || './prepared_scenes';
