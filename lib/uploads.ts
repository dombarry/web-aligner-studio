import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UPLOAD_DIR, FILE_PAIR_REGEX } from './constants';

export async function saveUploadedFile(
  file: File,
  caseId: string
): Promise<{ uploadId: string; diskPath: string; originalName: string; fileSize: number; pairGroup: string | null }> {
  const uploadId = uuidv4();
  const caseDir = path.join(process.cwd(), UPLOAD_DIR, caseId);
  await mkdir(caseDir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._\- ]/g, '_');
  const diskPath = path.join(caseDir, `${uploadId}_${safeName}`);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  const match = file.name.match(FILE_PAIR_REGEX);
  const pairGroup = match ? match[1] : null;

  return {
    uploadId,
    diskPath: path.resolve(diskPath),
    originalName: file.name,
    fileSize: buffer.length,
    pairGroup,
  };
}

export function getUploadPath(diskPath: string): string {
  return path.resolve(diskPath);
}
