import { NextRequest } from 'next/server';
import { saveUploadedFile } from '@/lib/uploads';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const caseId = formData.get('caseId') as string;

    if (!caseId) {
      return Response.json({ error: 'caseId is required' }, { status: 400 });
    }

    const files = formData.getAll('files') as File[];
    if (files.length === 0) {
      return Response.json({ error: 'No files provided' }, { status: 400 });
    }

    const db = getDb();
    const results = [];

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.stl')) {
        results.push({ error: `${file.name} is not an STL file`, fileName: file.name });
        continue;
      }

      const { uploadId, diskPath, originalName, fileSize, pairGroup } =
        await saveUploadedFile(file, caseId);

      const scanId = uploadId;
      db.prepare(
        `INSERT INTO scans (id, caseId, originalName, diskPath, fileSize, pairGroup)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(scanId, caseId, originalName, diskPath, fileSize, pairGroup);

      results.push({
        id: scanId,
        caseId,
        originalName,
        diskPath,
        fileSize,
        pairGroup,
      });
    }

    return Response.json({ uploads: results });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
