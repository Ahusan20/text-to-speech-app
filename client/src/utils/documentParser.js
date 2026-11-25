import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  // Use worker from unpkg or bundler url
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

/**
 * Extract plain text from TXT, DOCX, or PDF files
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file) {
  if (!file) throw new Error('No file provided');

  const fileName = file.name.toLowerCase();

  // 1. Plain Text (.txt)
  if (fileName.endsWith('.txt')) {
    return await file.text();
  }

  // 2. Word Document (.docx)
  if (fileName.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  }

  // 3. PDF Document (.pdf)
  if (fileName.endsWith('.pdf')) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items.map((item) => ('str' in item ? item.str : ''));
      fullText += (pageNum > 1 ? '\n' : '') + pageStrings.join(' ');
      if (fullText.length > 2000) break; // Don't parse massive files unnecessarily
    }

    return fullText;
  }

  throw new Error('Unsupported file format. Please upload a .txt, .pdf, or .docx file.');
}
