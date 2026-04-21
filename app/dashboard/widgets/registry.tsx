import { Package, AlertOctagon, Activity, TrendingUp, Users } from "lucide-react";
import { StockStatusWidget } from "./StockStatusWidget";
import { CriticalStockWidget } from "./CriticalStockWidget";
import { ActivityLogWidget } from "./ActivityLogWidget";
import { InventoryValueWidget } from "./InventoryValueWidget";
import { QuickBookWidget } from "./QuickBookWidget";
import { WeeklyTrendWidget } from "./WeeklyTrendWidget";

export interface WidgetMeta {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultW: number;
  defaultH: number;
}

export const WIDGET_REGISTRY: WidgetMeta[] = [
  {
    id: "stock-status",
    title: "Lager-Status",
    description: "Zeigt die Gesamtzahl der Artikel und Kategorien im Bestand an.",
    icon: Package,
    defaultW: 4,
    defaultH: 2,
  },
  {
    id: "critical-stock",
    title: "Kritische Bestände",
    description: "Listet die Top 5 Artikel auf, die unter ihr Warnlimit gefallen sind.",
    icon: AlertOctagon,
    defaultW: 4,
    defaultH: 3,
  },
  {
    id: "activity-log",
    title: "Aktivitäts-Log",
    description: "Zeigt eine Echtzeit-Übersicht der letzten 5 Änderungen im Inventar.",
    icon: Activity,
    defaultW: 4,
    defaultH: 3,
  },
  {
    id: "inventory-value",
    title: "Inventar-Wert",
    description: "Zeigt den gesamten gebundenen Kapitalwert (Bestand × Einkaufspreis).",
    icon: TrendingUp,
    defaultW: 4,
    defaultH: 2,
  },
  {
    id: "quick-book",
    title: "Express-Buchung",
    description: "Ermöglicht das schnelle Ein- und Auslagern direkt aus dem Dashboard.",
    icon: Package,
    defaultW: 4,
    defaultH: 3,
  },
  {
    id: "weekly-trend",
    title: "Wochen-Trend",
    description: "Visualisiert die Bestandsbewegungen der letzten 7 Tage.",
    icon: Activity,
    defaultW: 8,
    defaultH: 3,
  }
];

export const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  "stock-status": StockStatusWidget,
  "critical-stock": CriticalStockWidget,
  "activity-log": ActivityLogWidget,
  "inventory-value": InventoryValueWidget,
  "quick-book": QuickBookWidget,
  "weekly-trend": WeeklyTrendWidget,
};
