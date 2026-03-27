"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as THREE from "three";
import { getToothColor, TOOTH_NAMES } from "@/lib/segmentation/types";
import type { ToothSegment, SegmentationResult } from "@/lib/segmentation/types";

const GINGIVA_COLOR = new THREE.Color("#e8b4b8");
const UNASSIGNED_COLOR = new THREE.Color("#94a3b8");
const BRUSH_INDICATOR_COLOR = "#ffffff";

interface PaintableSTLViewerProps {
  url: string;
  activeToothNumber: number | null;
  brushRadius: number;
  isPainting: boolean;
  onSegmentationUpdate: (result: SegmentationResult) => void;
  scanId: string;
  arch: "upper" | "lower";
  className?: string;
}

interface PaintableMeshProps {
  url: string;
  activeToothNumber: number | null;
  brushRadius: number;
  isPainting: boolean;
  onSegmentationUpdate: (result: SegmentationResult) => void;
  scanId: string;
  arch: "upper" | "lower";
}

function PaintableMesh({
  url,
  activeToothNumber,
  brushRadius,
  isPainting,
  onSegmentationUpdate,
  scanId,
  arch,
}: PaintableMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const brushIndicatorRef = useRef<THREE.Mesh>(null);
  const geometry = useLoader(STLLoader, url);
  const { raycaster, camera, pointer, gl } = useThree();

  // Per-vertex tooth assignment: 0 = unassigned, -1 = gingiva, 1-32 = tooth number
  const vertexAssignments = useRef<Int8Array | null>(null);
  const [brushPos, setBrushPos] = useState<THREE.Vector3 | null>(null);
  const [brushNormal, setBrushNormal] = useState<THREE.Vector3 | null>(null);

  const centeredGeometry = useMemo(() => {
    const geo = geometry.clone();
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const center = new THREE.Vector3();
    bb.getCenter(center);
    geo.translate(-center.x, -center.y, -center.z);

    // Auto-scale if needed
    const size = new THREE.Vector3();
    bb.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim < 1) {
      geo.scale(1000, 1000, 1000);
    } else if (maxDim > 500) {
      const s = 80 / maxDim;
      geo.scale(s, s, s);
    }

    geo.computeBoundingBox();
    const minY = geo.boundingBox!.min.y;
    geo.translate(0, -minY, 0);

    // Ensure we have vertex colors
    const posAttr = geo.getAttribute("position");
    const vertexCount = posAttr.count;
    const colors = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      colors[i * 3] = UNASSIGNED_COLOR.r;
      colors[i * 3 + 1] = UNASSIGNED_COLOR.g;
      colors[i * 3 + 2] = UNASSIGNED_COLOR.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Initialize assignments
    vertexAssignments.current = new Int8Array(vertexCount);

    geo.computeVertexNormals();
    return geo;
  }, [geometry]);

  const paintVertices = useCallback(
    (point: THREE.Vector3, toothNumber: number | null) => {
      if (!centeredGeometry || !vertexAssignments.current) return;

      const posAttr = centeredGeometry.getAttribute("position");
      const colorAttr = centeredGeometry.getAttribute("color");
      const assignments = vertexAssignments.current;
      const radiusSq = brushRadius * brushRadius;
      let changed = false;

      const assignValue = toothNumber === null ? 0 : toothNumber === -1 ? -1 : toothNumber;
      const paintColor =
        toothNumber === null
          ? UNASSIGNED_COLOR
          : toothNumber === -1
          ? GINGIVA_COLOR
          : new THREE.Color(getToothColor(toothNumber));

      const vertex = new THREE.Vector3();
      for (let i = 0; i < posAttr.count; i++) {
        vertex.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        if (vertex.distanceToSquared(point) <= radiusSq) {
          if (assignments[i] !== assignValue) {
            assignments[i] = assignValue;
            colorAttr.setXYZ(i, paintColor.r, paintColor.g, paintColor.b);
            changed = true;
          }
        }
      }

      if (changed) {
        colorAttr.needsUpdate = true;
        emitSegmentation();
      }
    },
    [centeredGeometry, brushRadius]
  );

  const emitSegmentation = useCallback(() => {
    if (!vertexAssignments.current || !centeredGeometry) return;

    const assignments = vertexAssignments.current;
    const posAttr = centeredGeometry.getAttribute("position");
    const teethMap = new Map<number, { indices: number[]; sumX: number; sumY: number; sumZ: number }>();
    const gingivaIndices: number[] = [];

    for (let i = 0; i < assignments.length; i++) {
      const v = assignments[i];
      if (v > 0) {
        let entry = teethMap.get(v);
        if (!entry) {
          entry = { indices: [], sumX: 0, sumY: 0, sumZ: 0 };
          teethMap.set(v, entry);
        }
        entry.indices.push(i);
        entry.sumX += posAttr.getX(i);
        entry.sumY += posAttr.getY(i);
        entry.sumZ += posAttr.getZ(i);
      } else if (v === -1) {
        gingivaIndices.push(i);
      }
    }

    const teeth: ToothSegment[] = [];
    for (const [num, data] of teethMap) {
      const count = data.indices.length;
      const cx = data.sumX / count;
      const cy = data.sumY / count;
      const cz = data.sumZ / count;

      // Compute bounding box
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      for (const idx of data.indices) {
        const x = posAttr.getX(idx), y = posAttr.getY(idx), z = posAttr.getZ(idx);
        if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z;
        if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z;
      }

      teeth.push({
        toothNumber: num,
        label: TOOTH_NAMES[num] || `Tooth ${num}`,
        arch: num <= 16 ? "upper" : "lower",
        quadrant: num <= 8 ? 1 : num <= 16 ? 2 : num <= 24 ? 3 : 4,
        vertexIndices: data.indices,
        centroid: { x: cx, y: cy, z: cz },
        boundingBox: {
          min: { x: minX, y: minY, z: minZ },
          max: { x: maxX, y: maxY, z: maxZ },
        },
        color: getToothColor(num),
      });
    }

    onSegmentationUpdate({
      scanId,
      arch,
      teeth,
      totalVertices: assignments.length,
      gingivaVertexIndices: gingivaIndices,
      segmentedAt: new Date().toISOString(),
    });
  }, [centeredGeometry, scanId, arch, onSegmentationUpdate]);

  // Handle raycasting for brush position
  const updateBrush = useCallback(
    (event?: { clientX: number; clientY: number }) => {
      if (!meshRef.current) return;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(meshRef.current);

      if (intersects.length > 0) {
        setBrushPos(intersects[0].point.clone());
        setBrushNormal(intersects[0].face?.normal?.clone() || null);
        return intersects[0].point;
      } else {
        setBrushPos(null);
        setBrushNormal(null);
        return null;
      }
    },
    [raycaster, pointer, camera]
  );

  // Paint on pointer move when painting is active
  const isMouseDown = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;

    const onDown = (e: PointerEvent) => {
      if (!isPainting || activeToothNumber === null) return;
      isMouseDown.current = true;
      // Raycast and paint
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const pt = updateBrush();
      if (pt) paintVertices(pt, activeToothNumber);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      updateBrush();
      if (isMouseDown.current && isPainting && activeToothNumber !== null) {
        const pt = brushPos;
        if (pt) paintVertices(pt, activeToothNumber);
      }
    };

    const onUp = () => {
      isMouseDown.current = false;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onUp);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onUp);
    };
  }, [gl, isPainting, activeToothNumber, paintVertices, updateBrush, pointer, brushPos]);

  return (
    <group>
      <mesh ref={meshRef} geometry={centeredGeometry} castShadow receiveShadow>
        <meshStandardMaterial vertexColors metalness={0.05} roughness={0.7} flatShading={false} />
      </mesh>

      {/* Brush indicator */}
      {brushPos && isPainting && (
        <mesh ref={brushIndicatorRef} position={brushPos}>
          <sphereGeometry args={[brushRadius, 16, 16]} />
          <meshBasicMaterial
            color={activeToothNumber ? getToothColor(activeToothNumber) : BRUSH_INDICATOR_COLOR}
            transparent
            opacity={0.25}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

export function PaintableSTLViewer({
  url,
  activeToothNumber,
  brushRadius,
  isPainting,
  onSegmentationUpdate,
  scanId,
  arch,
  className = "",
}: PaintableSTLViewerProps) {
  return (
    <div className={`w-full h-full bg-[#0d1117] rounded-xl overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [0, 80, 120], fov: 45, near: 0.1, far: 2000 }}
        shadows
      >
        <color attach="background" args={["#0d1117"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[80, 150, 80]} intensity={1} castShadow />
        <directionalLight position={[-80, 80, -80]} intensity={0.3} />

        <PaintableMesh
          url={url}
          activeToothNumber={activeToothNumber}
          brushRadius={brushRadius}
          isPainting={isPainting}
          onSegmentationUpdate={onSegmentationUpdate}
          scanId={scanId}
          arch={arch}
        />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
          minDistance={20}
          maxDistance={400}
          enabled={!isPainting}
        />
      </Canvas>
    </div>
  );
}
