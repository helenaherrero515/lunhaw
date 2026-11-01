"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Grasshopper } from "./components/Grasshopper";
import { Tree } from "./components/Tree";
import { LibraryBuilding } from "./components/Building";

interface JourneySceneProps {
  progress: number; // 0 to 1
}

function JourneyPath({ progress }: JourneySceneProps) {
  const hopperRef = useRef<THREE.Group>(null);
  const pathGroupRef = useRef<THREE.Group>(null);

  // Path key points: Home (step 0), Shaded Way (step 0.5), Library (step 1)
  const p0 = new THREE.Vector3(-3.0, 0.4, 1.2);
  const p1 = new THREE.Vector3(0.0, 0.4, 0.0);
  const p2 = new THREE.Vector3(3.0, 0.4, -1.2);

  useFrame((state, delta) => {
    // Parallax tilt
    if (pathGroupRef.current) {
      pathGroupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.03;
    }

    if (hopperRef.current) {
      // Calculate current position along quadratic curve
      const t = Math.max(0, Math.min(1, progress));
      const targetPos = new THREE.Vector3();

      if (t <= 0.5) {
        const localT = t / 0.5;
        targetPos.lerpVectors(p0, p1, localT);
        // Small hopping bounce
        targetPos.y += Math.sin(localT * Math.PI * 4) * 0.3;
      } else {
        const localT = (t - 0.5) / 0.5;
        targetPos.lerpVectors(p1, p2, localT);
        targetPos.y += Math.sin(localT * Math.PI * 4) * 0.3;
      }

      hopperRef.current.position.lerp(targetPos, Math.min(1, delta * 6));
      // Orient facing forward along path
      hopperRef.current.rotation.y = progress < 0.5 ? 0.3 : 0.6;
    }
  });

  return (
    <group ref={pathGroupRef}>
      {/* Diorama ground */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[9.5, 0.25, 4.5]} />
        <meshLambertMaterial color="#B7F9ED" />
      </mesh>

      {/* Pathway Tiles */}
      {[-3, -2, -1, 0, 1, 2, 3].map((x, i) => {
        const tileProg = (i + 1) / 7;
        const isWalked = progress >= tileProg - 0.15;
        return (
          <mesh
            key={i}
            position={[x, 0.06, -(x * 0.4)]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[0.85, 0.85]} />
            <meshLambertMaterial color={isWalked ? "#98D746" : "#E2EAE4"} />
          </mesh>
        );
      })}

      {/* Origin: Home Gate / Marker */}
      <group position={[-3.6, 0.1, 1.6]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshLambertMaterial color="#FFFFFF" />
        </mesh>
        <Tree position={[0.8, 0, 0.4]} scale={0.6} foliageColor="#2E7D4F" />
      </group>

      {/* Midpoint: Shaded Path Avenue */}
      <group position={[0, 0.1, 0]}>
        <Tree position={[-0.8, 0, -0.8]} scale={0.8} foliageColor="#2E7D4F" />
        <Tree position={[0.8, 0, 0.8]} scale={0.9} foliageColor="#3F8F2E" round />
      </group>

      {/* Destination: Public Library Building */}
      <group position={[3.6, 0.1, -1.6]}>
        <LibraryBuilding scale={0.7} />
        <Tree position={[1.0, 0, -0.6]} scale={0.7} foliageColor="#2E7D4F" />
      </group>

      {/* The Grasshopper Walking Journey */}
      <group ref={hopperRef} position={[p0.x, p0.y, p0.z]}>
        <Grasshopper scale={0.45} />
      </group>
    </group>
  );
}

export function JourneyScene({ progress }: JourneySceneProps) {
  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        orthographic
        camera={{
          position: [4, 9, 8],
          zoom: 36,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 12, 6]} intensity={1.1} castShadow />
        <JourneyPath progress={progress} />
      </Canvas>
    </div>
  );
}
