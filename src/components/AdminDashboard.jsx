// AdminDashboard.jsx - Phase 1: Real-time Odds Validator + Kick-off Time
import authService from '../services/authService';
import apiService from '../services/apiService';
import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Save, X, Upload, Download, Users, 
  BarChart3, Settings, Calendar, Clock, Search, Filter,
  CheckCircle, XCircle, AlertCircle, RefreshCw, Eye,
  TrendingUp, DollarSign, Target, Activity, Mail, Bell,
  Menu, Home, LogOut
} from 'lucide-react';

const AdminDashboard = ({ user, darkMode }) => {
  const [activeTab, setActiveTab] = useState('picks');
  const [picks, setPicks] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPicks: 0,
    winRate: 0,
    totalROI: 0,
    activeSubscribers: 0
  });
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Pick Management State
  const [isCreatingPick, setIsCreatingPick] = useState(false);
  const [editingPick, setEditingPick] = useState(null);
  const [currentPick, setCurrentPick] = useState({
    date: new Date().toISOString().split('T')[0],
    matches: [],
    combined_odds: 0,
    status: 'pending'
  });
  const [newMatch, setNewMatch] = useState({
    league: '',
    home: '',
    away: '',
    time: '',
    selection: '',
    odds: '',
    confidence: 80,
    fixture_id: ''
  });

  // Settings State
  const [platformSettings, setPlatformSettings] = useState({
    siteName: 'FootyFortunes',
    targetOddsMin: 2.5,
    targetOddsMax: 3.5,
    logoUrl: '',
    faviconUrl: '',
    telegramChannelId: '',
    telegramBotToken: '',
    apiFootballKey: ''
  });
  
  const [isAddingUser, setIsAddingUser] = useState(false);
