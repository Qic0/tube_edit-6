import { useState, useEffect } from "react";
import { MainNav } from "@/components/MainNav";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingTextarea } from "@/components/ui/floating-textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { MATERIALS } from "@/types/dxf";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { loadCartFromStorage, getCartTotalPrice, Cart, saveCartToStorage, createEmptyCart } from "@/types/cart";
import { calculateTubePrice, getProfileTypeName } from "@/types/igs";

export default function Pay() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart>(createEmptyCart());
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    comment: ""
  });
  const [acceptedSize, setAcceptedSize] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  useEffect(() => {
    // Load cart from localStorage
    const loadedCart = loadCartFromStorage();
    setCart(loadedCart);

    // If cart is empty, redirect to DXF page
    if (loadedCart.items.length === 0) {
      toast({
        title: "Корзина пуста",
        description: "Добавьте детали перед оформлением заказа",
        variant: "destructive"
      });
      navigate("/dxf");
    }
  }, [navigate]);

  const totalPrice = getCartTotalPrice(cart);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedSize || !acceptedPrivacy) {
      toast({
        title: "Ошибка",
        description: "Необходимо согласиться с условиями",
        variant: "destructive"
      });
      return;
    }

    try {
      // Prepare FormData for multipart/form-data
      const formDataToSend = new FormData();
      
      // Add basic fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('comment', formData.comment);
      formDataToSend.append('totalPrice', totalPrice.toString());

      // Prepare items data and files
      const items = cart.items.map((item, index) => {
        if (item.type === "dxf" && item.dxfConfig) {
          const config = item.dxfConfig;
          const materialName = MATERIALS[config.material]?.name || config.material;
          
          // Create Blob from file content and add to FormData
          const blob = new Blob([config.fileContent], { type: 'application/dxf' });
          formDataToSend.append(`file_${item.id}`, blob, config.fileName);
          
          return {
            name: `${item.id} — ${config.fileName}`,
            serviceType: "laser_cut",
            cutPoints: config.piercePoints || 0,
            material: `${materialName} ${config.thickness} мм`,
            cutLength: config.vectorLength,
            area: config.sheetArea || 0,
            fileId: item.id,
            price: config.price
          };
        }
        
                        if (item.type === "tube" && item.tubeConfig) {
                          const config = item.tubeConfig;
                          const price = calculateTubePrice(config);
                          const analysis = config.analysis;
                          
                          return {
                            name: `${item.id} — ${analysis?.fileName || "Труба"}`,
                            serviceType: "tube_cut",
                            cutPoints: analysis?.piercePointsCount || 0,
                            material: `${config.material.name} ${config.wallThickness} мм`,
                            cutLength: (analysis?.totalCutLength || 0) / 1000, // convert mm to m
                            area: 0,
                            price: price
                          };
                        }
        
        return null;
      }).filter(Boolean);

      // Add items as JSON
      formDataToSend.append('items', JSON.stringify(items));

      // Send to backend
      const response = await fetch("https://tube-edit.cloudpub.ru/order", {
        method: "POST",
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error("Ошибка отправки заказа");
      }

      toast({
        title: "Заказ оформлен",
        description: "Мы свяжемся с вами в ближайшее время"
      });

      // Clear cart
      const emptyCart = createEmptyCart();
      saveCartToStorage(emptyCart);
      navigate("/dxf");
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить заказ. Попробуйте позже.",
        variant: "destructive"
      });
      console.error("Order submission error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <MainNav />

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 perspective-[1200px]">
            {/* Left Column - Cart */}
            <Card className="p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 hover:brightness-[1.03] animate-fade-in">
              <h2 className="text-3xl font-semibold mb-6 tracking-tight">Ваш заказ</h2>

              <div className="space-y-6">
                {cart.items.map((item) => {
                  if (item.type === "dxf" && item.dxfConfig) {
                    const config = item.dxfConfig;
                    const materialName = MATERIALS[config.material]?.name || config.material;
                    
                    return (
                      <div
                        key={item.id}
                        className="flex gap-5 p-5 border-b last:border-b-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rounded-lg"
                      >
                        <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                          {config.previewImage ? (
                            <img
                              src={config.previewImage}
                              alt={config.fileName}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-muted-foreground text-xs">DXF</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-lg mb-2">
                            {item.id} — {config.fileName || "Безымянный"}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {config.piercePoints && (
                              <div>• Точек врезки: {config.piercePoints}</div>
                            )}
                            <div>• Длина реза: {config.vectorLength.toFixed(1)} м</div>
                            <div>
                              • {materialName} {config.thickness} мм
                              {config.sheetArea && `: ${config.sheetArea.toFixed(2)} м²`}
                            </div>
                          </div>
                        </div>

                        <div className="text-lg font-semibold whitespace-nowrap self-start">
                          {config.price.toFixed(2)} ₽
                        </div>
                      </div>
                    );
                  }

                  if (item.type === "tube" && item.tubeConfig) {
                    const config = item.tubeConfig;
                    const price = calculateTubePrice(config);
                    const analysis = config.analysis;
                    
                    return (
                      <div
                        key={item.id}
                        className="flex gap-5 p-5 border-b last:border-b-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rounded-lg"
                      >
                        <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                          <div className="text-muted-foreground text-xs">Труба</div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-lg mb-2">
                            {item.id} — {analysis?.fileName || "Труба"}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {analysis && (
                              <>
                                <div>• Профиль: {getProfileTypeName(analysis.profileType)}</div>
                                <div>• Длина: {analysis.dimensions.length.toFixed(0)} мм</div>
                                <div>• Длина реза: {(analysis.totalCutLength / 1000).toFixed(3)} м</div>
                                <div>• Точек врезки: {analysis.piercePointsCount}</div>
                              </>
                            )}
                            <div>• Материал: {config.material.name} {config.wallThickness} мм</div>
                          </div>
                        </div>

                        <div className="text-lg font-semibold whitespace-nowrap self-start">
                          {price.toFixed(2)} ₽
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>

              <div className="mt-8 pt-6 border-t text-right">
                <div className="text-2xl font-semibold">
                  Итог: {totalPrice.toFixed(2)} ₽
                </div>
              </div>
            </Card>

            {/* Right Column - Form */}
            <Card className="p-8 h-fit sticky top-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 hover:brightness-[1.03] animate-fade-in [animation-delay:150ms]">
              <h2 className="text-2xl font-semibold mb-6 tracking-tight">
                Данные для заказа
              </h2>

              <form onSubmit={handleSubmit}>
                <FloatingInput
                  id="name"
                  label="Имя"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <FloatingInput
                  id="phone"
                  label="Телефон"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />

                <FloatingInput
                  id="email"
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />

                <FloatingTextarea
                  id="comment"
                  label="Комментарий"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                />

                <div className="flex flex-col gap-2.5 mb-5">
                  <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer transition-colors hover:text-foreground/80 group">
                    <Checkbox
                      id="size"
                      checked={acceptedSize}
                      onCheckedChange={(checked) => setAcceptedSize(checked as boolean)}
                      className="transition-transform group-hover:scale-110"
                    />
                    Подтверждаю правильность размеров
                  </label>

                  <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer transition-colors hover:text-foreground/80 group">
                    <Checkbox
                      id="privacy"
                      checked={acceptedPrivacy}
                      onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                      className="transition-transform group-hover:scale-110"
                    />
                    Согласен на обработку персональных данных
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold rounded-[14px] shadow-lg hover:shadow-xl transition-all duration-250 hover:brightness-105"
                >
                  Подтвердить заказ
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
