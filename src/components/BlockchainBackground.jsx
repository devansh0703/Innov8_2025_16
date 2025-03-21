import { Canvas } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial } from '@react-three/drei';
import { random } from 'maath';
import { useRef, useState } from 'react';

export default function BlockchainBackground() {
  const ref = useRef();
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <OrbitControls enableZoom={false} />
        <group rotation={[0, 0, Math.PI / 4]}>
          <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
            <PointMaterial
              transparent
              color="#00ff88"
              size={0.002}
              sizeAttenuation={true}
              depthWrite={false}
            />
          </Points>
        </group>
      </Canvas>
    </div>
  );
} 