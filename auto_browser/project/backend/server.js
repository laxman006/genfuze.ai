require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Database = require('./database');
const AuthService = require('./auth');
const LocalAuthService = require('./localAuth');
const JSONStorage = require('./jsonStorage');
const MemoryStorage = require('./memoryStorage');
const EmailService = require('./emailService');
const { LLMService, getGeminiEmbedding } = require('./llmService');
// const FanoutQueryDensity = require('./fanoutQueryDensity');
// const GEOFanoutDensity = require('./geoFanoutDensity');
const {
  getPerplexityAnswer,
  getPerplexityAnswers,
  getPerplexityAnswersSelenium,
  getChatGPTAnswers,
  getChatGPTAnswersSelenium,
  getGeminiAnswers,
  getGeminiAnswersSelenium,
  getClaudeAnswers,
  getClaudeAnswersSelenium,
  getChatGPTAnswersRobust,
} = require('./browserAutomation');
const { compareAnswers } = require('./platformAutomation');
const axios = require('axios');
const fetch = require('node-fetch');
const unfluff = require('unfluff');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize services
const db = new Database();
const authService = new AuthService();
const localAuthService = new LocalAuthService();
const emailService = new EmailService();
const llmService = new LLMService();

// Check authentication type
const AUTH_TYPE = process.env.AUTH_TYPE || 'azure';
const ENABLE_LOCAL_AUTH = process.env.ENABLE_LOCAL_AUTH === 'true';

console.log('ENABLE_LOCAL_AUTH:', process.env.ENABLE_LOCAL_AUTH);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    let user;
    if (AUTH_TYPE === 'local') {
      user = localAuthService.extractUserFromToken(token);
    } else {
      user = authService.extractUserFromToken(token);
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Initialize database connection
db.connect().catch(console.error);

// Create default admin user if local auth is enabled
if (ENABLE_LOCAL_AUTH) {
  db.connect().then(() => {
    localAuthService.createDefaultAdmin(db);
  }).catch(console.error);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    auth: AUTH_TYPE,
    localAuthEnabled: ENABLE_LOCAL_AUTH
  });
});

// Local Authentication Routes
if (ENABLE_LOCAL_AUTH) {
  // Register new user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, displayName } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ 
          error: 'Missing required fields: email, password, name' 
        });
      }

      // Validate email
      if (!localAuthService.validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Validate password
      if (!localAuthService.validatePassword(password)) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
        });
      }

      // Check if user already exists
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await localAuthService.hashPassword(password);
      
      // Create user
      const userData = {
        id: uuidv4(),
        email,
        name,
        displayName: displayName || name,
        password: hashedPassword,
        roles: ['user'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await db.createUser(userData);
      
      // Generate tokens
      const accessToken = localAuthService.generateJWT(userData);
      const refreshToken = localAuthService.generateRefreshToken(userData);
      
      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Save session
      await db.saveUserSession(userData.id, refreshToken, expiresAt.toISOString());
      
      // Remove password from response
      const { password: _, ...userResponse } = userData;
      
      res.json({
        success: true,
        user: userResponse,
        accessToken,
        refreshToken,
        expiresAt: expiresAt.toISOString()
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed',
        details: error.message 
      });
    }
  });

  // Local login
  app.post('/api/auth/local-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Missing required fields: email, password' 
        });
      }

      // Get user by email
      const user = await db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      // Verify password
      const isValidPassword = await localAuthService.comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      await db.updateUserLastLogin(user.id);
      
      // Generate tokens
      const accessToken = localAuthService.generateJWT(user);
      const refreshToken = localAuthService.generateRefreshToken(user);
      
      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Save session
      await db.saveUserSession(user.id, refreshToken, expiresAt.toISOString());
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      
      res.json({
        success: true,
        user: userResponse,
        accessToken,
        refreshToken,
        expiresAt: expiresAt.toISOString()
      });
      
    } catch (error) {
      console.error('Local login error:', error);
      res.status(401).json({ 
        error: 'Authentication failed',
        details: error.message 
      });
    }
  });
}

// Azure Authentication routes (existing)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { msalToken, clientId, tenantId } = req.body;
    
    if (!msalToken || !clientId || !tenantId) {
      return res.status(400).json({ 
        error: 'Missing required fields: msalToken, clientId, tenantId' 
      });
    }

    // Validate the Microsoft Entra ID token
    const validatedToken = await authService.validateAzureToken(msalToken);
    
    // Get user info from Microsoft Graph API
    const userInfo = await authService.getUserInfo(msalToken);
    
    // Create or update user in our database
    const userData = {
      id: userInfo.id,
      email: userInfo.mail || userInfo.userPrincipalName,
      name: userInfo.givenName + ' ' + userInfo.surname,
      displayName: userInfo.displayName,
      tenantId: validatedToken.tid || tenantId,
      roles: ['user'] // Default role, can be enhanced with role mapping
    };
    
    await db.createOrUpdateUser(userData);
    
    // Generate our application tokens
    const accessToken = authService.generateJWT(userData);
    const refreshToken = authService.generateRefreshToken(userData);
    
    // Calculate expiration time (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Save refresh token to database
    await db.saveUserSession(userData.id, refreshToken, expiresAt.toISOString());
    
    res.json({
      success: true,
      user: userData,
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString()
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = authService.verifyRefreshToken(refreshToken);
    
    // Get user session from database
    const userSession = await db.getUserSessionByRefreshToken(refreshToken);
    
    if (!userSession) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Get user data
    const user = await db.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Generate new tokens
    const newAccessToken = authService.generateJWT(user);
    const newRefreshToken = authService.generateRefreshToken(user);
    
    // Calculate new expiration time
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Delete old session and save new one
    await db.deleteUserSession(refreshToken);
    await db.saveUserSession(user.id, newRefreshToken, expiresAt.toISOString());
    
    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: expiresAt.toISOString()
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ 
      error: 'Token refresh failed',
      details: error.message 
    });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return success
    res.json({ success: true, message: 'Logged out successfully' });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      details: error.message 
    });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      displayName: user.display_name,
      tenantId: user.tenant_id,
      roles: user.roles,
      isActive: user.is_active,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Failed to get user information',
      details: error.message 
    });
  }
});

