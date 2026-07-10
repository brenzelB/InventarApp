"use client";

import { useState, useEffect, SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { Article, Group } from "@/modules/articles/types";
import { articleService } from "@/modules/articles/services/articleService";
import { groupService } from "@/modules/articles/services/groupService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Layers, 
  ArrowLeft,
  Coins,
  Package,
  Info
} from "lucide-react";
import Link from "next/link";

interface SelectedComponent {
  article_id: string;
  quantity: number;
  article: Article;
}

export default function NewBundlePage() {
  const router = useRouter();
  const { role } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [articles, setArticles] = useState<Article[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [lagerort, setLagerort] = useState("");
  const [unit, setUnit] = useState("Set");
  const [taxRate, setTaxRate] = useState<number>(19);
  
  // Custom prices (if overridden) or auto-calculated
  const [herstellpreis, setHerstellpreis] = useState<number>(0);
  const [verkaufspreis, setVerkaufspreis] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  
  // Flag to check if user manually edited prices (if not, we auto-update from components)
  const [manualHerstellpreis, setManualHerstellpreis] = useState(false);
  const [manualVerkaufspreis, setManualVerkaufspreis] = useState(false);
  const [manualPurchasePrice, setManualPurchasePrice] = useState(false);

  // Component items state
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [currentComponentId, setCurrentComponentId] = useState("");
  const [currentComponentQty, setCurrentComponentQty] = useState<number>(1);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [loadedArticles, loadedGroups] = await Promise.all([
          articleService.getArticles(),
          groupService.getGroups(),
        ]);
        // Filter out bundles to prevent nesting bundles inside bundles
        setArticles(loadedArticles.filter(a => !a.is_bundle));
        setGroups(loadedGroups);
      } catch (err) {
        console.error("Failed to load form data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-calculate prices when selected components change
  useEffect(() => {
    let calculatedHerstell = 0;
    let calculatedPurchase = 0;
    let calculatedVerkauf = 0;

    selectedComponents.forEach(comp => {
      calculatedHerstell += (comp.article.herstellpreis || 0) * comp.quantity;
      calculatedPurchase += (comp.article.purchase_price || 0) * comp.quantity;
      calculatedVerkauf += (comp.article.verkaufspreis || 0) * comp.quantity;
    });

    if (!manualHerstellpreis) setHerstellpreis(calculatedHerstell);
    if (!manualPurchasePrice) setPurchasePrice(calculatedPurchase);
    if (!manualVerkaufspreis) setVerkaufspreis(calculatedVerkauf);
  }, [selectedComponents, manualHerstellpreis, manualPurchasePrice, manualVerkaufspreis]);

  const handleAddComponent = () => {
    if (!currentComponentId || currentComponentQty <= 0) return;

    // Check if component already added
    if (selectedComponents.some(comp => comp.article_id === currentComponentId)) {
      toastError("Dieser Artikel ist bereits im Bundle enthalten.");
      return;
    }

    const article = articles.find(a => a.id === currentComponentId);
    if (!article) return;

    setSelectedComponents(prev => [
      ...prev,
      {
        article_id: currentComponentId,
        quantity: currentComponentQty,
        article,
      }
    ]);

    // Reset inputs
    setCurrentComponentId("");
    setCurrentComponentQty(1);
  };

  const handleRemoveComponent = (id: string) => {
    setSelectedComponents(prev => prev.filter(comp => comp.article_id !== id));
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (role === "viewer") return;

    if (selectedComponents.length === 0) {
      toastError("Ein Bundle muss mindestens eine Komponente enthalten.");
      return;
    }

    // Check stock for all components
    const outOfStockItems = selectedComponents.filter(
      comp => comp.article.bestand < comp.quantity
    );

    if (outOfStockItems.length > 0) {
      const names = outOfStockItems.map(c => `"${c.article.name}"`).join(", ");
      toastError(`Nicht genügend Bestand für Komponenten: ${names}`);
      return;
    }

    try {
      setSubmitting(true);
      const items = selectedComponents.map(comp => ({
        article_id: comp.article_id,
        quantity: comp.quantity,
      }));

      await articleService.createBundle({
        name,
        sku,
        description,
        herstellpreis,
        verkaufspreis,
        purchase_price: purchasePrice,
        lagerort,
        unit,
        tax_rate: taxRate,
        items,
      });

      toastSuccess(`Bundle "${name}" erfolgreich geschnürt.`);
      router.push("/dashboard/articles");
      router.refresh();
    } catch (err: any) {
      toastError(err.message || "Fehler beim Erstellen des Bundles.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-8">
        <div className="w-12 h-12 border-4 border-outline border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-bold font-mono text-foreground/50 uppercase tracking-widest animate-pulse">Lade Konfigurationsdaten...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/dashboard/articles" 
            className="inline-flex items-center gap-2 text-xs font-bold font-mono text-foreground/50 hover:text-primary uppercase tracking-wider transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Zurück zu allen Artikeln
          </Link>
          <h2 className="text-2xl font-bold font-sora tracking-tight leading-7 text-foreground sm:truncate sm:text-3xl uppercase">
            Artikel-Bundle erstellen
          </h2>
          <p className="mt-1 text-xs text-foreground/60 font-sans">
            Füge mehrere existierende Artikel zu einem neuen Set (Bundle) zusammen. Der Bestand der Komponenten wird automatisch abgebucht.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Bundle Info */}
          <div className="lg:col-span-2 space-y-6 bg-widget p-8 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5">
            <h3 className="text-xs font-bold text-foreground mb-4 flex items-center gap-2 uppercase font-mono border-b border-outline pb-4">
              <Package className="w-4 h-4 text-primary" /> [ BUNDLE_META ] Bundle Stammdaten
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Bundle-Name *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2.5 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm" placeholder="z. B. Starter-Kit Premium" disabled={submitting}/>
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">SKU (Barcode / Artikelnummer) *</label>
                <input required type="text" value={sku} onChange={e => setSku(e.target.value)} className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2.5 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm" placeholder="z. B. BNDL-STR-001" disabled={submitting}/>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Lagerort</label>
                <input type="text" value={lagerort} onChange={e => setLagerort(e.target.value)} className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2.5 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm" placeholder="z. B. Regal B1" disabled={submitting}/>
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Gruppe (Kategorie)</label>
                <select 
                  value={groupId || ""} 
                  onChange={e => setGroupId(e.target.value || null)}
                  className="block w-full border border-outline rounded-element bg-surface-0 text-foreground py-2.5 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm appearance-none bg-no-repeat bg-[right_0.5rem_center]"
                  disabled={submitting}
                >
                  <option value="">Keine Gruppe</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Einheit</label>
                <input required type="text" value={unit} onChange={e => setUnit(e.target.value)} className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2.5 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm" placeholder="z. B. Set" disabled={submitting}/>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Beschreibung</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm" placeholder="Beschreibe den Inhalt oder Verwendungszweck des Bundles..." disabled={submitting}/>
            </div>
            
            {/* Component Selector Area */}
            <div className="pt-6 border-t border-outline space-y-4">
              <h4 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-secondary" /> [ BUNDLE_COMPONENTS ] Komponenten hinzufügen
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-1.5">
                  <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Artikel auswählen</label>
                  <select
                    value={currentComponentId}
                    onChange={e => setCurrentComponentId(e.target.value)}
                    className="block w-full border border-outline rounded-element bg-surface-0 text-foreground py-2.5 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm appearance-none bg-no-repeat bg-[right_0.5rem_center]"
                    disabled={submitting}
                  >
                    <option value="">-- Artikel wählen --</option>
                    {articles.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.sku} | {a.name} ({a.bestand} {a.unit} vorrätig)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Stückzahl</label>
                  <input
                    type="number"
                    min="1"
                    value={currentComponentQty}
                    onChange={e => setCurrentComponentQty(Math.max(1, Number(e.target.value)))}
                    className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2.5 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm"
                    disabled={submitting || !currentComponentId}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddComponent}
                  disabled={submitting || !currentComponentId}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-element text-xs font-bold font-mono uppercase tracking-widest text-secondary bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Hinzufügen
                </button>
              </div>

              {/* Added Components List */}
              <div className="mt-4 border border-outline rounded-card overflow-hidden">
                <table className="min-w-full divide-y divide-outline">
                  <thead className="bg-surface-2">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-[9px] font-bold font-mono text-foreground/60 uppercase tracking-widest">Artikel</th>
                      <th scope="col" className="px-4 py-3 text-right text-[9px] font-bold font-mono text-foreground/60 uppercase tracking-widest">Verfügbar</th>
                      <th scope="col" className="px-4 py-3 text-right text-[9px] font-bold font-mono text-foreground/60 uppercase tracking-widest">Benötigt</th>
                      <th scope="col" className="px-4 py-3 text-right text-[9px] font-bold font-mono text-foreground/60 uppercase tracking-widest">Status</th>
                      <th scope="col" className="px-4 py-3 w-px"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline bg-transparent">
                    {selectedComponents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-xs font-mono text-foreground/40 uppercase tracking-wider">
                          Noch keine Komponenten hinzugefügt.
                        </td>
                      </tr>
                    ) : (
                      selectedComponents.map(comp => {
                        const hasEnoughStock = comp.article.bestand >= comp.quantity;
                        return (
                          <tr key={comp.article_id} className="hover:bg-surface-2/20 transition-colors">
                            <td className="px-4 py-3 text-xs font-bold font-sora">
                              <span className="block text-foreground">{comp.article.name}</span>
                              <span className="block text-[9px] font-mono text-foreground/50">{comp.article.sku}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-mono text-foreground/80">
                              {comp.article.bestand} {comp.article.unit}
                            </td>
                            <td className="px-4 py-3 text-xs text-right font-mono font-bold text-foreground">
                              {comp.quantity} {comp.article.unit}
                            </td>
                            <td className="px-4 py-3 text-xs text-right">
                              {hasEnoughStock ? (
                                <span className="inline-flex items-center rounded-element bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold text-emerald-500 border border-emerald-500/20 uppercase font-mono tracking-wider">
                                  Verfügbar
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-element bg-primary/10 px-2.5 py-0.5 text-[9px] font-bold text-primary border border-primary/20 uppercase font-mono tracking-wider animate-pulse">
                                  Zu wenig Bestand!
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveComponent(comp.article_id)}
                                className="p-1.5 text-foreground/35 hover:text-primary hover:bg-primary/10 rounded-element transition-all"
                                disabled={submitting}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Submit */}
          <div className="space-y-6">
            {/* Pricing Section */}
            <div className="bg-widget p-6 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5 space-y-6">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase font-mono border-b border-outline pb-4">
                <Coins className="w-4 h-4 text-primary" /> [ BUNDLE_PRICING ] Finanzdaten
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-0.5">Herstellpreis (€)</label>
                  <input
                    required
                    type="number"
                    step="any"
                    min="0"
                    value={herstellpreis}
                    onChange={e => {
                      setHerstellpreis(Number(e.target.value));
                      setManualHerstellpreis(true);
                    }}
                    className="block w-full border border-outline rounded-element bg-surface-0 text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all"
                    disabled={submitting}
                  />
                  {!manualHerstellpreis && selectedComponents.length > 0 && (
                    <span className="text-[9px] font-bold font-mono text-emerald-500 uppercase tracking-widest ml-1 block mt-1">✓ Automatisch berechnet</span>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-0.5">Einkaufspreis (€)</label>
                  <input
                    required
                    type="number"
                    step="any"
                    min="0"
                    value={purchasePrice}
                    onChange={e => {
                      setPurchasePrice(Number(e.target.value));
                      setManualPurchasePrice(true);
                    }}
                    className="block w-full border border-outline rounded-element bg-surface-0 text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all"
                    disabled={submitting}
                  />
                  {!manualPurchasePrice && selectedComponents.length > 0 && (
                    <span className="text-[9px] font-bold font-mono text-emerald-500 uppercase tracking-widest ml-1 block mt-1">✓ Automatisch berechnet</span>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-0.5">Verkaufspreis (€)</label>
                  <input
                    required
                    type="number"
                    step="any"
                    min="0"
                    value={verkaufspreis}
                    onChange={e => {
                      setVerkaufspreis(Number(e.target.value));
                      setManualVerkaufspreis(true);
                    }}
                    className="block w-full border border-outline rounded-element bg-surface-0 text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all"
                    disabled={submitting}
                  />
                  {!manualVerkaufspreis && selectedComponents.length > 0 && (
                    <span className="text-[9px] font-bold font-mono text-emerald-500 uppercase tracking-widest ml-1 block mt-1">✓ Automatisch berechnet</span>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-0.5">Steuersatz (%)</label>
                  <select
                    value={taxRate}
                    onChange={e => setTaxRate(Number(e.target.value))}
                    className="block w-full border border-outline rounded-element bg-surface-0 text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all appearance-none bg-no-repeat bg-[right_0.5rem_center]"
                    disabled={submitting}
                  >
                    <option value={19}>19 % (Standard)</option>
                    <option value={7}>7 % (Ermäßigt)</option>
                    <option value={0}>0 % (Steuerfrei)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Block */}
            <div className="bg-widget p-6 rounded-card border border-outline shadow-sm space-y-4">
              <div className="flex items-start gap-2.5 p-3 bg-primary/10 border border-primary/20 rounded-element">
                <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-[10px] text-primary font-mono font-bold uppercase leading-relaxed">
                  Bestandswarnung: Durch das Schnüren wird die Komponentenanzahl sofort unwiderruflich im Lager abgebucht.
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/articles")}
                  className="w-1/2 py-2.5 text-xs font-bold font-mono uppercase tracking-widest text-foreground/75 hover:text-foreground hover:bg-surface-2 border border-transparent hover:border-outline rounded-element transition-all"
                  disabled={submitting}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={submitting || selectedComponents.length === 0 || selectedComponents.some(c => c.article.bestand < c.quantity)}
                  className="w-1/2 py-2.5 text-xs font-bold text-white dark:text-black dark:font-extrabold bg-primary hover:bg-primary-hover rounded-element border border-outline shadow-sm font-mono uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Schnüre..." : "Set schnüren"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
