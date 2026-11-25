import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Float, Lightformer, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';
import { ProductModel } from './models.jsx';

// Studio lighting built from Lightformers — no HDR download needed.
function Studio() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <Environment resolution={256}>
        <Lightformer intensity={2.2} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer intensity={1.2} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer intensity={1.2} color="#ffe7a3" position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer intensity={0.6} position={[0, 0, -5]} scale={[10, 10, 1]} />
      </Environment>
    </>
  );
}

// Gentle parallax that follows the pointer.
function PointerRig({ children, strength = 0.25 }) {
  const ref = useRef();
  useFrame(({ pointer }, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, pointer.x * strength, 3, dt);
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, -pointer.y * strength * 0.5, 3, dt);
  });
  return <group ref={ref}>{children}</group>;
}

// Garments are flat-ish, so they sway to keep their print in view; round things spin.
const SPINS = { mug: true };
function Spinner({ speed = 0.25, model, children }) {
  const ref = useRef();
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    if (SPINS[model]) ref.current.rotation.y += dt * speed;
    else ref.current.rotation.y = Math.sin(clock.elapsedTime * Math.abs(speed) * 2.2) * 0.6 * Math.sign(speed);
  });
  return <group ref={ref}>{children}</group>;
}

// Shrinks the whole composition on narrow (portrait) viewports.
function Fit({ width = 9, children }) {
  const { viewport } = useThree();
  const s = Math.min(1, viewport.width / width);
  return <group scale={s}>{children}</group>;
}

const HERO_ITEMS = [
  { model: 'hoodie', color: '#1b1b1d', position: [0, 0.1, 0], scale: 1.05, speed: 0.18 },
  { model: 'tee', color: '#efece4', position: [-2.8, -0.6, -1.2], scale: 0.7, speed: -0.25 },
  { model: 'mug', color: '#ffcf3a', position: [2.45, -0.95, -0.4], scale: 0.6, speed: 0.35 },
  { model: 'stickers', position: [2.6, 1.5, -1.8], scale: 0.55, speed: -0.2 }
];

export function HeroScene() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.4, 7.2], fov: 38 }} gl={{ antialias: true }}>
      <Suspense fallback={null}>
        <Studio />
        <Fit width={6.4}>
        <PointerRig>
          {HERO_ITEMS.map((it) => (
            <Float key={it.model} speed={1.6} rotationIntensity={0.35} floatIntensity={0.9}>
              <group position={it.position} scale={it.scale}>
                <Spinner speed={it.speed} model={it.model}>
                  <ProductModel model={it.model} color={it.color} />
                </Spinner>
              </group>
            </Float>
          ))}
        </PointerRig>
        </Fit>
        <ContactShadows position={[0, -2.1, 0]} opacity={0.35} scale={14} blur={2.6} far={4} />
      </Suspense>
    </Canvas>
  );
}

export function ProductStage({ model, color }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.2, 5.6], fov: 36 }}>
      <Suspense fallback={null}>
        <Studio />
        <Fit width={5.2}>
        <PresentationControls global={false} snap polar={[-0.3, 0.3]} azimuth={[-Infinity, Infinity]} speed={1.4}>
          <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
            <Spinner speed={0.35} model={model}>
              <group scale={model === 'mug' ? 1.15 : 1}>
                <ProductModel model={model} color={color} />
              </group>
            </Spinner>
          </Float>
        </PresentationControls>
        </Fit>
        <ContactShadows position={[0, -1.75, 0]} opacity={0.4} scale={8} blur={2.4} far={3} />
      </Suspense>
    </Canvas>
  );
}
