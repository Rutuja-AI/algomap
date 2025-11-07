import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { a, useSpring } from "@react-spring/three";

/**
 * Props:
 *  - arr: number[]
 *  - idxHi: number[] (highlighted indices)
 *  - action: string ("compare" | "swap" | "loop" | "end")
 */
export default function Visualizer3D({ arr = [], idxHi = [], action = "compare" }) {
  const gap = 1.25;
  const baseHeight = 0.4;
  const scaleY = 0.08;

  const positions = useMemo(() => {
    const centerOffset = ((arr.length - 1) * gap) / 2;
    return arr.map((_, i) => -centerOffset + i * gap);
  }, [arr]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "480px" }}>
      <Canvas camera={{ position: [0, 5, 9], fov: 45 }}>
        {/* Lights */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[6, 10, 4]} intensity={0.9} castShadow />
        <directionalLight position={[-6, 4, -3]} intensity={0.3} />

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#f5f7fb" />
        </mesh>

        {/* Bars */}
        {arr.map((val, i) => {
          const x = positions[i];
          return (
            <Bar3D
              key={`bar-${i}-${val}`}
              x={x}
              value={val}
              index={i}
              highlighted={idxHi.includes(i)}
              action={action}
            />
          );
        })}

        <OrbitControls enablePan={false} minDistance={5} maxDistance={18} />
      </Canvas>
    </div>
  );
}

function Bar3D({ x, value, index, highlighted, action }) {
  const height = useMemo(() => 0.4 + value * 0.08, [value]);
  const color = highlighted ? "#10b981" : "#cbd5e1";

  const { pos, scl, col, rot, emojiPos, emojiScale } = useSpring({
    pos: [x, height / 2, 0],
    scl: [1, height, 1],
    col: color,
    rot: [0, action === "swap" ? Math.PI : 0, 0],
    emojiPos: [x, height + 0.9, 0],
    emojiScale: action === "compare" || action === "swap" ? [1, 1, 1] : [0, 0, 0],
    config: { tension: 300, friction: 25 },
    reset: true
  });

  const mood = action === "swap"
    ? "😤"
    : action === "compare"
    ? "🧐"
    : action === "end"
    ? "😎"
    : "🙂";

  return (
    <group>
      {/* Bar */}
      <a.mesh position={pos} scale={scl} rotation={rot} castShadow>
        <boxGeometry args={[0.9, 1, 0.9]} />
        <a.meshStandardMaterial color={col} metalness={0.1} roughness={0.6} />
      </a.mesh>

      {/* Value label */}
      <Text
        position={[x, height + 0.35, 0]}
        fontSize={0.35}
        color="#334155"
        anchorX="center"
        anchorY="middle"
      >
        {value}
      </Text>

      {/* Mood emoji (animated in/out) */}
      <a.group position={emojiPos} scale={emojiScale}>
        <Text
          fontSize={0.5}
          color="#0f172a"
          anchorX="center"
          anchorY="middle"
        >
          {mood}
        </Text>
      </a.group>

      {/* Index label (only if highlighted) */}
      {highlighted && (
        <Text
          position={[x, -0.35, 0]}
          fontSize={0.28}
          color="#10b981"
          anchorX="center"
          anchorY="middle"
        >
          {index}
        </Text>
      )}
    </group>
  );
}
