import { useState, useEffect } from "react";
import { IgsViewer3D } from "@/components/IgsViewer3D";
import { IgsUploader } from "@/components/IgsUploader";
import { IgsAnalysisPanel } from "@/components/IgsAnalysisPanel";
import { TubeConfig, createDefaultTubeConfig, IgsAnalysisResult } from "@/types/igs";
import { MainNav } from "@/components/MainNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cart } from "@/components/Cart";
import { 
  loadCartFromStorage, 
  saveCartToStorage, 
  addTubeItemToCart, 
  removeItemFromCart,
  Cart as CartType 
} from "@/types/cart";
import { toast } from "@/hooks/use-toast";
import * as THREE from "three";

const Index = () => {
  const [tubeConfig, setTubeConfig] = useState<TubeConfig>(createDefaultTubeConfig());
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [cart, setCart] = useState<CartType>(() => loadCartFromStorage());
  const [isCartCollapsed, setIsCartCollapsed] = useState(() => {
    const saved = localStorage.getItem("cart-collapsed");
    return saved === "true";
  });

  // Save cart to localStorage
  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  const handleFileLoaded = (group: THREE.Group, analysis: IgsAnalysisResult) => {
    setModel(group);
    setTubeConfig(prev => ({
      ...prev,
      analysis,
      wallThickness: analysis.dimensions.wallThickness || 2,
    }));
    
    toast({
      title: "Файл загружен",
      description: `Определён профиль: ${analysis.profileType}`
    });
  };

  const handleAddToCart = () => {
    if (!tubeConfig.analysis) {
      toast({
        title: "Ошибка",
        description: "Сначала загрузите .IGS файл",
        variant: "destructive"
      });
      return;
    }

    const newCart = addTubeItemToCart(cart, tubeConfig);
    const newItem = newCart.items[newCart.items.length - 1];
    
    setCart(newCart);
    
    // Reset for new file
    setTubeConfig(createDefaultTubeConfig());
    setModel(null);

    toast({
      title: "Деталь добавлена",
      description: `Артикул: ${newItem.id}`
    });
  };

  const handleDeleteItem = (itemId: string) => {
    const newCart = removeItemFromCart(cart, itemId);
    setCart(newCart);
    toast({
      title: "Деталь удалена"
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <MainNav />

      {/* Основной контент */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex gap-4 p-4 overflow-hidden overflow-x-hidden">
          {/* Левая панель - загрузка и параметры */}
          <div className="w-80 flex flex-col gap-4 flex-shrink-0 overflow-y-auto">
            <IgsUploader onFileLoaded={handleFileLoaded} />
            <IgsAnalysisPanel 
              config={tubeConfig}
              onChange={setTubeConfig}
              onAddToCart={handleAddToCart}
            />
          </div>

          {/* Центральная панель - 3D просмотр */}
          <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCartCollapsed ? 'mr-0' : ''}`}>
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b flex-shrink-0">
                <CardTitle className="text-lg">3D Просмотр</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-4 overflow-auto">
                {model ? (
                  <div className="h-full">
                    <IgsViewer3D model={model} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Загрузите .IGS файл для просмотра
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Правая панель - корзина */}
          <div className={`flex flex-col transition-all duration-300 flex-shrink-0 overflow-hidden ${isCartCollapsed ? 'w-0' : 'w-80'}`}>
            <Cart 
              cart={cart} 
              onDeleteItem={handleDeleteItem}
              onCollapseChange={setIsCartCollapsed}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
