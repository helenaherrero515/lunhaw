"use client";

import React, { useRef, useState, useImperativeHandle, forwardRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LibraryBuilding } from "./components/Building";
import { Tree } from "./components/Tree";

export interface LibrarySceneHandle {
  dropBooks: () => void;
}

const BOOK_COLORS = ["#245C43", "#3F8F2E", "#98D746", "#B7F9ED", "#79C24A", "#26332D"];

const LibrarySceneInternal = forwardRef<LibrarySceneHandle>((_, ref) => {
  const groupRef = useRef<THREE.Group>(null);

  // Generate 12 book definitions with stack targets
  const initialBooks = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const stackIndex = i % 4;
      const stackX = [-1.4, -0.6, 0.6, 1.4][stackIndex]!;
      const stackZ = (stackIndex % 2 === 0 ? 0.8 : -0.8);
      const stackY = 0.35 + Math.floor(i / 4) * 0.12;

      return {
        targetY: stackY,
        currentY: stackY + 5 + (i * 0.4),
        x: stackX + (Math.random() - 0.5) * 0.1,
        z: stackZ + (Math.random() - 0.5) * 0.1,
        rotY: Math.random() * Math.PI,
        color: BOOK_COLORS[i % BOOK_COLORS.length]!,
        vy: 0,
        bounced: 0,
      };
    });
  }, []);

  const [books, setBooks] = useState(initialBooks);

  // Expose dropBooks imperatively for the replay button
  useImperativeHandle(ref, () => ({
    dropBooks: () => {
      setBooks((prev) =>
        prev.map((b, i) => ({
          ...b,
          currentY: b.targetY + 4 + i * 0.3,
          vy: 0,
          bounced: 0,
        }))
      );
    },
  }));

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.04;
    }

    setBooks((prev) =>
      prev.map((b) => {
        if (b.currentY > b.targetY) {
          const gravity = 18 * delta;
          const newVy = b.vy + gravity;
          let newY = b.currentY - newVy * delta;

          if (newY <= b.targetY) {
            newY = b.targetY;
            if (b.bounced < 2) {
              return {
                ...b,
                currentY: newY,
                vy: -newVy * 0.4, // restitution bounce
                bounced: b.bounced + 1,
              };
            }
            return { ...b, currentY: newY, vy: 0 };
          }
          return { ...b, currentY: newY, vy: newVy };
        }
        return b;
      })
    );
  });

  return (
    <group ref={groupRef}>
      {/* Platform */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <cylinderGeometry args={[4.2, 4.6, 0.3, 32]} />
        <meshLambertMaterial color="#E8ECE9" />
      </mesh>

      {/* Library Model */}
      <LibraryBuilding position={[0, 0, -0.6]} scale={1.2} />

      {/* Reading Desks in Front */}
      <mesh position={[-1.0, 0.18, 0.8]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.35, 0.6]} />
        <meshLambertMaterial color="#7B5E45" />
      </mesh>
      <mesh position={[1.0, 0.18, 0.8]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.35, 0.6]} />
        <meshLambertMaterial color="#7B5E45" />
      </mesh>

      {/* Trees flanking the library */}
      <Tree position={[-2.4, 0, -0.4]} scale={0.9} foliageColor="#2E7D4F" />
      <Tree position={[2.4, 0, -0.4]} scale={0.9} foliageColor="#3F8F2E" round />

      {/* Dropping Book Stacks */}
      {books.map((b, i) => (
        <mesh
          key={i}
          position={[b.x, b.currentY, b.z]}
          rotation={[0, b.rotY, 0]}
          castShadow
        >
          <boxGeometry args={[0.35, 0.08, 0.25]} />
          <meshLambertMaterial color={b.color} />
        </mesh>
      ))}
    </group>
  );
});

LibrarySceneInternal.displayName = "LibrarySceneInternal";

export const LibraryScene = forwardRef<LibrarySceneHandle>((props, ref) => {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        shadows
        orthographic
        camera={{
          position: [5, 8, 8],
          zoom: 38,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[7, 12, 6]} intensity={1.1} castShadow />
        <LibrarySceneInternal ref={ref} />
      </Canvas>
    </div>
  );
});

LibraryScene.displayName = "LibraryScene";
