import crypto from 'crypto';

export const generateId = (): string => {
  return crypto.randomUUID();
};

export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9_\-\.]/gi, '_')
    .toLowerCase();
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const parseJSON = (text: string): any | null => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const extractJSON = (text: string): any | null => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return parseJSON(jsonMatch[0]);
  }
  return null;
};

export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return emailRegex.test(email);
};

export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  const masked = username.substring(0, 2) + '***';
  return `${masked}@${domain}`;
};

export const getEnumValues = <T extends Record<string, string>>(enumObj: T): string[] => {
  return Object.values(enumObj);
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};