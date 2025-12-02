import { useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Center } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { RotateCcw, Box, Eye, Grid3X3 } from "lucide-react";

interface IgsViewer3DProps {
  model: THREE.Group | null;
  diagnostics?: string[];
}

function ModelDisplay({ model }: { model: THREE.Group }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (groupRef.current && model) {
      // Clear previous children
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }

      // Clone and add new model
      const clonedModel = model.clone();
      groupRef.current.add(clonedModel);

      // Center the model
      const box = new THREE.Box3().setFromObject(clonedModel);
      const center = box.getCenter(new THREE.Vector3());
      clonedModel.position.sub(center);

      // Move model up so it sits on the grid
      const size = box.getSize(new THREE.Vector3());
      clonedModel.position.y += size.y / 2;

      // Adjust camera to fit model
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      const cameraDistance = Math.max(maxDim / (2 * Math.tan(fov / 2)) * 2, 100);

      camera.position.set(cameraDistance * 0.8, cameraDistance * 0.5, cameraDistance * 0.8);
      camera.lookAt(0, size.y / 4, 0);
      
      console.log("Model positioned, size:", size, "camera distance:", cameraDistance);
    }
  }, [model, camera]);

  return <group ref={groupRef} />;
}

function CameraController({
  resetTrigger,
}: {
  resetTrigger: number;
}) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current && resetTrigger > 0) {
      controlsRef.current.reset();
    }
  }, [resetTrigger]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={10}
      maxDistance={5000}
      target={[0, 0, 0]}
      makeDefault
    />
  );
}

function Scene({
  model,
  resetTrigger,
  showGrid,
  showWireframe,
}: {
  model: THREE.Group | null;
  resetTrigger: number;
  showGrid: boolean;
  showWireframe: boolean;
}) {
  // Apply wireframe mode if enabled
  useEffect(() => {
    if (model) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material.wireframe !== undefined) {
            material.wireframe = showWireframe;
          }
        }
      });
    }
  }, [model, showWireframe]);

  return (
    <>
      {/* Main lighting setup - enhanced for metallic materials */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, 10, -5]} intensity={0.8} />
      <directionalLight position={[0, -10, 0]} intensity={0.3} />
      
      {/* Fill lights for better detail visibility */}
      <pointLight position={[20, 5, 20]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-20, 5, -20]} intensity={0.5} color="#ffffff" />
      <hemisphereLight args={["#ffffff", "#444444", 0.6]} />

      {/* Model */}
      {model && (
        <Center>
          <ModelDisplay model={model} />
        </Center>
      )}

      {/* Ground plane for shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <shadowMaterial opacity={0.3} />
      </mesh>

      {/* Grid */}
      {showGrid && (
        <Grid
          args={[2000, 2000]}
          cellSize={50}
          cellThickness={0.5}
          cellColor="#666"
          sectionSize={250}
          sectionThickness={1}
          sectionColor="#888"
          fadeDistance={3000}
          fadeStrength={1}
          followCamera={false}
          position={[0, 0, 0]}
        />
      )}

      <CameraController resetTrigger={resetTrigger} />
    </>
  );
}

export function IgsViewer3D({ model, diagnostics }: IgsViewer3DProps) {
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleReset = () => {
    setResetTrigger((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setShowGrid(!showGrid)}
          title="Сетка"
          className={showGrid ? "bg-primary text-primary-foreground" : ""}
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setShowWireframe(!showWireframe)}
          title="Каркас"
          className={showWireframe ? "bg-primary text-primary-foreground" : ""}
        >
          <Box className="w-4 h-4" />
        </Button>
        {diagnostics && diagnostics.length > 0 && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            title="Диагностика"
            className={showDiagnostics ? "bg-primary text-primary-foreground" : ""}
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="secondary"
          size="icon"
          onClick={handleReset}
          title="Сбросить вид"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Diagnostics panel */}
      {showDiagnostics && diagnostics && (
        <div className="absolute top-14 right-4 z-10 bg-background/95 border rounded-lg p-3 max-w-xs text-xs shadow-lg">
          <h4 className="font-semibold mb-2">Диагностика</h4>
          <ul className="space-y-1">
            {diagnostics.map((d, i) => (
              <li key={i} className="text-muted-foreground">{d}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        ЛКМ — вращение | СКМ — перемещение | Колёсико — масштаб
      </div>

      <Canvas
        camera={{ position: [300, 200, 300], fov: 50, near: 0.1, far: 10000 }}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        shadows
        dpr={[1, 2]}
      >
        <color attach="background" args={["#e8e8e8"]} />
        <Scene 
          model={model} 
          resetTrigger={resetTrigger}
          showGrid={showGrid}
          showWireframe={showWireframe}
        />
      </Canvas>
    </div>
  );
}
