import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* All products are modelled procedurally from 2D outlines and lathes,
   so the site ships no model files and every colour is just a material. */

// ---------- helpers ----------
const isDark = (hex) => {
  const c = new THREE.Color(hex);
  return c.r * 0.299 + c.g * 0.587 + c.b * 0.114 < 0.5;
};

// Mirror a right-half outline (top-centre → bottom-centre) into a closed Shape.
function mirroredShape(rightHalf) {
  const shape = new THREE.Shape();
  const left = [...rightHalf].reverse().map(([x, y]) => [-x, y]);
  const pts = [...rightHalf, ...left.slice(1)];
  shape.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();
  return shape;
}

function useExtrude(shape, depth, bevel = 0.1, curveSegments = 12) {
  return useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel * 0.8,
      bevelSegments: 5,
      curveSegments
    });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    return g;
  }, [shape, depth, bevel, curveSegments]);
}

// Smoothly "dye" a material toward its target colour.
function useDye(hex) {
  const mat = useRef();
  const target = useMemo(() => new THREE.Color(hex), [hex]);
  useFrame((_, dt) => mat.current?.color.lerp(target, Math.min(1, dt * 6)));
  return mat;
}

// Printed logo drawn on a canvas — the "artwork" on every product.
export function usePrintTexture(dark, variant = 'chest') {
  const tex = useMemo(() => {
    const s = 512;
    const cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const ctx = cv.getContext('2d');
    const ink = dark ? '#f3efe4' : '#121212';
    ctx.clearRect(0, 0, s, s);
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineJoin = 'round';

    // wireframe triangle mark
    const cx = s / 2, cy = variant === 'wrap' ? s * 0.42 : s * 0.38, r = s * 0.22;
    const tri = [0, 1, 2].map((i) => [
      cx + r * Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / 3),
      cy + r * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / 3)
    ]);
    ctx.lineWidth = 14;
    ctx.beginPath();
    tri.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.stroke();
    ctx.lineWidth = 6;
    tri.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    });
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.font = '700 58px "Space Grotesk", system-ui, sans-serif';
    ctx.fillText('POLYGON', cx, s * 0.78);
    ctx.font = '500 30px "JetBrains Mono", monospace';
    ctx.fillText('SUPPLY  /  v1.0', cx, s * 0.86);

    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [dark, variant]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

const fabric = { roughness: 0.88, metalness: 0, sheen: 0.7, sheenRoughness: 0.5, sheenColor: '#9b968a' };

// ---------- T-shirt ----------
const teeShape = mirroredShape([
  [0, 1.12],
  [0.22, 1.18],
  [0.42, 1.3],
  [0.82, 1.22],
  [1.5, 0.78],
  [1.22, 0.22],
  [0.86, 0.46],
  [0.88, -1.3],
  [0, -1.32]
]);

export function Tee({ color = '#efece4' }) {
  const geo = useExtrude(teeShape, 0.36, 0.2);
  const mat = useDye(color);
  const print = usePrintTexture(isDark(color));
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial ref={mat} color={color} {...fabric} />
      </mesh>
      {/* collar rib */}
      <mesh position={[0, 1.18, 0.04]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.55, 1]}>
        <torusGeometry args={[0.36, 0.05, 12, 40, Math.PI]} />
        <meshPhysicalMaterial color={color} {...fabric} />
      </mesh>
      <mesh position={[0, 0.25, 0.385]}>
        <planeGeometry args={[0.95, 0.95]} />
        <meshStandardMaterial map={print} transparent roughness={0.8} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  );
}

// ---------- Hoodie ----------
const hoodieShape = mirroredShape([
  [0, 1.06],
  [0.4, 1.18],
  [0.8, 1.12],
  [1.22, 0.7],
  [1.5, -1.06],
  [1.1, -1.12],
  [0.93, 0.12],
  [0.95, -1.36],
  [0, -1.38]
]);
const pocketShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.62, -1.0);
  s.lineTo(0.62, -1.0);
  s.lineTo(0.48, -0.42);
  s.lineTo(-0.48, -0.42);
  s.closePath();
  return s;
})();

