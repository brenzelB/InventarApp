"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Edit3, 
  TrendingUp, 
  History, 
  MessageSquare, 
  Settings, 
  LayoutDashboard,
  Box,
  AlertTriangle,
  Info,
  Camera,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useArticleDetails } from "@/modules/articles/hooks/useArticleDetails";
import { ArticleForm } from "@/modules/articles/components/ArticleForm";
import { StockHistoryChart } from "@/modules/articles/components/StockHistoryChart";
import { ArticleHistoryList } from "@/modules/articles/components/ArticleHistoryList";
import { ArticleComments } from "@/modules/articles/components/ArticleComments";
import { StockAdjustmentForm } from "@/modules/articles/components/StockAdjustmentForm";
import { QRCodeView } from "@/components/QRCodeView";
import { useSearchParams } from "next/navigation";

type TabType = 'overview' | 'analysis' | 'comments' | 'edit';

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  const { 
    article, 
    history, 
    comments, 
    loading, 
    isAdjusting,
    error, 
    addComment, 
    adjustStock,
    updateArticle
  } = useArticleDetails(params.id);
  
  const searchParams = useSearchParams();
  const fromGroup = searchParams.get('fromGroup');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <div className="w-12 h-12 border-4 border-outline border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-bold font-mono text-foreground/50 uppercase tracking-widest animate-pulse">Lade Artikel-Details...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-8 bg-primary/10 rounded-card border border-primary/20 text-center bg-grid-pattern bg-opacity-5">
        <AlertTriangle className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-base font-bold font-sora text-primary uppercase mb-2 tracking-wide">[ ACCESS_ERROR ] Hoppla!</h2>
        <p className="text-xs text-primary font-mono font-bold uppercase mb-6">{error || "Artikel wurde nicht gefunden."}</p>
        <Link href="/dashboard/articles" className="inline-flex items-center gap-2 text-primary font-bold font-mono text-xs uppercase tracking-widest hover:text-primary-hover">
          <ArrowLeft className="w-4 h-4" /> Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const isLowStock = article.bestand <= article.mindestbestand;

  return (
    <div className="space-y-8 pb-20">
      {/* Top Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Link 
            href={fromGroup ? `/dashboard/groups?id=${fromGroup}` : "/dashboard/articles"} 
            className="inline-flex items-center gap-2 text-xs font-bold font-mono text-foreground/50 hover:text-primary uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 
            {fromGroup ? "Zurück zur Gruppe" : "Zurück zu allen Artikeln"}
          </Link>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary rounded-element border border-outline">
              <Box className="w-6 h-6 text-white dark:text-black" />
            </div>
            <div>
              <div className="text-[10px] font-bold font-mono text-secondary uppercase tracking-[0.2em] mb-1">
                [ ARTICLE_INFO ]
              </div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight font-sora uppercase">{article.name}</h1>
              <p className="text-xs font-bold text-foreground/60 font-mono mt-1">
                {article.sku} 
                {article.lagerort && (
                  <span className="ml-2 px-2 py-0.5 bg-secondary/15 text-secondary border border-secondary/20 rounded-element text-[9px] font-bold font-mono uppercase tracking-wider">
                    {article.lagerort}
                  </span>
                )}
                <span className="mx-2">•</span>
                {isLowStock ? <span className="text-primary font-bold font-mono uppercase">Niedriger Bestand!</span> : <span className="text-secondary font-bold font-mono uppercase">Bestand OK</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 p-1 bg-surface-2 rounded-element border border-outline">
          {[
            { id: 'overview', label: 'Übersicht', icon: LayoutDashboard },
            { id: 'analysis', label: 'Analyse', icon: TrendingUp },
            { id: 'comments', label: 'Kommentare', icon: MessageSquare },
            { id: 'edit', label: 'Bearbeiten', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-element text-xs font-bold font-mono uppercase tracking-wider transition-all ${
                activeTab === tab.id 
                ? 'bg-widget text-primary border border-outline shadow-sm' 
                : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Context Tabs */}
        <div className="lg:col-span-2 space-y-8">
          
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="bg-widget p-6 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5">
                  <p className="text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest mb-1 ml-1 block">Aktueller Bestand</p>
                  <p className={`text-3xl font-bold font-mono ${isLowStock ? 'text-primary' : 'text-foreground'}`}>{article.bestand} {article.unit || 'Stück'}</p>
                </div>
                <div className="bg-widget p-6 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5">
                  <p className="text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest mb-1 ml-1 block">Verkaufspreis</p>
                  <p className="text-3xl font-bold font-mono text-foreground">{Number(article.verkaufspreis).toFixed(2)} €</p>
                </div>
                <div className="bg-widget p-6 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5">
                  <p className="text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest mb-1 ml-1 block">Letzte Änderung</p>
                  <p className="text-sm font-bold font-mono text-foreground mt-3">
                    {history.length > 0 
                      ? new Date(history[0].created_at).toLocaleDateString('de-DE') 
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Description & QR */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 bg-widget p-6 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5 flex flex-col">
                  <h3 className="text-xs font-bold text-foreground mb-4 flex items-center gap-2 uppercase font-mono">
                    <Info className="w-4 h-4 text-primary" /> [ DESCRIPTION ] Beschreibung
                  </h3>
                  <p className="text-foreground/75 font-sans leading-relaxed text-xs flex-1">
                    {article.description || "Keine Beschreibung hinterlegt."}
                  </p>
                </div>
                
                 <div className="bg-widget p-6 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5 relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest">[ QR_CODE ] Scanbar</h3>
                    <div className="flex gap-1.5 text-foreground/30">
                      <Camera className="w-4 h-4" />
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    {/* Recessed QR Panel with dotted indicator */}
                    <div className="relative p-5 bg-surface-0 rounded-card border border-outline">
                      {/* Zone Indicator */}
                      <div className="absolute inset-2 border border-dashed border-primary/20 rounded-card pointer-events-none" />
                      
                      <div className="relative bg-white p-3 rounded-card border border-outline">
                        <QRCodeView svgString={article.qr_code} name={article.name} articleId={article.id} size="lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-widget p-6 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5">
                <ArticleHistoryList history={history.slice(0, 5)} />
                <button 
                  onClick={() => setActiveTab('analysis')}
                  className="mt-6 w-full py-2.5 text-xs font-bold font-mono uppercase tracking-widest text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-element transition-all"
                >
                  Vollständigen Verlauf anzeigen
                </button>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-widget p-6 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-foreground font-sora uppercase">[ ANALYSIS ] Bestandsverlauf</h3>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                {history.length === 0 && (
                  <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-element flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold font-mono text-amber-500 uppercase">Analyse eingeschränkt</p>
                      <p className="text-[11px] text-amber-500/80">Es konnten keine Verlaufsdaten geladen werden. Wurden die Datenbank-Tabellen für die Historie bereits erstellt?</p>
                    </div>
                  </div>
                )}
                <StockHistoryChart history={history} initialStock={article.bestand} />
              </div>
              <div className="bg-widget p-6 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5">
                <ArticleHistoryList history={history} />
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="bg-widget p-6 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              {comments.length === 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-element flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold font-mono text-amber-500 uppercase">Kommentar-Funktion möglicherweise inaktiv</p>
                    <p className="text-[11px] text-amber-500/80">Wenn Sie keine Kommentare sehen oder hinzufügen können, prüfen Sie bitte, ob die `article_comments` Tabelle in der Datenbank existiert.</p>
                  </div>
                </div>
              )}
              <ArticleComments comments={comments} onAddComment={addComment} />
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ArticleForm 
                key={`${article.id}-${article.bestand}`}
                articleId={article.id} 
                initialData={{
                  name: article.name,
                  sku: article.sku,
                  description: article.description || '',
                  herstellpreis: article.herstellpreis,
                  verkaufspreis: article.verkaufspreis,
                  purchase_price: article.purchase_price || 0,
                  bestand: article.bestand,
                  mindestbestand: article.mindestbestand,
                  group_id: article.group_id || null,
                  lagerort: article.lagerort || "",
                  unit: article.unit || 'Stück',
                  tax_rate: article.tax_rate || 19
                }} 
                qrCode={article.qr_code} 
                onUpdate={updateArticle}
              />
            </div>
          )}

        </div>

        {/* Right Column: Actions & Quick Info */}
        <div className="space-y-8">
          <StockAdjustmentForm onAdjust={adjustStock} loading={isAdjusting} />
          
          {/* Quick Stats Sidebar */}
          <div className="bg-widget p-6 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5 space-y-6">
            <h3 className="font-bold text-foreground uppercase text-xs tracking-widest pl-2 border-l-2 border-primary font-mono">Finanzielles</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground/70 font-mono font-bold">Herstellpreis</span>
                <span className="font-bold text-foreground font-mono">{Number(article.herstellpreis).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground/70 font-mono font-bold">Einkaufspreis</span>
                <span className="font-bold text-foreground font-mono">{Number(article.purchase_price || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground/70 font-mono font-bold">Verkaufspreis</span>
                <span className="font-bold text-foreground font-mono">{Number(article.verkaufspreis).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-[9px] text-foreground/50 font-bold uppercase font-mono tracking-widest pt-1">
                <span>Inkl. {article.tax_rate || 19}% MwSt.</span>
              </div>
              <div className="pt-4 border-t border-outline flex justify-between items-center">
                <span className="text-xs font-bold font-mono text-primary uppercase tracking-wider">Marge</span>
                <span className="text-lg font-black font-mono text-primary">
                  {article.verkaufspreis > 0 
                    ? (((article.verkaufspreis - article.herstellpreis) / article.verkaufspreis) * 100).toFixed(0) 
                    : "0"}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-primary p-6 rounded-card border border-outline shadow-[0_0_15px_rgba(224,108,117,0.1)] relative overflow-hidden group">
            <div className="relative z-10 text-white dark:text-black space-y-2">
              <p className="text-[10px] font-bold font-mono text-white/70 dark:text-black/70 uppercase tracking-widest">Lagerwert Gesamt</p>
              <p className="text-3xl font-black font-mono text-white dark:text-black">{(article.bestand * article.verkaufspreis).toFixed(2)} €</p>
            </div>
            <Box className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 dark:text-black/5 group-hover:rotate-12 transition-transform duration-500" />
          </div>
        </div>

      </div>
    </div>
  );
}
