import { BoundingBox, LabelPose } from './types';
import { DEFAULT_LABEL_SETTINGS, type LabelSettings } from './constants';

export function calculateLabelPose(
  boundingBox: BoundingBox,
  labelText: string,
  settings: LabelSettings = DEFAULT_LABEL_SETTINGS
): LabelPose {
  const { min_corner, max_corner } = boundingBox;

  const position = {
    x: max_corner.x,
    y: (min_corner.y + max_corner.y) / 2.0,
    z: min_corner.z + settings.verticalOffsetMm,
  };

  const orientation = {
    z_direction: [1, 0, 0],
    x_direction: [0, 1, 0],
  };

  const text = labelText.slice(0, settings.maxLabelLen);

  return { position, orientation, text };
}
