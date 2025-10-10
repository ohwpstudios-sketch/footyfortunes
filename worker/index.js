// index.js - Complete Cloudflare Worker with Subscriber Delete
// Place this single file in your worker directory and deploy

// ============================================
// HELPER FUNCTIONS
// ============================================

function jsonResponse(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

async function verifyToken(token, env) {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1] || token));
    
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    const user = await env.DB.prepare(
      'SELECT id, email, role FROM users WHERE email = ?'
    ).bind(decoded.email).first();

    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

function generateToken(user) {
  const payload = {
    email: user.email,
    role: user.role,
    exp: Date.now() + (24 * 60 * 60 * 1000)
  };
  
  return btoa(JSON.stringify(payload));
}

// ============================================
// AUTH HANDLERS
// ============================================

async function handleLogin(request, env, corsHeaders) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return jsonResponse({ 
        success: false, 
        error: 'Email and password are required' 
      }, 400, corsHeaders);
    }

    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND status = ?'
    ).bind(email, 'active').first();

    if (!user) {
      return jsonResponse({ 
        success: false, 
        error: 'Invalid credentials' 
      }, 401, corsHeaders);
    }

    if (user.password_hash !== password) {
      return jsonResponse({ 
        success: false, 
        error: 'Invalid credentials' 
      }, 401, corsHeaders);
    }

    const token = generateToken(user);

    return jsonResponse({ 
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Login failed' 
    }, 500, corsHeaders);
  }
}

async function handleRegister(request, env, corsHeaders) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return jsonResponse({ 
        success: false, 
        error: 'Email and password are required' 
      }, 400, corsHeaders);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return jsonResponse({ 
        success: false, 
        error: 'Invalid email format' 
      }, 400, corsHeaders);
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return jsonResponse({ 
        success: false, 
        error: 'Email already registered' 
      }, 409, corsHeaders);
    }

    const result = await env.DB.prepare(
      'INSERT INTO users (email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      email,
      password,
      'user',
      'active',
      new Date().toISOString()
    ).run();

    const token = generateToken({ email, role: 'user' });

    return jsonResponse({ 
      success: true,
      token,
      user: {
        id: result.meta.last_row_id,
        email,
        role: 'user'
      }
    }, 201, corsHeaders);
  } catch (error) {
    console.error('Registration error:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Registration failed' 
    }, 500, corsHeaders);
  }
}

// ============================================
// PUBLIC PICK HANDLERS
// ============================================

async function handleGetTodaysPicks(env, corsHeaders) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const pick = await env.DB.prepare(
      'SELECT * FROM picks WHERE date = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(today).first();

    if (!pick) {
      return jsonResponse({ 
        success: true,
        picks: null,
        message: 'No picks available for today'
      }, 200, corsHeaders);
    }

    const matches = await env.DB.prepare(
      'SELECT * FROM matches WHERE pick_id = ?'
    ).bind(pick.id).all();

    return jsonResponse({ 
      success: true,
      picks: {
        ...pick,
        matches: matches.results
      }
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error fetching today\'s picks:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to fetch picks' 
    }, 500, corsHeaders);
  }
}

async function handleGetArchive(url, env, corsHeaders) {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const picks = await env.DB.prepare(
      'SELECT * FROM picks WHERE status IN (?, ?) ORDER BY date DESC LIMIT ? OFFSET ?'
    ).bind('won', 'lost', limit, offset).all();

    const statsQuery = await env.DB.prepare(`
      SELECT 
        COUNT(*) as totalPicks,
        SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
        SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost
      FROM picks
      WHERE status IN ('won', 'lost')
    `).first();

    const winRate = statsQuery.totalPicks > 0 
      ? ((statsQuery.won / statsQuery.totalPicks) * 100).toFixed(1)
      : 0;

    return jsonResponse({ 
      success: true,
      picks: picks.results,
      stats: {
        totalPicks: statsQuery.totalPicks || 0,
        won: statsQuery.won || 0,
        lost: statsQuery.lost || 0,
        winRate: parseFloat(winRate),
        totalROI: 0
      }
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error fetching archive:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to fetch archive' 
    }, 500, corsHeaders);
  }
}