const [newUser, setNewUser] = useState({
  email: '',
  password: '',
  role: 'user'
});

  // ⭐ NEW: Helper function to get odds status
  const getOddsStatus = (odds) => {
    if (odds === 0) return { icon: '📝', color: 'bg-gray-400', textColor: 'text-white', message: 'Add matches to calculate odds' };
    if (odds < 2.95) return { icon: '⬆️', color: 'bg-gradient-to-r from-yellow-500 to-orange-500', textColor: 'text-white', message: 'Odds too low - add more selections or higher odds' };
    if (odds > 3.05) return { icon: '⬇️', color: 'bg-gradient-to-r from-red-500 to-red-600', textColor: 'text-white', message: 'Odds too high - remove a match or lower odds' };
    return { icon: '✅', color: 'bg-gradient-to-r from-green-500 to-emerald-600', textColor: 'text-white', message: 'Perfect! Within target range (2.95-3.05)' };
  };

  useEffect(() => {
    loadDashboardData();
    loadSettings();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading dashboard data...');
      
      const [statsRes, picksRes, usersRes, subscribersRes] = await Promise.all([
        apiService.admin.getStats(),
        apiService.admin.getAllPicks(),
        apiService.admin.getAllUsers(),
        apiService.admin.getAllSubscribers()
      ]);

      console.log('📊 Stats response:', statsRes);
      console.log('🎯 Picks response:', picksRes);
      console.log('👥 Users response:', usersRes);
      console.log('📧 Subscribers response:', subscribersRes);

      if (statsRes.ok && statsRes.data.success) {
        setStats(statsRes.data.stats);
      } else {
        console.warn('Stats failed:', statsRes.data);
        setStats({
          totalUsers: 0,
          totalPicks: 0,
          winRate: 0,
          totalROI: 0,
          activeSubscribers: 0
        });
      }

      if (picksRes.ok && picksRes.data.success) {
        setPicks(picksRes.data.picks || []);
      } else {
        console.warn('Picks failed:', picksRes.data);
        setPicks([]);
      }

      if (usersRes.ok && usersRes.data.success) {
        setUsers(usersRes.data.users || []);
      } else {
        console.warn('Users failed:', usersRes.data);
        setUsers([]);
      }

      if (subscribersRes.ok && subscribersRes.data.success) {
        setSubscribers(subscribersRes.data.subscribers || []);
      } else {
        console.warn('Subscribers failed:', subscribersRes.data);
        setSubscribers([]);
      }

      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setStats({
        totalUsers: 0,
        totalPicks: 0,
        winRate: 0,
        totalROI: 0,
        activeSubscribers: 0
      });
      setPicks([]);
      setUsers([]);
      setSubscribers([]);
    }
    setLoading(false);
  };

  const loadSettings = async () => {
    try {
      const response = await apiService.admin.getSettings();
      if (response.ok && response.data.settings) {
        setPlatformSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Pick Management Functions
  const calculateCombinedOdds = (matches) => {
    if (matches.length === 0) return 0;
    return matches.reduce((acc, match) => acc * parseFloat(match.odds || 1), 1).toFixed(2);
  };

  const addMatchToPick = () => {
    if (!newMatch.league || !newMatch.home || !newMatch.away || !newMatch.odds) {
      alert('Please fill in all required fields (League, Home Team, Away Team, and Odds)');
      return;
    }

    // ⭐ NEW: Validate time is provided
    if (!newMatch.time) {
      alert('⏰ Please provide kick-off time for the match');
      return;
    }

    const updatedMatches = [...currentPick.matches, { ...newMatch, id: Date.now() }];
    const combined_odds = calculateCombinedOdds(updatedMatches);
    
    setCurrentPick({
      ...currentPick,
      matches: updatedMatches,
      combined_odds
    });

    // Reset match form
    setNewMatch({
      league: '',
      home: '',
      away: '',
      time: '',
      selection: '',
      odds: '',
      confidence: 80,
      fixture_id: ''
    });

    alert('✅ Match added successfully!');
  };

  const removeMatchFromPick = (matchId) => {
    const updatedMatches = currentPick.matches.filter(m => m.id !== matchId);
    const combined_odds = calculateCombinedOdds(updatedMatches);
    
    setCurrentPick({
      ...currentPick,
      matches: updatedMatches,
      combined_odds
    });
  };

  const savePick = async () => {
  if (currentPick.matches.length === 0) {
    alert('⚠️ Please add at least one match before saving');
    return;
  }

  const combinedOdds = parseFloat(currentPick.combined_odds);
  if (combinedOdds < 2.95 || combinedOdds > 3.05) {
    alert(`⚠️ Combined odds must be between 2.95 and 3.05 (Target: 3.00)\n\nCurrent: ${combinedOdds}\n\nPlease adjust your selections to reach the target range.`);
    return;
  }

  setLoading(true);
  try {
    let response;
    
    // FIXED: Clean matches data before sending to API
    const cleanMatches = currentPick.matches.map(match => ({
      league: match.league,
      home: match.home,
      away: match.away,
      time: match.time,
      selection: match.selection,
      odds: match.odds,
      confidence: match.confidence,
      fixture_id: match.fixture_id || null
    }));
    
    if (editingPick && currentPick.id) {
      // UPDATE MODE: Editing existing pick
      console.log('📝 Updating pick:', currentPick.id);
      response = await apiService.admin.updatePick(currentPick.id, {
        date: currentPick.date,
        matches: cleanMatches,
        combined_odds: currentPick.combined_odds,
        status: currentPick.status
      });
    } else {
      // CREATE MODE: New pick
      console.log('➕ Creating new pick');
      response = await apiService.admin.createPick({
        date: currentPick.date,
        matches: cleanMatches,
        combined_odds: currentPick.combined_odds,
        status: 'pending'
      });
    }
    
	if (response.ok && response.data.success) {
      alert(editingPick ? '✅ Pick updated successfully!' : '✅ Pick saved successfully!');
      
      // FIXED: Properly reset ALL state
      setIsCreatingPick(false);
      setEditingPick(null);
      setCurrentPick({
        date: new Date().toISOString().split('T')[0],
        matches: [],
        combined_odds: 0,
        status: 'pending'
      });
      
      // FIXED: Also reset the new match form
      setNewMatch({
        league: '',
        home: '',
        away: '',
        time: '',
        selection: '',
        odds: '',
        confidence: 80,
        fixture_id: ''
      });
      
      // Reload picks list to show updated data
      await loadDashboardData();
    }
    
	else {
      alert(`❌ Failed to ${editingPick ? 'update' : 'save'} pick: ${response.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error saving pick:', error);
    alert(`❌ Failed to ${editingPick ? 'update' : 'save'} pick. Please try again.`);
  }
  setLoading(false);
};

  const updatePickResult = async (pickId, result) => {
    const finalScore = prompt('Enter final score (optional, e.g., 2-1):');
    
    setLoading(true);
    try {
      const response = await apiService.admin.updatePickResult(pickId, result, finalScore);

      if (response.ok && response.data.success) {
        alert(`✅ Pick marked as ${result}!`);
        await loadDashboardData();
      } else {
        alert(`❌ Failed to update result: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating result:', error);
      alert('❌ Failed to update result. Please try again.');
    }
    setLoading(false);
  };

  const deletePick = async (pickId) => {
    if (!confirm('⚠️ Are you sure you want to delete this pick? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.admin.deletePick(pickId);

      if (response.ok && response.data.success) {
        alert('✅ Pick deleted successfully!');
        await loadDashboardData();
      } else {
        alert(`❌ Failed to delete pick: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting pick:', error);
      alert('❌ Failed to delete pick. Please try again.');
    }
    setLoading(false);
  };
  
const editPick = (pick) => {
  // FIXED: Add temporary IDs to existing matches for UI consistency
  const matchesWithIds = (pick.matches || []).map((match, index) => ({
    ...match,
    id: match.id || `existing_${index}_${Date.now()}`
  }));
  
  setCurrentPick({
    id: pick.id,
    date: pick.date,
    matches: matchesWithIds,
    combined_odds: pick.combined_odds,
    status: pick.status
  });
  setIsCreatingPick(true);
  setEditingPick(pick);
};

  const updateUserRole = async (userId, newRole) => {
    setLoading(true);
    try {
      const response = await apiService.admin.updateUserRole(userId, newRole);

      if (response.ok && response.data.success) {
        alert(`✅ User role updated to ${newRole}!`);
        await loadDashboardData();
      } else {
        alert(`❌ Failed to update role: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('❌ Failed to update role. Please try again.');
    }
    setLoading(false);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    setLoading(true);
    try {
      const response = await apiService.admin.updateUserStatus(userId, newStatus);

      if (response.ok && response.data.success) {
        alert(`✅ User ${newStatus === 'active' ? 'activated' : 'suspended'}!`);
        await loadDashboardData();
      } else {
        alert(`❌ Failed to update status: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('❌ Failed to update status. Please try again.');
    }
    setLoading(false);
  };
  
  const createUser = async () => {
  if (!newUser.email || !newUser.password) {
    alert('⚠️ Please provide both email and password');
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newUser.email)) {
    alert('⚠️ Please provide a valid email address');
    return;
  }

  // Password validation
  if (newUser.password.length < 6) {
    alert('⚠️ Password must be at least 6 characters long');
    return;
  }

  setLoading(true);
  try {
    const response = await apiService.admin.createUser({
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      status: 'active'
    });

    if (response.ok && response.data.success) {
      alert('✅ User created successfully!');
      setIsAddingUser(false);
      setNewUser({ email: '', password: '', role: 'user' });
      await loadDashboardData();
    } else {
      alert(`❌ Failed to create user: ${response.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error creating user:', error);
    alert('❌ Failed to create user. Please try again.');
  }
  setLoading(false);
};

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await apiService.admin.updateSettings(platformSettings);

      if (response.ok && response.data.success) {
        alert('✅ Settings saved successfully!');
      } else {
        alert(`❌ Failed to save settings: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Failed to save settings. Please try again.');
    }
    setLoading(false);
  };
  
  const handleFileUpload = async (file, type) => {
  if (!file) return;

  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/x-icon'];
  if (!validTypes.includes(file.type)) {
    alert('⚠️ Please upload a valid image file (PNG, JPG, SVG, or ICO)');
    return;
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('⚠️ File size must be less than 2MB');
    return;
  }

  setLoading(true);
  try {
    const response = await apiService.admin.uploadFile(file, type);

    if (response.success && response.url) {
      setPlatformSettings({
        ...platformSettings,
        [type === 'logo' ? 'logoUrl' : 'faviconUrl']: response.url
      });
      alert(`✅ ${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully!`);
    } else {
      alert(`❌ Failed to upload ${type}: ${response.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    alert(`❌ Failed to upload ${type}. Please try again.`);
  }
  setLoading(false);
};

  const deleteSubscriber = async (subscriberId) => {
    if (!confirm('⚠️ Are you sure you want to delete this subscriber?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.admin.deleteSubscriber(subscriberId);

      if (response.ok && response.data.success) {
        alert('✅ Subscriber deleted successfully!');
        await loadDashboardData();
      } else {
        alert(`❌ Failed to delete subscriber: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      alert('❌ Failed to delete subscriber. Please try again.');
    }
    setLoading(false);
  };

  // Component Renders
  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-6 h-6 md:w-8 md:h-8 text-${color}-500`} />
        <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-lg transition text-sm md:text-base whitespace-nowrap ${
        activeTab === id
          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 md:p-8">
  <div className="container mx-auto">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Admin Dashboard</h1>
        <p className="text-sm md:text-base text-yellow-100 hidden md:block">Manage picks, users, and platform settings</p>
      </div>
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-yellow-600 transition"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </div>
  </div>
</div>

      {/* Stats Overview */}
      <div className="container mx-auto px-4 -mt-4 md:-mt-8 mb-6 md:mb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="blue" />
          <StatCard icon={Target} label="Total Picks" value={stats.totalPicks} color="green" />
          <StatCard icon={TrendingUp} label="Win Rate" value={`${stats.winRate}%`} color="purple" />
          <StatCard icon={DollarSign} label="Total ROI" value={`+${stats.totalROI}%`} color="emerald" />
          <StatCard icon={Mail} label="Subscribers" value={stats.activeSubscribers} color="yellow" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 mb-4 md:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2 border border-gray-200 dark:border-gray-700">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-2 overflow-x-auto">
            <TabButton id="picks" label="Pick Management" icon={Target} />
            <TabButton id="users" label="User Management" icon={Users} />
            <TabButton id="subscribers" label="Subscribers" icon={Mail} />
            <TabButton id="analytics" label="Analytics" icon={BarChart3} />
            <TabButton id="settings" label="Settings" icon={Settings} />
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-2"
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {activeTab === 'picks' && 'Pick Management'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'subscribers' && 'Subscribers'}
                {activeTab === 'analytics' && 'Analytics'}
                {activeTab === 'settings' && 'Settings'}
              </span>
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            {mobileMenuOpen && (
              <div className="mt-2 space-y-1">
                <TabButton id="picks" label="Pick Management" icon={Target} />
                <TabButton id="users" label="User Management" icon={Users} />
                <TabButton id="subscribers" label="Subscribers" icon={Mail} />
                <TabButton id="analytics" label="Analytics" icon={BarChart3} />
                <TabButton id="settings" label="Settings" icon={Settings} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 pb-12">
        {activeTab === 'picks' && (
          <div className="space-y-4 md:space-y-6">
            {/* Create Pick Button */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Pick Management</h2>
              <button
                onClick={() => setIsCreatingPick(true)}
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 text-sm md:text-base"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                <span>Create New Pick</span>
              </button>
            </div>

            {/* Create/Edit Pick Modal */}
            {isCreatingPick && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
  {editingPick ? '✏️ Edit Pick' : '➕ Create New Pick'} (Target: 3.00 Odds)
</h3>
                  <button
                    onClick={() => {
  setIsCreatingPick(false);
  setEditingPick(null);
  setCurrentPick({
    date: new Date().toISOString().split('T')[0],
    matches: [],
    combined_odds: 0,
    status: 'pending'
  });
}}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Pick Date */}
                <div className="mb-4 md:mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pick Date
                  </label>
                  <input
                    type="date"
                    value={currentPick.date}
                    onChange={(e) => setCurrentPick({ ...currentPick, date: e.target.value })}
                    className="w-full px-3 md:px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm md:text-base"
                  />
                </div>

                {/* ⭐ NEW: Enhanced Add Match Form with Kick-off Time */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 md:mb-4 text-sm md:text-base">Add Match</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        League
                      </label>
                      <input
                        type="text"
                        placeholder="League (e.g., Premier League)"
                        value={newMatch.league}
                        onChange={(e) => setNewMatch({ ...newMatch, league: e.target.value })}
                        className="w-full px-3 md:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm md:text-base"
                      />
                    </div>
                    
                    {/* ⭐ NEW: Kick-off Time Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ⏰ Kick-off Time
                      </label>
                      <input
                        type="time"
                        value={newMatch.time}
                        onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
                        className="w-full px-3 md:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm md:text-base"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Home Team
                      </label>
                      <input
                        type="text"
                        placeholder="Home Team"
                        value={newMatch.home}
                        onChange={(e) => setNewMatch({ ...newMatch, home: e.target.value })}
                        className="w-full px-3 md:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm md:text-base"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Away Team
                      </label>
                      <input
                        type="text"
                        placeholder="Away Team"
                        value={newMatch.away}
                        onChange={(e) => setNewMatch({ ...newMatch, away: e.target.value })}
                        className="w-full px-3 md:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm md:text-base"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selection
                      </label>
                      <select
                        value={newMatch.selection}
                        onChange={(e) => setNewMatch({ ...newMatch, selection: e.target.value })}
                        className="w-full px-3 md:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm md:text-base"
                      >
                        <option value="">Select Prediction</option>
                        <option value="Home Win">Home Win</option>
                        <option value="Away Win">Away Win</option>
                        <option value="Draw">Draw</option>
                        <option value="Over 2.5">Over 2.5 Goals</option>
                        <option value="Under 2.5">Under 2.5 Goals</option>
                        <option value="BTTS">Both Teams to Score</option>
                        <option value="BTTS No">Both Teams Not to Score</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Odds (Decimal)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Odds (e.g., 1.75)"
                        value={newMatch.odds}
                        onChange={(e) => setNewMatch({ ...newMatch, odds: e.target.value })}
                        className="w-full px-3 md:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm md:text-base"
                      />
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Confidence: {newMatch.confidence}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={newMatch.confidence}
                        onChange={(e) => setNewMatch({ ...newMatch, confidence: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3 md:mt-4">
                    <button
                      onClick={addMatchToPick}
                      className="w-full md:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm md:text-base"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Match</span>
                    </button>
                  </div>
                </div>

                {/* Current Matches */}
                {currentPick.matches.length > 0 && (
                  <div className="mb-4 md:mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 md:mb-4 text-sm md:text-base">
                      Matches ({currentPick.matches.length})
                    </h4>
                    <div className="space-y-2 md:space-y-3">
                      {currentPick.matches.map((match) => (
                        <div
                          key={match.id}
                          className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 gap-3"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">
                              {match.home} vs {match.away}
                            </div>
                            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {match.league} • ⏰ {match.time} • {match.selection} • {match.odds} • {match.confidence}%
                            </div>
                          </div>
                          <button
                            onClick={() => removeMatchFromPick(match.id)}
                            className="self-end md:self-auto p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ⭐ NEW: Enhanced Combined Odds Display with Real-Time Validation */}
                <div className={`rounded-lg p-4 md:p-6 text-white mb-4 md:mb-6 transition-all duration-300 ${getOddsStatus(parseFloat(currentPick.combined_odds)).color}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 text-sm md:text-base">Combined Odds (Target: 3.00)</h4>
                      <p className="text-white opacity-90 text-xs md:text-sm">{currentPick.matches.length} matches</p>
                      
                      {/* ⭐ NEW: Real-Time Status Message */}
                      <div className="mt-2 text-sm md:text-base font-semibold flex items-center gap-2">
                        <span>{getOddsStatus(parseFloat(currentPick.combined_odds)).icon}</span>
                        <span>{getOddsStatus(parseFloat(currentPick.combined_odds)).message}</span>
                      </div>
                    </div>
                    <div className="text-3xl md:text-5xl font-bold">{currentPick.combined_odds}x</div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={savePick}
                  disabled={loading || currentPick.matches.length === 0 || currentPick.combined_odds < 2.95 || currentPick.combined_odds > 3.05}
                  className="w-full flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  <Save className="w-4 h-4 md:w-5 md:h-5" />
                  <span>{loading ? 'Saving...' : editingPick ? 'Update Pick' : 'Save Pick'}</span>
                </button>
                {(currentPick.combined_odds < 2.95 || currentPick.combined_odds > 3.05) && currentPick.matches.length > 0 && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
                    ⚠️ Adjust odds to be within 2.95-3.05 range before saving
                  </p>
                )}
              </div>
            )}

            {/* Picks List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">All Picks</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {picks.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No picks yet. Create your first pick above.
                  </div>
                ) : (
                  picks.map((pick) => (
                    <div key={pick.id} className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{pick.date}</div>
                          <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {pick.matches?.length || 0} matches • {pick.combined_odds}x odds
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                          <span className={`px-3 py-1 rounded-lg text-xs md:text-sm font-semibold ${
                            pick.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            pick.status === 'won' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {pick.status}
                          </span>
                          {pick.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updatePickResult(pick.id, 'won')}
                                disabled={loading}
                                className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-50"
                                title="Mark as Won"
                              >
                                <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                              </button>
                              <button
                                onClick={() => updatePickResult(pick.id, 'lost')}
                                disabled={loading}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                                title="Mark as Lost"
                              >
                                <XCircle className="w-4 h-4 md:w-5 md:h-5" />
                              </button>
                            </>
                          )}
						  <button
  onClick={() => editPick(pick)}
  disabled={loading}
  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-50"
  title="Edit Pick"
>
  <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
</button>
                          <button
                            onClick={() => deletePick(pick.id)}
                            disabled={loading}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                            title="Delete Pick"
                          >
                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
  <div className="flex justify-between items-center">
    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">User Management</h3>
    <button
      onClick={() => setIsAddingUser(true)}
      disabled={loading}
      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
    >
      <Plus className="w-4 h-4" />
      <span>Add User</span>
    </button>
  </div>
</div>

{/* Add User Modal */}
{isAddingUser && (
  <div className="m-4 md:m-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-600">
    <div className="flex justify-between items-center mb-4">
      <h4 className="text-lg font-bold text-gray-900 dark:text-white">Create New User</h4>
      <button
        onClick={() => {
          setIsAddingUser(false);
          setNewUser({ email: '', password: '', role: 'user' });
        }}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
    
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          placeholder="user@example.com"
          className="w-full px-3 md:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password
        </label>
        <input
          type="password"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          placeholder="Minimum 6 characters"
          className="w-full px-3 md:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Role
        </label>
        <select
          value={newUser.role}
          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          className="w-full px-3 md:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      
      <button
        onClick={createUser}
        disabled={loading}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        <span>{loading ? 'Creating...' : 'Create User'}</span>
      </button>
    </div>
  </div>
)}

<div className="overflow-x-auto">
  <table className="w-full">
    <thead className="bg-gray-50 dark:bg-gray-700">
      <tr>
        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Joined</th>
        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
      {users.length === 0 ? (
        <tr>
          <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
            No users found
          </td>
        </tr>
      ) : (
        users.map((u) => (
          <tr key={u.id}>
            <td className="px-4 md:px-6 py-4 text-xs md:text-sm text-gray-900 dark:text-white">{u.email}</td>
            <td className="px-4 md:px-6 py-4">
              <select
                value={u.role}
                onChange={(e) => updateUserRole(u.id, e.target.value)}
                disabled={loading}
                className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs md:text-sm disabled:opacity-50"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td className="px-4 md:px-6 py-4">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                u.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {u.status}
              </span>
            </td>
            <td className="px-4 md:px-6 py-4 text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{u.created_at}</td>
            <td className="px-4 md:px-6 py-4">
              <button
                onClick={() => toggleUserStatus(u.id, u.status)}
                disabled={loading}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
              >
                {u.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
</div>
)}

        {activeTab === 'subscribers' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Subscribers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Subscribed</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No subscribers yet
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((sub) => (
                      <tr key={sub.id}>
                        <td className="px-4 md:px-6 py-4 text-xs md:text-sm text-gray-900 dark:text-white">{sub.email}</td>
                        <td className="px-4 md:px-6 py-4 text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{sub.subscribed_at}</td>
                        <td className="px-4 md:px-6 py-4">
                          <button
                            onClick={() => deleteSubscriber(sub.id)}
                            disabled={loading}
                            className="text-xs md:text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-8 border border-gray-200 dark:border-gray-700 text-center">
            <BarChart3 className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">Analytics Coming Soon</h3>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Detailed analytics and performance metrics will be available here soon.
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">Platform Settings</h3>
            
            <div className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={platformSettings.siteName}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, siteName: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base"
                />
              </div>
			  
			  <div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Platform Logo
  </label>
  <div className="flex items-center space-x-4">
    {platformSettings.logoUrl && (
      <img 
        src={platformSettings.logoUrl} 
        alt="Logo" 
        className="h-16 w-16 object-contain border border-gray-300 rounded"
      />
    )}
    <input
      type="file"
      accept="image/*"
      onChange={(e) => handleFileUpload(e.target.files[0], 'logo')}
      className="w-full px-3 md:px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base"
    />
  </div>
  <p className="text-xs text-gray-500 mt-1">Recommended: PNG or SVG, max 2MB</p>
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Favicon
  </label>
  <div className="flex items-center space-x-4">
    {platformSettings.faviconUrl && (
      <img 
        src={platformSettings.faviconUrl} 
        alt="Favicon" 
        className="h-8 w-8 object-contain border border-gray-300 rounded"
      />
    )}
    <input
      type="file"
      accept="image/*,.ico"
      onChange={(e) => handleFileUpload(e.target.files[0], 'favicon')}
      className="w-full px-3 md:px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base"
    />
  </div>
  <p className="text-xs text-gray-500 mt-1">Recommended: ICO or PNG, 16x16 or 32x32 pixels</p>
</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Odds Min
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={platformSettings.targetOddsMin}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, targetOddsMin: parseFloat(e.target.value) })}
                    className="w-full px-3 md:px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Odds Max
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={platformSettings.targetOddsMax}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, targetOddsMax: parseFloat(e.target.value) })}
                    className="w-full px-3 md:px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API-Football Key
                </label>
                <input
                  type="password"
                  value={platformSettings.apiFootballKey}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, apiFootballKey: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telegram Bot Token
                </label>
                <input
                  type="password"
                  value={platformSettings.telegramBotToken}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, telegramBotToken: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base"
                />
              </div>

              <button
                onClick={saveSettings}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 text-sm md:text-base"
              >
                <Save className="w-4 h-4 md:w-5 md:h-5" />
                <span>{loading ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;