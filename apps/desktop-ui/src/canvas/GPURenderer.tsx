import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

interface GPURendererProps {
  width: number;
  height: number;
  entityCount: number;
  onRender?: (renderer: THREE.WebGLRenderer) => void;
}

export const GPURenderer: React.FC<GPURendererProps> = ({
  width,
  height,
  entityCount,
  onRender,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1724);
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;

    // Initialize renderer with GPU acceleration
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create instanced geometry for efficient rendering
    const geometry = new THREE.BoxGeometry(1, 1, 0.5);
    const material = new THREE.MeshStandardMaterial({
      color: 0x6ec1ff,
      metalness: 0.5,
      roughness: 0.5,
    });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, entityCount);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    // Position instances in a grid
    const dummy = new THREE.Object3D();
    const gridSize = Math.ceil(Math.sqrt(entityCount));
    for (let i = 0; i < entityCount; i++) {
      const x = (i % gridSize) * 2 - gridSize;
      const y = Math.floor(i / gridSize) * 2 - gridSize;
      dummy.position.set(x, y, 0);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;

    scene.add(instancedMesh);
    instancedMeshRef.current = instancedMesh;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate instances
      if (instancedMeshRef.current) {
        instancedMeshRef.current.rotation.x += 0.001;
        instancedMeshRef.current.rotation.y += 0.002;
      }

      renderer.render(scene, camera);
      onRender?.(renderer);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const newWidth = containerRef.current?.clientWidth || width;
      const newHeight = containerRef.current?.clientHeight || height;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [width, height, entityCount, onRender]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
