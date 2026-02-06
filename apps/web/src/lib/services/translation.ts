import { logger } from '../logger';

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage: string;
  provider: string;
}

export interface TranslationProvider {
  name: string;
  translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult>;
  detectLanguage(text: string): Promise<string>;
}

// Mock provider for development
class MockTranslationProvider implements TranslationProvider {
  name = 'mock';

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    // Simulate translation delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simple mock: just return the text with a marker
    return {
      translatedText: `[Translated to ${targetLanguage}] ${text}`,
      detectedSourceLanguage: sourceLanguage || 'en',
      provider: this.name,
    };
  }

  async detectLanguage(text: string): Promise<string> {
    // Simple heuristic for Portuguese
    const portugueseWords = ['que', 'não', 'para', 'uma', 'com', 'este', 'isso'];
    const words = text.toLowerCase().split(/\s+/);
    const hasPortuguese = portugueseWords.some((w) => words.includes(w));
    return hasPortuguese ? 'pt' : 'en';
  }
}

// OpenAI provider
class OpenAITranslationProvider implements TranslationProvider {
  name = 'openai';

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const languageNames: Record<string, string> = {
      en: 'English',
      'pt-BR': 'Brazilian Portuguese',
      pt: 'Portuguese',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a translator. Translate the following text to ${targetLangName}. Only respond with the translated text, nothing else.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error('No translation returned from OpenAI');
    }

    return {
      translatedText,
      detectedSourceLanguage: sourceLanguage || 'auto',
      provider: this.name,
    };
  }

  async detectLanguage(text: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Detect the language of the following text. Respond with only the ISO 639-1 language code (e.g., "en", "pt", "es").',
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim().toLowerCase() || 'en';
  }
}

// DeepL provider
class DeepLTranslationProvider implements TranslationProvider {
  name = 'deepl';

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      throw new Error('DeepL API key not configured');
    }

    // DeepL uses different language codes
    const deeplLanguageMap: Record<string, string> = {
      en: 'EN',
      'pt-BR': 'PT-BR',
      pt: 'PT',
      es: 'ES',
      fr: 'FR',
      de: 'DE',
    };

    const targetLang = deeplLanguageMap[targetLanguage] || targetLanguage.toUpperCase();
    const sourceLang = sourceLanguage
      ? deeplLanguageMap[sourceLanguage] || sourceLanguage.toUpperCase()
      : undefined;

    const params = new URLSearchParams({
      text,
      target_lang: targetLang,
    });

    if (sourceLang) {
      params.set('source_lang', sourceLang);
    }

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `DeepL-Auth-Key ${apiKey}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status}`);
    }

    const data = await response.json();
    const translation = data.translations?.[0];

    if (!translation) {
      throw new Error('No translation returned from DeepL');
    }

    return {
      translatedText: translation.text,
      detectedSourceLanguage: translation.detected_source_language?.toLowerCase() || 'en',
      provider: this.name,
    };
  }

  async detectLanguage(text: string): Promise<string> {
    // DeepL doesn't have a standalone language detection endpoint
    // We'll translate to English and get the source language
    const result = await this.translate(text, 'en');
    return result.detectedSourceLanguage;
  }
}

// Get the configured translation provider
export const getTranslationProvider = (): TranslationProvider => {
  const providerName = process.env.TRANSLATION_PROVIDER || 'mock';

  switch (providerName) {
    case 'openai':
      return new OpenAITranslationProvider();
    case 'deepl':
      return new DeepLTranslationProvider();
    case 'mock':
    default:
      return new MockTranslationProvider();
  }
};

// Main translation function
export const translateText = async (
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult> => {
  const provider = getTranslationProvider();

  try {
    logger.info('Translating text', {
      provider: provider.name,
      targetLanguage,
      textLength: text.length,
    });

    const result = await provider.translate(text, targetLanguage, sourceLanguage);

    logger.info('Translation complete', {
      provider: provider.name,
      detectedSource: result.detectedSourceLanguage,
    });

    return result;
  } catch (error) {
    logger.error('Translation failed', { provider: provider.name }, error instanceof Error ? error : undefined);
    throw error;
  }
};

// Simple language detection using franc library (fallback)
export const detectLanguageSimple = (text: string): string => {
  // Use franc for client-side detection if needed
  // This is a simplified version
  const portuguesePatterns = [
    /\bque\b/i,
    /\bnão\b/i,
    /\bpara\b/i,
    /\buma\b/i,
    /\bcom\b/i,
    /\bé\b/i,
    /\bmais\b/i,
    /\bem\b/i,
    /\bpor\b/i,
    /\bseu\b/i,
    /ção\b/i,
    /ões\b/i,
  ];

  const spanishPatterns = [
    /\bque\b/i,
    /\bno\b/i,
    /\bpara\b/i,
    /\buna\b/i,
    /\bcon\b/i,
    /\bes\b/i,
    /\bmás\b/i,
    /\bpor\b/i,
    /\bsu\b/i,
    /ción\b/i,
  ];

  const portugueseScore = portuguesePatterns.filter((p) => p.test(text)).length;
  const spanishScore = spanishPatterns.filter((p) => p.test(text)).length;

  if (portugueseScore > 3 && portugueseScore > spanishScore) {
    return 'pt';
  }
  if (spanishScore > 3 && spanishScore > portugueseScore) {
    return 'es';
  }

  return 'en';
};
