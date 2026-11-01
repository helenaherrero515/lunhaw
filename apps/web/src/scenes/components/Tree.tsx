"use client";

import React from "react";

interface TreeProps {
  position?: [number, number, number];
  scale?: number;
  foliageColor?: string;
  round?: boolean;
}

export function Tree({
  position = [0, 0, 0],
  scale = 1,
  foliageColor = "#2E7D4F",
  round = false,
}: TreeProps) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 6]} />
        <meshLambertMaterial color="#7B5E45" />
      </mesh>

      {/* Foliage */}
      {round ? (
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.55, 10, 10]} />
          <meshLambertMaterial color={foliageColor} />
        </mesh>
      ) : (
        <group position={[0, 0.7, 0]}>
          <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.5, 0.7, 7]} />
            <meshLambertMaterial color={foliageColor} />
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.38, 0.6, 7]} />
            <meshLambertMaterial color="#4FA56A" />
          </mesh>
        </group>
      )}
    </group>
  );
}
