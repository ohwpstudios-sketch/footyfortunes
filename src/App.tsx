import authService from './services/authService';
import apiService from './services/apiService';
import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import { 
  Trophy, TrendingUp, Target, Calendar, Clock, BarChart3, 
  Settings, User, LogOut, Menu, X, Bell, Search, Filter,
  Home, Archive, Calculator, Wallet, Plus, Edit2, Trash2,
  CheckCircle, XCircle, AlertCircle, Download, Upload,
  Share2, Users, Mail, Activity, DollarSign, Shield,
  Sun, Moon, Eye, EyeOff, Lock, Unlock, ChevronDown,
  ChevronRight, RefreshCw, ExternalLink, TrendingDown
} from 'lucide-react';

// ==== Types ====
type Role = 'user' | 'admin';

interface UserType {
  email: string;
  role: Role;
}

interface Match {
  id: number;
  league: string;
  home: string;
  away: string;
  time: string;
  selection: string;
  odds: number;
  confidence: number;
}

interface TodayPicks {
  id: string;
  date: string;
  combined_odds: number;
  status: string;
  matches: Match[];
}

interface ArchivePick {
  id: string;
  date: string;
  combined_odds: number;
  status: string;
  roi: number;
}

interface ArchiveStats {
  totalPicks: number;
  won: number;
  lost: number;
  winRate: number;
  totalROI: number;
}

interface ArchiveData {
  success: boolean;
  picks: ArchivePick[];
  stats: ArchiveStats;
}


// Mock API functions (replace with actual Cloudflare Workers API calls)
const api = {
  // Login: mydaily2plusodds@gmail.com / angels2G9@84? -> role: 'admin', else 'user'
  login: async (email: string, password: string) => {
    const isAdmin =
      email.trim().toLowerCase() === 'mydaily2plusodds@gmail.com' &&
      password === 'angels2G9@84?';

    return {
      success: true,
      token: 'mock-token',
      user: {
        email,
        role: isAdmin ? ('admin' as const) : ('user' as const),
      },
    };
  },

  // Register: everyone is created as a normal user in this mock
  register: async (email: string, password: string) => {
    return {
      success: true,
      token: 'mock-token',
      user: {
        email,
        role: 'user' as const,
      },
    };
  },

  // Today’s picks: demo payload
  getTodaysPicks: async () => {
    return {
      success: true,
      picks: {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        combined_odds: 3.2,
        status: 'pending',
        matches: [
          {
            id: 1,
            league: 'Premier League',
            home: 'Arsenal',
            away: 'Chelsea',
            time: '20:00',
            selection: 'Home Win',
            odds: 1.65,
            confidence: 85,
          },
          {
            id: 2,
            league: 'La Liga',
            home: 'Barcelona',
            away: 'Real Madrid',
            time: '21:00',
            selection: 'Over 2.5',
            odds: 1.75,
            confidence: 78,
          },
          {
            id: 3,
            league: 'Bundesliga',
            home: 'Bayern',
            away: 'Dortmund',
            time: '18:30',
            selection: 'BTTS',
            odds: 1.55,
            confidence: 82,
          },
        ],
      },
    };
  },

  // Archive: demo payload
  getArchive: async () => {
    return {
      success: true,
      picks: [
        { id: '1', date: '2025-10-06', combined_odds: 3.1, status: 'won', roi: 210 },
        { id: '2', date: '2025-10-05', combined_odds: 2.8, status: 'lost', roi: -100 },
        { id: '3', date: '2025-10-04', combined_odds: 3.5, status: 'won', roi: 250 },
      ],
      stats: {
        totalPicks: 150,
        won: 95,
        lost: 55,
        winRate: 63.3,
        totalROI: 8500,
      },
    };
  },
};

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [currentPage, setCurrentPage] = useState<'home'|'login'|'register'|'dashboard'|'archive'|'admin-dashboard'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [todaysPicks, setTodaysPicks] = useState<TodayPicks | null>(null);
  const [archive, setArchive] = useState<ArchiveData | null>(null);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Initialize authentication on app load
