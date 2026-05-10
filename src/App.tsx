import { useState } from 'react';
import FileUpload from './components/FileUpload';

interface CsvRow {
  Name?: string;
  Familienname?: string;
  Vorname?: string;
  Datum?: string;
  Note?: string;
  [key: string]: any;
}

function App() {
  const [csvData, setCsvData] = useState<CsvRow[]>([]);

  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date(0);
    const [day, month, year] = dateString.split('.').map(Number);
    return new Date(2000 + year, month - 1, day);
  };

  const handleCsvParsed = (data: CsvRow[]) => {
    const cleanedData = data.filter(row => Object.values(row).some(val => val !== ''));
    setCsvData(cleanedData);
  };

  const sortCsvData = (data: CsvRow[]): CsvRow[] => {
    const groups: CsvRow[][] = [];
    let currentGroup: CsvRow[] = [];

    data.forEach((row) => {
      if (row.Name) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [row];
      } else {
        currentGroup.push(row);
      }
    });
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    groups.sort((a, b) => {
      const aFach = a[0].Name || '';
      const bFach = b[0].Name || '';
      if (aFach !== bFach) {
        return aFach.localeCompare(bFach);
      }
      const aDatum = parseDate(a[0].Datum || '01.01.00');
      const bDatum = parseDate(b[0].Datum || '01.01.00');
      return aDatum.getTime() - bDatum.getTime();
    });

    return groups.flat();
  };

  const parseNote = (note: string): number => {
    if (!note) return 0;

    // Entferne Leerzeichen
    const trimmedNote = note.trim();

    // 4+ → 4.25
    if (trimmedNote.endsWith('+')) {
      const base = parseFloat(trimmedNote.slice(0, -1));
      return base + 0.25;
    }
    // 5- → 4.75
    if (trimmedNote.endsWith('-')) {
      const base = parseFloat(trimmedNote.slice(0, -1));
      return base - 0.25;
    }
    // 4/5 → 4.5
    if (trimmedNote.includes('/')) {
      const [a, b] = trimmedNote.split('/').map(Number);
      return (a + b) / 2;
    }
    // 4, 5, 10 → 4, 5, 10
    return parseFloat(trimmedNote);
  };

  const evaluateByFach = (data: CsvRow[]): Record<string, { headers: string[]; rows: any[] }> => {
    const result: Record<string, { headers: string[]; rows: any[] }> = {};
    let currentFach = '';
    let currentDatum = '';

    // Sammle alle Noten pro Fach, Schüler und Datum
    const facher: Record<string, Record<string, Record<string, number>>> = {};
    // Sammle alle Daten, für die mindestens eine Note existiert
    const usedDaten: Record<string, Set<string>> = {};

    // 1. Durchlauf: Sammle Noten und markiere verwendete Daten
    data.forEach((row) => {
      if (row.Name) {
        currentFach = row.Name || '';
        currentDatum = row.Datum || '';
      } else if (row.Familienname && currentFach) {
        const schulerName = `${row.Vorname || ''} ${row.Familienname || ''}`.trim();
        if (!facher[currentFach]) {
          facher[currentFach] = {};
        }
        if (!facher[currentFach][schulerName]) {
          facher[currentFach][schulerName] = {};
        }
        if (currentDatum) {
          facher[currentFach][schulerName][currentDatum] = row.Note ? parseNote(row.Note) : 0;
          // Markiere, dass dieses Datum verwendet wird
          if (!usedDaten[currentFach]) {
            usedDaten[currentFach] = new Set();
          }
          usedDaten[currentFach].add(currentDatum);
        }
      }
    });

    // 2. Durchlauf: Erstelle die Tabellen pro Fach
    for (const fach in facher) {
      // Nur die Daten verwenden, für die Noten existieren
      const daten = Array.from(usedDaten[fach] || []).sort();
      const headers = ['Name', ...daten, 'Durchschnitt'];
      const rows: any[] = [];

      for (const schulerName in facher[fach]) {
        const schulerDaten = facher[fach][schulerName];
        const row: Record<string, any> = { Name: schulerName };

        // Füge Noten für jedes Datum hinzu
        daten.forEach((datum) => {
          row[datum] = schulerDaten[datum] !== undefined ? schulerDaten[datum].toFixed(2) : '';
        });

        // Berechne Durchschnitt
        const noten = Object.values(schulerDaten);
        const durchschnitt = noten.reduce((a: number, b: number) => a + b, 0) / noten.length;
        row.Durchschnitt = durchschnitt.toFixed(2);

        rows.push(row);
      }

      result[fach] = { headers, rows };
    }

    return result;
  };

  const sortedData = sortCsvData(csvData);
  const evaluation = evaluateByFach(sortedData);

  return (
    <div style={{ padding: '20px' }}>
      <h1>CSV-Datei importieren und auswerten</h1>
      <FileUpload onCsvParsed={handleCsvParsed} />

      {Object.keys(evaluation).length > 0 && (
        <div>
          <h2>Auswertung pro Fach:</h2>
          {Object.entries(evaluation).map(([fach, { headers, rows }]) => (
            <div key={fach} style={{ marginBottom: '30px' }}>
              <h3>{fach}</h3>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f2f2f2' }}>
                    {headers.map((header) => (
                      <th key={header} style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: any, index: number) => (
                    <tr key={index}>
                      {headers.map((header) => (
                        <td key={header} style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;