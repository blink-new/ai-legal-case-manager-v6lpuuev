const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { database } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all cases for the authenticated user
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['open', 'closed', 'settled', 'dismissed']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { status, priority, search } = req.query;

    let whereClause = 'WHERE user_id = ?';
    let params = [req.user.id];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (priority) {
      whereClause += ' AND priority = ?';
      params.push(priority);
    }

    if (search) {
      whereClause += ' AND (title LIKE ? OR client_name LIKE ? OR case_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM cases ${whereClause}`;
    const countResult = await database.get(countQuery, params);
    const total = countResult.total;

    // Get cases with pagination
    const casesQuery = `
      SELECT * FROM cases 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const cases = await database.all(casesQuery, [...params, limit, offset]);

    res.json({
      cases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({
      error: 'Failed to fetch cases',
      message: 'An error occurred while fetching cases'
    });
  }
});

// Get a specific case
router.get('/:id', async (req, res) => {
  try {
    const caseData = await database.get(
      'SELECT * FROM cases WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!caseData) {
      return res.status(404).json({
        error: 'Case not found',
        message: 'Case not found or you do not have permission to view it'
      });
    }

    // Get case notes
    const notes = await database.all(
      'SELECT * FROM case_notes WHERE case_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    // Get deadlines
    const deadlines = await database.all(
      'SELECT * FROM deadlines WHERE case_id = ? ORDER BY due_date ASC',
      [req.params.id]
    );

    // Get documents
    const documents = await database.all(
      'SELECT id, filename, original_name, file_size, mime_type, document_type, description, uploaded_at FROM documents WHERE case_id = ?',
      [req.params.id]
    );

    res.json({
      case: caseData,
      notes,
      deadlines,
      documents
    });

  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({
      error: 'Failed to fetch case',
      message: 'An error occurred while fetching the case'
    });
  }
});

// Create a new case
router.post('/', [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('clientName').trim().isLength({ min: 1 }).withMessage('Client name is required'),
  body('clientEmail').optional().isEmail(),
  body('clientPhone').optional().trim(),
  body('caseType').isIn(['personal_injury', 'auto_accident', 'medical_malpractice', 'workers_comp', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('description').optional().trim(),
  body('incidentDate').optional().isISO8601(),
  body('insuranceCompany').optional().trim(),
  body('insuranceAdjuster').optional().trim(),
  body('insuranceClaimNumber').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      title,
      clientName,
      clientEmail,
      clientPhone,
      caseType,
      priority = 'medium',
      description,
      incidentDate,
      insuranceCompany,
      insuranceAdjuster,
      insuranceClaimNumber
    } = req.body;

    const caseId = uuidv4();
    const caseNumber = `${caseType.toUpperCase()}-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Calculate statute of limitations (2 years from incident date for most cases)
    let statuteOfLimitations = null;
    if (incidentDate) {
      const incident = new Date(incidentDate);
      statuteOfLimitations = new Date(incident.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years
    }

    const result = await database.run(
      `INSERT INTO cases (
        id, user_id, case_number, title, client_name, client_email, client_phone,
        case_type, priority, description, incident_date, statute_of_limitations,
        insurance_company, insurance_adjuster, insurance_claim_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        caseId, req.user.id, caseNumber, title, clientName, clientEmail || null,
        clientPhone || null, caseType, priority, description || null,
        incidentDate || null, statuteOfLimitations ? statuteOfLimitations.toISOString() : null,
        insuranceCompany || null, insuranceAdjuster || null, insuranceClaimNumber || null
      ]
    );

    // Get the created case
    const newCase = await database.get(
      'SELECT * FROM cases WHERE id = ?',
      [caseId]
    );

    res.status(201).json({
      message: 'Case created successfully',
      case: newCase
    });

  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({
      error: 'Failed to create case',
      message: 'An error occurred while creating the case'
    });
  }
});

// Update a case
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1 }),
  body('clientName').optional().trim().isLength({ min: 1 }),
  body('clientEmail').optional().isEmail(),
  body('clientPhone').optional().trim(),
  body('status').optional().isIn(['open', 'closed', 'settled', 'dismissed']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('description').optional().trim(),
  body('settlementAmount').optional().isFloat({ min: 0 }),
  body('insuranceCompany').optional().trim(),
  body('insuranceAdjuster').optional().trim(),
  body('insuranceClaimNumber').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if case exists and belongs to user
    const existingCase = await database.get(
      'SELECT * FROM cases WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!existingCase) {
      return res.status(404).json({
        error: 'Case not found',
        message: 'Case not found or you do not have permission to update it'
      });
    }

    const updates = [];
    const values = [];

    // Build dynamic update query
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates.push(`${dbField} = ?`);
        values.push(req.body[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'At least one field must be provided for update'
      });
    }

    updates.push('updated_at = datetime("now")');
    values.push(req.params.id);

    await database.run(
      `UPDATE cases SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated case
    const updatedCase = await database.get(
      'SELECT * FROM cases WHERE id = ?',
      [req.params.id]
    );

    res.json({
      message: 'Case updated successfully',
      case: updatedCase
    });

  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({
      error: 'Failed to update case',
      message: 'An error occurred while updating the case'
    });
  }
});

