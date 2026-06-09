'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function GlobalBarcodeScanner() {
  const router = useRouter();
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // Ignorieren, wenn der Nutzer gerade aktiv in einem normalen Formular-Eingabefeld tippt
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      // Wenn die Zeit zwischen zwei Tastenschlägen länger als 40ms ist, 
      // war es wahrscheinlich ein Mensch und kein Scanner -> Buffer löschen.
      if (currentTime - lastKeyTimeRef.current > 40) {
        bufferRef.current = '';
      }

      lastKeyTimeRef.current = currentTime;

      // Wenn der Scanner fertig ist, sendet er standardmäßig 'Enter'
      if (event.key === 'Enter') {
        if (bufferRef.current.length > 2) {
          let scannedVal = bufferRef.current.trim();
          bufferRef.current = ''; // Buffer leeren
          
          console.log("[GlobalBarcodeScanner] Scanned raw value:", scannedVal);

          // Falls eine vollständige URL gescannt wurde (die vom QR-Code-Generator der App stammt)
          if (scannedVal.includes('/dashboard/articles/')) {
            const parts = scannedVal.split('/dashboard/articles/');
            scannedVal = parts[parts.length - 1];
            // Entferne eventuelle Query-Parameter (?origin=...) oder Hash-Fragmente
            scannedVal = scannedVal.split('?')[0].split('#')[0];
          }

          if (scannedVal.length > 0) {
            console.log("[GlobalBarcodeScanner] Navigating to article ID:", scannedVal);
            router.push(`/dashboard/articles/${scannedVal}`);
          }
        }
      } else {
        // Nur sichtbare Zeichen an den Buffer hängen (Steuertasten wie Shift, Control etc. ignorieren)
        if (event.key.length === 1) {
          bufferRef.current += event.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return null; // Reine Logik-Komponente
}
