import { Package, Info, Activity, TrendingUp, Coins } from "lucide-react";
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
    icon: Info,
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
    title: "Finanz-Cockpit",
    description: "Analysiert EK, VK und Marge des gesamten Lagerbestands in 3 Spalten.",
    icon: Coins,
    defaultW: 10,
    defaultH: 3,
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
    title: "Bestands-Trend 2.0",
    description: "Visualisiert Bestandsverlauf und kumulierte Historie.",
    icon: TrendingUp,
    defaultW: 10,
    defaultH: 4,
  }
];

export const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  "stock-status": StockStatusWidget,
  "critical-stock": CriticalStockWidget,
  "activity-log": ActivityLogWidget,
  "warenwert": WarenwertWidget,
  "profit-calc": ProfitCalcWidget,
  "quick-book": QuickBookWidget,
  "weekly-trend": WeeklyTrendWidget,
};