useEffect(() => {
  const authState = authService.initializeAuth();

  if (authState.isAuthenticated && authState.user) {
    setIsAuthenticated(true);

    // Ensure the user matches your TypeScript types
    const typedUser: UserType = {
      email: authState.user.email,
      role: authState.user.role as Role,
    };
    setUser(typedUser);

    // Redirect admin users to admin dashboard; others to dashboard
    if (authState.user.role === 'admin') {
      setCurrentPage('admin-dashboard');
    } else {
      setCurrentPage('dashboard');
    }
  }
}, []);


  // Authentication persists only during the session (in-memory)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

const handleLogin = async (email: string, password: string) => {
  setLoading(true);
  try {
    const response = await apiService.login(email, password);

    if (response.ok && response.data.success) {
      // Save session using authService
      authService.saveSession(response.data.token, response.data.user);
      
      setIsAuthenticated(true);
      setUser(response.data.user);
      
      // Route based on role
      if (response.data.user.role === 'admin') {
        setCurrentPage('admin-dashboard');
      } else {
        setCurrentPage('dashboard');
      }
    } else {
      alert(response.data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed. Please try again.');
  }
  setLoading(false);
};

  const handleLogout = () => {
  authService.clearSession();
  setIsAuthenticated(false);
  setUser(null);
  setCurrentPage('home');
};

  const loadTodaysPicks = async () => {
    setLoading(true);
    try {
      const response = await api.getTodaysPicks();
      if (response.success) {
        setTodaysPicks(response.picks);
      }
    } catch (error) {
      console.error('Error loading picks:', error);
    }
    setLoading(false);
  };

  const loadArchive = async () => {
    setLoading(true);
    try {
      const response = await api.getArchive();
      if (response.success) {
        setArchive(response);
      }
    } catch (error) {
      console.error('Error loading archive:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentPage === 'dashboard' && !todaysPicks) {
      loadTodaysPicks();
    }
    if (currentPage === 'archive' && !archive) {
      loadArchive();
    }
  }, [currentPage]);

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
      {/* Header */}
      <header className="fixed top-0 w-full bg-black/20 backdrop-blur-md z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-white">FootyFortunes</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-white/80 hover:text-white transition">Features</a>
            <a href="#how-it-works" className="text-white/80 hover:text-white transition">How it Works</a>
            <a href="#pricing" className="text-white/80 hover:text-white transition">Pricing</a>
            <button
              onClick={() => setCurrentPage('login')}
              className="px-4 py-2 text-white/80 hover:text-white transition"
            >
              Login
            </button>
            <button
              onClick={() => setCurrentPage('register')}
              className="px-6 py-2 bg-yellow-400 text-emerald-900 rounded-lg font-semibold hover:bg-yellow-300 transition"
            >
              Get Started
            </button>
          </nav>
          <button className="md:hidden text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-yellow-400/20 rounded-full text-yellow-400 text-sm font-semibold mb-6">
            ⚽ AI-Powered Predictions • 63% Win Rate
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Daily 2+ Odds
            <br />
            <span className="text-yellow-400">AI Football Picks</span>
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Get expertly curated football betting predictions powered by advanced AI. 
            Daily picks with combined odds between 2.5-3.5x, complete with live tracking and performance analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setCurrentPage('register')}
              className="px-8 py-4 bg-yellow-400 text-emerald-900 rounded-lg font-bold text-lg hover:bg-yellow-300 transition transform hover:scale-105"
            >
              Start Free Trial
            </button>
            <button className="px-8 py-4 bg-white/10 text-white rounded-lg font-bold text-lg hover:bg-white/20 transition backdrop-blur-sm">
              View Today's Picks
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { label: 'Win Rate', value: '63.3%', icon: TrendingUp },
              { label: 'Total ROI', value: '+8,500%', icon: DollarSign },
              { label: 'Daily Picks', value: '3-5', icon: Target },
              { label: 'Active Users', value: '12K+', icon: Users }
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <stat.icon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-black/20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Everything You Need to Win
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Activity,
                title: 'Live Score Tracking',
                description: 'Real-time match updates and live score tracking for all your picks'
              },
              {
                icon: BarChart3,
                title: 'Performance Analytics',
                description: 'Detailed statistics, ROI tracking, and historical performance data'
              },
              {
                icon: Bell,
                title: 'Instant Notifications',
                description: 'Telegram and email alerts for new picks, results, and updates'
              },
              {
                icon: Calculator,
                title: 'Betting Calculator',
                description: 'Calculate returns, accumulator odds, and potential profits'
              },
              {
                icon: Wallet,
                title: 'Bankroll Manager',
                description: 'Set betting budgets and track unit sizing automatically'
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Bank-level security with Cloudflare protection'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10 hover:bg-white/10 transition">
                <feature.icon className="w-12 h-12 text-yellow-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-12">
            <h2 className="text-4xl font-bold text-emerald-900 mb-4">
              Ready to Start Winning?
            </h2>
            <p className="text-emerald-900/80 text-lg mb-8">
              Join thousands of successful bettors using AI-powered predictions
            </p>
            <button
              onClick={() => setCurrentPage('register')}
              className="px-8 py-4 bg-emerald-900 text-yellow-400 rounded-lg font-bold text-lg hover:bg-emerald-800 transition"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-xl font-bold text-white">FootyFortunes</span>
              </div>
              <p className="text-white/60 text-sm">
                AI-powered football predictions for smarter betting decisions.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>Features</li>
                <li>Pricing</li>
                <li>API</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>About</li>
                <li>Contact</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>Privacy</li>
                <li>Terms</li>
                <li>Disclaimer</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
            © 2025 FootyFortunes. All rights reserved. Gamble responsibly.
          </div>
        </div>
      </footer>
    </div>
  );

  // Auth Pages
  interface AuthPageProps {
  mode: 'login' | 'register';
}

