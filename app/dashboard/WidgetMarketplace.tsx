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
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Widget Marketplace</h2>
            <p className="text-sm text-slate-500 mt-1">
              Passe dein Dashboard individuell an.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {WIDGET_REGISTRY.map((widget) => {
            const isActive = activeWidgetIds.includes(widget.id);
            const Icon = widget.icon;

            return (
              <div 
                key={widget.id}
                className={`p-4 rounded-xl border ${isActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'} shadow-sm flex flex-col gap-4 relative overflow-hidden transition-colors`}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${isActive ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{widget.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">{widget.description}</p>
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  {isActive ? (
                    <button
                      onClick={() => onRemoveWidget(widget.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Entfernen
                    </button>
                  ) : (
                    <button
                      onClick={() => onAddWidget(widget)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
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
