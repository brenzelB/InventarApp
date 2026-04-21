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
    setCurrentLayouts(allLayouts);
    setLayout(newLayout);
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

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <div className="py-6">
      <div className="md:flex md:items-center md:justify-between px-4 sm:px-0 mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-black leading-7 text-slate-900 dark:text-white sm:truncate sm:text-3xl tracking-tighter uppercase">
            Dashboard
          </h2>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <button
            onClick={() => setIsMarketplaceOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 shadow-sm hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-4 h-4" /> Widget hinzufügen
          </button>
          
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" /> Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Speichern
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Pencil className="w-4 h-4" /> Layout bearbeiten
            </button>
          )}
        </div>
      </div>

      <div className={`p-2 rounded-2xl transition-all duration-300 ${isEditing ? 'bg-slate-100/50 dark:bg-slate-800/50 ring-2 ring-indigo-500/20 ring-inset relative' : ''}`}>
        {isEditing && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-2xl border-2 border-dashed border-indigo-400/50 z-0 opacity-50" />
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
            {layout.map(item => {
              const widgetComponent = WIDGET_COMPONENTS[item.i];
              if (!widgetComponent) return null;

              return (
                <div key={item.i} className={`transition-shadow ${isEditing ? 'cursor-grab active:cursor-grabbing ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 rounded-xl' : ''}`}>
                  {widgetComponent}
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
