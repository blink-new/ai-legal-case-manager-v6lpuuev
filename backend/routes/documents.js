const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { database } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common document types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, Excel, text, and image files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Upload document to a case
router.post('/upload/:caseId', upload.single('document'), [
  body('documentType').optional().isIn(['contract', 'medical_record', 'police_report', 'insurance_doc', 'correspondence', 'photo', 'other']),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    const { caseId } = req.params;
    const { documentType = 'other', description } = req.body;

    // Check if case exists and belongs to user
    const existingCase = await database.get(
      'SELECT * FROM cases WHERE id = ? AND user_id = ?',
      [caseId, req.user.id]
    );

    if (!existingCase) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        error: 'Case not found',
        message: 'Case not found or you do not have permission to upload documents'
      });
    }

    const documentId = uuidv4();
    const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);

    // Save document record to database
    await database.run(
      `INSERT INTO documents (
        id, case_id, user_id, filename, original_name, file_path, 
        file_size, mime_type, document_type, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        documentId, caseId, req.user.id, req.file.filename, req.file.originalname,
        relativePath, req.file.size, req.file.mimetype, documentType, description || null
      ]
    );

    // Get the created document
    const newDocument = await database.get(
      'SELECT * FROM documents WHERE id = ?',
      [documentId]
    );

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: newDocument
    });

  } catch (error) {
    console.error('Upload document error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size exceeds the maximum allowed limit'
      });
    }

    res.status(500).json({
      error: 'Upload failed',
      message: 'An error occurred while uploading the document'
    });
  }
});

// Get all documents for a case
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;

    // Check if case exists and belongs to user
    const existingCase = await database.get(
      'SELECT * FROM cases WHERE id = ? AND user_id = ?',
      [caseId, req.user.id]
    );

    if (!existingCase) {
      return res.status(404).json({
        error: 'Case not found',
        message: 'Case not found or you do not have permission to view documents'
      });
    }

    const documents = await database.all(
      `SELECT id, filename, original_name, file_size, mime_type, 
              document_type, description, uploaded_at 
       FROM documents 
       WHERE case_id = ? 
       ORDER BY uploaded_at DESC`,
      [caseId]
    );

    res.json({
      documents
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      error: 'Failed to fetch documents',
      message: 'An error occurred while fetching documents'
    });
  }
});

// Download a document
router.get('/download/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get document and verify ownership
    const document = await database.get(
      'SELECT d.*, c.user_id FROM documents d JOIN cases c ON d.case_id = c.id WHERE d.id = ?',
      [documentId]
    );

    if (!document || document.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'Document not found or you do not have permission to download it'
      });
    }

    const filePath = path.join(__dirname, '..', document.file_path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file could not be found on the server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
    res.setHeader('Content-Type', document.mime_type);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      error: 'Download failed',
      message: 'An error occurred while downloading the document'
    });
  }
});

// Update document metadata
router.put('/:documentId', [
  body('documentType').optional().isIn(['contract', 'medical_record', 'police_report', 'insurance_doc', 'correspondence', 'photo', 'other']),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { documentId } = req.params;
    const { documentType, description } = req.body;

    // Get document and verify ownership
    const document = await database.get(
      'SELECT d.*, c.user_id FROM documents d JOIN cases c ON d.case_id = c.id WHERE d.id = ?',
      [documentId]
    );

    if (!document || document.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'Document not found or you do not have permission to update it'
      });
    }

    const updates = [];
    const values = [];

    if (documentType !== undefined) {
      updates.push('document_type = ?');
      values.push(documentType);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'At least one field must be provided for update'
      });
    }

    values.push(documentId);

    await database.run(
      `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated document
    const updatedDocument = await database.get(
      'SELECT * FROM documents WHERE id = ?',
      [documentId]
    );

    res.json({
      message: 'Document updated successfully',
      document: updatedDocument
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      error: 'Update failed',
      message: 'An error occurred while updating the document'
    });
  }
});

// Delete a document
router.delete('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get document and verify ownership
    const document = await database.get(
      'SELECT d.*, c.user_id FROM documents d JOIN cases c ON d.case_id = c.id WHERE d.id = ?',
      [documentId]
    );

    if (!document || document.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'Document not found or you do not have permission to delete it'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', document.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete document record from database
    await database.run(
      'DELETE FROM documents WHERE id = ?',
      [documentId]
    );

    res.json({
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: 'Delete failed',
      message: 'An error occurred while deleting the document'
    });
  }
});

// Get document statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await database.get(`
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN document_type = 'contract' THEN 1 END) as contracts,
        COUNT(CASE WHEN document_type = 'medical_record' THEN 1 END) as medical_records,
        COUNT(CASE WHEN document_type = 'police_report' THEN 1 END) as police_reports,
        COUNT(CASE WHEN document_type = 'insurance_doc' THEN 1 END) as insurance_docs,
        COUNT(CASE WHEN document_type = 'photo' THEN 1 END) as photos,
        COALESCE(SUM(file_size), 0) as total_storage_used
      FROM documents d
      JOIN cases c ON d.case_id = c.id
      WHERE c.user_id = ?
    `, [req.user.id]);

    const recentDocuments = await database.all(`
      SELECT d.id, d.original_name, d.document_type, d.uploaded_at, c.case_number, c.title as case_title
      FROM documents d
      JOIN cases c ON d.case_id = c.id
      WHERE c.user_id = ?
      ORDER BY d.uploaded_at DESC
      LIMIT 10
    `, [req.user.id]);

    res.json({
      stats,
      recentDocuments
    });

  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: 'An error occurred while fetching document statistics'
    });
  }
});

module.exports = router;