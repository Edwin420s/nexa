"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const file_storage_1 = require("../services/file-storage");
const Project_1 = require("../models/Project");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 10 // Max 10 files at once
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'text/plain',
            'text/markdown',
            'text/html',
            'application/json',
            'application/javascript',
            'application/typescript',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/svg+xml',
            'application/pdf',
            'application/zip'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    }
});
// Upload files
router.post('/upload', auth_1.authenticate, upload.array('files'), async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }
        const { projectId, agent } = req.body;
        const uploadedFiles = [];
        for (const file of req.files) {
            const fileMetadata = await (0, file_storage_1.getFileStorage)().saveFile(file.buffer, file.originalname, req.user.id, {
                projectId,
                agent,
                metadata: {
                    originalName: file.originalname,
                    encoding: file.encoding,
                    mimetype: file.mimetype
                }
            });
            // If projectId is provided, add file reference to project
            if (projectId) {
                await Project_1.Project.findByIdAndUpdate(projectId, {
                    $push: {
                        files: {
                            name: fileMetadata.name,
                            path: fileMetadata.path,
                            type: fileMetadata.mimeType,
                            size: fileMetadata.size
                        }
                    }
                });
            }
            uploadedFiles.push(fileMetadata);
        }
        logger_1.default.info(`User ${req.user.id} uploaded ${uploadedFiles.length} files`);
        res.json({
            success: true,
            data: uploadedFiles,
            count: uploadedFiles.length
        });
    }
    catch (error) {
        next(error);
    }
});
// Upload single file (alternative endpoint)
router.post('/upload/single', auth_1.authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        const { projectId, agent } = req.body;
        const fileMetadata = await (0, file_storage_1.getFileStorage)().saveFile(req.file.buffer, req.file.originalname, req.user.id, {
            projectId,
            agent,
            metadata: {
                originalName: req.file.originalname,
                encoding: req.file.encoding,
                mimetype: req.file.mimetype
            }
        });
        // If projectId is provided, add file reference to project
        if (projectId) {
            await Project_1.Project.findByIdAndUpdate(projectId, {
                $push: {
                    files: {
                        name: fileMetadata.name,
                        path: fileMetadata.path,
                        type: fileMetadata.mimeType,
                        size: fileMetadata.size
                    }
                }
            });
        }
        res.json({
            success: true,
            data: fileMetadata
        });
    }
    catch (error) {
        next(error);
    }
});
// List files
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { projectId, limit, offset, sortBy, sortOrder } = req.query;
        const files = await (0, file_storage_1.getFileStorage)().listFiles(req.user.id, projectId, {
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
            sortBy: sortBy,
            sortOrder: sortOrder
        });
        res.json({
            success: true,
            data: files,
            count: files.length
        });
    }
    catch (error) {
        next(error);
    }
});
// Get file metadata
router.get('/:fileId', auth_1.authenticate, async (req, res, next) => {
    try {
        const file = await (0, file_storage_1.getFileStorage)().getFile(req.params.fileId, req.user.id);
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
        res.json({
            success: true,
            data: file.metadata
        });
    }
    catch (error) {
        next(error);
    }
});
// Download file
router.get('/:fileId/download', auth_1.authenticate, async (req, res, next) => {
    try {
        const file = await (0, file_storage_1.getFileStorage)().getFile(req.params.fileId, req.user.id);
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
        // Set download headers
        res.setHeader('Content-Type', file.metadata.mimeType);
        res.setHeader('Content-Length', file.metadata.size);
        res.setHeader('Content-Disposition', `attachment; filename="${file.metadata.name}"`);
        res.setHeader('Cache-Control', 'private, max-age=3600');
        // Pipe file stream to response
        file.stream.pipe(res);
    }
    catch (error) {
        next(error);
    }
});
// Get file content
router.get('/:fileId/content', auth_1.authenticate, async (req, res, next) => {
    try {
        const { format = 'json' } = req.query;
        const file = await (0, file_storage_1.getFileStorage)().getFileContent(req.params.fileId, req.user.id);
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
        if (format === 'raw') {
            if (typeof file === 'string') {
                res.setHeader('Content-Type', 'text/plain');
                res.send(file);
            }
            else {
                res.setHeader('Content-Type', 'application/octet-stream');
                res.send(file);
            }
        }
        else {
            res.json({
                success: true,
                data: typeof file === 'string' ? file : file.toString('base64'),
                metadata: {
                    encoding: typeof file === 'string' ? 'utf8' : 'base64'
                }
            });
        }
    }
    catch (error) {
        next(error);
    }
});
// Update file metadata
router.put('/:fileId', auth_1.authenticate, async (req, res, next) => {
    try {
        // Note: This only updates project references
        // Actual file metadata is stored in JSON files
        const { projectId } = req.body;
        if (projectId) {
            const success = await (0, file_storage_1.getFileStorage)().moveFile(req.params.fileId, projectId, req.user.id);
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found or move failed'
                });
            }
        }
        res.json({
            success: true,
            message: 'File updated'
        });
    }
    catch (error) {
        next(error);
    }
});
// Delete file
router.delete('/:fileId', auth_1.authenticate, async (req, res, next) => {
    try {
        const success = await (0, file_storage_1.getFileStorage)().deleteFile(req.params.fileId, req.user.id);
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
        res.json({
            success: true,
            message: 'File deleted'
        });
    }
    catch (error) {
        next(error);
    }
});
// Create zip archive of files
router.post('/archive', auth_1.authenticate, async (req, res, next) => {
    try {
        const { fileIds, zipName = `archive-${Date.now()}` } = req.body;
        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'File IDs are required'
            });
        }
        const zipPath = await (0, file_storage_1.getFileStorage)().createZipArchive(fileIds, zipName, req.user.id);
        // Return download URL
        res.json({
            success: true,
            data: {
                downloadUrl: `/api/files/download/archive/${path.basename(zipPath)}`,
                size: (await fs.promises.stat(zipPath)).size,
                fileCount: fileIds.length
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Download archive
router.get('/download/archive/:filename', auth_1.authenticate, async (req, res, next) => {
    try {
        const filePath = path.join((0, file_storage_1.getFileStorage)()['config'].basePath, 'exports', req.params.filename);
        // Check if file exists and is accessible
        await fs.promises.access(filePath);
        const stats = await fs.promises.stat(filePath);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        // Delete file after download (optional)
        fileStream.on('end', () => {
            fs.promises.unlink(filePath).catch(error => {
                logger_1.default.error('Failed to delete archive after download:', error);
            });
        });
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                message: 'Archive not found'
            });
        }
        next(error);
    }
});
// Copy file
router.post('/:fileId/copy', auth_1.authenticate, async (req, res, next) => {
    try {
        const { newFileName, targetUserId, metadata } = req.body;
        if (!newFileName) {
            return res.status(400).json({
                success: false,
                message: 'New file name is required'
            });
        }
        const targetUserIdToUse = targetUserId || req.user.id;
        const copiedFile = await (0, file_storage_1.getFileStorage)().copyFile(req.params.fileId, newFileName, targetUserIdToUse, metadata);
        res.json({
            success: true,
            data: copiedFile
        });
    }
    catch (error) {
        next(error);
    }
});
// Get storage statistics
router.get('/stats/storage', auth_1.authenticate, async (req, res, next) => {
    try {
        // Only allow admins or the user themselves
        if (req.user.role !== 'admin' && req.query.userId && req.query.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
        const userId = req.query.userId || (req.user.role === 'admin' ? undefined : req.user.id);
        const files = await (0, file_storage_1.getFileStorage)().listFiles(userId);
        const stats = {
            totalFiles: files.length,
            totalSize: files.reduce((sum, file) => sum + file.size, 0),
            byType: {},
            byProject: {}
        };
        for (const file of files) {
            // By type
            const type = file.mimeType.split('/')[0];
            if (!stats.byType[type]) {
                stats.byType[type] = { count: 0, size: 0 };
            }
            stats.byType[type].count++;
            stats.byType[type].size += file.size;
            // By project
            if (file.projectId) {
                if (!stats.byProject[file.projectId]) {
                    stats.byProject[file.projectId] = { count: 0, size: 0 };
                }
                stats.byProject[file.projectId].count++;
                stats.byProject[file.projectId].size += file.size;
            }
        }
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