export function Hoodie({ color = '#1b1b1d' }) {
  const geo = useExtrude(hoodieShape, 0.44, 0.22);
  const pocket = useExtrude(pocketShape, 0.02, 0.03, 4);
  const mat = useDye(color);
  const print = usePrintTexture(isDark(color));
  const stringColor = isDark(color) ? '#e9e4d6' : '#2a2a2a';
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial ref={mat} color={color} {...fabric} />
      </mesh>
      {/* hood */}
      <mesh position={[0, 1.02, -0.3]} rotation={[-0.35, 0, 0]} scale={[0.6, 0.46, 0.34]} castShadow>
        <sphereGeometry args={[1, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshPhysicalMaterial color={color} {...fabric} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.1, 0.12]} rotation={[Math.PI / 2.4, 0, 0]} scale={[1, 0.7, 1]}>
        <torusGeometry args={[0.44, 0.09, 14, 48]} />
        <meshPhysicalMaterial color={color} {...fabric} />
      </mesh>
      {/* drawstrings */}
      {[-0.17, 0.17].map((x) => (
        <group key={x} position={[x, 0.78, 0.46]}>
          <mesh>
            <cylinderGeometry args={[0.022, 0.022, 0.55, 8]} />
            <meshStandardMaterial color={stringColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.08, 10]} />
            <meshStandardMaterial color="#c9c2ae" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* kangaroo pocket */}
      <mesh geometry={pocket} position={[0, 0, 0.43]}>
        <meshPhysicalMaterial color={color} {...fabric} />
      </mesh>
      {/* ribbed waistband */}
      <mesh position={[0, -1.3, 0]}>
        <boxGeometry args={[1.98, 0.16, 0.82]} />
        <meshPhysicalMaterial color={color} {...fabric} roughness={1} />
      </mesh>
      <mesh position={[0, 0.12, 0.445]}>
        <planeGeometry args={[0.72, 0.72]} />
        <meshStandardMaterial map={print} transparent roughness={0.8} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  );
}

// ---------- Mug ----------
export function Mug({ color = '#202022' }) {
  const body = useMemo(() => {
    const p = [
      [0, -0.9], [0.62, -0.9], [0.7, -0.86], [0.72, -0.78],
      [0.74, 0.86], [0.73, 0.9], [0.69, 0.9], [0.67, 0.86],
      [0.65, -0.74], [0, -0.76]
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(p, 72);
  }, []);
  const mat = useDye(color);
  const handleMat = useDye(color);
  const print = usePrintTexture(isDark(color), 'wrap');
  return (
    <group>
      <mesh geometry={body} castShadow receiveShadow>
        <meshPhysicalMaterial ref={mat} color={color} roughness={0.25} clearcoat={1} clearcoatRoughness={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.73, 0.02, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <torusGeometry args={[0.42, 0.09, 18, 48, Math.PI]} />
        <meshPhysicalMaterial ref={handleMat} color={color} roughness={0.25} clearcoat={1} />
      </mesh>
      {/* coffee */}
      <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.66, 48]} />
        <meshStandardMaterial color="#3b2418" roughness={0.15} />
      </mesh>
      {/* wrap print facing camera (theta 0 = +z) */}
      <mesh>
        <cylinderGeometry args={[0.745, 0.745, 1.1, 64, 1, true, -Math.PI * 0.32, Math.PI * 0.64]} />
        <meshStandardMaterial map={print} transparent roughness={0.4} side={THREE.FrontSide} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  );
}

// ---------- Sticker pack ----------
function star(n, r1, r2) {
  const s = new THREE.Shape();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = (i / (n * 2)) * Math.PI * 2 + Math.PI / 2;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
}
function polygon(n, r) {
  const s = new THREE.Shape();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / 2;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
}
function circle(r) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, 0, Math.PI * 2, false);
  return s;
}
function roundRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

const STICKERS = [
  { shape: () => star(5, 0.48, 0.22), color: '#ffd23f', pos: [-0.75, 0.6, 0.05], rot: 0.2 },
  { shape: () => circle(0.42), color: '#2f6bff', pos: [0.6, 0.72, 0], rot: 0 },
  { shape: () => polygon(6, 0.44), color: '#121212', pos: [0.05, 0.02, 0.1], rot: 0.3 },
  { shape: () => roundRect(0.9, 0.5, 0.14), color: '#ff5a36', pos: [-0.62, -0.62, 0], rot: -0.25 },
  { shape: () => polygon(3, 0.46), color: '#25b07a', pos: [0.75, -0.55, 0.05], rot: 0.15 },
  { shape: () => star(8, 0.34, 0.26), color: '#e86fd0', pos: [-0.05, -1.05, 0.02], rot: 0 }
];

function Sticker({ shape, color, pos, rot, index }) {
  const s = useMemo(shape, [shape]);
  const backing = useMemo(
    () => new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.06, bevelSegments: 2 }),
    [s]
  );
  const face = useMemo(() => new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false }), [s]);
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.x = Math.sin(clock.elapsedTime * 1.2 + index) * 0.12;
  });
  return (
    <group ref={ref} position={pos} rotation={[0, 0, rot]}>
      <mesh geometry={backing} castShadow>
        <meshStandardMaterial color="#fbfaf6" roughness={0.55} />
      </mesh>
      <mesh geometry={face} position={[0, 0, 0.01]}>
        <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.6} />
      </mesh>
    </group>
  );
}

export function Stickers() {
  return (
    <group>
      {STICKERS.map((s, i) => (
        <Sticker key={i} index={i} {...s} />
      ))}
    </group>
  );
}

// ---------- switch ----------
export function ProductModel({ model, color }) {
  switch (model) {
    case 'hoodie':
      return <Hoodie color={color} />;
    case 'tee':
      return <Tee color={color} />;
    case 'mug':
      return <Mug color={color} />;
    case 'stickers':
      return <Stickers />;
    default:
      return null;
  }
}
