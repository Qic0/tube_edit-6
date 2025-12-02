import { useState, useMemo, useEffect } from "react";
import { DxfUploader } from "@/components/DxfUploader";
import { DxfViewer } from "@/components/DxfViewer";
import { NestingViewer } from "@/components/NestingViewer";
import { MaterialSelector } from "@/components/MaterialSelector";
import { MainNav } from "@/components/MainNav";
import { DxfThumbnailGenerator } from "@/components/DxfThumbnailGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { calculateNesting } from "@/lib/dxfNesting";
import type { NestingResult } from "@/lib/dxf/types";
import { DxfConfig, createDefaultDxfConfig, calculateDxfPrice, MaterialType, getPricingByThickness } from "@/types/dxf";
import { Cart } from "@/components/Cart";
import { 
  loadCartFromStorage, 
  saveCartToStorage, 
  addDxfItemToCart, 
  removeItemFromCart,
  Cart as CartType 
} from "@/types/cart";
import { toast } from "@/hooks/use-toast";

export default function DxfPage() {
  const [dxfConfig, setDxfConfig] = useState<DxfConfig>(createDefaultDxfConfig());
  const [cart, setCart] = useState<CartType>(() => loadCartFromStorage());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [selectedNestingVariant, setSelectedNestingVariant] = useState(0);
  const [isPriceDetailsOpen, setIsPriceDetailsOpen] = useState(false);
  const [isCartCollapsed, setIsCartCollapsed] = useState(() => {
    const saved = localStorage.getItem("cart-collapsed");
    return saved === "true";
  });

  // Save cart to localStorage
  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  // Расчет раскроя
  const nestingResults = useMemo<NestingResult[]>(() => {
    // Определяем текущую конфигурацию для расчета
    let currentDisplayConfig: DxfConfig | null = null;
    if (selectedItemId && !isCreatingNew) {
      const item = cart.items.find(i => i.id === selectedItemId && i.type === "dxf");
      currentDisplayConfig = item?.dxfConfig || null;
    } else {
      currentDisplayConfig = dxfConfig.fileName ? dxfConfig : null;
    }
    if (!currentDisplayConfig?.fileContent || !currentDisplayConfig?.thickness) {
      return [];
    }
    try {
      return calculateNesting(currentDisplayConfig.fileContent, currentDisplayConfig.thickness);
    } catch (error) {
      console.error("Error calculating nesting:", error);
      return [];
    }
  }, [dxfConfig, cart.items, selectedItemId, isCreatingNew]);
  const handleFileLoaded = (fileName: string, content: string, vectorLength: number) => {
    setDxfConfig({
      ...dxfConfig,
      fileName,
      fileContent: content,
      vectorLength,
      price: 0,
      previewImage: undefined
    });
    setIsCreatingNew(true);
    setSelectedItemId(null);
  };

  const handleThumbnailGenerated = (dataUrl: string) => {
    setDxfConfig(prev => ({
      ...prev,
      previewImage: dataUrl
    }));
  };
  const handleMaterialChange = (material: MaterialType) => {
    setDxfConfig({
      ...dxfConfig,
      material,
      price: 0 // Will be recalculated
    });
  };
  const handleThicknessChange = (thickness: number) => {
    setDxfConfig({
      ...dxfConfig,
      thickness,
      price: 0 // Will be recalculated
    });
  };
  const handleFinishPart = () => {
    if (!dxfConfig.fileName) {
      toast({
        title: "Ошибка",
        description: "Загрузите DXF файл",
        variant: "destructive"
      });
      return;
    }

    const currentNesting = nestingResults[selectedNestingVariant];
    const price = currentNesting ? calculateDxfPrice(dxfConfig.vectorLength, dxfConfig.thickness, dxfConfig.material, currentNesting.piercePoints, currentNesting.sheetArea) : 0;
    
    const configWithPrice: DxfConfig = {
      ...dxfConfig,
      price,
      sheetArea: currentNesting?.sheetArea,
      metalCost: currentNesting?.metalCost,
      efficiency: currentNesting?.efficiency,
      piercePoints: currentNesting?.piercePoints,
    };

    const newCart = addDxfItemToCart(cart, configWithPrice);
    const newItem = newCart.items[newCart.items.length - 1];
    
    setCart(newCart);
    setDxfConfig(createDefaultDxfConfig());
    setIsCreatingNew(true);
    setSelectedItemId(null);
    
    toast({
      title: "Деталь добавлена",
      description: `Артикул: ${newItem.id}`
    });
  };
  const handleDeleteItem = (itemId: string) => {
    const newCart = removeItemFromCart(cart, itemId);
    setCart(newCart);
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
      setIsCreatingNew(true);
    }
    toast({
      title: "Деталь удалена"
    });
  };

  const handleEditDxfItem = (itemId: string) => {
    const item = cart.items.find(i => i.id === itemId && i.type === "dxf");
    if (item?.dxfConfig) {
      setDxfConfig({ ...item.dxfConfig });
      setSelectedItemId(itemId);
      setIsCreatingNew(false);
    }
  };

  const handleSaveEdit = () => {
    if (!selectedItemId) return;

    const currentNesting = nestingResults[selectedNestingVariant];
    const price = currentNesting ? calculateDxfPrice(dxfConfig.vectorLength, dxfConfig.thickness, dxfConfig.material, currentNesting.piercePoints, currentNesting.sheetArea) : 0;
    
    setCart({
      ...cart,
      items: cart.items.map(item => 
        item.id === selectedItemId && item.type === "dxf" 
          ? { ...item, dxfConfig: { ...dxfConfig, price } }
          : item
      )
    });

    toast({
      title: "Изменения сохранены"
    });
    setSelectedItemId(null);
    setIsCreatingNew(true);
    setDxfConfig(createDefaultDxfConfig());
  };
  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedItemId(null);
    setDxfConfig(createDefaultDxfConfig());
  };

  const getDisplayConfig = (): DxfConfig | null => {
    if (selectedItemId && !isCreatingNew) {
      const item = cart.items.find(i => i.id === selectedItemId && i.type === "dxf");
      return item?.dxfConfig || null;
    }
    return dxfConfig.fileName ? dxfConfig : null;
  };

  const displayConfig = getDisplayConfig();

  // Calculate current price for display
  const currentPrice = displayConfig && nestingResults.length > 0 && nestingResults[selectedNestingVariant] ? calculateDxfPrice(displayConfig.vectorLength, displayConfig.thickness, displayConfig.material, nestingResults[selectedNestingVariant].piercePoints, nestingResults[selectedNestingVariant].sheetArea) : 0;
  return <div className="h-screen flex flex-col overflow-hidden">
      <MainNav />

      {/* Основной контент */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex gap-4 p-4 overflow-hidden">
          {/* Left Column - Configurator */}
          <div className="w-80 flex flex-col flex-shrink-0">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base">
                  {isCreatingNew ? "Новая деталь" : "Редактирование"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-4 space-y-4">
                {isCreatingNew ? <>
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Загрузка файла</h3>
                      <DxfUploader onFileLoaded={handleFileLoaded} />
                    </div>

                    {dxfConfig.fileName && <MaterialSelector selectedMaterial={dxfConfig.material} selectedThickness={dxfConfig.thickness} onMaterialChange={handleMaterialChange} onThicknessChange={handleThicknessChange} />}
                  </> : <>
                  <div className="space-y-2 text-xs p-3 bg-muted/50 rounded-md">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Артикул:</span>
                      <span className="font-medium">{selectedItemId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Файл:</span>
                      <span className="font-medium truncate ml-2">{dxfConfig.fileName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Длина реза:</span>
                      <span className="font-medium">
                        {dxfConfig.vectorLength.toFixed(2)} м
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Стоимость:</span>
                      <span className="font-bold text-primary">
                        {dxfConfig.price.toFixed(2)} ₽
                      </span>
                    </div>
                  </div>

                    <MaterialSelector selectedMaterial={dxfConfig.material} selectedThickness={dxfConfig.thickness} onMaterialChange={handleMaterialChange} onThicknessChange={handleThicknessChange} />

                    <div className="space-y-2">
                      <Button onClick={handleSaveEdit} className="w-full">
                        Сохранить изменения
                      </Button>
                      <Button onClick={handleCreateNew} variant="outline" className="w-full">
                        Создать новую деталь
                      </Button>
                    </div>
                  </>}
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Viewer */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between min-h-[52px] flex-shrink-0">
                <CardTitle className="text-base">Предварительный просмотр</CardTitle>
                {isCreatingNew && dxfConfig.fileName && <Button onClick={handleFinishPart}>
                    В корзину
 
                  </Button>}
              </CardHeader>
              <CardContent className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                {displayConfig && displayConfig.fileContent ? <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                      <TabsTrigger value="preview">Предпросмотр</TabsTrigger>
                      <TabsTrigger value="nesting">Раскрой</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview" className="flex-1 mt-4 min-h-0 overflow-auto data-[state=inactive]:hidden">
                      <div className="p-4 space-y-4">
                          <div className="space-y-2 text-xs p-3 bg-muted/50 rounded-md">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Файл:</span>
                              <span className="font-medium truncate ml-2">{displayConfig.fileName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Длина реза:</span>
                              <span className="font-medium">
                                {displayConfig.vectorLength.toFixed(2)} м
                              </span>
                            </div>
                            {nestingResults.length > 0 && nestingResults[selectedNestingVariant] && <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Площадь листа:</span>
                                  <span className="font-medium">
                                    {nestingResults[selectedNestingVariant].sheetArea.toFixed(2)} м²
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Точек врезки:</span>
                                  <span className="font-medium">
                                    {nestingResults[selectedNestingVariant].piercePoints}
                                  </span>
                                </div>
                              </>}
                            <Collapsible open={isPriceDetailsOpen} onOpenChange={setIsPriceDetailsOpen} className="pt-2 mt-2 border-t">
                              <CollapsibleTrigger className="flex justify-between items-center w-full hover:bg-muted/50 p-2 rounded-md transition-colors">
                                <span className="text-muted-foreground text-sm">Стоимость:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-primary text-2xl">
                                    {currentPrice.toFixed(2)} ₽
                                  </span>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground collapsible-chevron" data-state={isPriceDetailsOpen ? "open" : "closed"} />
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-3 space-y-2 text-xs">
                                {displayConfig && nestingResults.length > 0 && nestingResults[selectedNestingVariant] && (() => {
                              const pricing = getPricingByThickness(displayConfig.thickness, displayConfig.material);
                              if (!pricing) return null;
                              const piercePoints = nestingResults[selectedNestingVariant].piercePoints;
                              const pierceCost = piercePoints * pricing.pierce;
                              const cuttingLength = displayConfig.vectorLength;
                              const cuttingCost = cuttingLength * pricing.cutting;
                              const sheetArea = nestingResults[selectedNestingVariant].sheetArea;
                              const metalCost = sheetArea * pricing.metal;
                              return <>
                                      <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                                        <span className="text-muted-foreground">Точки врезки:</span>
                                        <span className="font-medium">
                                          {piercePoints} × {pricing.pierce} ₽ = {pierceCost.toFixed(2)} ₽
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                                        <span className="text-muted-foreground">Длина реза:</span>
                                        <span className="font-medium">
                                          {cuttingLength.toFixed(2)} м × {pricing.cutting} ₽/м = {cuttingCost.toFixed(2)} ₽
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                                        <span className="text-muted-foreground">Материал:</span>
                                        <span className="font-medium">
                                          {sheetArea.toFixed(2)} м² × {pricing.metal} ₽/м² = {metalCost.toFixed(2)} ₽
                                        </span>
                                      </div>
                                    </>;
                            })()}
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                          <div className="flex items-center justify-center min-h-[400px]">
                            <DxfViewer fileContent={displayConfig.fileContent} fileName={displayConfig.fileName} />
                          </div>
                          {/* Hidden thumbnail generator */}
                          {isCreatingNew && dxfConfig.fileContent && !dxfConfig.previewImage && (
                            <DxfThumbnailGenerator 
                              fileContent={dxfConfig.fileContent} 
                              onGenerated={handleThumbnailGenerated}
                            />
                          )}
                        </div>
                    </TabsContent>

                    <TabsContent value="nesting" className="flex-1 mt-4 min-h-0 overflow-auto data-[state=inactive]:hidden">
                      <div className="p-4 space-y-4">
                          {nestingResults.length > 0 && <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Вариант раскроя:</span>
                              <Select value={selectedNestingVariant.toString()} onValueChange={value => setSelectedNestingVariant(parseInt(value))}>
                                <SelectTrigger className="w-[240px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {nestingResults.map((result, index) => <SelectItem key={index} value={index.toString()}>
                                      Вариант {index + 1} - Эффективность: {result.efficiency.toFixed(1)}%
                                    </SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>}
                          <div className="min-h-[400px]">
                            <NestingViewer nestingResults={nestingResults} selectedVariant={selectedNestingVariant} />
                          </div>
                        </div>
                    </TabsContent>
                  </Tabs> : <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    Загрузите DXF файл для просмотра
                  </div>}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Cart */}
          <div className={`flex flex-col min-h-0 transition-all duration-300 flex-shrink-0 overflow-hidden ${isCartCollapsed ? 'w-0' : 'w-80'}`}>
            <Cart 
              cart={cart} 
              onDeleteItem={handleDeleteItem}
              onEditDxfItem={handleEditDxfItem}
              onCollapseChange={setIsCartCollapsed}
            />
          </div>
        </div>
      </div>

    </div>;
}