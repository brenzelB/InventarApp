import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Article, ArticleFormData } from '../types';
import { groupService } from './groupService';
import { articleService } from './articleService';

// Add type support for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ColumnSetting {
  key: string;
  label: string;
  width: number;
  visible: boolean;
}

/** Maps article field keys to German column header labels */
const COLUMN_LABEL_MAP: Record<string, string> = {
  name: 'Name',
  sku: 'SKU',
  description: 'Beschreibung',
  lagerort: 'Lagerort',
  herstellpreis: 'Herstellpreis',
  purchase_price: 'Einkaufspreis',
  verkaufspreis: 'Verkaufspreis',
  bestand: 'Bestand',
  mindestbestand: 'Mindestbestand',
  unit: 'Einheit',
  tax_rate: 'Steuersatz (%)',
  // Computed / display-only keys
  gruppe: 'Gruppe',
  marge: 'Marge (%)',
  gesamtwert: 'Gesamtwert (€)',
};

/** Keys that can appear in exports (maps key → getter from Article) */
type ExportableKey =
  | 'name' | 'sku' | 'description' | 'lagerort'
  | 'herstellpreis' | 'purchase_price' | 'verkaufspreis'
  | 'bestand' | 'mindestbestand' | 'unit' | 'tax_rate'
  | 'qr_code' | 'actions';

function getArticleValue(a: Article, key: string): string | number {
  switch (key) {
    case 'name': return a.name;
    case 'sku': return a.sku;
    case 'description': return a.description || '';
    case 'lagerort': return a.lagerort || '';
    case 'herstellpreis': return a.herstellpreis;
    case 'purchase_price': return a.purchase_price;
    case 'verkaufspreis': return a.verkaufspreis;
    case 'bestand': return a.bestand;
    case 'mindestbestand': return a.mindestbestand;
    case 'unit': return a.unit;
    case 'tax_rate': return a.tax_rate ?? 19;
    case 'gruppe': return a.group?.name || 'Keine Gruppe';
    default: return '';
  }
}

/** Keys that are meaningful to export (excludes purely UI-only columns) */
const EXPORTABLE_KEYS = new Set([
  'name', 'sku', 'description', 'lagerort',
  'herstellpreis', 'purchase_price', 'verkaufspreis',
  'bestand', 'mindestbestand', 'unit', 'tax_rate',
]);

