import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Plane, Box } from '@react-three/drei';
import * as THREE from 'three';

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
        color={isSelected ? '#00ff00' : hovered ? '#ffff00' : component.color}
        emissive={isSelected ? '#00aa00' : hovered ? '#ffaa00' : '#000000'}
        emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0}
        metalness={0.7}
        roughness={0.2}
      />
    </Box>
  );
});

const PCBPlane = memo(function PCBPlane() {
  return (
    <Plane args={[100, 100]} position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.7} />
    </Plane>
  );
});

function Scene3DContent({
  components,
  selectedComponentIds,
  onSelectComponent,
}: Omit<Canvas3DProps, 'onDeselectAll'>) {
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
      <OrbitControls />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 100, 100]} intensity={1} castShadow />
      <pointLight position={[-100, 100, -100]} intensity={0.5} />

      {/* Grid and PCB */}
      <Grid args={[100, 100]} cellSize={5} cellColor="#444" sectionSize={25} sectionColor="#888" />
      <PCBPlane />

      {/* Components */}
      {componentNodes}
    </>
  );
}

export function Canvas3D({ components, selectedComponentIds, onSelectComponent, onDeselectAll }: Canvas3DProps) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#0f1724' }}>
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
