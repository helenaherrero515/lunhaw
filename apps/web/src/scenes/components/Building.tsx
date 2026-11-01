"use client";

import React from "react";

interface BuildingProps {
  position?: [number, number, number];
  size?: [number, number, number];
  color?: string;
}

export function Building({
  position = [0, 0, 0],
  size = [0.8, 1.4, 0.8],
  color = "#E8ECE9",
}: BuildingProps) {
  const [w, h, d] = size;
  return (
    <group position={position}>
      {/* Main structure */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Roof trim */}
      <mesh position={[0, h + 0.05, 0]}>
        <boxGeometry args={[w * 1.05, 0.1, d * 1.05]} />
        <meshLambertMaterial color="#245C43" />
      </mesh>
    </group>
  );
}

export function LibraryBuilding({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Base platform */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.2, 1.2]} />
        <meshLambertMaterial color="#DDE5DF" />
      </mesh>
      {/* Main Hall */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.8, 1.0]} />
        <meshLambertMaterial color="#FFFFFF" />
      </mesh>
      {/* Columns */}
      {[-0.5, -0.25, 0, 0.25, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.6, 0.55]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
          <meshLambertMaterial color="#F7F7F0" />
        </mesh>
      ))}
      {/* Triangular Pediment / Gable */}
      <mesh position={[0, 1.15, 0.2]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.9, 0.4, 4]} />
        <meshLambertMaterial color="#B7F9ED" />
      </mesh>
    </group>
  );
}
