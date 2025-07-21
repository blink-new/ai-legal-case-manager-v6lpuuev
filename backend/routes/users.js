const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { database } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // Get case statistics
    const caseStats = await database.get(`
      SELECT 
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_cases,
        COUNT(CASE WHEN status = 'settled' THEN 1 END) as settled_cases,
        COALESCE(SUM(settlement_amount), 0) as total_settlements
      FROM cases 
      WHERE user_id = ?
    `, [req.user.id]);

    // Get recent cases
    const recentCases = await database.all(`
      SELECT id, case_number, title, client_name, status, priority, created_at
      FROM cases 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [req.user.id]);

    // Get upcoming deadlines
    const upcomingDeadlines = await database.all(`
      SELECT d.*, c.case_number, c.title as case_title
      FROM deadlines d
      JOIN cases c ON d.case_id = c.id
      WHERE d.user_id = ? AND d.status = 'pending' AND d.due_date > datetime('now')
      ORDER BY d.due_date ASC
      LIMIT 5
    `, [req.user.id]);

    // Get document statistics
    const documentStats = await database.get(`
      SELECT 
        COUNT(*) as total_documents,
        COALESCE(SUM(file_size), 0) as total_storage_used
      FROM documents d
      JOIN cases c ON d.case_id = c.id
      WHERE c.user_id = ?
    `, [req.user.id]);

    // Get recent activity (notes and documents)
    const recentActivity = await database.all(`
      SELECT 
        'note' as type,
        cn.id,
        cn.note as content,
        cn.created_at,
        c.case_number,
        c.title as case_title
      FROM case_notes cn
      JOIN cases c ON cn.case_id = c.id
      WHERE cn.user_id = ?
      
      UNION ALL
      
      SELECT 
        'document' as type,
        d.id,
        d.original_name as content,
        d.uploaded_at as created_at,
        c.case_number,
        c.title as case_title
      FROM documents d
      JOIN cases c ON d.case_id = c.id
      WHERE d.user_id = ?
      
      ORDER BY created_at DESC
      LIMIT 10
    `, [req.user.id, req.user.id]);

    res.json({
      caseStats,
      recentCases,
      upcomingDeadlines,
      documentStats,
      recentActivity
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: 'An error occurred while fetching dashboard data'
    });
  }
});

// Get user activity log
router.get('/activity', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['note', 'document', 'case', 'deadline'])
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
    const { type } = req.query;

    let activities = [];

    if (!type || type === 'note') {
      const notes = await database.all(`
        SELECT 
          'note' as type,
          cn.id,
          cn.note as content,
          cn.note_type as subtype,
          cn.created_at,
          c.case_number,
          c.title as case_title,
          c.id as case_id
        FROM case_notes cn
        JOIN cases c ON cn.case_id = c.id
        WHERE cn.user_id = ?
        ORDER BY cn.created_at DESC
        LIMIT ? OFFSET ?
      `, [req.user.id, limit, offset]);
      activities = activities.concat(notes);
    }

    if (!type || type === 'document') {
      const documents = await database.all(`
        SELECT 
          'document' as type,
          d.id,
          d.original_name as content,
          d.document_type as subtype,
          d.uploaded_at as created_at,
          c.case_number,
          c.title as case_title,
          c.id as case_id
        FROM documents d
        JOIN cases c ON d.case_id = c.id
        WHERE d.user_id = ?
        ORDER BY d.uploaded_at DESC
        LIMIT ? OFFSET ?
      `, [req.user.id, limit, offset]);
      activities = activities.concat(documents);
    }

    if (!type || type === 'case') {
      const cases = await database.all(`
        SELECT 
          'case' as type,
          id,
          title as content,
          case_type as subtype,
          created_at,
          case_number,
          title as case_title,
          id as case_id
        FROM cases
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [req.user.id, limit, offset]);
      activities = activities.concat(cases);
    }

    if (!type || type === 'deadline') {
      const deadlines = await database.all(`
        SELECT 
          'deadline' as type,
          d.id,
          d.title as content,
          d.priority as subtype,
          d.created_at,
          c.case_number,
          c.title as case_title,
          c.id as case_id
        FROM deadlines d
        JOIN cases c ON d.case_id = c.id
        WHERE d.user_id = ?
        ORDER BY d.created_at DESC
        LIMIT ? OFFSET ?
      `, [req.user.id, limit, offset]);
      activities = activities.concat(deadlines);
    }

    // Sort all activities by created_at
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Limit to requested amount
    activities = activities.slice(0, limit);

    res.json({
      activities,
      pagination: {
        page,
        limit,
        hasMore: activities.length === limit
      }
    });

  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      error: 'Failed to fetch activity',
      message: 'An error occurred while fetching user activity'
    });
  }
});

