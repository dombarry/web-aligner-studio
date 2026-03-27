"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as THREE from "three";

export interface ModelClickEvent {
  point: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
}

interface STLModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;
  selected?: boolean;
  onClick?: () => void;
  onSurfaceClick?: (event: ModelClickEvent) => void;
  autoScale?: boolean;
  targetSize?: number;
}

export function STLModel({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  color = "#94a3b8",
  selected = false,
  onClick,
  onSurfaceClick,
  autoScale = true,
  targetSize = 80,
}: STLModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const geometry = useLoader(STLLoader, url);

  const { centeredGeometry, computedScale } = useMemo(() => {
    const geo = geometry.clone();
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const center = new THREE.Vector3();
    bb.getCenter(center);
    geo.translate(-center.x, -center.y, -center.z);

    // Compute size to determine if auto-scaling is needed
    const size = new THREE.Vector3();
    bb.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    let autoScaleFactor = 1;
    if (autoScale && maxDim > 0) {
      // If model is very small (likely in meters) or very large, scale to target
      if (maxDim < 1) {
        // Model is likely in meters, convert to mm
        autoScaleFactor = 1000;
      } else if (maxDim > 500) {
        // Model is too large, scale down to fit build plate
        autoScaleFactor = targetSize / maxDim;
      }
    }

    if (autoScaleFactor !== 1) {
      geo.scale(autoScaleFactor, autoScaleFactor, autoScaleFactor);
    }

    // Recompute bounding box after scaling
    geo.computeBoundingBox();
    const minY = geo.boundingBox!.min.y;
    geo.translate(0, -minY, 0);

    return { centeredGeometry: geo, computedScale: autoScaleFactor };
  }, [geometry, autoScale, targetSize]);

  const displayColor = selected ? "#3b82f6" : hovered ? "#60a5fa" : color;

  return (
    <mesh
      ref={meshRef}
      geometry={centeredGeometry}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
        if (onSurfaceClick && e.face) {
          onSurfaceClick({
            point: { x: e.point.x, y: e.point.y, z: e.point.z },
            normal: { x: e.face.normal.x, y: e.face.normal.y, z: e.face.normal.z },
          });
        }
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={displayColor}
        metalness={0.1}
        roughness={0.6}
        flatShading={false}
      />
      {selected && (
        <lineSegments>
          <edgesGeometry args={[centeredGeometry, 30]} />
          <lineBasicMaterial color="#60a5fa" linewidth={1} />
        </lineSegments>
      )}
    </mesh>
  );
}