// Protected session routes
app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const sessionData = req.body;
    
    // Validate required fields
    if (!sessionData.id || !sessionData.name || !sessionData.type) {
      return res.status(400).json({ 
        error: 'Missing required fields: id, name, type' 
      });
    }

    // Add user ID to session data
    sessionData.userId = req.user.id;

    // Generate embeddings for Q&A pairs if they exist
    if (sessionData.qaData && Array.isArray(sessionData.qaData) && sessionData.qaData.length > 0) {
      console.log(`[Embeddings] Generating embeddings for ${sessionData.qaData.length} Q&A pairs`);
      
      for (let i = 0; i < sessionData.qaData.length; i++) {
        const qa = sessionData.qaData[i];
        
        try {
          // Generate question embedding
          if (qa.question) {
            console.log(`[Embeddings] Generating question embedding for: ${qa.question.substring(0, 50)}...`);
            qa.questionEmbedding = await getGeminiEmbedding(qa.question);
          }
          
          // Generate answer embedding
          if (qa.answer) {
            console.log(`[Embeddings] Generating answer embedding for: ${qa.answer.substring(0, 50)}...`);
            qa.embedding = await getGeminiEmbedding(qa.answer);
          }
        } catch (error) {
          console.error(`[Embeddings] Failed to generate embedding for Q&A pair ${i}:`, error);
          // Continue with other Q&A pairs even if one fails
        }
      }
      
      console.log(`[Embeddings] Completed embedding generation for session`);
    }

    // Save to database
    const savedId = await db.saveSession(sessionData);
    
    res.status(201).json({ 
      success: true, 
      sessionId: savedId,
      message: 'Session saved successfully' 
    });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ 
      error: 'Failed to save session',
      details: error.message 
    });
  }
});

app.get('/api/sessions/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { 
      fromDate, 
      toDate, 
      llmProvider, 
      llmModel, 
      blogLink,
      search 
    } = req.query;
    
    if (!['question', 'answer'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid session type. Must be "question" or "answer"' 
      });
    }

    // Build filter object
    const filters = {
      fromDate: fromDate || null,
      toDate: toDate || null,
      llmProvider: llmProvider || null,
      llmModel: llmModel || null,
      blogLink: blogLink || null,
      search: search || null
    };

    const sessions = await db.getSessionsByTypeWithFilters(type, req.user.id, filters);
    
    res.json({ 
      success: true, 
      sessions,
      filters,
      totalCount: sessions.length
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sessions',
      details: error.message 
    });
  }
});

app.get('/api/sessions/:type/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await db.getSessionById(id, req.user.id);
    
    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    res.json({ 
      success: true, 
      session 
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ 
      error: 'Failed to fetch session',
      details: error.message 
    });
  }
});

app.delete('/api/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await db.deleteSession(id, req.user.id);
    
    if (!deleted) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Session deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ 
      error: 'Failed to delete session',
      details: error.message 
    });
  }
});

// Get session statistics
app.get('/api/stats/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['question', 'answer'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid session type. Must be "question" or "answer"' 
      });
    }

    const count = await db.getSessionCount(type, req.user.id);
    const sessions = await db.getSessionsByType(type, req.user.id);
    
    // Calculate additional statistics
    const totalCost = sessions.reduce((sum, session) => {
      return sum + parseFloat(session.statistics.totalCost || 0);
    }, 0);

    const totalQuestions = sessions.reduce((sum, session) => {
      return sum + (session.statistics.totalQuestions || 0);
    }, 0);

    res.json({ 
      success: true, 
      stats: {
        totalSessions: count,
        totalCost: totalCost.toFixed(8),
        totalQuestions,
        averageQuestionsPerSession: count > 0 ? (totalQuestions / count).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      details: error.message 
    });
  }
});

// Migrate localStorage data to backend
app.post('/api/migrate', authenticateToken, async (req, res) => {
  try {
    const { sessions } = req.body;
    
    if (!sessions || !Array.isArray(sessions)) {
      return res.status(400).json({ 
        error: 'Invalid sessions data' 
      });
    }

    // Add user ID to all sessions
    const sessionsWithUserId = Object.values(sessions).map(session => ({
      ...session,
      userId: req.user.id
    }));

    const result = await db.bulkSaveSessions(sessionsWithUserId);
    
    res.json({
      success: result.success,
      summary: result.summary,
      results: result.results
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Migration failed',
      details: error.message 
    });
  }
});

// Bulk save sessions endpoint
app.post('/api/sessions/bulk', authenticateToken, async (req, res) => {
  try {
    const { sessions } = req.body;
    
    if (!sessions || !Array.isArray(sessions)) {
      return res.status(400).json({ 
        error: 'Invalid sessions data' 
      });
    }

    // Add user ID to all sessions
    const sessionsWithUserId = sessions.map(session => ({
      ...session,
      userId: req.user.id
    }));

    const result = await db.bulkSaveSessions(sessionsWithUserId);
    
    res.json({
      success: result.success,
      summary: result.summary,
      results: result.results
    });
  } catch (error) {
    console.error('Bulk save error:', error);
    res.status(500).json({ 
      error: 'Bulk save failed',
      details: error.message 
    });
  }
});

// Export sessions to CSV
app.get('/api/export/:type/csv', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['question', 'answer'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid session type. Must be "question" or "answer"' 
      });
    }

    const sessions = await db.getSessionsByType(type, req.user.id);
    
    if (sessions.length === 0) {
      return res.status(404).json({ 
        error: 'No sessions found to export' 
      });
    }

    const csvContent = generateCSV(sessions);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-sessions-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Export failed',
      details: error.message 
    });
  }
});

// Helper function to generate CSV
function generateCSV(sessions) {
  const headers = [
    'Session ID', 'Name', 'Type', 'Timestamp', 'Model', 'Question Provider', 'Question Model', 
    'Answer Provider', 'Answer Model', 'Blog URL', 'Source URLs', 'Crawl Mode', 'Crawled Pages Count',
    'Total Questions', 'Total Cost', 'Question', 'Answer', 'Accuracy', 'Sentiment',
    'Input Tokens', 'Output Tokens', 'Cost'
  ];

  const rows = [headers.join(',')];

  sessions.forEach(session => {
    session.qaData.forEach(qa => {
      const row = [
        `"${session.id}"`,
        `"${session.name}"`,
        `"${session.type}"`,
        `"${session.timestamp}"`,
        `"${session.model}"`,
        `"${session.questionProvider || ''}"`,
        `"${session.questionModel || ''}"`,
        `"${session.answerProvider || ''}"`,
        `"${session.answerModel || ''}"`,
        `"${session.blogUrl || ''}"`,
        `"${session.sourceUrls ? session.sourceUrls.join('; ') : ''}"`,
        `"${session.crawlMode || ''}"`,
        session.crawledPages ? session.crawledPages.length : 0,
        session.statistics.totalQuestions,
        session.statistics.totalCost,
        `"${qa.question.replace(/"/g, '""')}"`,
        `"${(qa.answer || '').replace(/"/g, '""')}"`,
        qa.accuracy || '',
        `"${qa.sentiment || ''}"`,
        qa.inputTokens || 0,
        qa.outputTokens || 0,
        qa.cost || 0
      ];
      rows.push(row.join(','));
    });
  });

  return rows.join('\n');
}

