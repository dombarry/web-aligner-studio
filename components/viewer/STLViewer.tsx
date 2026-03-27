"use client";

import { Suspense, Component, ReactNode } from "react";
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

// Error boundary to catch STL loading failures per-model
class ModelErrorBoundary extends Component<
  { children: ReactNode; name: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; name: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error(`Failed to load model "${this.props.name}":`, error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function STLViewer({
  models = [],
  onModelClick,
  buildPlateSize = { x: 200, y: 125 },
  className = ""
}: STLViewerProps) {
  const camDistance = Math.max(buildPlateSize.x, buildPlateSize.y) * 1.2;

  return (
    <div className={`w-full h-full bg-[#0d1117] rounded-xl overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [0, camDistance * 0.7, camDistance], fov: 45, near: 0.1, far: 5000 }}
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

        {/* Build plate always visible */}
        <BuildPlateGrid sizeX={buildPlateSize.x} sizeY={buildPlateSize.y} />

        {/* Each model in its own Suspense + Error boundary */}
        {models.map((model) => (
          <ModelErrorBoundary key={model.id} name={model.name}>
            <Suspense fallback={null}>
              <STLModel
                url={model.url}
                position={model.position || [0, 0, 0]}
                color={model.color || "#94a3b8"}
                selected={model.selected}
                onClick={() => onModelClick?.(model.id)}
              />
            </Suspense>
          </ModelErrorBoundary>
        ))}

        <ContactShadows
          position={[0, -0.5, 0]}
          opacity={0.4}
          scale={Math.max(buildPlateSize.x, buildPlateSize.y) * 1.5}
          blur={2}
          far={200}
        />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
          minDistance={20}
          maxDistance={1000}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