// ============================================
// ADMIN STATS HANDLERS
// ============================================

async function handleGetAdminStats(env, corsHeaders) {
  try {
    const userStats = await env.DB.prepare(
      'SELECT COUNT(*) as total FROM users'
    ).first();

    const pickStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as totalPicks,
        SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
        SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost
      FROM picks
      WHERE status IN ('won', 'lost')
    `).first();

    const subStats = await env.DB.prepare(
      'SELECT COUNT(*) as total FROM subscribers'
    ).first();

    const winRate = pickStats.totalPicks > 0 
      ? ((pickStats.won / pickStats.totalPicks) * 100).toFixed(1)
      : 0;

    return jsonResponse({ 
      success: true,
      stats: {
        totalUsers: userStats.total || 0,
        totalPicks: pickStats.totalPicks || 0,
        winRate: parseFloat(winRate),
        totalROI: 0,
        activeSubscribers: subStats.total || 0
      }
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to fetch statistics' 
    }, 500, corsHeaders);
  }
}

// ============================================
// ADMIN PICK HANDLERS
// ============================================

async function handleGetAllPicks(env, corsHeaders) {
  try {
    const picks = await env.DB.prepare(
      'SELECT * FROM picks ORDER BY date DESC LIMIT 100'
    ).all();

    const picksWithMatches = await Promise.all(
      picks.results.map(async (pick) => {
        const matches = await env.DB.prepare(
          'SELECT * FROM matches WHERE pick_id = ?'
        ).bind(pick.id).all();
        
        return {
          ...pick,
          matches: matches.results
        };
      })
    );

    return jsonResponse({ 
      success: true,
      picks: picksWithMatches
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error fetching all picks:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to fetch picks' 
    }, 500, corsHeaders);
  }
}

async function handleCreatePick(request, env, corsHeaders) {
  try {
    const { date, matches, combined_odds, status } = await request.json();

    if (!date || !matches || matches.length === 0) {
      return jsonResponse({ 
        success: false, 
        error: 'Date and matches are required' 
      }, 400, corsHeaders);
    }

    const pickId = `pick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await env.DB.prepare(
      'INSERT INTO picks (id, date, combined_odds, status, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      pickId,
      date,
      combined_odds,
      status || 'pending',
      new Date().toISOString()
    ).run();

    for (const match of matches) {
      await env.DB.prepare(
        `INSERT INTO matches (
          pick_id, league, home_team, away_team, kick_off_time, 
          selection_type, odds, confidence, fixture_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        pickId,
        match.league,
        match.home,
        match.away,
        match.time,
        match.selection,
        match.odds,
        match.confidence,
        match.fixture_id || null
      ).run();
    }

    await env.PICKS_KV.put(
      `pick:${date}`,
      JSON.stringify({ id: pickId, date, combined_odds, status, matches }),
      { expirationTtl: 86400 }
    );

    return jsonResponse({ 
      success: true,
      pickId,
      message: 'Pick created successfully'
    }, 201, corsHeaders);
  } catch (error) {
    console.error('Error creating pick:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to create pick' 
    }, 500, corsHeaders);
  }
}

async function handleUpdatePick(pickId, request, env, corsHeaders) {
  try {
    const { date, matches, combined_odds, status } = await request.json();

    await env.DB.prepare(
      'UPDATE picks SET date = ?, combined_odds = ?, status = ? WHERE id = ?'
    ).bind(date, combined_odds, status, pickId).run();

    await env.DB.prepare(
      'DELETE FROM matches WHERE pick_id = ?'
    ).bind(pickId).run();

    for (const match of matches) {
      await env.DB.prepare(
        `INSERT INTO matches (
          pick_id, league, home_team, away_team, kick_off_time, 
          selection_type, odds, confidence, fixture_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        pickId,
        match.league,
        match.home,
        match.away,
        match.time,
        match.selection,
        match.odds,
        match.confidence,
        match.fixture_id || null
      ).run();
    }

    await env.PICKS_KV.delete(`pick:${date}`);

    return jsonResponse({ 
      success: true,
      message: 'Pick updated successfully'
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error updating pick:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to update pick' 
    }, 500, corsHeaders);
  }
}

async function handleDeletePick(pickId, env, corsHeaders) {
  try {
    const pick = await env.DB.prepare(
      'SELECT date FROM picks WHERE id = ?'
    ).bind(pickId).first();

    await env.DB.prepare(
      'DELETE FROM matches WHERE pick_id = ?'
    ).bind(pickId).run();

    await env.DB.prepare(
      'DELETE FROM picks WHERE id = ?'
    ).bind(pickId).run();

    if (pick) {
      await env.PICKS_KV.delete(`pick:${pick.date}`);
    }

    return jsonResponse({ 
      success: true,
      message: 'Pick deleted successfully'
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error deleting pick:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to delete pick' 
    }, 500, corsHeaders);
  }
}

async function handleUpdatePickResult(request, env, corsHeaders) {
  try {
    const { pickId, result, finalScore } = await request.json();

    if (!pickId || !result) {
      return jsonResponse({ 
        success: false, 
        error: 'Pick ID and result are required' 
      }, 400, corsHeaders);
    }

    if (!['won', 'lost', 'pending'].includes(result)) {
      return jsonResponse({ 
        success: false, 
        error: 'Invalid result. Must be won, lost, or pending' 
      }, 400, corsHeaders);
    }

    await env.DB.prepare(
      'UPDATE picks SET status = ? WHERE id = ?'
    ).bind(result, pickId).run();

    const pick = await env.DB.prepare(
      'SELECT date FROM picks WHERE id = ?'
    ).bind(pickId).first();

    if (pick) {
      await env.PICKS_KV.delete(`pick:${pick.date}`);
    }

    return jsonResponse({ 
      success: true,
      message: `Pick marked as ${result}`
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error updating pick result:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to update result' 
    }, 500, corsHeaders);
  }
}

async function handleAutoDetectFixtures(request, env, corsHeaders) {
  try {
    const { matches } = await request.json();

    if (!matches || matches.length === 0) {
      return jsonResponse({ 
        success: false, 
        error: 'No matches provided' 
      }, 400, corsHeaders);
    }

    return jsonResponse({ 
      success: true,
      matches,
      message: 'Fixture detection will be available after API-Football integration'
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error detecting fixtures:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to detect fixtures' 
    }, 500, corsHeaders);
  }
}

// ============================================
// ADMIN USER HANDLERS
// ============================================

async function handleGetAllUsers(env, corsHeaders) {
  try {
    const users = await env.DB.prepare(
      'SELECT id, email, role, status, created_at FROM users ORDER BY created_at DESC'
    ).all();

    return jsonResponse({ 
      success: true,
      users: users.results
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error fetching users:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to fetch users' 
    }, 500, corsHeaders);
  }
}

async function handleUpdateUserRole(userId, request, env, corsHeaders) {
  try {
    const { role } = await request.json();

    if (!['user', 'admin'].includes(role)) {
      return jsonResponse({ 
        success: false, 
        error: 'Invalid role. Must be user or admin' 
      }, 400, corsHeaders);
    }

    const result = await env.DB.prepare(
      'UPDATE users SET role = ? WHERE id = ?'
    ).bind(role, userId).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ 
        success: false, 
        error: 'User not found' 
      }, 404, corsHeaders);
    }

    return jsonResponse({ 
      success: true,
      message: `User role updated to ${role}`
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error updating user role:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to update user role' 
    }, 500, corsHeaders);
  }
}