// Delete a case
router.delete('/:id', async (req, res) => {
  try {
    // Check if case exists and belongs to user
    const existingCase = await database.get(
      'SELECT * FROM cases WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!existingCase) {
      return res.status(404).json({
        error: 'Case not found',
        message: 'Case not found or you do not have permission to delete it'
      });
    }

    // Delete case (cascade will handle related records)
    await database.run(
      'DELETE FROM cases WHERE id = ?',
      [req.params.id]
    );

    res.json({
      message: 'Case deleted successfully'
    });

  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({
      error: 'Failed to delete case',
      message: 'An error occurred while deleting the case'
    });
  }
});

// Add a note to a case
router.post('/:id/notes', [
  body('note').trim().isLength({ min: 1 }).withMessage('Note content is required'),
  body('noteType').optional().isIn(['general', 'phone_call', 'meeting', 'court', 'research'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if case exists and belongs to user
    const existingCase = await database.get(
      'SELECT * FROM cases WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!existingCase) {
      return res.status(404).json({
        error: 'Case not found',
        message: 'Case not found or you do not have permission to add notes'
      });
    }

    const { note, noteType = 'general' } = req.body;

    const result = await database.run(
      'INSERT INTO case_notes (case_id, user_id, note, note_type) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id, note, noteType]
    );

    const newNote = await database.get(
      'SELECT * FROM case_notes WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      message: 'Note added successfully',
      note: newNote
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      error: 'Failed to add note',
      message: 'An error occurred while adding the note'
    });
  }
});

// Add a deadline to a case
router.post('/:id/deadlines', [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if case exists and belongs to user
    const existingCase = await database.get(
      'SELECT * FROM cases WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!existingCase) {
      return res.status(404).json({
        error: 'Case not found',
        message: 'Case not found or you do not have permission to add deadlines'
      });
    }

    const { title, dueDate, description, priority = 'medium' } = req.body;

    const result = await database.run(
      'INSERT INTO deadlines (case_id, user_id, title, description, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, req.user.id, title, description || null, dueDate, priority]
    );

    const newDeadline = await database.get(
      'SELECT * FROM deadlines WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      message: 'Deadline added successfully',
      deadline: newDeadline
    });

  } catch (error) {
    console.error('Add deadline error:', error);
    res.status(500).json({
      error: 'Failed to add deadline',
      message: 'An error occurred while adding the deadline'
    });
  }
});

// Get case statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await database.get(`
      SELECT 
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_cases,
        COUNT(CASE WHEN status = 'settled' THEN 1 END) as settled_cases,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_cases,
        COALESCE(SUM(settlement_amount), 0) as total_settlements,
        COALESCE(AVG(settlement_amount), 0) as avg_settlement
      FROM cases 
      WHERE user_id = ?
    `, [req.user.id]);

    const recentCases = await database.all(`
      SELECT id, case_number, title, client_name, status, created_at
      FROM cases 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [req.user.id]);

    const upcomingDeadlines = await database.all(`
      SELECT d.*, c.case_number, c.title as case_title
      FROM deadlines d
      JOIN cases c ON d.case_id = c.id
      WHERE d.user_id = ? AND d.status = 'pending' AND d.due_date > datetime('now')
      ORDER BY d.due_date ASC
      LIMIT 5
    `, [req.user.id]);

    res.json({
      stats,
      recentCases,
      upcomingDeadlines
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: 'An error occurred while fetching case statistics'
    });
  }
});

module.exports = router;