// Audio upload constants
export const AUDIO_UPLOAD = {
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_MIME_TYPES: ['audio/mp4', 'audio/x-m4a', 'audio/m4a'] as const,
} as const;

// Type definition for allowed MIME types
export type AllowedMimeType = (typeof AUDIO_UPLOAD.ALLOWED_MIME_TYPES)[number];