// Email API endpoints
app.post('/api/email/test', authenticateToken, async (req, res) => {
  try {
    const result = await emailService.testEmailConfiguration();
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error.message 
    });
  }
});

app.post('/api/email/crawl-completion', authenticateToken, async (req, res) => {
  try {
    const { crawlData } = req.body;
    const userEmail = req.user.email;
    
    if (!crawlData) {
      return res.status(400).json({ 
        error: 'Missing crawl data' 
      });
    }

    const result = await emailService.sendCrawlCompletionEmail(userEmail, crawlData);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Crawl completion email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Crawl completion email error:', error);
    res.status(500).json({ 
      error: 'Failed to send crawl completion email',
      details: error.message 
    });
  }
});

app.post('/api/email/crawl-error', authenticateToken, async (req, res) => {
  try {
    const { errorData } = req.body;
    const userEmail = req.user.email;
    
    if (!errorData) {
      return res.status(400).json({ 
        error: 'Missing error data' 
      });
    }

    const result = await emailService.sendErrorEmail(userEmail, errorData);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Error email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Error email error:', error);
    res.status(500).json({ 
      error: 'Failed to send error email',
      details: error.message 
    });
  }
});

// LLM API endpoints
app.get('/api/llm/providers', async (req, res) => {
  try {
    const configuredProviders = llmService.getConfiguredProviders();
    const availableModels = llmService.getAvailableModels();
    
    res.json({
      success: true,
      configuredProviders,
      availableModels
    });
  } catch (error) {
    console.error('LLM providers error:', error);
    res.status(500).json({ 
      error: 'Failed to get LLM providers',
      details: error.message 
    });
  }
});

app.post('/api/llm/generate-questions', authenticateToken, async (req, res) => {
  try {
    const { content, questionCount, provider, model } = req.body;
    
    if (!content || !questionCount || !provider || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, questionCount, provider, model' 
      });
    }

    if (!llmService.isProviderConfigured(provider)) {
      return res.status(400).json({ 
        error: `Provider ${provider} is not configured` 
      });
    }

    const prompt = `Generate exactly ${questionCount} questions based on the following blog content. Each question must be extremely relevant to the content—so relevant that it would receive a relevance score of 95 or higher out of 100, where 100 means the question is directly about the main topics, facts, or ideas in the blog content. Only generate questions that are clearly and strongly related to the blog content. Avoid questions that are only loosely related or require outside knowledge. Blog Content: ${content} List the ${questionCount} questions, each on a new line starting with "Q:".`;

    const result = await llmService.callLLM(prompt, provider, model, true);
    
    // Parse questions from the result
    const questions = result.text.split('\n')
      .filter(line => line.trim().startsWith('Q:'))
      .map(line => line.replace(/^Q:\s*/, '').trim())
      .filter(q => q.length > 0)
      .slice(0, questionCount);

    res.json({
      success: true,
      questions,
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens
    });
    
  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate questions',
      details: error.message 
    });
  }
});

app.post('/api/llm/calculate-confidence', authenticateToken, async (req, res) => {
  try {
    const { question, content, provider, model } = req.body;
    
    if (!question || !content || !provider || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: question, content, provider, model' 
      });
    }

    const result = await llmService.calculateConfidence(question, content, provider, model);
    
    res.json({
      success: true,
      confidence: result.confidence,
      reasoning: result.reasoning,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      provider: result.provider,
      model: result.model
    });
    
  } catch (error) {
    console.error('Confidence calculation error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate confidence',
      details: error.message 
    });
  }
});

app.post('/api/llm/generate-answers', authenticateToken, async (req, res) => {
  try {
    const { content, questions, provider, model } = req.body;
    
    if (!content || !questions || !Array.isArray(questions) || !provider || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, questions (array), provider, model' 
      });
    }

    if (!llmService.isProviderConfigured(provider)) {
      return res.status(400).json({ 
        error: `Provider ${provider} is not configured` 
      });
    }

    const answers = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const question of questions) {
      const answerPrompt = `Based on the following content, provide a comprehensive and accurate answer to the question.

Content:
${content}

Question: ${question}

Answer:`;

      const result = await llmService.callLLM(answerPrompt, provider, model, false);
      
      answers.push({
        question,
        answer: result.text.trim(),
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        provider: result.provider,
        model: result.model
      });

      totalInputTokens += result.inputTokens;
      totalOutputTokens += result.outputTokens;

      // Track GEO Fanout Density for each question
      // try {
      //   const geoFanoutAnalyzer = new GEOFanoutDensity();
      //   const fanoutAnalysis = await geoFanoutAnalyzer.trackFanoutQueries(
      //     req.user.id, question, content, provider, model
      //   );
        
      //   if (fanoutAnalysis.success) {
      //     console.log(`[GEO Fanout] Tracked fanout density for question: ${question.substring(0, 50)}...`);
      //     // Store fanout analysis with the answer for later reference
      //     answers[answers.length - 1].fanoutAnalysis = fanoutAnalysis;
      //   }
      // } catch (fanoutError) {
      //   console.error('[GEO Fanout] Failed to track fanout for question:', fanoutError);
      // }
    }

    res.json({
      success: true,
      answers,
      provider,
      model,
      totalInputTokens,
      totalOutputTokens
    });
    
  } catch (error) {
    console.error('Answer generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate answers',
      details: error.message 
    });
  }
});

