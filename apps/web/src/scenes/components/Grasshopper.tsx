"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface GrasshopperProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function Grasshopper({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 0.6,
}: GrasshopperProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = Math.sin(t * 8) * 0.2;
      rightLegRef.current.rotation.x = -Math.sin(t * 8) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Abdomen / Torso */}
      <mesh position={[0, 0.45, -0.2]} castShadow receiveShadow>
        <capsuleGeometry args={[0.22, 0.6, 8, 16]} />
        <meshLambertMaterial color="#98D746" />
      </mesh>

      {/* Thorax */}
      <mesh position={[0, 0.52, 0.22]} castShadow receiveShadow>
        <boxGeometry args={[0.32, 0.35, 0.35]} />
        <meshLambertMaterial color="#79C24A" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.62, 0.45]} castShadow receiveShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshLambertMaterial color="#98D746" />
      </mesh>

      {/* Eyes */}
      <mesh position={[0.14, 0.7, 0.52]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshLambertMaterial color="#26332D" />
      </mesh>
      <mesh position={[-0.14, 0.7, 0.52]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshLambertMaterial color="#26332D" />
      </mesh>

      {/* Antennae */}
      <mesh position={[0.08, 0.88, 0.58]} rotation={[0.4, 0, 0.2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
        <meshLambertMaterial color="#245C43" />
      </mesh>
      <mesh position={[-0.08, 0.88, 0.58]} rotation={[0.4, 0, -0.2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
        <meshLambertMaterial color="#245C43" />
      </mesh>

      {/* Left Back Leg */}
      <group ref={leftLegRef} position={[0.22, 0.5, -0.2]}>
        {/* Femur */}
        <mesh position={[0.15, 0.25, -0.1]} rotation={[-0.6, 0.3, 0.6]}>
          <capsuleGeometry args={[0.07, 0.5, 6, 8]} />
          <meshLambertMaterial color="#3F8F2E" />
        </mesh>
        {/* Tibia */}
        <mesh position={[0.26, -0.1, -0.3]} rotation={[0.8, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.02, 0.6, 6]} />
          <meshLambertMaterial color="#245C43" />
        </mesh>
      </group>

      {/* Right Back Leg */}
      <group ref={rightLegRef} position={[-0.22, 0.5, -0.2]}>
        {/* Femur */}
        <mesh position={[-0.15, 0.25, -0.1]} rotation={[-0.6, -0.3, -0.6]}>
          <capsuleGeometry args={[0.07, 0.5, 6, 8]} />
          <meshLambertMaterial color="#3F8F2E" />
        </mesh>
        {/* Tibia */}
        <mesh position={[-0.26, -0.1, -0.3]} rotation={[0.8, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.02, 0.6, 6]} />
          <meshLambertMaterial color="#245C43" />
        </mesh>
      </group>
    </group>
  );
}
