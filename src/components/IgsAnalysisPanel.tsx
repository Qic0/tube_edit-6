import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  TubeConfig,
  TUBE_MATERIALS,
  WALL_THICKNESSES,
  calculateTubePrice,
  getProfileTypeName,
  formatDimensions,
} from "@/types/igs";
import {
  Ruler,
  Scissors,
  Target,
  Package,
  CircleDollarSign,
  FileCheck,
} from "lucide-react";

interface IgsAnalysisPanelProps {
  config: TubeConfig;
  onChange: (config: TubeConfig) => void;
  onAddToCart: () => void;
}

export function IgsAnalysisPanel({
  config,
  onChange,
  onAddToCart,
}: IgsAnalysisPanelProps) {
  const { analysis } = config;

  if (!analysis) {
    return (
      <Card className="bg-card">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Загрузите .IGS файл для анализа</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const price = calculateTubePrice(config);

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Параметры детали</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File info */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-medium truncate" title={analysis.fileName}>
            {analysis.fileName}
          </p>
        </div>

        {/* Detected parameters */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Определённые параметры
          </h4>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Профиль:</span>
            </div>
            <span className="font-medium">
              {getProfileTypeName(analysis.profileType)}
            </span>

            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Размер:</span>
            </div>
            <span className="font-medium">
              {formatDimensions(analysis.dimensions, analysis.profileType)}
            </span>

            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Длина:</span>
            </div>
            <span className="font-medium">
              {analysis.dimensions.length.toFixed(1)} мм
            </span>

            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Длина реза:</span>
            </div>
            <span className="font-medium">
              {analysis.totalCutLength.toFixed(1)} мм
            </span>

            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Точек врезки:</span>
            </div>
            <span className="font-medium">{analysis.piercePointsCount}</span>
          </div>
        </div>

        <Separator />

        {/* User selections */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Настройки
          </h4>

          <div className="space-y-2">
            <Label>Материал</Label>
            <Select
              value={config.material.id}
              onValueChange={(value) => {
                const material = TUBE_MATERIALS.find((m) => m.id === value);
                if (material) {
                  onChange({ ...config, material });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TUBE_MATERIALS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Толщина стенки (мм)</Label>
            <Select
              value={config.wallThickness.toString()}
              onValueChange={(value) => {
                onChange({ ...config, wallThickness: parseFloat(value) });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WALL_THICKNESSES.map((t) => (
                  <SelectItem key={t} value={t.toString()}>
                    {t} мм
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Количество</Label>
            <Input
              type="number"
              min={1}
              value={config.quantity}
              onChange={(e) => {
                const quantity = Math.max(1, parseInt(e.target.value) || 1);
                onChange({ ...config, quantity });
              }}
            />
          </div>
        </div>

        <Separator />

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-primary" />
            <span className="font-medium">Стоимость:</span>
          </div>
          <span className="text-xl font-bold text-primary">
            {price.toFixed(2)} ₽
          </span>
        </div>

        <Button onClick={onAddToCart} className="w-full">
          В корзину
        </Button>
      </CardContent>
    </Card>
  );
}
