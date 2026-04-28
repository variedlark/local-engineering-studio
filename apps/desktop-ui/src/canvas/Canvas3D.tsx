import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, PerspectiveCamera, Plane, Box } from "@react-three/drei";
import * as THREE from "three";

interface Component3D {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  color: string;
  layer: number;
}

interface Canvas3DProps {
  components: Component3D[];
  selectedComponentIds: string[];
  onSelectComponent: (id: string) => void;
  onDeselectAll: () => void;
}

interface Scene3DContentProps {
  components: Component3D[];
  selectedComponentIds: string[];
  onSelectComponent: (id: string) => void;
}

const ComponentBox = memo(function ComponentBox({ component, isSelected, onSelectComponent }: {
  component: Component3D;
  isSelected: boolean;
  onSelectComponent: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <Box
      ref={meshRef}
      position={[component.x / 100, component.z / 100, component.y / 100]}
      scale={[component.width / 100, component.depth / 100, component.height / 100]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => onSelectComponent(component.id)}
    >
      <meshStandardMaterial
        color={component.color}
        emissive={isSelected ? "#6ef6ff" : hovered ? "#2ee8ff" : "#000000"}
        emissiveIntensity={isSelected ? 0.7 : hovered ? 0.25 : 0}
        metalness={0.4}
        roughness={0.35}
      />
    </Box>
  );
});

const PCBPlane = memo(function PCBPlane() {
  return (
    <Plane args={[100, 100]} position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#0b0b0c" metalness={0.2} roughness={0.8} />
    </Plane>
  );
});

function Scene3DContent({
  components,
  selectedComponentIds,
  onSelectComponent,
}: Scene3DContentProps) {
  const { camera } = useThree();
  const selectedSet = useMemo(() => new Set(selectedComponentIds), [selectedComponentIds]);
  const componentNodes = useMemo(
    () =>
      components.map((component) => (
        <ComponentBox
          key={component.id}
          component={component}
          isSelected={selectedSet.has(component.id)}
          onSelectComponent={onSelectComponent}
        />
      )),
    [components, onSelectComponent, selectedSet],
  );

  useEffect(() => {
    camera.position.set(50, 50, 50);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[50, 50, 50]} />
      <OrbitControls enableDamping dampingFactor={0.12} />
      <color args={["#050505"]} attach="background" />

      <ambientLight intensity={0.45} />
      <directionalLight position={[80, 120, 60]} intensity={0.9} />
      <pointLight position={[-60, 80, -80]} intensity={0.4} />

      <Grid
        args={[120, 120]}
        cellSize={6}
        cellThickness={0.4}
        sectionSize={24}
        sectionThickness={0.8}
        cellColor="#1b1d22"
        sectionColor="#2a2d35"
        fadeDistance={40}
        fadeStrength={1}
      />
      <PCBPlane />

      {componentNodes}
    </>
  );
}

export function Canvas3D({ components, selectedComponentIds, onSelectComponent, onDeselectAll }: Canvas3DProps) {
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--les-bg)" }}>
      <Canvas shadows onPointerMissed={onDeselectAll}>
        <Scene3DContent
          components={components}
          selectedComponentIds={selectedComponentIds}
          onSelectComponent={onSelectComponent}
        />
      </Canvas>
    </div>
  );
}
