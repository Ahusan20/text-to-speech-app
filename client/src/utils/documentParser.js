/**
 * Extract plain text from TXT, DOCX, or PDF files with on-demand dynamic imports.
 * Keeps initial page load bundle lightweight.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file) {
  if (!file) throw new Error('No file provided');

  const fileName = file.name.toLowerCase();

  // 1. Plain Text (.txt) - 0 dependencies, instant parsing
  if (fileName.endsWith('.txt')) {
    return await file.text();
  }

  // 2. Word Document (.docx) - loaded on-demand
  if (fileName.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  }

  // 3. PDF Document (.pdf) - loaded on-demand
  if (fileName.endsWith('.pdf')) {
    const pdfjsLib = await import('pdfjs-dist');
    if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
    }
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items.map((item) => ('str' in item ? item.str : ''));
      fullText += (pageNum > 1 ? '\n' : '') + pageStrings.join(' ');
      if (fullText.length > 2000) break;
    }

    return fullText;
  }

  throw new Error('Unsupported file format. Please upload a .txt, .pdf, or .docx file.');
}
