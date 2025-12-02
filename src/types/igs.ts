// Types for IGS file analysis

export type TubeProfileType = "round" | "square" | "rectangular";

export interface TubeDimensions {
  // Для круглой трубы
  diameter?: number;
  // Для квадратной/прямоугольной трубы
  width?: number;
  height?: number;
  // Общие параметры
  wallThickness: number;
  length: number;
}

export interface CuttingPath {
  id: string;
  points: { x: number; y: number; z: number }[];
  length: number; // длина в мм
  isClosed: boolean;
}

export interface IgsAnalysisResult {
  fileName: string;
  profileType: TubeProfileType;
  dimensions: TubeDimensions;
  cuttingPaths: CuttingPath[];
  totalCutLength: number; // мм
  piercePointsCount: number;
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
}

export interface TubeMaterial {
  id: string;
  name: string;
  pricePerMeter: number; // руб/м
  cutPricePerMeter: number; // руб/м реза
  piercePricePerPoint: number; // руб/точку
}

export const TUBE_MATERIALS: TubeMaterial[] = [
  {
    id: "steel",
    name: "Сталь",
    pricePerMeter: 150,
    cutPricePerMeter: 100,
    piercePricePerPoint: 10,
  },
  {
    id: "stainless",
    name: "Нержавеющая сталь",
    pricePerMeter: 350,
    cutPricePerMeter: 200,
    piercePricePerPoint: 20,
  },
  {
    id: "aluminum",
    name: "Алюминий",
    pricePerMeter: 250,
    cutPricePerMeter: 150,
    piercePricePerPoint: 15,
  },
];

export const WALL_THICKNESSES = [1, 1.5, 2, 2.5, 3, 4, 5, 6];

export interface TubeConfig {
  analysis: IgsAnalysisResult | null;
  material: TubeMaterial;
  wallThickness: number;
  quantity: number;
}

export function createDefaultTubeConfig(): TubeConfig {
  return {
    analysis: null,
    material: TUBE_MATERIALS[0],
    wallThickness: 2,
    quantity: 1,
  };
}

export function calculateTubePrice(config: TubeConfig): number {
  if (!config.analysis) return 0;

  const lengthMeters = config.analysis.dimensions.length / 1000;
  const cutLengthMeters = config.analysis.totalCutLength / 1000;

  const materialCost = lengthMeters * config.material.pricePerMeter;
  const cutCost = cutLengthMeters * config.material.cutPricePerMeter;
  const pierceCost =
    config.analysis.piercePointsCount * config.material.piercePricePerPoint;

  return Math.round((materialCost + cutCost + pierceCost) * config.quantity * 100) / 100;
}

export function getProfileTypeName(type: TubeProfileType): string {
  switch (type) {
    case "round":
      return "Круглая";
    case "square":
      return "Квадратная";
    case "rectangular":
      return "Прямоугольная";
  }
}

export function formatDimensions(dims: TubeDimensions, type: TubeProfileType): string {
  if (type === "round") {
    return `Ø${dims.diameter?.toFixed(1)} мм`;
  }
  return `${dims.width?.toFixed(1)}×${dims.height?.toFixed(1)} мм`;
}
