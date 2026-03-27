"use client";

import { useRef, useState, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as THREE from "three";

interface STLModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;
  selected?: boolean;
  onClick?: () => void;
}

export function STLModel({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  color = "#94a3b8",
  selected = false,
  onClick,
}: STLModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const geometry = useLoader(STLLoader, url);

  const centeredGeometry = useMemo(() => {
    const geo = geometry.clone();
    geo.computeBoundingBox();
    const center = new THREE.Vector3();
    geo.boundingBox!.getCenter(center);
    geo.translate(-center.x, -center.y, -center.z);
    // Move so bottom sits at y=0
    geo.computeBoundingBox();
    const minY = geo.boundingBox!.min.y;
    geo.translate(0, -minY, 0);
    return geo;
  }, [geometry]);

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