export const importExportService = {
  /**
   * Generiert eine Excel/CSV-Datei aus den übergebenen Artikeln.
   * Respektiert columnSettings: nur sichtbare Spalten in der richtigen Reihenfolge.
   */
  exportArticles(
    articles: Article[],
    format: 'xlsx' | 'csv' = 'xlsx',
    columnSettings?: ColumnSetting[]
  ) {
    let columns: { key: string; label: string }[];

    if (columnSettings && columnSettings.length > 0) {
      // Use visible columns in UI order (skip purely UI keys like qr_code, actions)
      columns = columnSettings
        .filter(c => c.visible && EXPORTABLE_KEYS.has(c.key))
        .map(c => ({ key: c.key, label: COLUMN_LABEL_MAP[c.key] || c.label }));
      
      // Always append computed columns if not already represented
      // (only for xlsx full export, not template)
    } else {
      // Fallback: full export with all columns
      columns = [
        { key: 'name', label: 'Name' },
        { key: 'sku', label: 'SKU' },
        { key: 'description', label: 'Beschreibung' },
        { key: 'lagerort', label: 'Lagerort' },
        { key: 'herstellpreis', label: 'Herstellpreis' },
        { key: 'purchase_price', label: 'Einkaufspreis' },
        { key: 'verkaufspreis', label: 'Verkaufspreis' },
        { key: 'bestand', label: 'Bestand' },
        { key: 'unit', label: 'Einheit' },
        { key: 'tax_rate', label: 'Steuersatz (%)' },
      ];
    }

    // Always include Gruppe & computed fields at the end for full export
    const data = articles.map(a => {
      const row: Record<string, string | number> = {};
      for (const col of columns) {
        row[col.label] = getArticleValue(a, col.key);
      }
      // Append Gruppe always
      row['Gruppe'] = a.group?.name || 'Keine Gruppe';
      // Marge & Gesamtwert for xlsx full context
      const marge = a.verkaufspreis > 0
        ? ((a.verkaufspreis - a.herstellpreis) / a.verkaufspreis * 100).toFixed(0) + '%'
        : '0%';
      row['Marge (%)'] = marge;
      row['Gesamtwert (€)'] = (a.bestand * a.verkaufspreis).toFixed(2) + ' €';
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventar');

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, `Inventar_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      XLSX.writeFile(workbook, `Inventar_Export_${new Date().toISOString().split('T')[0]}.csv`, { bookType: 'csv' });
    }
  },

  /**
   * Generiert ein professionelles PDF im Querformat.
   */
  exportToPDF(articles: Article[], title: string = 'Inventar Übersicht') {
    const doc = new jsPDF({ orientation: 'landscape' });
    const dateStr = new Date().toLocaleDateString('de-DE');

    doc.setFontSize(20);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Erstellt am: ${dateStr}`, 14, 30);

    const tableData = articles.map(a => [
      a.name,
      a.sku,
      a.lagerort || '—',
      `${a.herstellpreis.toFixed(2)} €`,
      `${a.verkaufspreis.toFixed(2)} €`,
      `${a.bestand.toString()} ${a.unit || 'Stk'}`,
      a.group?.name || '—',
      a.verkaufspreis > 0 ? ((a.verkaufspreis - a.herstellpreis) / a.verkaufspreis * 100).toFixed(0) + '%' : '0%',
      `${(a.bestand * a.verkaufspreis).toFixed(2)} €`
    ]);

    doc.autoTable({
      startY: 35,
      head: [['Name', 'SKU', 'Lagerort', 'EK', 'VK', 'Bestand', 'Gruppe', 'Marge', 'Wert']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
      styles: { fontSize: 8, cellPadding: 2 },
    });

    doc.save(`Inventar_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  },

  /**
   * Generiert eine leere Excel-Vorlage.
   * Respektiert columnSettings: nur sichtbare, importierbare Spalten.
   */
  downloadTemplate(columnSettings?: ColumnSetting[]) {
    let headers: string[];

    if (columnSettings && columnSettings.length > 0) {
      headers = columnSettings
        .filter(c => c.visible && EXPORTABLE_KEYS.has(c.key))
        .map(c => COLUMN_LABEL_MAP[c.key] || c.label);
      // Always ensure Gruppe is present for template
      if (!headers.includes('Gruppe')) headers.push('Gruppe');
    } else {
      headers = [
        'Name',
        'SKU',
        'Beschreibung',
        'Lagerort',
        'Herstellpreis',
        'Einkaufspreis',
        'Verkaufspreis',
        'Bestand',
        'Mindestbestand',
        'Einheit',
        'Gruppe',
        'Steuersatz (%)'
      ];
    }

    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import_Template');
    XLSX.writeFile(workbook, 'Inventar_Import_Vorlage.xlsx');
  },

  /**
   * Parst eine Excel-Datei und gibt eine Vorschau zurück – OHNE Datenbankschreibzugriffe.
   */
  parseExcelPreview(file: File): Promise<{
    rows: Record<string, any>[];
    headers: string[];
    totalCount: number;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet) as Record<string, any>[];
          const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
          resolve({ rows, headers, totalCount: rows.length });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Parst eine Excel-Datei und importiert die Artikel in die Datenbank.
   */
  async importFromExcel(file: File): Promise<{ success: number; groupsCreated: number; errors: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet) as any[];

          if (rows.length === 0) {
            resolve({ success: 0, groupsCreated: 0, errors: ['Die Datei enthält keine Daten.'] });
            return;
          }

          // 1. Alle existierenden Gruppen laden
          const existingGroups = await groupService.getGroups();
          const groupsMap = new Map<string, string>();
          existingGroups.forEach(g => groupsMap.set(g.name.toLowerCase(), g.id));

          let groupsCreatedCount = 0;
          const processedArticles: ArticleFormData[] = [];
          const errors: string[] = [];

          // 2. Zeilen verarbeiten & Gruppen zuordnen/erstellen
          for (const row of rows) {
            try {
              const groupName = row['Gruppe']?.toString().trim();
              let groupId = null;

              if (groupName) {
                const lowerName = groupName.toLowerCase();
                if (groupsMap.has(lowerName)) {
                  groupId = groupsMap.get(lowerName)!;
                } else {
                  const newGroup = await groupService.createGroup(groupName);
                  groupId = newGroup.id;
                  groupsMap.set(lowerName, groupId);
                  groupsCreatedCount++;
                }
              }

              processedArticles.push({
                name: row['Name']?.toString() || 'Unbenannter Artikel',
                sku: row['SKU']?.toString() || `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                description: row['Beschreibung']?.toString() || '',
                lagerort: row['Lagerort']?.toString() || '',
                herstellpreis: parseFloat(row['Herstellpreis'] || row['herstellpreis'] || 0),
                verkaufspreis: parseFloat(row['Verkaufspreis'] || row['verkaufspreis'] || 0),
                purchase_price: parseFloat(row['Einkaufspreis'] || row['purchase_price'] || 0),
                bestand: parseFloat(row['Bestand'] || 0),
                mindestbestand: parseFloat(row['Mindestbestand'] || 0),
                unit: row['Einheit']?.toString() || row['Unit']?.toString() || 'Stück',
                group_id: groupId,
                tax_rate: Number(row['Steuersatz (%)'] || row['Steuersatz'] || row['tax_rate']) || 19,
              });
            } catch (err: any) {
              errors.push(`Fehler in Zeile mit SKU ${row['SKU']}: ${err.message}`);
            }
          }

          // 3. Artikel importieren
          let importedCount = 0;
          for (const art of processedArticles) {
            try {
              await articleService.createArticle(art);
              importedCount++;
            } catch (err: any) {
              errors.push(`Fehlgeschlagener Import für ${art.name}: ${err.message}`);
            }
          }

          // Notify all useArticles subscribers (including dashboard widgets) once
          // after the full import, so they re-fetch without waiting for Supabase
          // realtime to propagate N individual INSERT events.
          articleService.notify();

          resolve({
            success: importedCount,
            groupsCreated: groupsCreatedCount,
            errors
          });
        } catch (err: any) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }
};
