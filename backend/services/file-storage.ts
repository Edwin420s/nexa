import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { createReadStream, createWriteStream } from 'fs';
import archiver from 'archiver';
import extract from 'extract-zip';
import logger from '../utils/logger';

export interface FileMetadata {
  id: string;
  name: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  encoding?: string;
  userId: string;
  projectId?: string;
  agent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageConfig {
  basePath: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  generateThumbnails: boolean;
  cleanupInterval: number; // hours
}

export class FileStorageService {
  private config: StorageConfig;

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      basePath: process.env.UPLOAD_PATH || './uploads',
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'text/plain',
        'text/markdown',
        'text/html',
        'application/json',
        'application/javascript',
        'application/typescript',
        'application/x-python-code',
        'application/xml',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/svg+xml',
        'application/pdf',
        'application/zip',
        'application/x-tar',
        'application/x-gzip'
      ],
      generateThumbnails: false,
      cleanupInterval: 24,
      ...config
    };

    this.ensureStoragePaths();
    this.setupCleanupInterval();
  }

  private async ensureStoragePaths(): Promise<void> {
    const paths = [
      this.config.basePath,
      path.join(this.config.basePath, 'projects'),
      path.join(this.config.basePath, 'exports'),
      path.join(this.config.basePath, 'temp'),
      path.join(this.config.basePath, 'backups')
    ];

    for (const dirPath of paths) {
      try {
        await fs.access(dirPath);
      } catch {
        await fs.mkdir(dirPath, { recursive: true });
        logger.info(`Created storage directory: ${dirPath}`);
      }
    }
  }

  private setupCleanupInterval(): void {
    if (this.config.cleanupInterval > 0) {
      setInterval(() => {
        this.cleanupTempFiles().catch(error => {
          logger.error('Failed to cleanup temp files:', error);
        });
      }, this.config.cleanupInterval * 60 * 60 * 1000);
    }
  }

  async saveFile(
    fileData: Buffer | Readable | string,
    fileName: string,
    userId: string,
    metadata?: Partial<FileMetadata>
  ): Promise<FileMetadata> {
    const fileId = uuidv4();
    const fileExt = path.extname(fileName);
    const baseName = path.basename(fileName, fileExt);
    const safeName = this.sanitizeFileName(baseName) + fileExt;
    const filePath = path.join(this.config.basePath, 'projects', userId, fileId, safeName);

    // Ensure user directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Save file
    if (Buffer.isBuffer(fileData)) {
      await fs.writeFile(filePath, fileData);
    } else if (typeof fileData === 'string') {
      await fs.writeFile(filePath, fileData, 'utf8');
    } else if (fileData instanceof Readable) {
      await new Promise((resolve, reject) => {
        const writeStream = createWriteStream(filePath);
        fileData.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } else {
      throw new Error('Unsupported file data type');
    }

    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Detect MIME type
    const mimeType = this.detectMimeType(fileName, filePath);

    const fileMetadata: FileMetadata = {
      id: fileId,
      name: safeName,
      originalName: fileName,
      path: filePath,
      size: stats.size,
      mimeType,
      userId,
      projectId: metadata?.projectId,
      agent: metadata?.agent,
      metadata: metadata?.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generate thumbnail if it's an image and configured
    if (this.config.generateThumbnails && mimeType.startsWith('image/')) {
      await this.generateThumbnail(filePath, fileMetadata);
    }

    // Save metadata to JSON file
    await this.saveMetadata(fileMetadata);

    logger.info(`File saved: ${fileId} (${safeName}) for user ${userId}`);
    
    return fileMetadata;
  }

  private async generateThumbnail(filePath: string, metadata: FileMetadata): Promise<void> {
    try {
      // This would require an image processing library like sharp
      // For now, just log that thumbnail generation is needed
      logger.debug(`Thumbnail generation needed for: ${metadata.id}`);
    } catch (error) {
      logger.error(`Failed to generate thumbnail for ${metadata.id}:`, error);
    }
  }

  private async saveMetadata(metadata: FileMetadata): Promise<void> {
    const metadataPath = path.join(
      path.dirname(metadata.path),
      `${metadata.id}.metadata.json`
    );
    
    await fs.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
  }

  async getFile(fileId: string, userId?: string): Promise<{
    metadata: FileMetadata;
    stream: Readable;
  } | null> {
    try {
      // Find metadata file
      const metadata = await this.findMetadata(fileId, userId);
      if (!metadata) {
        return null;
      }

      // Check if file exists
      await fs.access(metadata.path);

      // Create read stream
      const stream = createReadStream(metadata.path);

      return {
        metadata,
        stream
      };
    } catch (error) {
      logger.error(`Failed to get file ${fileId}:`, error);
      return null;
    }
  }

  async getFileContent(fileId: string, userId?: string): Promise<string | Buffer | null> {
    try {
      const file = await this.getFile(fileId, userId);
      if (!file) {
        return null;
      }

      // Read entire file
      const chunks: Buffer[] = [];
      for await (const chunk of file.stream) {
        chunks.push(chunk);
      }

      const content = Buffer.concat(chunks);
      
      // Return as string for text files
      if (file.metadata.mimeType.startsWith('text/') || 
          file.metadata.mimeType.includes('json') ||
          file.metadata.mimeType.includes('javascript')) {
        return content.toString('utf8');
      }

      return content;
    } catch (error) {
      logger.error(`Failed to get file content ${fileId}:`, error);
      return null;
    }
  }

  async deleteFile(fileId: string, userId?: string): Promise<boolean> {
    try {
      const metadata = await this.findMetadata(fileId, userId);
      if (!metadata) {
        return false;
      }

      // Delete the file
      await fs.unlink(metadata.path);

      // Delete metadata file
      const metadataPath = path.join(
        path.dirname(metadata.path),
        `${fileId}.metadata.json`
      );
      await fs.unlink(metadataPath);

      // Delete directory if empty
      const dirPath = path.dirname(metadata.path);
      const files = await fs.readdir(dirPath);
      if (files.length === 0) {
        await fs.rmdir(dirPath);
      }

      logger.info(`File deleted: ${fileId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete file ${fileId}:`, error);
      return false;
    }
  }

  async listFiles(
    userId?: string,
    projectId?: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: keyof FileMetadata;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<FileMetadata[]> {
    const files: FileMetadata[] = [];
    const basePath = path.join(this.config.basePath, 'projects');

    try {
      if (userId) {
        // List files for specific user
        const userPath = path.join(basePath, userId);
        await this.scanDirectoryForMetadata(userPath, files);
      } else {
        // List all files (admin only)
        const users = await fs.readdir(basePath);
        for (const user of users) {
          const userPath = path.join(basePath, user);
          await this.scanDirectoryForMetadata(userPath, files);
        }
      }

      // Filter by project if specified
      let filteredFiles = files;
      if (projectId) {
        filteredFiles = files.filter(file => file.projectId === projectId);
      }

      // Apply sorting
      const { sortBy = 'createdAt', sortOrder = 'desc' } = options || {};
      filteredFiles.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        
        if (aVal instanceof Date && bVal instanceof Date) {
          return sortOrder === 'asc' 
            ? aVal.getTime() - bVal.getTime()
            : bVal.getTime() - aVal.getTime();
        }
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        return 0;
      });

      // Apply pagination
      const { limit, offset = 0 } = options || {};
      if (limit) {
        return filteredFiles.slice(offset, offset + limit);
      }

      return filteredFiles;
    } catch (error) {
      logger.error('Failed to list files:', error);
      return [];
    }
  }

  private async scanDirectoryForMetadata(dirPath: string, results: FileMetadata[]): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.scanDirectoryForMetadata(fullPath, results);
        } else if (entry.name.endsWith('.metadata.json')) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            const metadata = JSON.parse(content) as FileMetadata;
            results.push(metadata);
          } catch (error) {
            logger.error(`Failed to parse metadata file ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      // Directory might not exist or be inaccessible
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async createZipArchive(
    fileIds: string[],
    zipName: string,
    userId?: string
  ): Promise<string> {
    const zipPath = path.join(this.config.basePath, 'exports', `${zipName}.zip`);
    
    // Ensure exports directory exists
    await fs.mkdir(path.dirname(zipPath), { recursive: true });

    const output = createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        logger.info(`Zip archive created: ${zipPath} (${archive.pointer()} bytes)`);
        resolve(zipPath);
      });

      archive.on('error', reject);
      archive.pipe(output);

      // Add files to archive
      Promise.all(
        fileIds.map(async (fileId) => {
          const file = await this.getFile(fileId, userId);
          if (file) {
            archive.append(file.stream, { name: file.metadata.name });
          }
        })
      ).then(() => {
        archive.finalize();
      }).catch(reject);
    });
  }

  async extractZip(zipPath: string, extractTo: string): Promise<string[]> {
    const extractedFiles: string[] = [];

    await extract(zipPath, {
      dir: extractTo,
      onEntry: (entry) => {
        extractedFiles.push(entry.fileName);
      }
    });

    logger.info(`Zip extracted: ${zipPath} -> ${extractTo} (${extractedFiles.length} files)`);
    return extractedFiles;
  }

  async copyFile(
    sourceFileId: string,
    newFileName: string,
    targetUserId: string,
    metadata?: Partial<FileMetadata>
  ): Promise<FileMetadata> {
    const sourceFile = await this.getFile(sourceFileId);
    if (!sourceFile) {
      throw new Error(`Source file ${sourceFileId} not found`);
    }

    // Read source file content
    const chunks: Buffer[] = [];
    for await (const chunk of sourceFile.stream) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks);

    // Save as new file
    return this.saveFile(content, newFileName, targetUserId, {
      ...sourceFile.metadata,
      ...metadata,
      id: undefined, // Generate new ID
      originalName: newFileName
    });
  }

  async moveFile(
    fileId: string,
    newProjectId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const metadata = await this.findMetadata(fileId, userId);
      if (!metadata) {
        return false;
      }

      // Update metadata
      metadata.projectId = newProjectId;
      metadata.updatedAt = new Date();

      // Save updated metadata
      await this.saveMetadata(metadata);

      logger.info(`File ${fileId} moved to project ${newProjectId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to move file ${fileId}:`, error);
      return false;
    }
  }

  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byUser: Record<string, { files: number; size: number }>;
    byType: Record<string, { files: number; size: number }>;
  }> {
    const files = await this.listFiles();
    
    const stats = {
      totalFiles: files.length,
      totalSize: 0,
      byUser: {} as Record<string, { files: number; size: number }>,
      byType: {} as Record<string, { files: number; size: number }>
    };

    for (const file of files) {
      stats.totalSize += file.size;

      // User stats
      if (!stats.byUser[file.userId]) {
        stats.byUser[file.userId] = { files: 0, size: 0 };
      }
      stats.byUser[file.userId].files++;
      stats.byUser[file.userId].size += file.size;

      // Type stats
      const type = file.mimeType.split('/')[0];
      if (!stats.byType[type]) {
        stats.byType[type] = { files: 0, size: 0 };
      }
      stats.byType[type].files++;
      stats.byType[type].size += file.size;
    }

    return stats;
  }

  async cleanupTempFiles(maxAgeHours: number = 24): Promise<number> {
    const tempPath = path.join(this.config.basePath, 'temp');
    let deletedCount = 0;

    try {
      const entries = await fs.readdir(tempPath, { withFileTypes: true });
      const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);

      for (const entry of entries) {
        const fullPath = path.join(tempPath, entry.name);
        const stats = await fs.stat(fullPath);

        if (stats.mtimeMs < cutoff) {
          if (entry.isDirectory()) {
            await fs.rm(fullPath, { recursive: true });
          } else {
            await fs.unlink(fullPath);
          }
          deletedCount++;
          logger.debug(`Cleaned up temp file: ${fullPath}`);
        }
      }

      logger.info(`Cleaned up ${deletedCount} temp files`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup temp files:', error);
      return 0;
    }
  }

  private async findMetadata(fileId: string, userId?: string): Promise<FileMetadata | null> {
    const files = await this.listFiles(userId);
    return files.find(file => file.id === fileId) || null;
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 255); // Limit length
  }

  private detectMimeType(fileName: string, filePath: string): string {
    const ext = path.extname(fileName).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.json': 'application/json',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.py': 'application/x-python-code',
      '.java': 'text/x-java-source',
      '.c': 'text/x-c',
      '.cpp': 'text/x-c++',
      '.h': 'text/x-c',
      '.cs': 'text/x-csharp',
      '.go': 'text/x-go',
      '.rs': 'text/x-rust',
      '.php': 'application/x-php',
      '.rb': 'application/x-ruby',
      '.xml': 'application/xml',
      '.yml': 'application/x-yaml',
      '.yaml': 'application/x-yaml',
      '.csv': 'text/csv',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.tar': 'application/x-tar',
      '.gz': 'application/x-gzip',
      '.7z': 'application/x-7z-compressed',
      '.rar': 'application/vnd.rar'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  async backupDatabase(backupName: string): Promise<string> {
    const backupPath = path.join(this.config.basePath, 'backups', `${backupName}.zip`);
    
    // This would require database backup logic
    // For now, just create an empty backup file
    await fs.writeFile(backupPath, 'Database backup placeholder');
    
    logger.info(`Database backup created: ${backupPath}`);
    return backupPath;
  }

  async restoreDatabase(backupPath: string): Promise<boolean> {
    try {
      // This would require database restore logic
      logger.info(`Database restore attempted from: ${backupPath}`);
      return true;
    } catch (error) {
      logger.error('Failed to restore database:', error);
      return false;
    }
  }
}

// Singleton instance
let fileStorageInstance: FileStorageService;

export function getFileStorage(): FileStorageService {
  if (!fileStorageInstance) {
    fileStorageInstance = new FileStorageService();
  }
  return fileStorageInstance;
}