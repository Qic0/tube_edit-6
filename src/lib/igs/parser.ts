// IGS file parser using three-iges-loader library
import * as THREE from "three";
import { IGESLoader } from "three-iges-loader";
import {
  IgsAnalysisResult,
  TubeProfileType,
  TubeDimensions,
  CuttingPath,
} from "@/types/igs";

export interface LoadingProgress {
  stage: 'reading' | 'parsing' | 'processing' | 'complete' | 'error';
  message: string;
  percent?: number;
}

// Analyze loaded THREE.js geometry to extract tube parameters
export function analyzeIgsGeometry(
  group: THREE.Group,
  fileName: string
): IgsAnalysisResult {
  const boundingBox = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  boundingBox.getSize(size);

  const profileType = detectProfileType(size);
  const dimensions = extractDimensions(size, profileType);
  const { paths, totalLength, pierceCount } = extractCuttingPaths(group, {
    maxVertices: 200000,
  });

  return {
    fileName,
    profileType,
    dimensions,
    cuttingPaths: paths,
    totalCutLength: totalLength,
    piercePointsCount: pierceCount,
    boundingBox: {
      min: { x: boundingBox.min.x, y: boundingBox.min.y, z: boundingBox.min.z },
      max: { x: boundingBox.max.x, y: boundingBox.max.y, z: boundingBox.max.z },
    },
  };
}

function detectProfileType(size: THREE.Vector3): TubeProfileType {
  const dims = [size.x, size.y, size.z].sort((a, b) => b - a);
  const crossSection = [dims[1], dims[2]];
  const ratio = Math.min(...crossSection) / Math.max(...crossSection);

  if (ratio > 0.95) {
    return "square";
  }
  return "rectangular";
}

function extractDimensions(
  size: THREE.Vector3,
  profileType: TubeProfileType
): TubeDimensions {
  const dims = [
    { value: size.x, axis: "x" },
    { value: size.y, axis: "y" },
    { value: size.z, axis: "z" },
  ].sort((a, b) => b.value - a.value);

  const length = dims[0].value;
  const crossDims = [dims[1].value, dims[2].value].sort((a, b) => b - a);

  const baseDimensions: TubeDimensions = {
    length,
    wallThickness: 2,
  };

  if (profileType === "round") {
    return { ...baseDimensions, diameter: crossDims[0] };
  }
  return { ...baseDimensions, width: crossDims[0], height: crossDims[1] };
}

function extractCuttingPaths(
  group: THREE.Group,
  options?: { maxVertices?: number }
): {
  paths: CuttingPath[];
  totalLength: number;
  pierceCount: number;
} {
  const paths: CuttingPath[] = [];
  let totalLength = 0;
  let pierceCount = 0;

  const maxVertices = options?.maxVertices ?? 200000;
  let processedVertices = 0;
  let aborted = false;

  group.traverse((child) => {
    if (aborted) return;

    if (child instanceof THREE.LineSegments || child instanceof THREE.Line) {
      const geometry = child.geometry;
      if (geometry instanceof THREE.BufferGeometry) {
        const positions = geometry.getAttribute("position");
        if (positions) {
          // Если геометрия слишком сложная, прекращаем дальнейший анализ,
          // чтобы не блокировать основной поток
          if (processedVertices + positions.count > maxVertices) {
            aborted = true;
            return;
          }

          let pathLength = 0;

          for (let i = 1; i < positions.count; i++) {
            const dx = positions.getX(i) - positions.getX(i - 1);
            const dy = positions.getY(i) - positions.getY(i - 1);
            const dz = positions.getZ(i) - positions.getZ(i - 1);
            pathLength += Math.sqrt(dx * dx + dy * dy + dz * dz);
          }

          if (pathLength > 0) {
            totalLength += pathLength;
            pierceCount++;
            processedVertices += positions.count;
          }
        }
      }
    }
  });

  return { paths, totalLength, pierceCount };
}

// Count meshes in group
function countMeshes(group: THREE.Group): number {
  let count = 0;
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) count++;
  });
  return count;
}

// Count lines in group
function countLines(group: THREE.Group): number {
  let count = 0;
  group.traverse((child) => {
    if (child instanceof THREE.Line || child instanceof THREE.LineSegments) count++;
  });
  return count;
}

