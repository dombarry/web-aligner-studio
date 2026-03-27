"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { BuildPlateGrid } from "./BuildPlateGrid";
import { STLModel } from "./STLModel";

interface ModelData {
  id: string;
  url: string;
  name: string;
  position?: [number, number, number];
  color?: string;
  selected?: boolean;
}

interface STLViewerProps {
  models?: ModelData[];
  onModelClick?: (id: string) => void;
  buildPlateSize?: { x: number; y: number };
  className?: string;
}

export function STLViewer({
  models = [],
  onModelClick,
  buildPlateSize = { x: 200, y: 125 },
  className = ""
}: STLViewerProps) {
  return (
    <div className={`w-full h-full bg-[#0d1117] rounded-xl overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [0, 150, 200], fov: 45, near: 0.1, far: 2000 }}
        shadows
      >
        <color attach="background" args={["#0d1117"]} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[100, 200, 100]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-100, 100, -100]} intensity={0.3} />

        <Suspense fallback={null}>
          <BuildPlateGrid sizeX={buildPlateSize.x} sizeY={buildPlateSize.y} />

          {models.map((model) => (
            <STLModel
              key={model.id}
              url={model.url}
              position={model.position || [0, 0, 0]}
              color={model.color || "#94a3b8"}
              selected={model.selected}
              onClick={() => onModelClick?.(model.id)}
            />
          ))}

          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.4}
            scale={300}
            blur={2}
            far={200}
          />
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
          minDistance={50}
          maxDistance={500}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
