import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '@/components/theme-provider';

function TrafficGrid() {
  const { theme } = useTheme();
  // Light mode: Silver/Gray, Dark mode: Cyan/Blue
  const gridColor = theme === 'dark' ? '#0ea5e9' : '#94a3b8';
  const opacity = theme === 'dark' ? 0.2 : 0.4;

  return (
    <group rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -2, 0]}>
      <gridHelper args={[100, 50, gridColor, gridColor]} position={[0, 0, 0]}>
        <meshBasicMaterial attach="material" color={gridColor} transparent opacity={opacity} />
      </gridHelper>
    </group>
  );
}

function DataStreams() {
  const { theme } = useTheme();
  const count = 40;
  // Light mode: Vibrant Indigo, Dark mode: Neon Cyan
  const streamColor = theme === 'dark' ? '#22d3ee' : '#4f46e5';

  // Create random streams
  const streams = useMemo(() => {
    return Array.from({ length: count }, () => ({
      pos: [ (Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40 ],
      speed: 0.1 + Math.random() * 0.4,
      axis: Math.random() > 0.5 ? 0 : 2, // X or Z axis
    }));
  }, [count]);

  const pointsRef = useRef();

  useFrame((state) => {
    const positions = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const s = streams[i];
      // Move along axis
      positions[i * 3 + s.axis] += s.speed;
      
      // Reset if out of bounds
      if (positions[i * 3 + s.axis] > 20) {
        positions[i * 3 + s.axis] = -20;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const initialPositions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    streams.forEach((s, i) => {
      pos[i * 3] = s.pos[0];
      pos[i * 3 + 1] = s.pos[1];
      pos[i * 3 + 2] = s.pos[2];
    });
    return pos;
  }, [streams]);

  return (
    <Points ref={pointsRef} positions={initialPositions} stride={3} position={[0, -1.9, 0]} rotation={[-Math.PI / 2.5, 0, 0]}>
      <PointMaterial
        transparent
        color={streamColor}
        size={0.15}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={theme === 'dark' ? 0.8 : 1.0}
      />
    </Points>
  );
}

function ScanningBeam() {
  const ref = useRef();
  const { theme } = useTheme();
  // Light mode: Cyan, Dark mode: Purple
  const beamColor = theme === 'dark' ? '#8b5cf6' : '#06b6d4';

  useFrame((state) => {
    ref.current.position.z = Math.sin(state.clock.elapsedTime) * 10;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1.8, 0]}>
      <planeGeometry args={[40, 0.2]} />
      <meshBasicMaterial color={beamColor} transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function Background3D() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 5, 15], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <TrafficGrid />
        <DataStreams />
        <ScanningBeam />
      </Canvas>
    </div>
  );
}
