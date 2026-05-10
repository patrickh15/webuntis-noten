import { useRef } from 'react';
import Papa from 'papaparse';

interface FileUploadProps {
    onCsvParsed: (data: any[]) => void;
}

export default function FileUpload({ onCsvParsed }: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true, // Nutzt die erste Zeile als Spaltennamen
                complete: (result) => {
                    onCsvParsed(result.data); // Parsed die CSV und gibt die Daten weiter
                },
                error: (error) => {
                    console.error('Fehler beim Parsen der CSV:', error);
                },
            });
        }
    };

    return (
        <div>
            <button onClick={handleButtonClick}>CSV-Datei auswählen</button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                style={{ display: 'none' }}
            />
        </div>
    );
};