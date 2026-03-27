"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Text, Line } from "@react-three/drei";

interface BuildPlateGridProps {
  sizeX?: number;
  sizeY?: number;
}

export function BuildPlateGrid({ sizeX = 200, sizeY = 125 }: BuildPlateGridProps) {
  const gridGeometry = useMemo(() => {
    const points: number[] = [];
    const halfX = sizeX / 2;
    const halfY = sizeY / 2;
    const step = 10;

    for (let y = -halfY; y <= halfY; y += step) {
      points.push(-halfX, 0, y, halfX, 0, y);
    }
    for (let x = -halfX; x <= halfX; x += step) {
      points.push(x, 0, -halfY, x, 0, halfY);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, [sizeX, sizeY]);

  const borderPoints = useMemo((): [number, number, number][] => {
    const halfX = sizeX / 2;
    const halfY = sizeY / 2;
    return [
      [-halfX, 0.1, -halfY],
      [halfX, 0.1, -halfY],
      [halfX, 0.1, halfY],
      [-halfX, 0.1, halfY],
      [-halfX, 0.1, -halfY],
    ];
  }, [sizeX, sizeY]);

  return (
    <group>
      {/* Platform surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[sizeX, sizeY]} />
        <meshStandardMaterial color="#0a0a12" transparent opacity={0.95} />
      </mesh>

      {/* Grid lines */}
      <lineSegments geometry={gridGeometry}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.04} />
      </lineSegments>

      {/* Border - gradient blue to purple */}
      <Line
        points={borderPoints}
        color="#0070f3"
        lineWidth={1.5}
        transparent
        opacity={0.4}
      />

      {/* Dimension labels */}
      <Text
        position={[0, 0.5, sizeY / 2 + 8]}
        fontSize={5}
        color="#71717a"
        anchorX="center"
        anchorY="middle"
      >
        {sizeX}mm
      </Text>
      <Text
        position={[sizeX / 2 + 8, 0.5, 0]}
        fontSize={5}
        color="#71717a"
        anchorX="center"
        anchorY="middle"
        rotation={[0, -Math.PI / 2, 0]}
      >
        {sizeY}mm
      </Text>
    </group>
  );
}
