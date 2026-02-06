import { promises as fs } from 'fs';
import path from 'path';

import { logger } from '../logger';

export interface StorageProvider {
  name: string;
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

// Local filesystem storage provider for development
class LocalStorageProvider implements StorageProvider {
  name = 'local';
  private basePath: string;
  private baseUrl: string;

  constructor() {
    this.basePath = process.env.LOCAL_STORAGE_PATH || './uploads';
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  async upload(key: string, data: Buffer, _contentType: string): Promise<string> {
    const filePath = path.join(this.basePath, key);
    const dir = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, data);

    logger.info('File uploaded to local storage', { key, size: data.length });

    return `${this.baseUrl}/api/storage/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, key);
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    try {
      await fs.unlink(filePath);
      logger.info('File deleted from local storage', { key });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async getSignedUrl(key: string, _expiresIn?: number): Promise<string> {
    // For local storage, just return the direct URL
    return `${this.baseUrl}/api/storage/${key}`;
  }
}

// S3-compatible storage provider
class S3StorageProvider implements StorageProvider {
  name = 's3';
  private endpoint: string;
  private bucket: string;
  private accessKey: string;
  private secretKey: string;
  constructor() {
    this.endpoint = process.env.S3_ENDPOINT || 'https://s3.amazonaws.com';
    this.bucket = process.env.S3_BUCKET || 'bookapp-storage';
    this.accessKey = process.env.S3_ACCESS_KEY || '';
    this.secretKey = process.env.S3_SECRET_KEY || '';
  }

  private async sign(
    _method: string,
    key: string,
    contentType?: string,
    _payload?: Buffer
  ): Promise<{ headers: Record<string, string>; url: string }> {
    // Simplified S3 signing - in production, use @aws-sdk/client-s3
    const date = new Date().toUTCString();
    const url = `${this.endpoint}/${this.bucket}/${key}`;

    // This is a simplified version - use AWS SDK in production
    const headers: Record<string, string> = {
      Date: date,
      Host: new URL(this.endpoint).host,
    };

    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    // In production, properly sign with AWS Signature V4
    // For now, we'll use a simplified approach that works with some S3-compatible services
    if (this.accessKey && this.secretKey) {
      // Use basic auth or API key depending on the service
      headers['Authorization'] = `AWS ${this.accessKey}:signature`;
    }

    return { headers, url };
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    const { headers, url } = await this.sign('PUT', key, contentType, data);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Length': data.length.toString(),
      },
      body: new Uint8Array(data),
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.status}`);
    }

    logger.info('File uploaded to S3', { key, bucket: this.bucket, size: data.length });

    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    const { headers, url } = await this.sign('GET', key);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`S3 download failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(key: string): Promise<void> {
    const { headers, url } = await this.sign('DELETE', key);

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`S3 delete failed: ${response.status}`);
    }

    logger.info('File deleted from S3', { key, bucket: this.bucket });
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    // Generate a pre-signed URL
    // In production, use AWS SDK's getSignedUrl
    const expires = Math.floor(Date.now() / 1000) + expiresIn;
    return `${this.endpoint}/${this.bucket}/${key}?expires=${expires}`;
  }
}

// Get the configured storage provider
export const getStorageProvider = (): StorageProvider => {
  const providerName = process.env.STORAGE_PROVIDER || 'local';

  switch (providerName) {
    case 's3':
      return new S3StorageProvider();
    case 'local':
    default:
      return new LocalStorageProvider();
  }
};

// Upload file
export const uploadFile = async (
  key: string,
  data: Buffer,
  contentType: string
): Promise<string> => {
  const provider = getStorageProvider();

  try {
    return await provider.upload(key, data, contentType);
  } catch (error) {
    logger.error('File upload failed', { provider: provider.name, key }, error instanceof Error ? error : undefined);
    throw error;
  }
};

// Download file
export const downloadFile = async (key: string): Promise<Buffer> => {
  const provider = getStorageProvider();

  try {
    return await provider.download(key);
  } catch (error) {
    logger.error('File download failed', { provider: provider.name, key }, error instanceof Error ? error : undefined);
    throw error;
  }
};

// Delete file
export const deleteFile = async (key: string): Promise<void> => {
  const provider = getStorageProvider();

  try {
    await provider.delete(key);
  } catch (error) {
    logger.error('File delete failed', { provider: provider.name, key }, error instanceof Error ? error : undefined);
    throw error;
  }
};

// Get signed URL for file
export const getFileUrl = async (key: string, expiresIn?: number): Promise<string> => {
  const provider = getStorageProvider();
  return provider.getSignedUrl(key, expiresIn);
};

// Generate a unique storage key
export const generateStorageKey = (
  prefix: string,
  filename: string,
  extension: string
): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
  return `${prefix}/${timestamp}-${random}-${sanitizedFilename}.${extension}`;
};
