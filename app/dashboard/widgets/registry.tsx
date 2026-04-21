import { Package, AlertOctagon, Activity, TrendingUp, Users } from "lucide-react";
import { StockStatusWidget } from "./StockStatusWidget";
import { CriticalStockWidget } from "./CriticalStockWidget";
import { ActivityLogWidget } from "./ActivityLogWidget";
import { PlaceholderWidget } from "./PlaceholderWidget";

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
    id: "financial-overview",
    title: "Finanz-Übersicht",
    description: "Platzhalter: Zusammenfassung von Kapitalbindung und Lagerwert.",
    icon: TrendingUp,
    defaultW: 6,
    defaultH: 3,
  },
  {
    id: "team-activity",
    title: "Team Leistung",
    description: "Platzhalter: Zeigt an, welches Teammitglied am meisten einbucht.",
    icon: Users,
    defaultW: 4,
    defaultH: 3,
  }
];

export const WIDGET_COMPONENTS: Record<string, React.ReactNode> = {
  "stock-status": <StockStatusWidget />,
  "critical-stock": <CriticalStockWidget />,
  "activity-log": <ActivityLogWidget />,
  "financial-overview": <PlaceholderWidget title="Finanz-Übersicht" />,
  "team-activity": <PlaceholderWidget title="Team Leistung" />
};
