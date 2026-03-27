// PreForm API types
export interface Vec3 { x: number; y: number; z: number; }

export interface BoundingBox {
  min_corner: Vec3;
  max_corner: Vec3;
}

export interface ModelProperties {
  id: string;
  name: string;
  position: Vec3;
  orientation: Vec3;
  scale: number;
  units: string;
  bounding_box: BoundingBox;
  original_file: string;
  visible: boolean;
  has_supports: boolean;
  in_bounds: boolean;
}

export interface SceneModel {
  id: string;
  models: ModelProperties[];
  scene_settings: {
    machine_type: string;
    material_code: string;
    layer_thickness_mm: number;
    print_setting?: string;
  };
  material_usage?: {
    volume_ml?: number;
    unsupported_volume_ml?: number;
  };
  layer_count?: number;
}

export interface DeviceStatus {
  id: string;
  product_name: string;
  status: string;
  is_connected: boolean;
  connection_type: string;
  ip_address: string;
  firmware_version: string;
  ready_to_print_now?: boolean;
  tank_material_code?: string;
  cartridge_data?: Record<string, {
    cartridgeMaterialCode: string;
    cartridgeEstimatedVolumeDispensed_mL: number;
    cartridgeOriginalVolume_mL: number;
  }>;
  estimated_print_time_remaining_ms?: number;
}

export interface DevicesResponse {
  count: number;
  devices: DeviceStatus[];
}

export interface MaterialInfo {
  machine_type_id: string;
  machine_type_name: string;
  build_volume?: { x: number; y: number; z: number };
  materials: Array<{
    material_code: string;
    material_name: string;
    material_description: string;
    material_settings: Array<{
      scene_settings: {
        machine_type: string;
        material_code: string;
        layer_thickness_mm: number;
        print_setting: string;
      };
      setting_name: string;
      setting_description: string;
    }>;
  }>;
}

export interface PrintValidationResult {
  per_model_results: Record<string, {
    cups: number;
    unsupported_minima: number;
    undersupported: boolean;
    has_seamline: boolean;
  }>;
}

export interface EstimatedPrintTime {
  total_print_time_s: number;
  preprint_time_s: number;
  printing_time_s: number;
}

// App types
export interface Case {
  id: string;
  patientName: string;
  notes: string;
  status: 'new' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Scan {
  id: string;
  caseId: string;
  originalName: string;
  diskPath: string;
  fileSize: number;
  pairGroup: string | null;
  uploadedAt: string;
}

export interface Job {
  id: string;
  caseId: string;
  sceneId: string | null;
  printerName: string;
  printerId: string;
  jobName: string;
  status: 'submitted' | 'printing' | 'completed' | 'failed';
  formFilePath: string | null;
  estimatedTime: number | null;
  submittedAt: string;
  completedAt: string | null;
}

export interface LabelPose {
  position: Vec3;
  orientation: { z_direction: number[]; x_direction: number[] };
  text: string;
}
