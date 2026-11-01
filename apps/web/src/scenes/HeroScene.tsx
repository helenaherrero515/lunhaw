"use client";

import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Grasshopper } from "./components/Grasshopper";
import { Tree } from "./components/Tree";
import { Building, LibraryBuilding } from "./components/Building";

const STOPS = [
  { name: "Rizal Park", type: "Park", x: -2.6, z: -0.5 },
  { name: "National Library", type: "Library", x: -1.9, z: -1.5 },
  { name: "Ayala Triangle Gardens", type: "Park", x: -0.2, z: 0.8 },
  { name: "Taguig City Library", type: "Library", x: 1.4, z: 1.6 },
  { name: "Pasig City Library", type: "Library", x: 1.6, z: -1.0 },
  { name: "Marikina River Park", type: "Park", x: 3.3, z: -2.1 },
  { name: "Quezon City Public Library", type: "Library", x: 1.6, z: -3.8 },
  { name: "La Mesa Eco Park", type: "Park", x: 0.4, z: -5.3 },
];

function WorldScene({ onStopChange }: { onStopChange: (name: string) => void }) {
  const worldRef = useRef<THREE.Group>(null);
  const hopperRef = useRef<THREE.Group>(null);

  const [curStop, setCurStop] = useState(0);
  const animState = useRef({
    cur: 0,
    nxt: 1,
    u: 0,
    timer: 0.8,
    isHopping: false,
  });

  // Target pointer rotation for interactive parallax
  const pointerRef = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    // Parallax mouse tilt
    const { pointer } = state;
    pointerRef.current.x += (pointer.x * 0.15 - pointerRef.current.x) * Math.min(1, delta * 4);
    pointerRef.current.y += (pointer.y * 0.1 - pointerRef.current.y) * Math.min(1, delta * 4);

    if (worldRef.current) {
      worldRef.current.rotation.y = pointerRef.current.x + Math.sin(state.clock.elapsedTime * 0.2) * 0.04;
      worldRef.current.rotation.x = -pointerRef.current.y * 0.5;
    }

    // Grasshopper hopping state machine
    const s = animState.current;
    const a = STOPS[s.cur]!;
    const b = STOPS[s.nxt]!;

    if (!s.isHopping) {
      s.timer -= delta;
      if (s.timer <= 0) {
        s.isHopping = true;
        s.u = 0;
      }
    } else {
      s.u += delta * 1.4; // jump duration ~ 0.7s
      if (s.u >= 1) {
        s.u = 1;
        s.isHopping = false;
        s.timer = 1.0; // pause at stop
        s.cur = s.nxt;
        s.nxt = (s.nxt + 1) % STOPS.length;
        setCurStop(s.cur);
        onStopChange(STOPS[s.cur]!.name);
      }
    }

    if (hopperRef.current) {
      const u = s.u;
      // Parabolic jump arc
      const px = a.x + (b.x - a.x) * u;
      const pz = a.z + (b.z - a.z) * u;
      const jumpHeight = Math.sin(u * Math.PI) * 1.2;
      const py = 0.42 + jumpHeight;

      hopperRef.current.position.set(px, py, pz);

      // Rotate towards destination
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const angle = Math.atan2(dx, dz);
      hopperRef.current.rotation.y = angle;
    }
  });

  // Procedural city skyline points
  const skylineBuildings = useMemo(
    () => [
      { x: -0.4, z: 0.6, h: 1.6, w: 0.5 },
      { x: -0.2, z: 1.1, h: 2.1, w: 0.6 },
      { x: 0.2, z: 0.9, h: 1.8, w: 0.5 },
      { x: 1.2, z: 1.2, h: 2.2, w: 0.6 },
      { x: 1.6, z: 1.5, h: 1.7, w: 0.5 },
      { x: 1.2, z: -0.8, h: 1.9, w: 0.6 },
      { x: 1.8, z: -1.2, h: 1.5, w: 0.5 },
      { x: 0.8, z: -3.2, h: 1.4, w: 0.5 },
      { x: 1.2, z: -3.5, h: 1.9, w: 0.6 },
    ],
    []
  );

  return (
    <group ref={worldRef}>
      {/* Diorama Island Base (Water + Land) */}
      <mesh position={[0, -0.15, -1.0]} receiveShadow>
        <cylinderGeometry args={[5.8, 6.2, 0.4, 32]} />
        <meshLambertMaterial color="#8FD9A6" />
      </mesh>

      {/* Manila Bay Water Cutout */}
      <mesh position={[-3.2, 0.06, 0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.4, 24]} />
        <meshLambertMaterial color="#7CC6DD" />
      </mesh>

      {/* Pasig River Ribbon */}
      <mesh position={[0.2, 0.08, -0.2]} rotation={[-Math.PI / 2, 0, 0.3]} receiveShadow>
        <planeGeometry args={[0.35, 4.8]} />
        <meshLambertMaterial color="#5E7F8A" />
      </mesh>

      {/* Metro Manila Skyline Buildings */}
      {skylineBuildings.map((b, i) => (
        <Building
          key={i}
          position={[b.x, 0.1, b.z]}
          size={[b.w, b.h, b.w]}
          color={i % 2 === 0 ? "#EAF2EC" : "#DDE5DF"}
        />
      ))}

      {/* Scattered Parks & Trees */}
      <Tree position={[-2.4, 0.1, -0.7]} scale={0.9} foliageColor="#2E7D4F" />
      <Tree position={[-2.8, 0.1, -0.3]} scale={0.7} foliageColor="#4FA56A" />
      <Tree position={[-0.4, 0.1, 0.5]} scale={0.8} foliageColor="#2E7D4F" />
      <Tree position={[3.2, 0.1, -1.8]} scale={0.9} foliageColor="#3F8F2E" />
      <Tree position={[0.6, 0.1, -5.0]} scale={1.1} foliageColor="#2E7D4F" round />
      <Tree position={[0.2, 0.1, -5.5]} scale={1.0} foliageColor="#4FA56A" round />

      {/* Destination Markers (STOPS) */}
      {STOPS.map((stop, i) => {
        const isCurrent = curStop === i;
        return (
          <group key={i} position={[stop.x, 0.1, stop.z]}>
            {/* Facility model */}
            {stop.type === "Library" ? (
              <LibraryBuilding scale={0.35} />
            ) : (
              <Tree scale={0.75} foliageColor="#2E7D4F" round />
            )}

            {/* Marker Pin Ring */}
            <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.28, 0.38, 16]} />
              <meshBasicMaterial
                color={isCurrent ? "#98D746" : "#245C43"}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

      {/* The Animated Grasshopper Mascot */}
      <group ref={hopperRef} position={[STOPS[0]!.x, 0.42, STOPS[0]!.z]}>
        <Grasshopper scale={0.55} />
      </group>
    </group>
  );
}

export function HeroScene({ onStopChange }: { onStopChange: (name: string) => void }) {
  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        orthographic
        camera={{
          position: [5, 12, 12],
          zoom: 38,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[10, 16, 8]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <WorldScene onStopChange={onStopChange} />
      </Canvas>
    </div>
  );
}