const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (mode === 'login') {
      await handleLogin(email, password);
    } else {
      const response = await api.register(email, password);
      if (response.success) {
        await handleLogin(email, password);
      }
    }
  };


    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-white/60">
              {mode === 'login' ? 'Sign in to view your picks' : 'Create your account to start winning'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="••••••••"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-yellow-400 text-emerald-900 rounded-lg font-bold hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setCurrentPage(mode === 'login' ? 'register' : 'login')}
              className="text-yellow-400 hover:text-yellow-300 text-sm"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <button
            onClick={() => setCurrentPage('home')}
            className="mt-4 w-full text-white/60 hover:text-white text-sm"
          >
            ← Back to home
          </button>
        </div>
      </div>
    );
  };

  // Dashboard Component
  const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('today');

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">FootyFortunes</span>
                </div>
                <div className="hidden md:flex space-x-1">
                  {[
                    { id: 'today', label: 'Today', icon: Home },
                    { id: 'archive', label: 'Archive', icon: Archive },
                    { id: 'calculator', label: 'Calculator', icon: Calculator },
                    { id: 'profile', label: 'Profile', icon: User }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                        activeTab === tab.id
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {activeTab === 'today' && <TodaysPicks picks={todaysPicks} loading={loading} onRefresh={loadTodaysPicks} />}
          {activeTab === 'archive' && <ArchiveView archive={archive} loading={loading} />}
          {activeTab === 'calculator' && <BettingCalculator />}
          {activeTab === 'profile' && <ProfileView user={user} />}
        </div>
      </div>
    );
  };

  // Today's Picks Component
  const TodaysPicks: React.FC<{
  picks: TodayPicks | null;
  loading: boolean;
  onRefresh: () => void;
}> = ({ picks, loading, onRefresh }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin" />
        </div>
      );
    }

    if (!picks) {
      return (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Picks Available</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Check back later for today's selections</p>
          <button
            onClick={onRefresh}
            className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
          >
            Refresh
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Today's Picks</h2>
              <p className="text-yellow-100">{picks.date}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{picks.combined_odds}x</div>
              <div className="text-yellow-100">Combined Odds</div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <span className="font-semibold">{picks.matches.length} Matches</span>
            </div>
            <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <span className="font-semibold capitalize">{picks.status}</span>
            </div>
            <button
              onClick={onRefresh}
              className="ml-auto px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Matches */}
        <div className="grid gap-4">
          {picks.matches.map((match: Match) => (
            <div key={match.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{match.league}</div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{match.home}</span>
                    <span className="text-gray-400">vs</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{match.away}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{match.time}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg font-semibold">
                    {match.selection}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{match.odds}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-semibold">{match.confidence}% Confidence</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Potential Return */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Potential Return</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">If all picks win with $100 stake</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${(picks.combined_odds * 100).toFixed(2)}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                +${((picks.combined_odds - 1) * 100).toFixed(2)} profit
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Archive View
  const ArchiveView: React.FC<{
  archive: ArchiveData | null;
  loading: boolean;
}> = ({ archive, loading }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin" />
        </div>
      );
    }

    if (!archive) return null;

    return (
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: 'Total Picks', value: archive.stats.totalPicks, icon: Target, color: 'blue' },
            { label: 'Won', value: archive.stats.won, icon: CheckCircle, color: 'green' },
            { label: 'Lost', value: archive.stats.lost, icon: XCircle, color: 'red' },
            { label: 'Win Rate', value: `${archive.stats.winRate}%`, icon: TrendingUp, color: 'yellow' }
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ROI Card */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Total ROI</h3>
              <p className="text-green-100 text-sm">Return on Investment</p>
            </div>
            <div className="text-5xl font-bold">+{archive.stats.totalROI}%</div>
          </div>
        </div>

        {/* Archive List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Historical Picks</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {archive.picks.map((pick: ArchivePick) => (
              <div key={pick.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{pick.date}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Combined Odds: {pick.combined_odds}x</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`px-4 py-2 rounded-lg font-semibold ${
                      pick.status === 'won'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {pick.status === 'won' ? 'Won' : 'Lost'}
                    </div>
                    <div className={`text-lg font-bold ${
                      pick.roi > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {pick.roi > 0 ? '+' : ''}{pick.roi}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Betting Calculator
  const BettingCalculator = () => {
    const [stake, setStake] = useState(100);
    const [odds1, setOdds1] = useState(1.65);
    const [odds2, setOdds2] = useState(1.75);
    const [odds3, setOdds3] = useState(1.55);

    const totalOddsNum = (odds1 * odds2 * odds3);
	const totalOdds = totalOddsNum.toFixed(2);
	const potentialReturn = (stake * totalOddsNum).toFixed(2);
	const profit = (Number(potentialReturn) - stake).toFixed(2);

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Calculator className="w-8 h-8 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Betting Calculator</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stake Amount ($)
              </label>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Match Odds
              </label>
              {[
                { value: odds1, setter: setOdds1, label: 'Match 1' },
                { value: odds2, setter: setOdds2, label: 'Match 2' },
                { value: odds3, setter: setOdds3, label: 'Match 3' }
              ].map((match, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20">{match.label}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={match.value}
                    onChange={(e) => match.setter(Number(e.target.value))}
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Odds</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalOdds}x</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Potential Return</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">${potentialReturn}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Profit</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">+${profit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Profile View
  const ProfileView: React.FC<{ user: UserType | null }> = ({ user }) => {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.email}</h2>
              <p className="text-gray-500 dark:text-gray-400">Member since 2025</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Email Notifications</span>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
                Enabled
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Telegram Alerts</span>
              <button className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition">
                Connect
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Account Type</span>
              <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg font-semibold">
                Premium
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main Render
  return (
  <div className={darkMode ? 'dark' : ''}>
    {!isAuthenticated && currentPage === 'home' && <LandingPage />}
    {!isAuthenticated && currentPage === 'login' && <AuthPage mode="login" />}
    {!isAuthenticated && currentPage === 'register' && <AuthPage mode="register" />}

    {/* ✅ Regular authenticated dashboard */}
    {isAuthenticated && currentPage === 'dashboard' && <Dashboard />}

    {/* 🆕 Admin dashboard route (only for admin users) */}
    {isAuthenticated && currentPage === 'admin-dashboard' && user?.role === 'admin' && (
      <AdminDashboard
        user={{ ...user, token: authToken ?? '' }}
        darkMode={darkMode}
      />
    )}
  </div>
);
};


export default App;