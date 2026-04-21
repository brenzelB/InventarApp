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
  Info
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Lade Artikel-Details...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-8 bg-red-50 dark:bg-red-900/20 rounded-3xl border border-red-100 dark:border-red-800 text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Hoppla!</h2>
        <p className="text-red-600 dark:text-red-400 mb-6">{error || "Artikel wurde nicht gefunden."}</p>
        <Link href="/dashboard/articles" className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const isLowStock = article.bestand <= article.mindestbestand;

  return (
    <div className="space-y-8 pb-20">
      {/* Top Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link 
            href={fromGroup ? `/dashboard/groups?id=${fromGroup}` : "/dashboard/articles"} 
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 
            {fromGroup ? "Zurück zur Gruppe" : "Zurück zu allen Artikeln"}
          </Link>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <Box className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{article.name}</h1>
              <p className="text-slate-500 font-medium">
                {article.sku} 
                {article.lagerort && (
                  <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    {article.lagerort}
                  </span>
                )}
                <span className="mx-2">•</span>
                {isLowStock ? <span className="text-red-500 font-bold">Niedriger Bestand!</span> : <span className="text-green-600 font-bold">Bestand OK</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          {[
            { id: 'overview', label: 'Übersicht', icon: LayoutDashboard },
            { id: 'analysis', label: 'Analyse', icon: TrendingUp },
            { id: 'comments', label: 'Kommentare', icon: MessageSquare },
            { id: 'edit', label: 'Bearbeiten', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Aktueller Bestand</p>
                  <p className={`text-3xl font-black ${isLowStock ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{article.bestand} {article.unit || 'Stück'}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Verkaufspreis</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{Number(article.verkaufspreis).toFixed(2)} €</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Letzte Änderung</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-3">
                    {history.length > 0 
                      ? new Date(history[0].created_at).toLocaleDateString('de-DE') 
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Description & QR */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-indigo-500" /> Beschreibung
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {article.description || "Keine Beschreibung hinterlegt."}
                  </p>
                </div>
                <div className="flex flex-col items-center p-6 bg-white dark:bg-white rounded-3xl border-2 border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Scanbarer QR-Code</p>
                  <QRCodeView svgString={article.qr_code} name={article.name} articleId={article.id} size="lg" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <ArticleHistoryList history={history.slice(0, 5)} />
                <button 
                  onClick={() => setActiveTab('analysis')}
                  className="mt-6 w-full py-3 text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  Vollständigen Verlauf anzeigen
                </button>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Bestandsverlauf</h3>
                  <TrendingUp className="w-6 h-6 text-indigo-500" />
                </div>
                {history.length === 0 && (
                  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Analyse eingeschränkt</p>
                      <p className="text-xs text-amber-700 dark:text-amber-500">Es konnten keine Verlaufsdaten geladen werden. Wurden die Datenbank-Tabellen für die Historie bereits erstellt?</p>
                    </div>
                  </div>
                )}
                <StockHistoryChart history={history} initialStock={article.bestand} />
              </div>
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <ArticleHistoryList history={history} />
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              {comments.length === 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Kommentar-Funktion möglicherweise inaktiv</p>
                    <p className="text-xs text-amber-700 dark:text-amber-500">Wenn Sie keine Kommentare sehen oder hinzufügen können, prüfen Sie bitte, ob die `article_comments` Tabelle in der Datenbank existiert.</p>
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
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest pl-1 border-l-4 border-indigo-600">Finanzielles</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Herstellpreis</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">{Number(article.herstellpreis).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Einkaufspreis</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">{Number(article.purchase_price || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Verkaufspreis</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">{Number(article.verkaufspreis).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-1">
                <span>Inkl. {article.tax_rate || 19}% MwSt.</span>
              </div>
              <div className="pt-4 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-600 uppercase">Marge</span>
                <span className="text-lg font-black text-indigo-600">
                  {article.verkaufspreis > 0 
                    ? (((article.verkaufspreis - article.herstellpreis) / article.verkaufspreis) * 100).toFixed(0) 
                    : "0"}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
            <div className="relative z-10 text-white space-y-2">
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Lagerwert Gesammt</p>
              <p className="text-3xl font-black">{(article.bestand * article.verkaufspreis).toFixed(2)} €</p>
            </div>
            <Box className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:rotate-12 transition-transform duration-500" />
          </div>
        </div>

      </div>
    </div>
  );
}