// Apply high-quality metallic material to loaded geometry
function applyMaterial(group: THREE.Group): void {
  const meshMaterial = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.85,
    roughness: 0.15,
    side: THREE.DoubleSide,
    envMapIntensity: 1.0,
  });

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xff3333,
    linewidth: 2,
  });

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = meshMaterial;
      child.castShadow = true;
      child.receiveShadow = true;
    } else if (child instanceof THREE.Line || child instanceof THREE.LineSegments) {
      (child as THREE.Line).material = lineMaterial;
    }
  });
}

// Simplify geometry - limit complexity to prevent freezing
function simplifyGeometry(group: THREE.Group, maxObjects: number = 100): void {
  let objectCount = 0;
  const toRemove: THREE.Object3D[] = [];
  
  group.traverse((child) => {
    objectCount++;
    if (objectCount > maxObjects) {
      toRemove.push(child);
    }
  });
  
  // Remove excess objects
  toRemove.forEach(obj => {
    if (obj.parent) {
      obj.parent.remove(obj);
    }
  });
  
  if (toRemove.length > 0) {
    console.warn(`Simplified model: removed ${toRemove.length} objects to prevent freezing`);
  }
}

// Create fallback bounding box visualization
export function createFallbackGeometry(boundingBox: THREE.Box3): THREE.Group {
  const group = new THREE.Group();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  boundingBox.getSize(size);
  boundingBox.getCenter(center);

  const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const wireframe = new THREE.LineSegments(edgesGeometry, lineMaterial);
  wireframe.position.copy(center);
  group.add(wireframe);

  const boxMaterial = new THREE.MeshStandardMaterial({
    color: 0x4488ff,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.copy(center);
  group.add(box);

  return group;
}

// Parse IGS file using three-iges-loader
export async function parseIgsFile(
  file: File,
  wallThickness: number = 2
): Promise<{ group: THREE.Group; analysis: IgsAnalysisResult; diagnostics: string[] }> {
  const diagnostics: string[] = [];
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        diagnostics.push(`Размер файла: ${(content.length / 1024).toFixed(1)} KB`);
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const loader = new IGESLoader();
        
        loader.load(
          url,
          (object) => {
            URL.revokeObjectURL(url);
            
            const meshCount = countMeshes(object);
            const lineCount = countLines(object);
            
            diagnostics.push(`Загружено объектов: ${object.children.length}`);
            diagnostics.push(`Мешей (поверхностей): ${meshCount}`);
            diagnostics.push(`Линий/кривых: ${lineCount}`);
            
            console.log("=== IGES Loading Diagnostics ===");
            console.log("File:", file.name);
            console.log("Children count:", object.children.length);
            console.log(`Meshes: ${meshCount}, Lines: ${lineCount}`);
            
            object.children.forEach((child, i) => {
              console.log(`Child ${i}: ${child.type}`, child);
            });
            
            let processedObject = object;
            
            // Simplify to prevent freezing on complex models
            simplifyGeometry(processedObject, 500);
            
            applyMaterial(processedObject);
            
            const analysis = analyzeIgsGeometry(processedObject, file.name);
            
            const boundingBox = new THREE.Box3().setFromObject(processedObject);
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            
            diagnostics.push(`Размеры модели: ${size.x.toFixed(1)} x ${size.y.toFixed(1)} x ${size.z.toFixed(1)} мм`);
            
            if (size.length() < 0.001) {
              diagnostics.push("⚠️ Геометрия слишком маленькая или пустая");
              const fallback = createFallbackGeometry(boundingBox);
              processedObject.add(fallback);
            }
            
            resolve({ group: processedObject, analysis, diagnostics });
          },
          (progress) => {
            console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
          },
          (error) => {
            URL.revokeObjectURL(url);
            console.error("IGESLoader error:", error);
            diagnostics.push(`Ошибка загрузчика: ${error}`);
            reject(new Error("Ошибка загрузки IGES файла"));
          }
        );
      } catch (error) {
        console.error("IGS parse error:", error);
        diagnostics.push(`Ошибка парсинга: ${error}`);
        reject(error instanceof Error ? error : new Error("Ошибка парсинга IGS файла"));
      }
    };

    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsText(file);
  });
}
