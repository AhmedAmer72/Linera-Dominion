'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Stars, 
  OrbitControls, 
  Float, 
  Sparkles,
  useTexture,
  MeshDistortMaterial,
  GradientTexture,
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Animated nebula clouds
function NebulaCloud({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      meshRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.15) * 0.1;
      meshRef.current.rotation.z += 0.001;
    }
  });

  return (
    <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[2, 4]} />
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.15}
          distort={0.6}
          speed={2}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
}

// Animated planet
function Planet({ position, size, color, rings = false }: { 
  position: [number, number, number]; 
  size: number; 
  color: string;
  rings?: boolean;
}) {
  const planetRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.002;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.z += 0.001;
    }
  });

  return (
    <group position={position}>
      <Float speed={0.3} floatIntensity={0.2}>
        <mesh ref={planetRef}>
          <sphereGeometry args={[size, 64, 64]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
        {rings && (
          <mesh ref={ringsRef} rotation={[Math.PI / 2.5, 0, 0]}>
            <ringGeometry args={[size * 1.4, size * 2, 64]} />
            <meshStandardMaterial 
              color={color} 
              transparent 
              opacity={0.6} 
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        {/* Atmosphere glow */}
        <mesh scale={1.1}>
          <sphereGeometry args={[size, 32, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} />
        </mesh>
      </Float>
    </group>
  );
}

// Animated warp trail particles
function WarpTrails() {
  const count = 1000;
  const mesh = useRef<THREE.Points>(null);
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200;
      
      vel[i * 3] = 0;
      vel[i * 3 + 1] = 0;
      vel[i * 3 + 2] = (Math.random() * 0.5 + 0.5) * 2;
    }
    
    return [pos, vel];
  }, []);

  useFrame(() => {
    if (mesh.current) {
      const positions = mesh.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 2] -= velocities[i * 3 + 2];
        
        if (positions[i * 3 + 2] < -100) {
          positions[i * 3 + 2] = 100;
          positions[i * 3] = (Math.random() - 0.5) * 100;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        }
      }
      
      mesh.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#6219ff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Animated starship
function Starship({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={0.5}>
      {/* Ship body */}
      <mesh>
        <coneGeometry args={[0.3, 1.5, 8]} />
        <meshStandardMaterial color="#4a90d9" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Wings */}
      <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.1, 0.8, 0.3]} />
        <meshStandardMaterial color="#3a80c9" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.4, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.1, 0.8, 0.3]} />
        <meshStandardMaterial color="#3a80c9" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Engine glow */}
      <mesh position={[0, -0.8, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#00e66c" transparent opacity={0.8} />
      </mesh>
      <Sparkles count={20} scale={1} size={2} speed={0.5} color="#00e66c" position={[0, -1, 0]} />
    </group>
  );
}

// Sun/star with corona
function Sun({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
    if (coronaRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      coronaRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[3, 64, 64]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>
      <mesh ref={coronaRef} scale={1.3}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.3} />
      </mesh>
      <pointLight color="#ffaa00" intensity={100} distance={100} />
      <Sparkles count={100} scale={8} size={3} speed={0.3} color="#ffaa00" />
    </group>
  );
}

// Asteroid field
function AsteroidField({ count = 50, radius = 30 }: { count?: number; radius?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const asteroids = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 10;
      temp.push({
        position: [
          Math.cos(angle) * r,
          (Math.random() - 0.5) * 5,
          Math.sin(angle) * r,
        ] as [number, number, number],
        scale: Math.random() * 0.5 + 0.2,
        rotation: Math.random() * Math.PI * 2,
      });
    }
    return temp;
  }, [count, radius]);

  useFrame((state) => {
    if (meshRef.current) {
      asteroids.forEach((asteroid, i) => {
        const matrix = new THREE.Matrix4();
        const angle = (i / count) * Math.PI * 2 + state.clock.elapsedTime * 0.02;
        const r = radius + Math.sin(i) * 5;
        
        matrix.setPosition(
          Math.cos(angle) * r,
          asteroid.position[1],
          Math.sin(angle) * r
        );
        matrix.scale(new THREE.Vector3(asteroid.scale, asteroid.scale, asteroid.scale));
        
        meshRef.current!.setMatrixAt(i, matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#666666" roughness={0.9} />
    </instancedMesh>
  );
}

// Main scene content
function SceneContent() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.1} />
      
      {/* Stars background */}
      <Stars radius={300} depth={100} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Nebula clouds */}
      <NebulaCloud position={[-30, 20, -50]} color="#6219ff" scale={3} />
      <NebulaCloud position={[40, -10, -60]} color="#00b8e6" scale={2.5} />
      <NebulaCloud position={[0, 30, -80]} color="#00e66c" scale={2} />
      
      {/* Central sun */}
      <Sun position={[0, 0, -40]} />
      
      {/* Planets */}
      <Planet position={[-15, 5, -20]} size={1.5} color="#4a90d9" />
      <Planet position={[20, -3, -25]} size={2} color="#9b59b6" rings />
      <Planet position={[-25, -8, -35]} size={1} color="#e67e22" />
      
      {/* Asteroid field */}
      <AsteroidField count={80} radius={25} />
      
      {/* Warp particles */}
      <WarpTrails />
      
      {/* Floating starship */}
      <Starship position={[5, 2, -10]} />
      
      {/* Extra sparkles */}
      <Sparkles count={200} scale={50} size={2} speed={0.2} color="#ffffff" />
      
      {/* Camera controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 3}
      />
    </>
  );
}

// Post-processing effects
function Effects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.5}
        luminanceThreshold={0.1}
        luminanceSmoothing={0.9}
        blendFunction={BlendFunction.SCREEN}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.001, 0.001)}
        radialModulation={false}
        modulationOffset={0.5}
      />
      <Vignette eskil={false} offset={0.1} darkness={0.8} />
    </EffectComposer>
  );
}

export function SpaceScene() {
  return (
    <Canvas
      camera={{ position: [0, 5, 20], fov: 60 }}
      gl={{ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      style={{ pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <SceneContent />
        <Effects />
      </Suspense>
    </Canvas>
  );
}
