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

type TubeParams = {
  length: number;
  isRect: boolean;
  radius?: number;
  width?: number;
  height?: number;
};

function CameraAndTubeSetup({
  model,
  resetTrigger,
  onParamsChange,
}: {
  model: THREE.Group | null;
  resetTrigger: number;
  onParamsChange: (params: TubeParams) => void;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (!model) return;

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const dims = [size.x, size.y, size.z].sort((a, b) => b - a);

    const length = dims[0] || 1000;
    const crossA = dims[1] || 100;
    const crossB = dims[2] || crossA;
    const ratio = Math.min(crossA, crossB) / Math.max(crossA, crossB);
    const isRect = ratio < 0.95;

    const baseParams: TubeParams = { length, isRect };

    const params: TubeParams = isRect
      ? { ...baseParams, width: crossA, height: crossB }
      : { ...baseParams, radius: crossA / 2 };

    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const distance = Math.max(length / (2 * Math.tan(fov / 2)) * 1.4, 200);

    camera.position.set(distance, distance * 0.4, distance);
    camera.lookAt(0, 0, 0);

    onParamsChange(params);
  }, [model, camera, resetTrigger, onParamsChange]);

  return null;
}

function CameraController({ resetTrigger }: { resetTrigger: number }) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current && resetTrigger > 0) {
      controlsRef.current.reset();
    }
  }, [resetTrigger]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      minDistance={10}
      maxDistance={5000}
      target={[0, 0, 0]}
      makeDefault
    />
  );
}

function TubeMesh({
  params,
  showWireframe,
}: {
  params: TubeParams;
  showWireframe: boolean;
}) {
  const { length, radius, width, height, isRect } = params;

  const tubeLength = length || 1000;

  const roundRadius = radius ?? Math.max(width ?? 100, height ?? 100) / 2;
  const rectWidth = width ?? roundRadius * 2;
  const rectHeight = height ?? roundRadius * 2;

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      {isRect ? (
        <boxGeometry args={[rectWidth, rectHeight, tubeLength]} />
      ) : (
        <cylinderGeometry
          args={[roundRadius, roundRadius, tubeLength, 64, 1, true]}
        />
      )}
      <meshStandardMaterial
        color="#b0b0b0"
        metalness={0.1}
        roughness={0.5}
        wireframe={showWireframe}
      />
    </mesh>
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
  const [params, setParams] = useState<TubeParams>({
    length: 1000,
    isRect: false,
    radius: 50,
  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[300, 400, 200]} intensity={0.6} />

      {showGrid && (
        <Grid
          args={[1000, 1000]}
          cellSize={50}
          cellThickness={0.5}
          cellColor="#9ca3af"
          sectionSize={250}
          sectionThickness={1}
          sectionColor="#6b7280"
          fadeDistance={2000}
          fadeStrength={1}
          followCamera={false}
          position={[0, 0, 0]}
        />
      )}

      <Center>
        <TubeMesh params={params} showWireframe={showWireframe} />
      </Center>

      <CameraAndTubeSetup
        model={model}
        resetTrigger={resetTrigger}
        onParamsChange={setParams}
      />
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
          className={
            showWireframe ? "bg-primary text-primary-foreground" : ""
          }
        >
          <Box className="w-4 h-4" />
        </Button>
        {diagnostics && diagnostics.length > 0 && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            title="Диагностика"
            className={
              showDiagnostics ? "bg-primary text-primary-foreground" : ""
            }
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
              <li key={i} className="text-muted-foreground">
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        ЛКМ — вращение | СКМ — перемещение | Колёсико — масштаб
      </div>

      <Canvas
        camera={{ position: [600, 300, 600], fov: 45, near: 1, far: 10000 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#e5e7eb"]} />
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
