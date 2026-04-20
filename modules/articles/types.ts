export interface Group {
  id: string;
  name: string;
  user_id?: string;
  created_at: string;
}

export interface Article {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  herstellpreis: number;
  verkaufspreis: number;
  bestand: number;
  mindestbestand: number;
  created_at: string;
  updated_at: string;
  qr_code: string | null;
  group_id: string | null;
  group?: { name: string } | null;
}

export interface ArticleFormData {
  name: string;
  sku: string;
  description: string;
  herstellpreis: number;
  verkaufspreis: number;
  bestand: number;
  mindestbestand: number;
  group_id: string | null;
}

export type HistoryType = 'input' | 'output';

export interface ArticleHistoryEntry {
  id: string;
  article_id: string;
  old_stock: number;
  new_stock: number;
  type: HistoryType;
  created_at: string;
}

export interface ArticleComment {
  id: string;
  article_id: string;
  content: string;
  user_id?: string;
  created_at: string;
}
