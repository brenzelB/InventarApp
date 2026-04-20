import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Article, ArticleFormData } from '../types';
import { supabase } from '@/lib/supabaseClient';
import { groupService } from './groupService';
import { articleService } from './articleService';

// Add type support for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const importExportService = {
  /**
   * Generiert eine Excel-Datei aus den übergebenen Artikeln.
   */
  exportArticles(articles: Article[], format: 'xlsx' | 'csv' = 'xlsx') {
    const data = articles.map(a => {
      const marge = a.verkaufspreis > 0 
        ? ((a.verkaufspreis - a.herstellpreis) / a.verkaufspreis * 100).toFixed(0) + '%'
        : '0%';
      const gesamtwert = (a.bestand * a.verkaufspreis).toFixed(2) + ' €';

      return {
        'Name': a.name,
        'SKU': a.sku,
        'Beschreibung': a.description || '',
        'Lagerort': a.lagerort || '',
        'Herstellpreis': a.herstellpreis,
        'Verkaufspreis': a.verkaufspreis,
        'Bestand': a.bestand,
        'Gruppe': a.group?.name || 'Keine Gruppe',
        'Marge (%)': marge,
        'Gesamtwert (€)': gesamtwert
      };
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
      a.bestand.toString(),
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
   */
  downloadTemplate() {
    const headers = [[
      'Name', 
      'SKU', 
      'Beschreibung', 
      'Lagerort', 
      'Herstellpreis', 
      'Verkaufspreis', 
      'Bestand', 
      'Mindestbestand',
      'Gruppe'
    ]];
    
    const worksheet = XLSX.utils.aoa_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import_Template');
    XLSX.writeFile(workbook, 'Inventar_Import_Vorlage.xlsx');
  },

  /**
   * Parst eine Excel-Datei und importiert die Artikel.
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
                  // Neue Gruppe erstellen
                  const newGroup = await groupService.createGroup(groupName);
                  groupId = newGroup.id;
                  groupsMap.set(lowerName, groupId);
                  groupsCreatedCount++;
                }
              }

              processedArticles.push({
                name: row['Name']?.toString() || 'Unbenannter Artikel',
                sku: row['SKU']?.toString() || `IMP-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
                description: row['Beschreibung']?.toString() || '',
                lagerort: row['Lagerort']?.toString() || '',
                herstellpreis: parseFloat(row['Herstellpreis']) || 0,
                verkaufspreis: parseFloat(row['Verkaufspreis']) || 0,
                bestand: parseInt(row['Bestand']) || 0,
                mindestbestand: parseInt(row['Mindestbestand']) || 0,
                group_id: groupId
              });
            } catch (err: any) {
              errors.push(`Fehler in Zeile mit SKU ${row['SKU']}: ${err.message}`);
            }
          }

          // 3. Artikel importieren (sequentiell für QR-Code Generierung Sicherheit, oder Bulk falls API es hergibt)
          // Wir nutzen hier sequential creation um die QR-Logic des ArticleService zu nutzen
          let importedCount = 0;
          for (const art of processedArticles) {
            try {
              await articleService.createArticle(art);
              importedCount++;
            } catch (err: any) {
              errors.push(`Fehlgeschlagener Import für ${art.name}: ${err.message}`);
            }
          }

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