async function handleUpdateUserStatus(userId, request, env, corsHeaders) {
  try {
    const { status } = await request.json();

    if (!['active', 'suspended'].includes(status)) {
      return jsonResponse({ 
        success: false, 
        error: 'Invalid status. Must be active or suspended' 
      }, 400, corsHeaders);
    }

    const result = await env.DB.prepare(
      'UPDATE users SET status = ? WHERE id = ?'
    ).bind(status, userId).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ 
        success: false, 
        error: 'User not found' 
      }, 404, corsHeaders);
    }

    return jsonResponse({ 
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'suspended'}`
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error updating user status:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to update user status' 
    }, 500, corsHeaders);
  }
}

async function handleCreateUser(request, env, corsHeaders) {
  try {
    const { email, password, role, status } = await request.json();

    if (!email || !password) {
      return jsonResponse({ 
        success: false, 
        error: 'Email and password are required' 
      }, 400, corsHeaders);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return jsonResponse({ 
        success: false, 
        error: 'Invalid email format' 
      }, 400, corsHeaders);
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return jsonResponse({ 
        success: false, 
        error: 'Email already registered' 
      }, 409, corsHeaders);
    }

    const result = await env.DB.prepare(
      'INSERT INTO users (email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      email,
      password,
      role || 'user',
      status || 'active',
      new Date().toISOString()
    ).run();

    return jsonResponse({ 
      success: true,
      message: 'User created successfully',
      userId: result.meta.last_row_id
    }, 201, corsHeaders);
  } catch (error) {
    console.error('Error creating user:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to create user' 
    }, 500, corsHeaders);
  }
}

// ============================================
// ADMIN SUBSCRIBER HANDLERS
// ============================================

async function handleGetAllSubscribers(env, corsHeaders) {
  try {
    const subscribers = await env.DB.prepare(
      'SELECT * FROM subscribers ORDER BY subscribed_at DESC'
    ).all();

    return jsonResponse({ 
      success: true,
      subscribers: subscribers.results.map(sub => ({
        ...sub,
        preferences: JSON.parse(sub.preferences || '{}')
      }))
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to fetch subscribers' 
    }, 500, corsHeaders);
  }
}

async function handleDeleteSubscriber(subscriberId, env, corsHeaders) {
  try {
    const result = await env.DB.prepare(
      'DELETE FROM subscribers WHERE id = ?'
    ).bind(subscriberId).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ 
        success: false, 
        error: 'Subscriber not found' 
      }, 404, corsHeaders);
    }

    return jsonResponse({ 
      success: true,
      message: 'Subscriber deleted successfully'
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to delete subscriber' 
    }, 500, corsHeaders);
  }
}

// ============================================
// ADMIN SETTINGS HANDLERS
// ============================================

async function handleGetSettings(env, corsHeaders) {
  try {
    const settings = await env.CACHE.get('platform_settings', { type: 'json' });

    if (!settings) {
      return jsonResponse({ 
        success: true,
        settings: {
          siteName: 'FootyFortunes',
          targetOddsMin: 2.5,
          targetOddsMax: 3.5,
          logoUrl: '',
          faviconUrl: '',
          telegramChannelId: '',
          telegramBotToken: '',
          apiFootballKey: ''
        }
      }, 200, corsHeaders);
    }

    return jsonResponse({ 
      success: true,
      settings
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to fetch settings' 
    }, 500, corsHeaders);
  }
}

async function handleUpdateSettings(request, env, corsHeaders) {
  try {
    const settings = await request.json();

    if (settings.targetOddsMin && settings.targetOddsMax) {
      if (settings.targetOddsMin >= settings.targetOddsMax) {
        return jsonResponse({ 
          success: false, 
          error: 'Minimum odds must be less than maximum odds' 
        }, 400, corsHeaders);
      }
    }

    await env.CACHE.put('platform_settings', JSON.stringify(settings));

    return jsonResponse({ 
      success: true,
      message: 'Settings updated successfully'
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error updating settings:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to update settings' 
    }, 500, corsHeaders);
  }
}

async function handleFileUpload(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type'); // 'logo' or 'favicon'

    if (!file) {
      return jsonResponse({ 
        success: false, 
        error: 'No file provided' 
      }, 400, corsHeaders);
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/x-icon'];
    if (!validTypes.includes(file.type)) {
      return jsonResponse({ 
        success: false, 
        error: 'Invalid file type. Supported: PNG, JPG, SVG, ICO' 
      }, 400, corsHeaders);
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return jsonResponse({ 
        success: false, 
        error: 'File size must be less than 2MB' 
      }, 400, corsHeaders);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${type}-${timestamp}.${fileExtension}`;

    // Upload to R2
    await env.UPLOADS.put(fileName, file.stream(), {
      httpMetadata: {
        contentType: file.type
      }
    });

    // Generate public URL
    // Note: You'll need to set up a custom domain or use R2 public buckets
    // For now, we'll use the bucket URL format
    const publicUrl = `https://cdn.footyfortunes.win/${fileName}`;

    console.log('✅ File uploaded:', fileName);

    return jsonResponse({ 
      success: true,
      url: publicUrl,
      filename: fileName,
      message: 'File uploaded successfully'
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Error uploading file:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Failed to upload file',
      details: error.message
    }, 500, corsHeaders);
  }
}