// Get user preferences
router.get('/preferences', async (req, res) => {
  try {
    // For now, return default preferences
    // In a real app, you might have a preferences table
    const preferences = {
      theme: 'light',
      notifications: {
        email: true,
        deadlines: true,
        caseUpdates: true
      },
      dashboard: {
        showRecentCases: true,
        showUpcomingDeadlines: true,
        showRecentActivity: true
      },
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    };

    res.json({
      preferences
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      error: 'Failed to fetch preferences',
      message: 'An error occurred while fetching user preferences'
    });
  }
});

// Update user preferences
router.put('/preferences', [
  body('theme').optional().isIn(['light', 'dark']),
  body('notifications').optional().isObject(),
  body('dashboard').optional().isObject(),
  body('dateFormat').optional().isIn(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  body('timeFormat').optional().isIn(['12h', '24h'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // For now, just return the updated preferences
    // In a real app, you would save these to a preferences table
    const updatedPreferences = req.body;

    res.json({
      message: 'Preferences updated successfully',
      preferences: updatedPreferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      error: 'Update failed',
      message: 'An error occurred while updating preferences'
    });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await database.get(`
      SELECT 
        COUNT(DISTINCT c.id) as total_cases,
        COUNT(DISTINCT CASE WHEN c.status = 'open' THEN c.id END) as open_cases,
        COUNT(DISTINCT CASE WHEN c.status = 'settled' THEN c.id END) as settled_cases,
        COUNT(DISTINCT CASE WHEN c.status = 'closed' THEN c.id END) as closed_cases,
        COUNT(DISTINCT d.id) as total_documents,
        COUNT(DISTINCT cn.id) as total_notes,
        COUNT(DISTINCT dl.id) as total_deadlines,
        COALESCE(SUM(c.settlement_amount), 0) as total_settlements,
        COALESCE(AVG(c.settlement_amount), 0) as avg_settlement,
        COALESCE(SUM(d.file_size), 0) as total_storage_used
      FROM users u
      LEFT JOIN cases c ON u.id = c.user_id
      LEFT JOIN documents d ON c.id = d.case_id
      LEFT JOIN case_notes cn ON c.id = cn.case_id
      LEFT JOIN deadlines dl ON c.id = dl.case_id
      WHERE u.id = ?
    `, [req.user.id]);

    // Get monthly case creation stats for the last 12 months
    const monthlyCases = await database.all(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM cases
      WHERE user_id = ? AND created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `, [req.user.id]);

    // Get case type distribution
    const caseTypes = await database.all(`
      SELECT 
        case_type,
        COUNT(*) as count
      FROM cases
      WHERE user_id = ?
      GROUP BY case_type
      ORDER BY count DESC
    `, [req.user.id]);

    // Get settlement trends
    const settlementTrends = await database.all(`
      SELECT 
        strftime('%Y-%m', updated_at) as month,
        COUNT(*) as settled_count,
        COALESCE(SUM(settlement_amount), 0) as total_amount
      FROM cases
      WHERE user_id = ? AND status = 'settled' AND updated_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', updated_at)
      ORDER BY month
    `, [req.user.id]);

    res.json({
      overview: stats,
      monthlyCases,
      caseTypes,
      settlementTrends
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: 'An error occurred while fetching user statistics'
    });
  }
});

// Admin only: Get all users (for admin dashboard)
router.get('/admin/all', requireRole(['admin']), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
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
    const { search } = req.query;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR firm_name LIKE ?';
      const searchTerm = `%${search}%`;
      params = [searchTerm, searchTerm, searchTerm, searchTerm];
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await database.get(countQuery, params);
    const total = countResult.total;

    // Get users
    const usersQuery = `
      SELECT id, email, first_name, last_name, role, firm_name, phone, 
             created_at, last_login, is_active
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const users = await database.all(usersQuery, [...params, limit, offset]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: 'An error occurred while fetching users'
    });
  }
});

module.exports = router;