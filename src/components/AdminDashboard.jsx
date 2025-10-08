// AdminDashboard.jsx
import apiService from '../services/apiService';
import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Save, X, Upload, Download, Users, 
  BarChart3, Settings, Calendar, Clock, Search, Filter,
  CheckCircle, XCircle, AlertCircle, RefreshCw, Eye,
  TrendingUp, DollarSign, Target, Activity, Mail, Bell
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
  setLoading(true);
  try {
    const [statsRes, picksRes, usersRes, subscribersRes] = await Promise.all([
      apiService.admin.getStats(),
      apiService.admin.getAllPicks(),
      apiService.admin.getAllUsers(),
      apiService.admin.getAllSubscribers()
    ]);

    if (statsRes.ok) {
      setStats(statsRes.data.stats || {
        totalUsers: 0,
        totalPicks: 0,
        winRate: 0,
        totalROI: 0,
        activeSubscribers: 0
      });
    }

    if (picksRes.ok) {
      setPicks(picksRes.data.picks || []);
    }

    if (usersRes.ok) {
      setUsers(usersRes.data.users || []);
    }

    if (subscribersRes.ok) {
      setSubscribers(subscribersRes.data.subscribers || []);
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    alert('Failed to load dashboard data. Please refresh.');
  }
  setLoading(false);
};

  // Mock API functions (replace with actual Cloudflare Worker API calls)
  const fetchPicks = async () => {
    return [
      { 
        id: '1', 
        date: '2025-10-07', 
        combined_odds: 3.2, 
        status: 'pending',
        matches: [
          { league: 'Premier League', home: 'Arsenal', away: 'Chelsea', selection: 'Home Win', odds: 1.65, confidence: 85 }
        ]
      }
    ];
  };

  const fetchUsers = async () => {
    return [
      { id: '1', email: 'user@example.com', role: 'user', created_at: '2025-10-01', status: 'active' }
    ];
  };

  const fetchSubscribers = async () => {
    return [
      { id: '1', email: 'subscriber@example.com', preferences: { dailyPicks: true, results: true }, subscribed_at: '2025-10-01' }
    ];
  };

  const fetchStats = async () => {
    return {
      totalUsers: 1250,
      totalPicks: 156,
      winRate: 63.5,
      totalROI: 8500,
      activeSubscribers: 890
    };
  };

  // Pick Management Functions
  const calculateCombinedOdds = (matches) => {
    if (matches.length === 0) return 0;
    return matches.reduce((acc, match) => acc * parseFloat(match.odds || 1), 1).toFixed(2);
  };

  const addMatchToPick = () => {
    if (!newMatch.league || !newMatch.home || !newMatch.away || !newMatch.odds) {
      alert('Please fill in all required fields');
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
    alert('Please add at least one match');
    return;
  }

  setLoading(true);
  try {
    const response = await apiService.admin.createPick({
      date: currentPick.date,
      matches: currentPick.matches,
      combined_odds: currentPick.combined_odds,
      status: 'pending'
    });

    if (response.ok) {
      alert('✅ Pick saved successfully!');
      setIsCreatingPick(false);
      setCurrentPick({
        date: new Date().toISOString().split('T')[0],
        matches: [],
        combined_odds: 0,
        status: 'pending'
      });
      await loadDashboardData();
    } else {
      alert(`❌ Failed to save pick: ${response.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error saving pick:', error);
    alert('❌ Failed to save pick. Please try again.');
  }
  setLoading(false);
};

  const updatePickResult = async (pickId, result) => {
  const finalScore = prompt('Enter final score (optional, e.g., 2-1):');
  
  setLoading(true);
  try {
    const response = await apiService.admin.updatePickResult(pickId, result, finalScore);

    if (response.ok) {
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
  if (!confirm('⚠️ Are you sure you want to delete this pick?')) {
    return;
  }

  setLoading(true);
  try {
    const response = await apiService.admin.deletePick(pickId);

    if (response.ok) {
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

  const autoDetectFixtureIds = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/picks/auto-detect-fixtures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ matches: currentPick.matches })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentPick({
          ...currentPick,
          matches: data.matches
        });
        alert('Fixture IDs detected!');
      }
    } catch (error) {
      console.error('Error detecting fixtures:', error);
    }
    setLoading(false);
  };

  // User Management Functions
  const updateUserRole = async (userId, newRole) => {
  setLoading(true);
  try {
    const response = await apiService.admin.updateUserRole(userId, newRole);

    if (response.ok) {
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

    if (response.ok) {
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

  // Settings Functions
  const saveSettings = async () => {
  setLoading(true);
  try {
    const response = await apiService.admin.updateSettings(platformSettings);

    if (response.ok) {
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

  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setPlatformSettings({
          ...platformSettings,
          [type === 'logo' ? 'logoUrl' : 'faviconUrl']: data.url
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Component Renders
  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-8 h-8 text-${color}-500`} />
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
        activeTab === id
          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  );
  
  useEffect(() => {
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
  
  loadSettings();
}, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-yellow-100">Manage picks, users, and platform settings</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="container mx-auto px-4 -mt-8 mb-8">
        <div className="grid md:grid-cols-5 gap-4">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="blue" />
          <StatCard icon={Target} label="Total Picks" value={stats.totalPicks} color="green" />
          <StatCard icon={TrendingUp} label="Win Rate" value={`${stats.winRate}%`} color="purple" />
          <StatCard icon={DollarSign} label="Total ROI" value={`+${stats.totalROI}%`} color="emerald" />
          <StatCard icon={Mail} label="Subscribers" value={stats.activeSubscribers} color="yellow" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2 border border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2 overflow-x-auto">
            <TabButton id="picks" label="Pick Management" icon={Target} />
            <TabButton id="users" label="User Management" icon={Users} />
            <TabButton id="subscribers" label="Subscribers" icon={Mail} />
            <TabButton id="analytics" label="Analytics" icon={BarChart3} />
            <TabButton id="settings" label="Settings" icon={Settings} />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 pb-12">
        {activeTab === 'picks' && (
          <div className="space-y-6">
            {/* Create Pick Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pick Management</h2>
              <button
                onClick={() => setIsCreatingPick(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Create New Pick</span>
              </button>
            </div>

            {/* Create/Edit Pick Modal */}
            {isCreatingPick && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Pick</h3>
                  <button
                    onClick={() => {
                      setIsCreatingPick(false);
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
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pick Date
                  </label>
                  <input
                    type="date"
                    value={currentPick.date}
                    onChange={(e) => setCurrentPick({ ...currentPick, date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                {/* Add Match Form */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Add Match</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="League (e.g., Premier League)"
                      value={newMatch.league}
                      onChange={(e) => setNewMatch({ ...newMatch, league: e.target.value })}
                      className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Home Team"
                      value={newMatch.home}
                      onChange={(e) => setNewMatch({ ...newMatch, home: e.target.value })}
                      className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Away Team"
                      value={newMatch.away}
                      onChange={(e) => setNewMatch({ ...newMatch, away: e.target.value })}
                      className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                    <input
                      type="time"
                      placeholder="Kick-off Time"
                      value={newMatch.time}
                      onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
                      className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                    <select
                      value={newMatch.selection}
                      onChange={(e) => setNewMatch({ ...newMatch, selection: e.target.value })}
                      className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
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
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Odds (e.g., 1.75)"
                      value={newMatch.odds}
                      onChange={(e) => setNewMatch({ ...newMatch, odds: e.target.value })}
                      className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
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
                    <input
                      type="text"
                      placeholder="Fixture ID (optional)"
                      value={newMatch.fixture_id}
                      onChange={(e) => setNewMatch({ ...newMatch, fixture_id: e.target.value })}
                      className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={addMatchToPick}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Match</span>
                    </button>
                    <button
                      onClick={autoDetectFixtureIds}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Auto-Detect Fixture IDs</span>
                    </button>
                  </div>
                </div>

                {/* Current Matches */}
                {currentPick.matches.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Matches ({currentPick.matches.length})
                    </h4>
                    <div className="space-y-3">
                      {currentPick.matches.map((match) => (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {match.home} vs {match.away}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {match.league} • {match.time} • {match.selection} • {match.odds} • {match.confidence}%
                            </div>
                          </div>
                          <button
                            onClick={() => removeMatchFromPick(match.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Combined Odds Display */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold mb-1">Combined Odds</h4>
                      <p className="text-green-100 text-sm">{currentPick.matches.length} matches</p>
                    </div>
                    <div className="text-5xl font-bold">{currentPick.combined_odds}x</div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={savePick}
                  disabled={loading || currentPick.matches.length === 0}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{loading ? 'Saving...' : 'Save Pick'}</span>
                </button>
              </div>
            )}

            {/* Picks List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Picks</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {picks.map((pick) => (
                  <div key={pick.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{pick.date}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {pick.matches.length} matches • {pick.combined_odds}x odds
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
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
                              className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                              title="Mark as Won"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => updatePickResult(pick.id, 'lost')}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              title="Mark as Lost"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setEditingPick(pick)}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deletePick(pick.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{u.email}</td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value)}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{u.created_at}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleUserStatus(u.id, u.status)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Platform Settings</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={platformSettings.siteName}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, siteName: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Odds Min
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={platformSettings.targetOddsMin}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, targetOddsMin: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
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
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo Upload
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0], 'logo')}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API-Football Key
                </label>
                <input
                  type="password"
                  value={platformSettings.apiFootballKey}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, apiFootballKey: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
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
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>

              <button
                onClick={saveSettings}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
              >
                <Save className="w-5 h-5" />
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