"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Tree } from "./components/Tree";

interface GreenIndexSceneProps {
  treeCount: number; // 0 to 12
}

function StreetDiorama({ treeCount }: GreenIndexSceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  // 12 slot positions along left and right sidewalks
  const slots = useMemo(
    () => [
      { x: -1.6, z: -3.0 },
      { x: 1.6, z: -3.0 },
      { x: -1.6, z: -1.8 },
      { x: 1.6, z: -1.8 },
      { x: -1.6, z: -0.6 },
      { x: 1.6, z: -0.6 },
      { x: -1.6, z: 0.6 },
      { x: 1.6, z: 0.6 },
      { x: -1.6, z: 1.8 },
      { x: 1.6, z: 1.8 },
      { x: -1.6, z: 3.0 },
      { x: 1.6, z: 3.0 },
    ],
    []
  );

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle idle sway
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Base platform */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[5.8, 0.4, 7.8]} />
        <meshLambertMaterial color="#DDE5DF" />
      </mesh>

      {/* Road / Asphalt */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.2, 7.6]} />
        <meshLambertMaterial color="#3E4A44" />
      </mesh>

      {/* Road Center Dashes */}
      {[-2.8, -1.4, 0, 1.4, 2.8].map((z, i) => (
        <mesh key={i} position={[0, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 0.6]} />
          <meshBasicMaterial color="#F7F7F0" />
        </mesh>
      ))}

      {/* Left Sidewalk */}
      <mesh position={[-1.7, 0.08, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.16, 7.6]} />
        <meshLambertMaterial color="#E8ECE9" />
      </mesh>

      {/* Right Sidewalk */}
      <mesh position={[1.7, 0.08, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.16, 7.6]} />
        <meshLambertMaterial color="#E8ECE9" />
      </mesh>

      {/* Street Lamps */}
      {[-2.2, 0, 2.2].map((z, i) => (
        <React.Fragment key={i}>
          <group position={[-2.1, 0.15, z]}>
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.02, 0.03, 1.6, 6]} />
              <meshLambertMaterial color="#26332D" />
            </mesh>
            <mesh position={[0.1, 1.6, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#FFF4B8" />
            </mesh>
          </group>
          <group position={[2.1, 0.15, z]}>
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.02, 0.03, 1.6, 6]} />
              <meshLambertMaterial color="#26332D" />
            </mesh>
            <mesh position={[-0.1, 1.6, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#FFF4B8" />
            </mesh>
          </group>
        </React.Fragment>
      ))}

      {/* Dynamically Planted Trees (0 to 12) */}
      {slots.map((slot, index) => {
        const isPlanted = index < treeCount;
        return isPlanted ? (
          <group key={index} position={[slot.x, 0.16, slot.z]}>
            <Tree scale={0.8} foliageColor={index % 2 === 0 ? "#2E7D4F" : "#3F8F2E"} round={index % 3 === 0} />
          </group>
        ) : null;
      })}
    </group>
  );
}

export function GreenIndexScene({ treeCount }: GreenIndexSceneProps) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        shadows
        orthographic
        camera={{
          position: [6, 8, 8],
          zoom: 36,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[8, 14, 6]} intensity={1.2} castShadow />
        <StreetDiorama treeCount={treeCount} />
      </Canvas>
    </div>
  );
}
