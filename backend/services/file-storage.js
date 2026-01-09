"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStorageService = void 0;
exports.getFileStorage = getFileStorage;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const stream_1 = require("stream");
const fs_1 = require("fs");
const archiver_1 = __importDefault(require("archiver"));
const extract_zip_1 = __importDefault(require("extract-zip"));
const logger_1 = __importDefault(require("../utils/logger"));
class FileStorageService {
    constructor(config) {
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
    async ensureStoragePaths() {
        const paths = [
            this.config.basePath,
            path_1.default.join(this.config.basePath, 'projects'),
            path_1.default.join(this.config.basePath, 'exports'),
            path_1.default.join(this.config.basePath, 'temp'),
            path_1.default.join(this.config.basePath, 'backups')
        ];
        for (const dirPath of paths) {
            try {
                await promises_1.default.access(dirPath);
            }
            catch {
                await promises_1.default.mkdir(dirPath, { recursive: true });
                logger_1.default.info(`Created storage directory: ${dirPath}`);
            }
        }
    }
    setupCleanupInterval() {
        if (this.config.cleanupInterval > 0) {
            setInterval(() => {
                this.cleanupTempFiles().catch(error => {
                    logger_1.default.error('Failed to cleanup temp files:', error);
                });
            }, this.config.cleanupInterval * 60 * 60 * 1000);
        }
    }
    async saveFile(fileData, fileName, userId, metadata) {
        const fileId = (0, uuid_1.v4)();
        const fileExt = path_1.default.extname(fileName);
        const baseName = path_1.default.basename(fileName, fileExt);
        const safeName = this.sanitizeFileName(baseName) + fileExt;
        const filePath = path_1.default.join(this.config.basePath, 'projects', userId, fileId, safeName);
        // Ensure user directory exists
        await promises_1.default.mkdir(path_1.default.dirname(filePath), { recursive: true });
        // Save file
        if (Buffer.isBuffer(fileData)) {
            await promises_1.default.writeFile(filePath, fileData);
        }
        else if (typeof fileData === 'string') {
            await promises_1.default.writeFile(filePath, fileData, 'utf8');
        }
        else if (fileData instanceof stream_1.Readable) {
            await new Promise((resolve, reject) => {
                const writeStream = (0, fs_1.createWriteStream)(filePath);
                fileData.pipe(writeStream);
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });
        }
        else {
            throw new Error('Unsupported file data type');
        }
        // Get file stats
        const stats = await promises_1.default.stat(filePath);
        // Detect MIME type
        const mimeType = this.detectMimeType(fileName, filePath);
        const fileMetadata = {
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
        logger_1.default.info(`File saved: ${fileId} (${safeName}) for user ${userId}`);
        return fileMetadata;
    }
    async generateThumbnail(filePath, metadata) {
        try {
            // This would require an image processing library like sharp
            // For now, just log that thumbnail generation is needed
            logger_1.default.debug(`Thumbnail generation needed for: ${metadata.id}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to generate thumbnail for ${metadata.id}:`, error);
        }
    }
    async saveMetadata(metadata) {
        const metadataPath = path_1.default.join(path_1.default.dirname(metadata.path), `${metadata.id}.metadata.json`);
        await promises_1.default.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    }
    async getFile(fileId, userId) {
        try {
            // Find metadata file
            const metadata = await this.findMetadata(fileId, userId);
            if (!metadata) {
                return null;
            }
            // Check if file exists
            await promises_1.default.access(metadata.path);
            // Create read stream
            const stream = (0, fs_1.createReadStream)(metadata.path);
            return {
                metadata,
                stream
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to get file ${fileId}:`, error);
            return null;
        }
    }
    async getFileContent(fileId, userId) {
        try {
            const file = await this.getFile(fileId, userId);
            if (!file) {
                return null;
            }
            // Read entire file
            const chunks = [];
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
        }
        catch (error) {
            logger_1.default.error(`Failed to get file content ${fileId}:`, error);
            return null;
        }
    }
    async deleteFile(fileId, userId) {
        try {
            const metadata = await this.findMetadata(fileId, userId);
            if (!metadata) {
                return false;
            }
            // Delete the file
            await promises_1.default.unlink(metadata.path);
            // Delete metadata file
            const metadataPath = path_1.default.join(path_1.default.dirname(metadata.path), `${fileId}.metadata.json`);
            await promises_1.default.unlink(metadataPath);
            // Delete directory if empty
            const dirPath = path_1.default.dirname(metadata.path);
            const files = await promises_1.default.readdir(dirPath);
            if (files.length === 0) {
                await promises_1.default.rmdir(dirPath);
            }
            logger_1.default.info(`File deleted: ${fileId}`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Failed to delete file ${fileId}:`, error);
            return false;
        }
    }
    async listFiles(userId, projectId, options) {
        const files = [];
        const basePath = path_1.default.join(this.config.basePath, 'projects');
        try {
            if (userId) {
                // List files for specific user
                const userPath = path_1.default.join(basePath, userId);
                await this.scanDirectoryForMetadata(userPath, files);
            }
            else {
                // List all files (admin only)
                const users = await promises_1.default.readdir(basePath);
                for (const user of users) {
                    const userPath = path_1.default.join(basePath, user);
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
        }
        catch (error) {
            logger_1.default.error('Failed to list files:', error);
            return [];
        }
    }
    async scanDirectoryForMetadata(dirPath, results) {
        try {
            const entries = await promises_1.default.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    await this.scanDirectoryForMetadata(fullPath, results);
                }
                else if (entry.name.endsWith('.metadata.json')) {
                    try {
                        const content = await promises_1.default.readFile(fullPath, 'utf8');
                        const metadata = JSON.parse(content);
                        results.push(metadata);
                    }
                    catch (error) {
                        logger_1.default.error(`Failed to parse metadata file ${fullPath}:`, error);
                    }
                }
            }
        }
        catch (error) {
            // Directory might not exist or be inaccessible
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    async createZipArchive(fileIds, zipName, userId) {
        const zipPath = path_1.default.join(this.config.basePath, 'exports', `${zipName}.zip`);
        // Ensure exports directory exists
        await promises_1.default.mkdir(path_1.default.dirname(zipPath), { recursive: true });
        const output = (0, fs_1.createWriteStream)(zipPath);
        const archive = (0, archiver_1.default)('zip', {
            zlib: { level: 9 } // Maximum compression
        });
        return new Promise((resolve, reject) => {
            output.on('close', () => {
                logger_1.default.info(`Zip archive created: ${zipPath} (${archive.pointer()} bytes)`);
                resolve(zipPath);
            });
            archive.on('error', reject);
            archive.pipe(output);
            // Add files to archive
            Promise.all(fileIds.map(async (fileId) => {
                const file = await this.getFile(fileId, userId);
                if (file) {
                    archive.append(file.stream, { name: file.metadata.name });
                }
            })).then(() => {
                archive.finalize();
            }).catch(reject);
        });
    }
    async extractZip(zipPath, extractTo) {
        const extractedFiles = [];
        await (0, extract_zip_1.default)(zipPath, {
            dir: extractTo,
            onEntry: (entry) => {
                extractedFiles.push(entry.fileName);
            }
        });
        logger_1.default.info(`Zip extracted: ${zipPath} -> ${extractTo} (${extractedFiles.length} files)`);
        return extractedFiles;
    }
    async copyFile(sourceFileId, newFileName, targetUserId, metadata) {
        const sourceFile = await this.getFile(sourceFileId);
        if (!sourceFile) {
            throw new Error(`Source file ${sourceFileId} not found`);
        }
        // Read source file content
        const chunks = [];
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
    async moveFile(fileId, newProjectId, userId) {
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
            logger_1.default.info(`File ${fileId} moved to project ${newProjectId}`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Failed to move file ${fileId}:`, error);
            return false;
        }
    }
    async getStorageStats() {
        const files = await this.listFiles();
        const stats = {
            totalFiles: files.length,
            totalSize: 0,
            byUser: {},
            byType: {}
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
    async cleanupTempFiles(maxAgeHours = 24) {
        const tempPath = path_1.default.join(this.config.basePath, 'temp');
        let deletedCount = 0;
        try {
            const entries = await promises_1.default.readdir(tempPath, { withFileTypes: true });
            const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
            for (const entry of entries) {
                const fullPath = path_1.default.join(tempPath, entry.name);
                const stats = await promises_1.default.stat(fullPath);
                if (stats.mtimeMs < cutoff) {
                    if (entry.isDirectory()) {
                        await promises_1.default.rm(fullPath, { recursive: true });
                    }
                    else {
                        await promises_1.default.unlink(fullPath);
                    }
                    deletedCount++;
                    logger_1.default.debug(`Cleaned up temp file: ${fullPath}`);
                }
            }
            logger_1.default.info(`Cleaned up ${deletedCount} temp files`);
            return deletedCount;
        }
        catch (error) {
            logger_1.default.error('Failed to cleanup temp files:', error);
            return 0;
        }
    }
    async findMetadata(fileId, userId) {
        const files = await this.listFiles(userId);
        return files.find(file => file.id === fileId) || null;
    }
    sanitizeFileName(fileName) {
        return fileName
            .replace(/[^a-zA-Z0-9.\-_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '')
            .substring(0, 255); // Limit length
    }
    detectMimeType(fileName, filePath) {
        const ext = path_1.default.extname(fileName).toLowerCase();
        const mimeTypes = {
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
    async backupDatabase(backupName) {
        const backupPath = path_1.default.join(this.config.basePath, 'backups', `${backupName}.zip`);
        // This would require database backup logic
        // For now, just create an empty backup file
        await promises_1.default.writeFile(backupPath, 'Database backup placeholder');
        logger_1.default.info(`Database backup created: ${backupPath}`);
        return backupPath;
    }
    async restoreDatabase(backupPath) {
        try {
            // This would require database restore logic
            logger_1.default.info(`Database restore attempted from: ${backupPath}`);
            return true;
        }
        catch (error) {
            logger_1.default.error('Failed to restore database:', error);
            return false;
        }
    }
}
exports.FileStorageService = FileStorageService;
// Singleton instance
let fileStorageInstance;
function getFileStorage() {
    if (!fileStorageInstance) {
        fileStorageInstance = new FileStorageService();
    }
    return fileStorageInstance;
}
