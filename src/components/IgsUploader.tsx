import { useCallback, useState } from "react";
import { Upload, FileType, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseIgsFile } from "@/lib/igs/parser";
import { IgsAnalysisResult } from "@/types/igs";
import * as THREE from "three";

interface IgsUploaderProps {
  onFileLoaded: (group: THREE.Group, analysis: IgsAnalysisResult) => void;
}

export function IgsUploader({ onFileLoaded }: IgsUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const extension = file.name.toLowerCase().split(".").pop();
      if (extension !== "igs" && extension !== "iges") {
        setError("Поддерживаются только файлы .IGS или .IGES");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { group, analysis, diagnostics } = await parseIgsFile(file);
        console.log("Diagnostics:", diagnostics);
        onFileLoaded(group, analysis);
      } catch (err) {
        console.error("Error parsing IGS file:", err);
        setError("Не удалось загрузить файл. Проверьте формат.");
      } finally {
        setIsLoading(false);
      }
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileType className="w-5 h-5" />
          Загрузка 3D модели
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/50"}
            ${isLoading ? "pointer-events-none opacity-50" : ""}
          `}
        >
          <input
            type="file"
            accept=".igs,.iges"
            onChange={handleInputChange}
            className="hidden"
            id="igs-upload"
            disabled={isLoading}
          />
          <label htmlFor="igs-upload" className="cursor-pointer">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Анализ файла...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-12 h-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">Перетащите файл сюда</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    или нажмите для выбора
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Поддерживаемые форматы: .IGS, .IGES
                </p>
              </div>
            )}
          </label>
        </div>

        {error && (
          <p className="text-sm text-destructive mt-3 text-center">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