// ============================================
// MAIN WORKER EXPORT
// ============================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const path = url.pathname;

      // PUBLIC ROUTES
      if (path === '/api/auth/login' && request.method === 'POST') {
        return handleLogin(request, env, corsHeaders);
      }
      
      if (path === '/api/auth/register' && request.method === 'POST') {
        return handleRegister(request, env, corsHeaders);
      }

      if (path === '/api/picks/today' && request.method === 'GET') {
        return handleGetTodaysPicks(env, corsHeaders);
      }

      if (path === '/api/picks/archive' && request.method === 'GET') {
        return handleGetArchive(url, env, corsHeaders);
      }

      // ADMIN ROUTES
      if (path.startsWith('/api/admin/')) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return jsonResponse({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
        }

        const token = authHeader.substring(7);
        const user = await verifyToken(token, env);
        
        if (!user || user.role !== 'admin') {
          return jsonResponse({ success: false, error: 'Forbidden: Admin access required' }, 403, corsHeaders);
        }

        if (path === '/api/admin/stats' && request.method === 'GET') {
          return handleGetAdminStats(env, corsHeaders);
        }

        if (path === '/api/admin/picks' && request.method === 'GET') {
          return handleGetAllPicks(env, corsHeaders);
        }
        if (path === '/api/admin/picks' && request.method === 'POST') {
          return handleCreatePick(request, env, corsHeaders);
        }
        if (path.match(/^\/api\/admin\/picks\/[^\/]+$/) && request.method === 'PUT') {
          const pickId = path.split('/').pop();
          return handleUpdatePick(pickId, request, env, corsHeaders);
        }
        if (path.match(/^\/api\/admin\/picks\/[^\/]+$/) && request.method === 'DELETE') {
          const pickId = path.split('/').pop();
          return handleDeletePick(pickId, env, corsHeaders);
        }
        if (path === '/api/admin/picks/update-result' && request.method === 'POST') {
          return handleUpdatePickResult(request, env, corsHeaders);
        }
        if (path === '/api/admin/picks/auto-detect-fixtures' && request.method === 'POST') {
          return handleAutoDetectFixtures(request, env, corsHeaders);
        }

        if (path === '/api/admin/users' && request.method === 'GET') {
          return handleGetAllUsers(env, corsHeaders);
        }
		
		if (path === '/api/admin/users' && request.method === 'POST') {
  return handleCreateUser(request, env, corsHeaders);
}

        if (path.match(/^\/api\/admin\/users\/[^\/]+\/role$/) && request.method === 'PUT') {
          const userId = path.split('/')[4];
          return handleUpdateUserRole(userId, request, env, corsHeaders);
        }
        if (path.match(/^\/api\/admin\/users\/[^\/]+\/status$/) && request.method === 'PUT') {
          const userId = path.split('/')[4];
          return handleUpdateUserStatus(userId, request, env, corsHeaders);
        }

        if (path === '/api/admin/subscribers' && request.method === 'GET') {
          return handleGetAllSubscribers(env, corsHeaders);
        }
        if (path.match(/^\/api\/admin\/subscribers\/[^\/]+$/) && request.method === 'DELETE') {
          const subscriberId = path.split('/').pop();
          return handleDeleteSubscriber(subscriberId, env, corsHeaders);
        }

        if (path === '/api/admin/settings' && request.method === 'GET') {
          return handleGetSettings(env, corsHeaders);
        }
        if (path === '/api/admin/settings' && request.method === 'PUT') {
          return handleUpdateSettings(request, env, corsHeaders);
        }
		
		if (path === '/api/admin/upload' && request.method === 'POST') {
  return handleFileUpload(request, env, corsHeaders);
}
      }

      return jsonResponse({ success: false, error: 'Endpoint not found' }, 404, corsHeaders);

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ 
        success: false,
        error: 'Internal server error',
        message: error.message 
      }, 500, corsHeaders);
    }
  }
};