// Compare two questions for similarity
app.post('/api/llm/compare-questions', authenticateToken, async (req, res) => {
  try {
    const { question1, question2, provider, model } = req.body;
    
    if (!question1 || !question2 || !provider || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: question1, question2, provider, model' 
      });
    }

    const result = await llmService.compareQuestions(question1, question2, provider, model);
    
    res.json({
      success: true,
      similarity: result.similarity,
      reasoning: result.reasoning,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      provider: result.provider,
      model: result.model
    });
    
  } catch (error) {
    console.error('Question comparison error:', error);
    res.status(500).json({ 
      error: 'Failed to compare questions',
      details: error.message 
    });
  }
});

// Cleanup expired sessions periodically
setInterval(async () => {
  try {
    const deletedCount = await db.deleteExpiredUserSessions();
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired user sessions`);
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}, 24 * 60 * 60 * 1000); // Run every 24 hours

// Check for relevant questions across different LLMs
app.post('/api/questions/check-relevance', authenticateToken, async (req, res) => {
  try {
    const { sourceUrls, blogUrl, questionText, currentProvider, currentModel } = req.body;
    
    if (!sourceUrls && !blogUrl) {
      return res.status(400).json({ 
        error: 'Source URLs or blog URL is required' 
      });
    }

    // Get all question sessions for the same source URLs or blog URL
    let query = `
      SELECT s.*, ss.total_questions, ss.avg_accuracy, ss.total_cost
      FROM sessions s
      LEFT JOIN session_statistics ss ON s.id = ss.session_id
      WHERE s.type = 'question' AND s.user_id = ?
    `;

    const params = [req.user.id];
    const conditions = [];

    // Filter by source URLs or blog URL
    if (sourceUrls && sourceUrls.length > 0) {
      conditions.push(`(
        s.source_urls LIKE ? OR 
        s.blog_url IN (${sourceUrls.map(() => '?').join(',')})
      )`);
      params.push(`%${sourceUrls[0]}%`); // Search for first URL in JSON
      sourceUrls.forEach(url => params.push(url));
    } else if (blogUrl) {
      conditions.push('s.blog_url = ?');
      params.push(blogUrl);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.timestamp DESC';

    const sessions = await new Promise((resolve, reject) => {
      db.db.all(query, params, async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const sessions = [];
          for (const row of rows) {
            const qaData = await db.getQADataBySessionId(row.id);
            sessions.push({
              id: row.id,
              name: row.name,
              type: row.type,
              timestamp: row.timestamp,
              model: row.model,
              questionProvider: row.question_provider,
              questionModel: row.question_model,
              answerProvider: row.answer_provider,
              answerModel: row.answer_model,
              blogContent: row.blog_content,
              blogUrl: row.blog_url,
              sourceUrls: row.source_urls ? JSON.parse(row.source_urls) : undefined,
              crawlMode: row.crawl_mode,
              crawledPages: row.crawled_pages ? JSON.parse(row.crawled_pages) : undefined,
              totalInputTokens: row.total_input_tokens,
              totalOutputTokens: row.total_output_tokens,
              qaData,
              statistics: {
                totalQuestions: row.total_questions,
                avgAccuracy: row.avg_accuracy,
                totalCost: row.total_cost
              }
            });
          }
          resolve(sessions);
        } catch (error) {
          reject(error);
        }
      });
    });

    // Filter out sessions from the same provider/model as current
    // const otherProviderSessions = sessions.filter(session => 
    //   session.questionProvider !== currentProvider || session.questionModel !== currentModel
    // );
    // Instead, include all sessions for the URL
    const otherProviderSessions = sessions;

    if (otherProviderSessions.length === 0) {
      return res.json({
        success: true,
        relevantQuestions: [],
        message: 'No questions found from other LLM providers for this content'
      });
    }

    // Debug: Log number of sessions found
    console.log(`[DEBUG] Found ${sessions.length} sessions for relevant question check.`);

    // Use Gemini 1.5 Flash for all relevance checks
    const relevantQuestions = [];
    let totalQuestionsChecked = 0;
    
    for (const session of otherProviderSessions) {
      for (const qa of session.qaData) {
        totalQuestionsChecked++;
        try {
          // Use Gemini 1.5 Flash for all relevance checks
          const relevanceResult = await llmService.checkQuestionRelevance(
            questionText,
            qa.question,
            "gemini",
            "gemini-1.5-flash"
          );
          // Debug: Log each relevance result
          console.log(`[DEBUG] Checked relevance: [Current] "${questionText}" vs [Session] "${qa.question}" => Score: ${relevanceResult.relevanceScore}, Reason: ${relevanceResult.reasoning}`);

          if (relevanceResult.relevanceScore >= 0.7) { // 70% threshold for relevance
            // Determine similarity group based on relevance score
            let similarityGroup = 'other';
            if (relevanceResult.relevanceScore >= 0.9) {
              similarityGroup = 'highly-similar';
            } else if (relevanceResult.relevanceScore >= 0.8) {
              similarityGroup = 'very-similar';
            } else if (relevanceResult.relevanceScore >= 0.7) {
              similarityGroup = 'similar';
            } else if (relevanceResult.relevanceScore >= 0.6) {
              similarityGroup = 'related';
            }

            relevantQuestions.push({
              question: qa.question,
              originalProvider: session.questionProvider,
              originalModel: session.questionModel,
              sessionName: session.name,
              sessionTimestamp: session.timestamp,
              relevanceScore: relevanceResult.relevanceScore,
              relevanceReasoning: relevanceResult.reasoning,
              sourceUrls: session.sourceUrls,
              blogUrl: session.blogUrl,
              similarityGroup: similarityGroup
            });
          }
        } catch (error) {
          console.error('Error checking question relevance:', error);
          // Continue with other questions even if one fails
        }
      }
    }
    // Debug: Log total questions checked and relevant questions found
    console.log(`[DEBUG] Total questions checked: ${totalQuestionsChecked}`);
    console.log(`[DEBUG] Relevant questions found: ${relevantQuestions.length}`);

    // Sort by relevance score (highest first)
    relevantQuestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json({
      success: true,
      relevantQuestions,
      totalChecked: otherProviderSessions.reduce((sum, s) => sum + s.qaData.length, 0),
      message: `Found ${relevantQuestions.length} relevant questions from other LLM providers`
    });

  } catch (error) {
    console.error('Error checking question relevance:', error);
    res.status(500).json({ 
      error: 'Failed to check question relevance',
      details: error.message 
    });
  }
});

app.post('/api/ask', async (req, res) => {
  const { provider, question } = req.body;
  if (provider === 'perplexity') {
    try {
      const answer = await getPerplexityAnswer(question);
      res.json({ answer });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(400).json({ error: 'Unsupported provider' });
  }
});

app.post('/api/llm/generate-answers-web', authenticateToken, async (req, res) => {
  console.log('Received request for /api/llm/generate-answers-web', req.body);
  const { questions, answerProvider, model, blogContent, blogUrl, sourceUrls } = req.body;
  try {
    let answers;
    let sessionId = null;
    let automationUsed = 'playwright';
    if (answerProvider === 'perplexity') {
      try {
        answers = await getPerplexityAnswers(questions);
      } catch (err) {
        console.warn('Playwright failed for Perplexity, falling back to Selenium:', err.message);
        answers = await getPerplexityAnswersSelenium(questions);
        automationUsed = 'selenium';
      }
      // Save session to history
      const sessionData = {
        id: uuidv4(),
        name: 'Perplexity Session - ' + new Date().toLocaleString(),
        type: 'answer',
        answerProvider: 'perplexity',
        answerModel: 'perplexity-web',
        timestamp: new Date().toISOString(),
        userId: req.user.id,
        blogContent: blogContent || '',
        blogUrl: blogUrl || '',
        sourceUrls: sourceUrls || [],
        qaData: answers.map((a, i) => ({
          question: a.question,
          answer: a.answer,
          questionOrder: i + 1,
        })),
      };
      sessionId = await db.saveSession(sessionData);
    } else if (answerProvider === 'chatgpt' || answerProvider === 'openai') {
      // Accept both 'chatgpt' and 'openai' for ChatGPT web automation
      answers = (await getChatGPTAnswersRobust(questions)).map(a => ({
        question: a.question,
        answer: a.answer,
        inputTokens: 0,
        outputTokens: 0,
        provider: answerProvider,
        model: model
      }));
      automationUsed = 'selenium';
    } else if (answerProvider === 'gemini') {
      try {
        answers = await getGeminiAnswers(questions);
      } catch (err) {
        console.warn('Playwright failed for Gemini, falling back to Selenium:', err.message);
        answers = await getGeminiAnswersSelenium(questions);
        automationUsed = 'selenium';
      }
    } else if (answerProvider === 'claude') {
      try {
        answers = await getClaudeAnswers(questions);
      } catch (err) {
        console.warn('Playwright failed for Claude, falling back to Selenium:', err.message);
        answers = await getClaudeAnswersSelenium(questions);
        automationUsed = 'selenium';
      }
    } else {
      console.error('Unsupported provider:', answerProvider);
      return res.status(400).json({ error: 'Unsupported provider' });
    }
    res.json({ success: true, answers, provider: answerProvider, model, sessionId, automationUsed });
  } catch (error) {
    console.error('Web automation error:', error);
    res.status(500).json({ error: 'Failed to generate answers', details: error.message });
  }
});

/**
 * POST /api/compare-answers
 * Request body: { questions: ["question1", "question2", ...] }
 * Response: { success: true, results: [...] }
 * Runs Playwright automation for Perplexity, ChatGPT, Gemini, Claude and returns answers for each question.
 */
app.post('/api/compare-answers', authenticateToken, async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'questions must be a non-empty array' });
  }
  try {
    const results = await compareAnswers(questions);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Compare answers error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/automation/chatgpt', authenticateToken, async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'questions must be a non-empty array' });
  }
  try {
    const answers = await getChatGPTAnswersRobust(questions);
    res.json({ success: true, answers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vector embedding endpoints
app.post('/api/embeddings/generate', authenticateToken, async (req, res) => {
  try {
    const { text, type = 'answer' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Missing required field: text' });
    }

    console.log(`[Embeddings] Generating ${type} embedding for text length:`, text.length);
    
    let embedding;
    try {
      embedding = await getGeminiEmbedding(text);
      console.log(`[Embeddings] Successfully generated embedding with ${embedding.length} dimensions`);
    } catch (error) {
      console.error('[Embeddings] Failed to generate embedding:', error);
      return res.status(500).json({ error: 'Failed to generate embedding', details: error.message });
    }

    res.json({ 
      success: true, 
      embedding,
      dimensions: embedding.length,
      type
    });
  } catch (error) {
    console.error('[Embeddings] API error:', error);
    res.status(500).json({ error: 'Failed to generate embedding', details: error.message });
  }
});

app.post('/api/embeddings/search/questions', authenticateToken, async (req, res) => {
  try {
    const { question, limit = 10, threshold = 0.7 } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Missing required field: question' });
    }

    console.log('[Embeddings] Searching for similar questions:', question.substring(0, 100) + '...');
    
    // Generate embedding for the search question
    let questionEmbedding;
    try {
      questionEmbedding = await getGeminiEmbedding(question);
    } catch (error) {
      console.error('[Embeddings] Failed to generate question embedding:', error);
      return res.status(500).json({ error: 'Failed to generate question embedding', details: error.message });
    }

    // Find similar questions
    const similarQuestions = await db.findSimilarQuestions(questionEmbedding, req.user.id, limit, threshold);
    
    console.log(`[Embeddings] Found ${similarQuestions.length} similar questions`);
    
    res.json({
      success: true,
      similarQuestions,
      searchQuestion: question,
      totalFound: similarQuestions.length
    });
  } catch (error) {
    console.error('[Embeddings] Search error:', error);
    res.status(500).json({ error: 'Failed to search similar questions', details: error.message });
  }
});

app.post('/api/embeddings/search/answers', authenticateToken, async (req, res) => {
  try {
    const { answer, limit = 10, threshold = 0.7 } = req.body;
    
    if (!answer) {
      return res.status(400).json({ error: 'Missing required field: answer' });
    }

    console.log('[Embeddings] Searching for similar answers:', answer.substring(0, 100) + '...');
    
    // Generate embedding for the search answer
    let answerEmbedding;
    try {
      answerEmbedding = await getGeminiEmbedding(answer);
    } catch (error) {
      console.error('[Embeddings] Failed to generate answer embedding:', error);
      return res.status(500).json({ error: 'Failed to generate answer embedding', details: error.message });
    }

    // Find similar answers
    const similarAnswers = await db.findSimilarAnswers(answerEmbedding, req.user.id, limit, threshold);
    
    console.log(`[Embeddings] Found ${similarAnswers.length} similar answers`);
    
    res.json({
      success: true,
      similarAnswers,
      searchAnswer: answer,
      totalFound: similarAnswers.length
    });
  } catch (error) {
    console.error('[Embeddings] Search error:', error);
    res.status(500).json({ error: 'Failed to search similar answers', details: error.message });
  }
});

// Calculate vector similarities for Q&A pairs
app.post('/api/embeddings/calculate-similarities', authenticateToken, async (req, res) => {
  try {
    const { qaData, content } = req.body;
    
    if (!qaData || !Array.isArray(qaData) || qaData.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid qaData array' });
    }

    console.log(`[Embeddings] Calculating similarities for ${qaData.length} Q&A pairs`);
    
    const results = [];
    
    // Generate content embedding if provided
    let contentEmbedding = null;
    if (content) {
      try {
        contentEmbedding = await getGeminiEmbedding(content);
        console.log('[Embeddings] Generated content embedding');
      } catch (error) {
        console.error('[Embeddings] Failed to generate content embedding:', error);
      }
    }
    
    for (let i = 0; i < qaData.length; i++) {
      const qa = qaData[i];
      const result = {
        index: i,
        questionSimilarity: null,
        answerSimilarity: null,
        contentSimilarity: null,
        questionConfidence: null,
        answerConfidence: null,
        contentConfidence: null
      };
      
      try {
        // Calculate question similarity
        if (qa.question) {
          const questionEmbedding = await getGeminiEmbedding(qa.question);
          const similarQuestions = await db.findSimilarQuestions(questionEmbedding, req.user.id, 5, 0.5);
          
          if (similarQuestions.length > 0) {
            result.questionSimilarity = similarQuestions[0].similarity;
            result.questionConfidence = getConfidenceLevel(result.questionSimilarity);
          }
        }
        
        // Calculate answer similarity
        if (qa.answer) {
          const answerEmbedding = await getGeminiEmbedding(qa.answer);
          const similarAnswers = await db.findSimilarAnswers(answerEmbedding, req.user.id, 5, 0.5);
          
          if (similarAnswers.length > 0) {
            result.answerSimilarity = similarAnswers[0].similarity;
            result.answerConfidence = getConfidenceLevel(result.answerSimilarity);
          }
        }
        
        // Calculate content similarity
        if (contentEmbedding && qa.answer) {
          const answerEmbedding = await getGeminiEmbedding(qa.answer);
          result.contentSimilarity = cosineSimilarity(answerEmbedding, contentEmbedding);
          result.contentConfidence = getConfidenceLevel(result.contentSimilarity);
        }
        
        console.log(`[Embeddings] Calculated similarities for Q&A pair ${i + 1}`);
        
      } catch (error) {
        console.error(`[Embeddings] Error calculating similarities for Q&A pair ${i + 1}:`, error);
      }
      
      results.push(result);
    }
    
    console.log(`[Embeddings] Completed similarity calculations for ${results.length} Q&A pairs`);
    
    res.json({
      success: true,
      results,
      totalProcessed: results.length
    });
    
  } catch (error) {
    console.error('[Embeddings] Calculate similarities error:', error);
    res.status(500).json({ error: 'Failed to calculate similarities', details: error.message });
  }
});

// Helper function to get confidence level
function getConfidenceLevel(similarity) {
  if (similarity >= 0.9) return 'Very High';
  if (similarity >= 0.8) return 'High';
  if (similarity >= 0.7) return 'Good';
  if (similarity >= 0.6) return 'Moderate';
  if (similarity >= 0.5) return 'Low';
  return 'Very Low';
}

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Fanout Query Density Analysis Endpoint
app.post('/api/fanout-density/analyze', authenticateToken, async (req, res) => {
  try {
    const { clusterThreshold = 0.7 } = req.body;
    const userId = req.user.id;

    console.log(`[Fanout Density] Starting analysis for user ${userId}`);
    
    // const fanoutAnalyzer = new FanoutQueryDensity();
    // const analysis = await fanoutAnalyzer.calculateFanoutDensity(userId, clusterThreshold);
    
    // if (!analysis.success) {
    //   return res.status(400).json(analysis);
    // }

    // console.log(`[Fanout Density] Analysis completed successfully`);
    res.json({ success: true, message: 'Fanout density analysis is currently disabled.' });

  } catch (error) {
    console.error('[Fanout Density] API error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze fanout query density', 
      details: error.message 
    });
  }
});

// Generate Fanout Density Report
app.get('/api/fanout-density/report', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`[Fanout Density] Generating report for user ${userId}`);
    
    // const fanoutAnalyzer = new FanoutQueryDensity();
    // const report = await fanoutAnalyzer.generateReport(userId);
    
    // if (!report.success) {
    //   return res.status(400).json(report);
    // }

    // console.log(`[Fanout Density] Report generated successfully`);
    res.json({ success: true, message: 'Fanout density report generation is currently disabled.' });

  } catch (error) {
    console.error('[Fanout Density] Report generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate fanout density report', 
      details: error.message 
    });
  }
});

// GEO Fanout Density Analysis - Track sub-queries and content attribution
app.post('/api/geo-fanout/track', authenticateToken, async (req, res) => {
  try {
    const { mainQuestion, content, provider, model } = req.body;
    const userId = req.user.id;

    if (!mainQuestion || !content || !provider || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: mainQuestion, content, provider, model' 
      });
    }

    console.log(`[GEO Fanout] Starting analysis for user ${userId}`);
    
    // const geoFanoutAnalyzer = new GEOFanoutDensity();
    // const analysis = await geoFanoutAnalyzer.trackFanoutQueries(
    //   userId, mainQuestion, content, provider, model
    // );
    
    // if (!analysis.success) {
    //   return res.status(400).json(analysis);
    // }

    // console.log(`[GEO Fanout] Analysis completed successfully`);
    res.json({ success: true, message: 'GEO fanout density analysis is currently disabled.' });

  } catch (error) {
    console.error('[GEO Fanout] Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze GEO fanout density', 
      details: error.message 
    });
  }
});

// Get comprehensive GEO Fanout analysis
app.get('/api/geo-fanout/analysis', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.query;

    console.log(`[GEO Fanout] Getting analysis for user ${userId}`);
    
    // const geoFanoutAnalyzer = new GEOFanoutDensity();
    // const analysis = await geoFanoutAnalyzer.getGEOFanoutAnalysis(userId, sessionId);
    
    // if (!analysis.success) {
    //   return res.status(400).json(analysis);
    // }

    // console.log(`[GEO Fanout] Analysis retrieved successfully`);
    res.json({ success: true, message: 'GEO fanout analysis retrieval is currently disabled.' });

  } catch (error) {
    console.error('[GEO Fanout] Analysis retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve GEO fanout analysis', 
      details: error.message 
    });
  }
});

app.post('/api/citation-likelihood/calculate', authenticateToken, async (req, res) => {
  try {
    const { answer, content, provider, model } = req.body;
    if (!answer || !content || !provider || !model) {
      console.error('[Citation Likelihood] Missing required fields:', { answer: !!answer, content: !!content, provider, model });
      return res.status(400).json({ error: 'Missing required fields: answer, content, provider, model' });
    }
    
    console.log('[Citation Likelihood] Starting calculation with provider:', provider, 'model:', model);
    console.log('[Citation Likelihood] Answer length:', answer.length, 'Content length:', content.length);
    
    if (!llmService.isProviderConfigured(provider)) {
      console.error('[Citation Likelihood] Provider not configured:', provider);
      return res.status(400).json({ error: `Provider ${provider} is not configured` });
    }
    
    const prompt = `Analyze the following answer and determine how likely it is to need citations or references. Consider:

1. Factual claims and statistics
2. Specific data, numbers, or dates
3. Technical information or research findings
4. Claims that go beyond the provided content
5. Statements that would benefit from external verification

Rate the citation likelihood on a scale of 0 to 100, where:
- 0-20: No citations needed (general knowledge, basic facts)
- 21-40: Low likelihood (some specific claims)
- 41-60: Moderate likelihood (several factual claims)
- 61-80: High likelihood (many specific claims, statistics)
- 81-100: Very high likelihood (extensive factual claims, research data)

Content:
${content}

Answer:
${answer}

Respond with ONLY a number between 0 and 100.`;
    
    let result;
    try {
      console.log('[Citation Likelihood] Calling LLM API with provider:', provider);
      result = await llmService.callLLM(prompt, provider, model, false);
      console.log('[Citation Likelihood] LLM API call successful');
    } catch (err) {
      console.error('[Citation Likelihood] LLM API call failed:', err);
      console.error('[Citation Likelihood] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      return res.status(500).json({ error: 'LLM API call failed', details: err.message });
    }
    
    const response = result.text.trim();
    const match = response.match(/\d+/);
    if (!match) {
      console.error('[Citation Likelihood] LLM response did not contain a number:', response);
    }
    const citationLikelihood = match ? Math.min(Math.max(parseInt(match[0]), 0), 100) : 50;
    console.log('[Citation Likelihood] Input:', { answer: answer.substring(0, 100) + '...', content: content.substring(0, 100) + '...', provider, model });
    console.log('[Citation Likelihood] LLM response:', response, 'Parsed likelihood:', citationLikelihood);
    res.json({ citationLikelihood });
  } catch (error) {
    console.error('[Citation Likelihood] API error:', error);
    res.status(500).json({ error: 'Failed to calculate citation likelihood', details: error.message });
  }
});

app.post('/api/accuracy/calculate', authenticateToken, async (req, res) => {
  try {
    const { answer, content, provider, model } = req.body;
    if (!answer || !content || !provider || !model) {
      console.error('[Accuracy Calculation] Missing required fields:', { answer: !!answer, content: !!content, provider, model });
      return res.status(400).json({ error: 'Missing required fields: answer, content, provider, model' });
    }
    
    console.log('[Accuracy Calculation] Starting calculation with provider:', provider, 'model:', model);
    console.log('[Accuracy Calculation] Answer length:', answer.length, 'Content length:', content.length);
    
    if (!llmService.isProviderConfigured(provider)) {
      console.error('[Accuracy Calculation] Provider not configured:', provider);
      return res.status(400).json({ error: `Provider ${provider} is not configured` });
    }
    
    const prompt = `Rate how well the following answer is supported by the given content on a scale of 0 to 100, where 0 means not supported at all and 100 means fully supported.

Content:
${content}

Answer:
${answer}

Respond with ONLY a number between 0 and 100.`;
    
    let result;
    try {
      console.log('[Accuracy Calculation] Calling LLM API with provider:', provider);
      result = await llmService.callLLM(prompt, provider, model, false);
      console.log('[Accuracy Calculation] LLM API call successful');
    } catch (err) {
      console.error('[Accuracy Calculation] LLM API call failed:', err);
      console.error('[Accuracy Calculation] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      return res.status(500).json({ error: 'LLM API call failed', details: err.message });
    }
    
    const response = result.text.trim();
    const match = response.match(/\d+/);
    if (!match) {
      console.error('[Accuracy Calculation] LLM response did not contain a number:', response);
    }
    const accuracy = match ? Math.min(Math.max(parseInt(match[0]), 0), 100) : 50;
    console.log('[Accuracy Calculation] Input:', { answer: answer.substring(0, 100) + '...', content: content.substring(0, 100) + '...', provider, model });
    console.log('[Accuracy Calculation] LLM response:', response, 'Parsed accuracy:', accuracy);
    res.json({ accuracy });
  } catch (error) {
    console.error('[Accuracy Calculation] API error:', error);
    res.status(500).json({ error: 'Failed to calculate accuracy', details: error.message });
  }
});

app.post('/api/accuracy/gemini', authenticateToken, async (req, res) => {
  try {
    const { answer, content, model } = req.body;
    if (!answer || !content) {
      console.error('[Gemini Accuracy] Missing answer or content:', { answer, content });
      return res.status(400).json({ error: 'Missing answer or content' });
    }
    
    console.log('[Gemini Accuracy] Starting calculation with model:', model);
    console.log('[Gemini Accuracy] Answer length:', answer.length, 'Content length:', content.length);
    
    const prompt = `Rate how well the following answer is supported by the given content on a scale of 0 to 100, where 0 means not supported at all and 100 means fully supported.\n\nContent:\n${content}\n\nAnswer:\n${answer}\n\nRespond with ONLY a number between 0 and 100.`;
    
    let result;
    try {
      console.log('[Gemini Accuracy] Calling Gemini API...');
      result = await llmService.callLLM(prompt, 'gemini', model || 'gemini-1.5-flash', false);
      console.log('[Gemini Accuracy] Gemini API call successful');
    } catch (err) {
      console.error('[Gemini Accuracy] Gemini API call failed:', err);
      console.error('[Gemini Accuracy] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      return res.status(500).json({ error: 'Gemini API call failed', details: err.message });
    }
    
    const response = result.text.trim();
    const match = response.match(/\d+/);
    if (!match) {
      console.error('[Gemini Accuracy] Gemini response did not contain a number:', response);
    }
    const accuracy = match ? Math.min(Math.max(parseInt(match[0]), 0), 100) : 50;
    console.log('[Gemini Accuracy] Input:', { answer: answer.substring(0, 100) + '...', content: content.substring(0, 100) + '...', model });
    console.log('[Gemini Accuracy] Gemini response:', response, 'Parsed accuracy:', accuracy);
    res.json({ accuracy });
  } catch (error) {
    console.error('[Gemini Accuracy] API error:', error);
    res.status(500).json({ error: 'Failed to calculate accuracy', details: error.message });
  }
});

app.post('/api/geo-score', authenticateToken, async (req, res) => {
  try {
    const { accuracy, question, answer, importantQuestions, allConfidences, sourceUrl, content } = req.body;
    console.log('[GEO Score] Input:', { accuracy, question, answer, importantQuestions, allConfidences, sourceUrl, content });
    
    // Dynamic Coverage Score - Calculate based on content similarity and question relevance
    let coverage = 0;
    if (importantQuestions && importantQuestions.length > 0) {
      let totalCoverageScore = 0;
      for (let i = 0; i < importantQuestions.length; i++) {
        const importantQ = importantQuestions[i];
        const confidence = allConfidences[i] || 0;
        
        // Calculate semantic similarity between current question and important question
        const similarity = calculateQuestionSimilarity(question, importantQ);
        
        // Weight by confidence and similarity
        const questionCoverage = (confidence * similarity) / 100;
        totalCoverageScore += questionCoverage;
      }
      coverage = (totalCoverageScore / importantQuestions.length) * 100;
    }
    
    // Dynamic Structure Score - More comprehensive analysis
    let structure = 0;
    
    // 1. Answer Length Analysis (0-20 points)
    const answerLength = answer.length;
    if (answerLength >= 50 && answerLength <= 500) {
      structure += 20; // Optimal length
    } else if (answerLength >= 30 && answerLength <= 800) {
      structure += 15; // Good length
    } else if (answerLength >= 20 && answerLength <= 1000) {
      structure += 10; // Acceptable length
    }
    
    // 2. Formatting and Structure (0-30 points)
    if (/^Q:|<h[1-6]>|<h[1-6] /.test(answer) || /<h[1-6]>/.test(content)) structure += 15;
    if (/\n\s*[-*1.]/.test(answer) || /<ul>|<ol>/.test(answer)) structure += 15;
    
    // 3. Readability Analysis (0-25 points)
    const sentences = answer.split(/[.!?]/).filter(s => s.trim().length > 0);
    const words = answer.split(/\s+/).filter(w => w.length > 0);
    const avgSentenceLen = sentences.length > 0 ? words.length / sentences.length : 0;
    
    if (avgSentenceLen >= 10 && avgSentenceLen <= 25) {
      structure += 25; // Optimal sentence length
    } else if (avgSentenceLen >= 8 && avgSentenceLen <= 30) {
      structure += 20; // Good sentence length
    } else if (avgSentenceLen >= 5 && avgSentenceLen <= 35) {
      structure += 15; // Acceptable sentence length
    }
    
    // 4. Content Organization (0-25 points)
    let organizationScore = 0;
    
    // Check for logical flow indicators
    if (/first|second|third|finally|in conclusion|to summarize/i.test(answer)) organizationScore += 10;
    if (/however|but|although|while|on the other hand/i.test(answer)) organizationScore += 5;
    if (/for example|such as|including|specifically/i.test(answer)) organizationScore += 5;
    if (/therefore|thus|as a result|consequently/i.test(answer)) organizationScore += 5;
    
    structure += Math.min(organizationScore, 25);
    
    // Cap structure at 100
    if (structure > 100) structure = 100;
    
    // Schema Presence (unchanged)
    let schema = /@type\s*[:=]\s*['"]?FAQPage['"]?/i.test(answer) || /@type\s*[:=]\s*['"]?FAQPage['"]?/i.test(content) ? 1 : 0;
    
    // Accessibility Score (unchanged)
    let access = 1;
    try {
      const robotsUrl = sourceUrl.replace(/\/$/, '') + '/robots.txt';
      const resp = await axios.get(robotsUrl, { timeout: 2000 });
      if (/Disallow:\s*\//i.test(resp.data)) access = 0;
    } catch (e) {
      console.error('[GEO Score] robots.txt fetch failed:', e.message);
      access = 1;
    }
    
    // Updated GEO Score formula using accuracy instead of aiConfidence
    const geoScore = 0.4 * accuracy + 0.2 * coverage + 0.2 * structure + 0.1 * schema * 100 + 0.1 * access * 100;
    
    console.log('[GEO Score] Components:', { accuracy, coverage, structure, schema, access, geoScore });
    res.json({
      geoScore: Math.round(geoScore),
      breakdown: { accuracy, coverage, structure, schema, access }
    });
  } catch (error) {
    console.error('[GEO Score] API error:', error);
    res.status(500).json({ error: 'Failed to calculate GEO score', details: error.message });
  }
});

// Helper function to calculate question similarity
function calculateQuestionSimilarity(question1, question2) {
  // Convert to lowercase and split into words
  const words1 = question1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const words2 = question2.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  
  // Calculate Jaccard similarity
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return union.length > 0 ? intersection.length / union.length : 0;
}

// Catch-all error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Authentication: Enabled`);
  console.log(`Database: Connected`);
}); 

app.post('/api/extract-content', authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Missing URL' });
    }
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to fetch URL', status: response.status });
    }
    const html = await response.text();
    const data = unfluff(html);
    res.json({ success: true, content: data.text, title: data.title, description: data.description });
  } catch (error) {
    console.error('Extract content error:', error);
    res.status(500).json({ error: 'Failed to extract content', details: error.message });
  }
}); 