/**
 * AI Text Enhancement Service using Google Gemini API
 * Section 14: AI Text Enhancement (Summarize, Correct grammar, Rewrite, Conversational)
 */

export async function enhanceTextWithGemini(text, mode = 'conversational') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is not configured on the server. Please set it in server/.env.');
    err.status = 503;
    throw err;
  }

  const prompts = {
    summarize: `Summarize the following text concisely within 450 characters so it can be converted to speech. Keep it clear, natural, and coherent. Return ONLY the summarized text with no extra commentary, quotes, or markdown:
${text}`,
    grammar: `Correct all grammatical errors, typos, and awkward phrasing in the following text to make it sound natural when spoken aloud. Return ONLY the corrected text with no extra commentary or quotes:
${text}`,
    conversational: `Rewrite the following text into warm, natural, conversational spoken speech suitable for a voice assistant. Keep the original meaning and keep within 450 characters. Return ONLY the rewritten text with no extra commentary:
${text}`,
    rewrite: `Rewrite and polish the following text for optimal clarity and auditory cadence when converted to speech. Return ONLY the polished text within 450 characters:
${text}`,
  };

  const selectedPrompt = prompts[mode] || prompts.conversational;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: selectedPrompt }]
      }],
      generationConfig: {
        maxOutputTokens: 250,
        temperature: 0.7,
      }
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      const err = new Error('Gemini API quota exceeded or rate limited. Please try again shortly.');
      err.status = 429;
      throw err;
    }
    const err = new Error(`Gemini API returned status ${response.status}`);
    err.status = response.status >= 500 ? 503 : 400;
    throw err;
  }

  const data = await response.json();
  const enhancedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!enhancedText) {
    throw new Error('Gemini did not return any text.');
  }

  return enhancedText;
}
