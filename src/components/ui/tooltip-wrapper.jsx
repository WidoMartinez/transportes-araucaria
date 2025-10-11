import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

/**
 * InfoTooltip - Componente para mostrar información adicional con un ícono de ayuda
 * @param {string} content - Texto del tooltip a mostrar
 * @param {React.ReactNode} children - Ícono personalizado (opcional, por defecto HelpCircle)
 * @param {string} side - Posición del tooltip: "top", "right", "bottom", "left" (por defecto "top")
 */
function InfoTooltip({ content, children, side = "top" }) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <button
            type="button"
            className="inline-flex items-center ml-1 cursor-help"
            aria-label="Más información"
          >
            {children || <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />}
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          side={side}
          className={cn(
            "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
            "animate-in fade-in-0 zoom-in-95",
            "max-w-xs"
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-border" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
}

export { InfoTooltip };
