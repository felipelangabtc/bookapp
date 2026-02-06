import { logger } from '../logger';

export interface TTSGenerateOptions {
  text: string;
  voice: string;
  language: string;
}

export interface TTSResult {
  audioUrl: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  voice: string;
  language: string;
  provider: string;
}

export interface TTSProvider {
  name: string;
  getAvailableVoices(language: string): Promise<TTSVoice[]>;
  generate(options: TTSGenerateOptions): Promise<Buffer>;
}

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  preview_url?: string;
}

// Mock provider for development
class MockTTSProvider implements TTSProvider {
  name = 'mock';

  async getAvailableVoices(language: string): Promise<TTSVoice[]> {
    const mockVoices: Record<string, TTSVoice[]> = {
      en: [
        { id: 'en-male-1', name: 'John', language: 'en', gender: 'male' },
        { id: 'en-female-1', name: 'Sarah', language: 'en', gender: 'female' },
      ],
      'pt-BR': [
        { id: 'pt-male-1', name: 'João', language: 'pt-BR', gender: 'male' },
        { id: 'pt-female-1', name: 'Maria', language: 'pt-BR', gender: 'female' },
      ],
      pt: [
        { id: 'pt-male-1', name: 'João', language: 'pt', gender: 'male' },
        { id: 'pt-female-1', name: 'Maria', language: 'pt', gender: 'female' },
      ],
    };

    return mockVoices[language] || mockVoices['en']!;
  }

  async generate(options: TTSGenerateOptions): Promise<Buffer> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create a simple WAV file header (minimal valid WAV)
    // In real implementation, this would return actual audio data
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36, 4); // File size - 8
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1 size
    header.writeUInt16LE(1, 20); // Audio format (PCM)
    header.writeUInt16LE(1, 22); // Num channels
    header.writeUInt32LE(22050, 24); // Sample rate
    header.writeUInt32LE(44100, 28); // Byte rate
    header.writeUInt16LE(2, 32); // Block align
    header.writeUInt16LE(16, 34); // Bits per sample
    header.write('data', 36);
    header.writeUInt32LE(0, 40); // Data size

    logger.info('Mock TTS generated', {
      voice: options.voice,
      language: options.language,
      textLength: options.text.length,
    });

    return header;
  }
}

// OpenAI TTS provider
class OpenAITTSProvider implements TTSProvider {
  name = 'openai';

  async getAvailableVoices(_language: string): Promise<TTSVoice[]> {
    // OpenAI TTS supports these voices for all languages
    return [
      { id: 'alloy', name: 'Alloy', language: 'multi', gender: 'neutral' },
      { id: 'echo', name: 'Echo', language: 'multi', gender: 'male' },
      { id: 'fable', name: 'Fable', language: 'multi', gender: 'neutral' },
      { id: 'onyx', name: 'Onyx', language: 'multi', gender: 'male' },
      { id: 'nova', name: 'Nova', language: 'multi', gender: 'female' },
      { id: 'shimmer', name: 'Shimmer', language: 'multi', gender: 'female' },
    ];
  }

  async generate(options: TTSGenerateOptions): Promise<Buffer> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: options.text,
        voice: options.voice || 'alloy',
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI TTS API error: ${response.status} - ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// ElevenLabs TTS provider
class ElevenLabsTTSProvider implements TTSProvider {
  name = 'elevenlabs';

  async getAvailableVoices(_language: string): Promise<TTSVoice[]> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      // Return default voices if no API key
      return [
        { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', language: 'en', gender: 'female' },
        { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', language: 'en', gender: 'female' },
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', language: 'en', gender: 'female' },
        { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', language: 'en', gender: 'female' },
        { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', language: 'en', gender: 'male' },
      ];
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data = await response.json();
      return data.voices.map((v: { voice_id: string; name: string; labels?: { gender?: string } }) => ({
        id: v.voice_id,
        name: v.name,
        language: 'multi',
        gender: v.labels?.gender as 'male' | 'female' | undefined,
      }));
    } catch (error) {
      logger.error('Failed to fetch ElevenLabs voices', {}, error instanceof Error ? error : undefined);
      return [];
    }
  }

  async generate(options: TTSGenerateOptions): Promise<Buffer> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = options.voice || '21m00Tcm4TlvDq8ikWAM'; // Rachel

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: options.text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs TTS API error: ${response.status} - ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// Get the configured TTS provider
export const getTTSProvider = (): TTSProvider => {
  const providerName = process.env.TTS_PROVIDER || 'mock';

  switch (providerName) {
    case 'openai':
      return new OpenAITTSProvider();
    case 'elevenlabs':
      return new ElevenLabsTTSProvider();
    case 'mock':
    default:
      return new MockTTSProvider();
  }
};

// Generate audio from text
export const generateAudio = async (options: TTSGenerateOptions): Promise<Buffer> => {
  const provider = getTTSProvider();

  try {
    logger.info('Generating TTS audio', {
      provider: provider.name,
      voice: options.voice,
      language: options.language,
      textLength: options.text.length,
    });

    const audioBuffer = await provider.generate(options);

    logger.info('TTS generation complete', {
      provider: provider.name,
      fileSize: audioBuffer.length,
    });

    return audioBuffer;
  } catch (error) {
    logger.error('TTS generation failed', { provider: provider.name }, error instanceof Error ? error : undefined);
    throw error;
  }
};

// Get available voices
export const getAvailableVoices = async (language: string): Promise<TTSVoice[]> => {
  const provider = getTTSProvider();
  return provider.getAvailableVoices(language);
};

// Estimate audio duration based on text length
// Average reading speed is about 150 words per minute
export const estimateAudioDuration = (text: string): number => {
  const wordCount = text.split(/\s+/).length;
  const minutesReading = wordCount / 150;
  return Math.ceil(minutesReading * 60); // Convert to seconds
};
