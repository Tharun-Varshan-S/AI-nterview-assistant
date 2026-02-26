export interface ExtractedFields {
  name?: string;
  email?: string;
  phone?: string;
}

// Lightweight PDF text extractor using pdfjs-dist from CDN at runtime.
// Falls back to empty string if loading fails.
export async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfLibUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.min.mjs';
    const pdfjs = await import(
      /* @vite-ignore */ pdfLibUrl
    );
    // Configure worker from CDN
    // @ts-ignore
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs';
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((it: any) => it.str || '');
      text += '\n' + strings.join(' ');
    }
    return text;
  } catch {
    return '';
  }
}

export function extractFieldsFromText(text: string): ExtractedFields {
  const email = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0];
  const phone = (text.match(/(?:\+\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/) || [])[0];
  // Heuristic name: first two words near top not including email/phone keywords
  const top = text.split(/\n|\r/).slice(0, 10).join(' ');
  const nameMatch = top.match(/([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+)/);
  const name = nameMatch ? nameMatch[1] : undefined;
  return { name, email: email || undefined, phone: phone || undefined };
}


