/**
 * File validation utilities for resume upload
 */

const FILE_CONSTRAINTS = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['application/pdf'],
  fileExtensions: ['.pdf'],
};

/**
 * Validate file before upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > FILE_CONSTRAINTS.maxSize) {
    const maxSizeMB = FILE_CONSTRAINTS.maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File is too large. Maximum size is ${maxSizeMB}MB (your file: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
    };
  }

  // Check file type
  if (!FILE_CONSTRAINTS.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only PDF files are allowed',
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = FILE_CONSTRAINTS.fileExtensions.some((ext) => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'File must be a PDF document',
    };
  }

  // Check file name
  if (file.name.length > 255) {
    return {
      valid: false,
      error: 'File name is too long',
    };
  }

  return { valid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Check if file upload is in progress
 */
export const isValidFileInput = (input: FileList | null): boolean => {
  return input !== null && input.length > 0;
};
