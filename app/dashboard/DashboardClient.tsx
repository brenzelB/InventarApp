"use client";

import { useState, useEffect } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import { Pencil, Save, X, Loader2 } from "lucide-react";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { Plus } from "lucide-react";
import { WidgetMarketplace } from "./WidgetMarketplace";
import { WIDGET_COMPONENTS, WidgetMeta } from "./widgets/registry";
import { saveDashboardLayout } from "./actions";
import { useToast } from "@/hooks/useToast";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardClientProps {
  userId: string;
  initialLayout: Layout[] | null;
}

const DEFAULT_LAYOUT: Layout[] = [
  { i: "stock-status", x: 0, y: 0, w: 4, h: 2 },
  { i: "critical-stock", x: 4, y: 0, w: 4, h: 3 },
  { i: "activity-log", x: 8, y: 0, w: 4, h: 3 },
  { i: "inventory-value", x: 0, y: 3, w: 12, h: 3 },
];

export function DashboardClient({ userId, initialLayout }: DashboardClientProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [layout, setLayout] = useState<Layout[]>(initialLayout && initialLayout.length > 0 ? initialLayout : DEFAULT_LAYOUT);
  const [currentLayouts, setCurrentLayouts] = useState<{ [key: string]: Layout[] }>({ lg: layout });
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddWidget = (widget: WidgetMeta) => {
    // Find the next available Y position by looking at current max Y
    let maxY = 0;
    layout.forEach(item => {
      if (item.y + item.h > maxY) {
        maxY = item.y + item.h;
      }
    });

    const newItem: Layout = {
      i: widget.id,
      x: 0,
      y: maxY,
      w: widget.defaultW,
      h: widget.defaultH,
    };

    const newLayout = [...layout, newItem];
    setLayout(newLayout);
    setCurrentLayouts({ lg: newLayout });
  };

  const handleRemoveWidget = (widgetId: string) => {
    const newLayout = layout.filter(item => item.i !== widgetId);
    setLayout(newLayout);
    setCurrentLayouts({ lg: newLayout });
  };

  const handleLayoutChange = (newLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    // Preserve custom settings during layout changes
    const layoutWithSettings = newLayout.map(newItem => {
      const existingItem = layout.find(oldItem => oldItem.i === newItem.i);
      return {
        ...newItem,
        settings: existingItem ? (existingItem as any).settings : undefined
      };
    });
    
    setCurrentLayouts(allLayouts);
    setLayout(layoutWithSettings);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveDashboardLayout(userId, layout);
      if (!result.success) throw new Error(result.error);
      
      toastSuccess("Layout erfolgreich gespeichert.");
      setIsEditing(false);
    } catch (err: any) {
      toastError("Fehler beim Speichern: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Revert to initial or default setup if cancelled
    setLayout(initialLayout && initialLayout.length > 0 ? initialLayout : DEFAULT_LAYOUT);
    setCurrentLayouts({ lg: initialLayout && initialLayout.length > 0 ? initialLayout : DEFAULT_LAYOUT });
    setIsEditing(false);
  };

  const handleUpdateWidgetConfig = async (widgetId: string, settings: any) => {
    const newLayout = layout.map(item => 
      item.i === widgetId ? { ...item, settings: { ...(item as any).settings, ...settings } } : item
    );
    setLayout(newLayout);
    setCurrentLayouts({ lg: newLayout });
    
    // Auto-save settings changes to DB
    try {
      await saveDashboardLayout(userId, newLayout);
    } catch (err) {
      console.error("Failed to auto-save widget settings:", err);
    }
  };

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <div className="py-6">
      <div className="md:flex md:items-center md:justify-between px-4 sm:px-0 mb-8">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold font-mono text-secondary uppercase tracking-[0.2em] mb-1">
            [ SYS_DASH_INV ]
          </div>
          <h2 className="text-2xl font-bold font-sora leading-7 text-foreground sm:truncate sm:text-3xl tracking-tight uppercase">
            System Dashboard
          </h2>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <button
            onClick={() => setIsMarketplaceOpen(true)}
            className="group inline-flex items-center h-11 px-4 rounded-element bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 shadow-sm transition-all duration-300 ease-in-out font-mono text-xs uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
              Widget hinzufügen
            </span>
          </button>
          
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="group inline-flex items-center h-11 px-4 rounded-element bg-surface-2 border border-outline text-foreground/80 shadow-sm hover:bg-foreground/5 transition-all duration-300 ease-in-out font-mono text-xs uppercase tracking-wider"
              >
                <X className="w-4 h-4 flex-shrink-0" />
                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                  Abbrechen
                </span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="group inline-flex items-center h-11 px-4 rounded-element bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/5 transition-all duration-300 ease-in-out disabled:opacity-50 font-mono text-xs uppercase tracking-wider"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : <Save className="w-4 h-4 flex-shrink-0" />}
                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                  Speichern
                </span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="group inline-flex items-center h-11 px-4 rounded-element bg-widget border border-outline text-foreground/80 hover:bg-surface-2 transition-all duration-300 ease-in-out font-mono text-xs uppercase tracking-wider"
            >
              <Pencil className="w-4 h-4 flex-shrink-0" />
              <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                Layout bearbeiten
              </span>
            </button>
          )}
        </div>
      </div>

      <div className={`p-2 rounded-card transition-all duration-300 ${isEditing ? 'bg-surface-2/30 border border-dashed border-primary/30 relative' : ''}`}>
        {isEditing && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-card border-2 border-dashed border-primary/20 z-0 opacity-40" />
        )}
        <div className="relative z-10">
          <ResponsiveGridLayout
            className="layout"
            layouts={currentLayouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            onLayoutChange={handleLayoutChange}
            isDraggable={isEditing}
            isResizable={isEditing}
            margin={[24, 24]}
            useCSSTransforms={true}
            draggableCancel=".no-drag"
          >
            {layout.map((item, index) => {
              const WidgetComponent = WIDGET_COMPONENTS[item.i];
              if (!WidgetComponent) return null;

              return (
                <div 
                  key={item.i} 
                  className={isEditing ? 'cursor-grab active:cursor-grabbing border border-primary shadow-[0_0_15px_rgba(224,108,117,0.2)] rounded-card overflow-hidden bg-widget' : ''}
                >
                  <div 
                    className="h-full w-full animate-fadeInUp opacity-0"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <WidgetComponent 
                      config={(item as any).settings || {}} 
                      onUpdateConfig={(s: any) => handleUpdateWidgetConfig(item.i, s)} 
                    />
                  </div>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        </div>
      </div>

      <WidgetMarketplace 
        isOpen={isMarketplaceOpen}
        onClose={() => setIsMarketplaceOpen(false)}
        activeWidgetIds={layout.map(item => item.i)}
        onAddWidget={handleAddWidget}
        onRemoveWidget={handleRemoveWidget}
      />
    </div>
  );
}
