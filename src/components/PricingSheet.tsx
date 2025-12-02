import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DollarSign, ChevronDown } from "lucide-react";
import { PRICING_DATA, MATERIALS, MaterialType } from "@/types/dxf";
import { useState } from "react";

export function PricingSheet() {
  const [openMaterials, setOpenMaterials] = useState<Record<string, boolean>>({});

  // Group pricing by material
  const pricingByMaterial = PRICING_DATA.reduce((acc, item) => {
    if (!acc[item.material]) {
      acc[item.material] = [];
    }
    acc[item.material].push(item);
    return acc;
  }, {} as Record<MaterialType, typeof PRICING_DATA>);
  
  const availableMaterials = Object.keys(pricingByMaterial) as MaterialType[];

  const toggleMaterial = (material: string) => {
    setOpenMaterials(prev => ({
      ...prev,
      [material]: !prev[material]
    }));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Стоимость
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-2">
          <SheetTitle className="text-xl">Прайс-лист на резку металла</SheetTitle>
          <SheetDescription className="text-xs">
            Актуальные цены на лазерную резку заготовок
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-4 space-y-2">
          {availableMaterials.map(material => (
            <Collapsible 
              key={material} 
              open={openMaterials[material] || false}
              onOpenChange={() => toggleMaterial(material)}
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <span className="font-semibold text-sm">{MATERIALS[material].name}</span>
                <ChevronDown 
                  className="h-4 w-4 text-muted-foreground transition-transform duration-200" 
                  style={{ transform: openMaterials[material] ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-xs h-8 px-2">Толщина (мм)</TableHead>
                      <TableHead className="font-semibold text-xs h-8 px-2">Резка (₽/м)</TableHead>
                      <TableHead className="font-semibold text-xs h-8 px-2">Врезка (₽/точка)</TableHead>
                      <TableHead className="font-semibold text-xs h-8 px-2">Металл (₽/м²)</TableHead>
                      <TableHead className="font-semibold text-xs h-8 px-2">Формат (м)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingByMaterial[material].map(row => (
                      <TableRow key={`${row.material}-${row.thickness}`} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-xs py-1.5 px-2">{row.thickness}</TableCell>
                        <TableCell className="text-xs py-1.5 px-2">{row.cutting}</TableCell>
                        <TableCell className="text-xs py-1.5 px-2">{row.pierce}</TableCell>
                        <TableCell className="text-xs py-1.5 px-2">{row.metal}</TableCell>
                        <TableCell className="text-xs py-1.5 px-2 text-muted-foreground">{row.format}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
