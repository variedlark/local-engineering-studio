import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, PerspectiveCamera, Plane, Box } from "@react-three/drei";
import * as THREE from "three";
import { THEME_CONFIG } from "../theme/ThemeConfig";

const WHITE_COLOR = new THREE.Color("#ffffff");

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
  const { baseColor, hoverColor, emissiveColor } = useMemo(() => {
    const base = new THREE.Color(component.color);
    const hover = base.clone().lerp(WHITE_COLOR, 0.18);
    const emissive = base.clone().lerp(WHITE_COLOR, 0.35);
    return { baseColor: base, hoverColor: hover, emissiveColor: emissive };
  }, [component.color]);

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
      castShadow
      receiveShadow
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => onSelectComponent(component.id)}
    >
      <meshPhysicalMaterial
        color={hovered ? hoverColor : baseColor}
        emissive={emissiveColor}
        emissiveIntensity={isSelected ? 0.75 : hovered ? 0.35 : 0.12}
        metalness={0.55}
        roughness={0.25}
        clearcoat={0.6}
        clearcoatRoughness={0.2}
      />
    </Box>
  );
});

const PCBPlane = memo(function PCBPlane() {
  return (
    <Plane args={[110, 110]} position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color="#0b0f14" metalness={0.25} roughness={0.85} />
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
      <color args={[THEME_CONFIG.colors.background]} attach="background" />
      <fog attach="fog" args={[THEME_CONFIG.colors.background, 45, 150]} />

      <ambientLight intensity={0.35} />
      <hemisphereLight intensity={0.35} color="#7bf3ff" groundColor="#120b14" />
      <directionalLight
        position={[80, 120, 60]}
        intensity={0.9}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <pointLight position={[-60, 80, -80]} intensity={0.35} color="#2ee8ff" />
      <spotLight position={[40, 60, 40]} intensity={0.4} angle={0.45} penumbra={0.6} castShadow />

      <Grid
        args={[120, 120]}
        cellSize={6}
        cellThickness={0.4}
        sectionSize={24}
        sectionThickness={0.8}
        cellColor="#1a1d24"
        sectionColor="#2c313b"
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
    <div className="canvas-surface" style={{ width: "100%", height: "100%" }}>
      <Canvas shadows dpr={[1, 2]} onPointerMissed={onDeselectAll}>
        <Scene3DContent
          components={components}
          selectedComponentIds={selectedComponentIds}
          onSelectComponent={onSelectComponent}
        />
      </Canvas>
    </div>
  );
}
