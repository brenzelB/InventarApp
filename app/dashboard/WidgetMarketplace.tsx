import { X, Plus, Trash2 } from "lucide-react";
import { WIDGET_REGISTRY, WidgetMeta } from "./widgets/registry";

interface WidgetMarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
  activeWidgetIds: string[];
  onAddWidget: (widget: WidgetMeta) => void;
  onRemoveWidget: (widgetId: string) => void;
}

export function WidgetMarketplace({
  isOpen,
  onClose,
  activeWidgetIds,
  onAddWidget,
  onRemoveWidget,
}: WidgetMarketplaceProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-widget border-l border-outline shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="p-6 border-b border-outline flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold font-mono text-secondary uppercase tracking-[0.2em] mb-1">
              [ SYS_WIDG_MKT ]
            </div>
            <h2 className="text-xl font-bold font-sora text-foreground uppercase tracking-tight">Widget Markt</h2>
            <p className="text-xs text-foreground/60 mt-1 font-sans">
              Passe dein Dashboard individuell an.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-foreground/50 hover:text-foreground rounded-element hover:bg-surface-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {WIDGET_REGISTRY.map((widget) => {
            const isActive = activeWidgetIds.includes(widget.id);
            const Icon = widget.icon;

            return (
              <div 
                key={widget.id}
                className={`p-6 rounded-card border transition-all duration-300 ${isActive ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(224,108,117,0.15)]' : 'border-outline bg-surface-1'} flex flex-col gap-4 relative overflow-hidden`}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-element ${isActive ? 'bg-primary/10 text-primary' : 'bg-surface-2 text-foreground/60'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-foreground font-sora uppercase tracking-tight">{widget.title}</h3>
                    <p className="text-xs text-foreground/60 leading-relaxed mt-1 font-sans">{widget.description}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  {isActive ? (
                    <button
                      onClick={() => onRemoveWidget(widget.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-element border border-red-500/20 transition-colors font-mono uppercase tracking-widest"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Entfernen
                    </button>
                  ) : (
                    <button
                      onClick={() => onAddWidget(widget)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-element border border-primary/20 transition-colors font-mono uppercase tracking-widest"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Hinzufügen
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
