import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Package, Trash2, Pencil, ChevronDown, FileText, Circle, Ruler, Layers, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CartItem, getCartTotalPrice, Cart as CartType } from "@/types/cart";
import { getPricingByThickness, MATERIALS } from "@/types/dxf";
import { calculateTubePrice, getProfileTypeName, formatDimensions } from "@/types/igs";
import { useState, useEffect } from "react";
interface CartProps {
  cart: CartType;
  onDeleteItem: (itemId: string) => void;
  onEditDxfItem?: (itemId: string) => void;
  onCollapseChange?: (collapsed: boolean) => void;
}
export function Cart({
  cart,
  onDeleteItem,
  onEditDxfItem,
  onCollapseChange
}: CartProps) {
  const navigate = useNavigate();
  const [openPriceDetails, setOpenPriceDetails] = useState<{
    [key: string]: boolean;
  }>({});
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("cart-collapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("cart-collapsed", String(isCollapsed));
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  const totalPrice = getCartTotalPrice(cart);
  return (
    <>
      {/* Collapsed Tab */}
      {isCollapsed && (
        <div 
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 cursor-pointer group"
          onClick={() => setIsCollapsed(false)}
        >
          <div className="bg-card border-l-0 border border-border rounded-l-lg shadow-lg py-6 px-2 flex flex-col items-center gap-2 hover:bg-accent transition-colors">
            <ShoppingCart className="w-5 h-5 text-primary" />
            {cart.items.length > 0 && (
              <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                {cart.items.length}
              </Badge>
            )}
            <ChevronLeft className="w-4 h-4 text-muted-foreground mt-2" />
          </div>
        </div>
      )}

      {/* Full Cart */}
      <Card 
        className={`flex-1 flex flex-col min-h-0 overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'opacity-0 pointer-events-none invisible' : 'opacity-100'
        }`}
      >
        <CardHeader className="pb-3 border-b flex-shrink-0 min-h-[52px]">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" />
            Корзина
            <Badge variant="secondary" className="ml-2">{cart.items.length}</Badge>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 w-7 p-0"
              onClick={() => setIsCollapsed(true)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-4 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto min-h-0">
            {cart.items.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                <p>Нет готовых деталей</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.items.map(item => (
                  <CartItemCard 
                    key={item.id} 
                    item={item} 
                    onDelete={onDeleteItem} 
                    onEdit={onEditDxfItem} 
                    openPriceDetails={openPriceDetails} 
                    setOpenPriceDetails={setOpenPriceDetails} 
                  />
                ))}
              </div>
            )}
          </div>

          {cart.items.length > 0 && (
            <div className="border-t pt-3 mt-3 space-y-3 flex-shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Итого:</span>
                <span className="text-3xl font-bold text-primary">
                  {totalPrice.toFixed(2)} ₽
                </span>
              </div>
              <Button className="w-full" size="lg" onClick={() => navigate("/pay")}>
                <ShoppingCart className="h-4 w-4" />
                Оформить заказ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
interface CartItemCardProps {
  item: CartItem;
  onDelete: (itemId: string) => void;
  onEdit?: (itemId: string) => void;
  openPriceDetails: {
    [key: string]: boolean;
  };
  setOpenPriceDetails: React.Dispatch<React.SetStateAction<{
    [key: string]: boolean;
  }>>;
}
function CartItemCard({
  item,
  onDelete,
  onEdit,
  openPriceDetails,
  setOpenPriceDetails
}: CartItemCardProps) {
  if (item.type === "dxf" && item.dxfConfig) {
    const config = item.dxfConfig;
    const materialInfo = MATERIALS[config.material];
    return <Card className="group transition-all duration-200 hover-card">
        <div className="flex items-start gap-2 p-2">
          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Header row with ID and number */}
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">{item.sequenceNumber}</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {item.id}
                </Badge>
              </div>
            </div>

            {/* File name */}
            <div className="text-xs font-medium text-foreground truncate pl-2" title={config.fileName}>
              {config.fileName}
            </div>

            {/* Parameters - compact */}
            <div className="space-y-0.5 text-[10px] text-muted-foreground pl-2">
              <div className="flex items-center gap-1">
                <Circle className="h-2.5 w-2.5 flex-shrink-0" />
                <span>Врезки: {config.piercePoints || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Ruler className="h-2.5 w-2.5 flex-shrink-0" />
                <span>Рез: {config.vectorLength.toFixed(1)} м</span>
              </div>
              <div className="flex items-center gap-1">
                <Layers className="h-2.5 w-2.5 flex-shrink-0" />
                <span>
                  {config.material === "steel" ? "СТ3" : materialInfo.name} {config.thickness}мм: {config.sheetArea?.toFixed(2) || 0} м²
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons - left of image */}
          <div className="flex-shrink-0 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-1">
            {onEdit && <Button size="sm" variant="ghost" className="h-5 w-5 p-0 hover:bg-primary/10 hover:text-primary" onClick={e => {
            e.stopPropagation();
            onEdit(item.id);
          }}>
                <Pencil className="h-2.5 w-2.5" />
              </Button>}
            <Button size="sm" variant="ghost" className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={e => {
            e.stopPropagation();
            onDelete(item.id);
          }}>
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>

          {/* Right content - avatar and price */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            {/* Avatar - larger */}
            <Avatar className="w-24 h-24 rounded-md border border-border">
              {config.previewImage ? <AvatarImage src={config.previewImage} alt={config.fileName} className="object-contain p-1" /> : <AvatarFallback className="rounded-md bg-muted">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </AvatarFallback>}
            </Avatar>

            {/* Price */}
            <Collapsible open={openPriceDetails[item.id] || false} onOpenChange={isOpen => setOpenPriceDetails(prev => ({
            ...prev,
            [item.id]: isOpen
          }))} className="w-full">
              <CollapsibleTrigger className="w-full flex items-center justify-center gap-0.5 hover:bg-muted/50 p-0.5 rounded transition-colors" onClick={e => e.stopPropagation()}>
                <span className="font-bold text-primary whitespace-nowrap text-xl">
                  {config.price.toFixed(0)} ₽
                </span>
                <ChevronDown className="h-2.5 w-2.5 text-muted-foreground transition-transform" style={{
                transform: openPriceDetails[item.id] ? "rotate(180deg)" : "rotate(0deg)"
              }} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-1">
                {(() => {
                const pricing = getPricingByThickness(config.thickness, config.material);
                if (!pricing) return null;
                const piercePoints = config.piercePoints || 0;
                const pierceCost = piercePoints * pricing.pierce;
                const cuttingLength = config.vectorLength;
                const cuttingCost = cuttingLength * pricing.cutting;
                const sheetArea = config.sheetArea || 0;
                const metalCost = sheetArea * pricing.metal;
                return <div className="space-y-0.5 text-[9px] leading-tight">
                      <div className="flex justify-between items-center p-0.5 bg-muted/30 rounded">
                        <span className="text-muted-foreground">Врез:</span>
                        <span className="font-medium">{pierceCost.toFixed(0)} ₽</span>
                      </div>
                      <div className="flex justify-between items-center p-0.5 bg-muted/30 rounded">
                        <span className="text-muted-foreground">Рез:</span>
                        <span className="font-medium">{cuttingCost.toFixed(0)} ₽</span>
                      </div>
                      <div className="flex justify-between items-center p-0.5 bg-muted/30 rounded">
                        <span className="text-muted-foreground">Мат:</span>
                        <span className="font-medium">{metalCost.toFixed(0)} ₽</span>
                      </div>
                    </div>;
              })()}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </Card>;
  }
  if (item.type === "tube" && item.tubeConfig) {
    const config = item.tubeConfig;
    const price = calculateTubePrice(config);
    const analysis = config.analysis;
    
    return <Card className="group transition-all duration-200 hover-card">
        <div className="flex items-start gap-2 p-2">
          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Header row with ID and number */}
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">{item.sequenceNumber}</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {item.id}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div className="text-xs font-medium text-foreground pl-2 truncate" title={analysis?.fileName}>
              {analysis?.fileName || "Труба"}
            </div>

            {/* Parameters - compact */}
            {analysis && (
              <div className="space-y-0.5 text-[10px] text-muted-foreground pl-2">
                <div className="flex items-center gap-1">
                  <Package className="h-2.5 w-2.5 flex-shrink-0" />
                  <span>{getProfileTypeName(analysis.profileType)} {formatDimensions(analysis.dimensions, analysis.profileType)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Ruler className="h-2.5 w-2.5 flex-shrink-0" />
                  <span>Длина: {analysis.dimensions.length.toFixed(0)} мм</span>
                </div>
                <div className="flex items-center gap-1">
                  <Circle className="h-2.5 w-2.5 flex-shrink-0" />
                  <span>Рез: {(analysis.totalCutLength / 1000).toFixed(3)} м</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons - left of image */}
          <div className="flex-shrink-0 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-1">
            <Button size="sm" variant="ghost" className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={e => {
              e.stopPropagation();
              onDelete(item.id);
            }}>
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>

          {/* Right content - avatar and price */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            {/* Avatar placeholder for tube */}
            <Avatar className="w-24 h-24 rounded-md border border-border">
              <AvatarFallback className="rounded-md bg-muted">
                <Package className="w-8 h-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>

            {/* Price */}
            <span className="font-bold text-primary whitespace-nowrap text-xl">
              {price.toFixed(0)} ₽
            </span>
          </div>
        </div>
      </Card>;
  }
  return null;
}