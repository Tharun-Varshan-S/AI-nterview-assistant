import { useState } from 'react';
import { extractFieldsFromText, extractPdfText } from '../utils/pdf';

interface Props {
  onExtract: (fields: { name?: string; email?: string; phone?: string; url?: string }) => void;
}

export default function ResumeUpload({ onExtract }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFile(file: File) {
    setError(null);
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setError('Please upload a PDF or DOCX file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
      return;
    }
    setLoading(true);
    try {
      let text = '';
      if (/\.pdf$/i.test(file.name)) {
        text = await extractPdfText(file);
      } else {
        // Basic DOCX text extraction via browser (unzipping is heavy). Prompt manual fill as fallback.
        text = '';
      }
      const fields = extractFieldsFromText(text);
      const url = URL.createObjectURL(file);
      onExtract({ ...fields, url });
    } catch (e) {
      setError('Unable to read file. Please try another');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Upload Resume (PDF preferred)</label>
      <input
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e)=>{ const f = e.target.files?.[0]; if (f) onFile(f); }}
        className="block w-full text-sm file:mr-4 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer"
      />
      {loading && <p className="text-xs text-gray-500">Reading file…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}


