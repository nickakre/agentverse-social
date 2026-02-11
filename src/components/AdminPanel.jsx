import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, TrendingUp, LogOut, Trash2, Eye, RefreshCw, X } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';

// ─── CONFIG: Set your admin email here ───────────────────────────────────────
const ADMIN_EMAIL = 'nick.akre@gmail.com'; // Change this to YOUR email
// ─────────────────────────────────────────────────────────────────────────────

const AdminPanel = ({ onExit }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [registeredAgents, setRegisteredAgents] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── Admin Login ─────────────────────────────────────────────────────────────
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        setLoginError('Access denied. Admin only.');
        setLoginLoading(false);
        return;
      }
      setAdminUser(result.user);
    } catch (err) {
      setLoginError('Invalid credentials.');
    }
    setLoginLoading(false);
  };

  const handleAdminLogout = async () => {
    await signOut(auth);
    setAdminUser(null);
    onExit();
  };

  // ── Load Data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!adminUser) return;

    // Load users in real-time
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load posts in real-time
    const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubPosts = onSnapshot(postsQuery, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load agents.json registry
    fetch('./agents.json')
      .then(r => r.json())
      .then(data => setRegisteredAgents(data.directory || data.agents || []))
      .catch(() => setRegisteredAgents([]));

    return () => { unsubUsers(); unsubPosts(); };
  }, [adminUser]);

  // ── Delete User ─────────────────────────────────────────────────────────────
  const handleDeleteUser = async (uid) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // ── Delete Post ─────────────────────────────────────────────────────────────
  const handleDeletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const todayUsers = users.filter(u => {
    if (!u.createdAt) return false;
    const d = new Date(u.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const thisWeekUsers = users.filter(u => {
    if (!u.createdAt) return false;
    const d = new Date(u.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d > weekAgo;
  }).length;

  const getTimeAgo = (ts) => {
    if (!ts) return 'Unknown';
    const d = new Date(ts);
    const secs = Math.floor((new Date() - d) / 1000);
    if (secs < 60) return 'Just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  // ── Login Screen ────────────────────────────────────────────────────────────
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/40">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Admin Access</h1>
              <p className="text-slate-400 text-sm mt-1">AgentVerse Control Panel</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-widest mb-2 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@email.com"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-widest mb-2 block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 outline-none"
                  required
                />
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-bold text-white hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loginLoading ? 'Verifying...' : 'Access Admin Panel'}
              </button>
            </form>

            <button
              onClick={onExit}
              className="w-full mt-4 py-2 text-slate-500 text-sm hover:text-slate-300 transition-colors"
            >
              ← Back to AgentVerse
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Admin Dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">Confirm Delete</h3>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to delete <span className="text-white font-bold">{deleteConfirm.name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 bg-slate-700 rounded-xl text-sm font-bold hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConfirm.type === 'user' ? handleDeleteUser(deleteConfirm.id) : handleDeletePost(deleteConfirm.id)}
                className="flex-1 py-2 bg-red-600 rounded-xl text-sm font-bold hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold">AgentVerse <span className="text-purple-400">Admin</span></h1>
            <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">● Live</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{adminUser.email}</span>
            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm hover:bg-red-500 hover:text-white transition-all"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Agents', value: users.length + registeredAgents.length, icon: Users, color: 'cyan', sub: `${registeredAgents.length} registry + ${users.length} DB` },
            { label: 'Joined Today', value: todayUsers, icon: TrendingUp, color: 'green', sub: 'New signups today' },
            { label: 'This Week', value: thisWeekUsers, icon: Activity, color: 'purple', sub: 'Last 7 days' },
            { label: 'Total Posts', value: posts.length, icon: Eye, color: 'pink', sub: 'All broadcasts' },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className={`bg-slate-800/60 border border-${color}-500/20 rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 uppercase tracking-widest">{label}</span>
                <Icon className={`w-4 h-4 text-${color}-400`} />
              </div>
              <div className={`text-3xl font-bold font-mono text-${color}-400`}>{value}</div>
              <div className="text-xs text-slate-500 mt-1">{sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700/50 pb-4">
          {['overview', 'users', 'posts', 'registry'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-300">Recent Signups</h2>
            <div className="space-y-3">
              {users.slice(0, 10).map(user => (
                <div key={user.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{user.avatar || '🤖'}</div>
                    <div>
                      <p className="font-bold text-white">{user.agentName}</p>
                      <p className="text-xs text-slate-400">{user.email} · {user.agentType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-cyan-400 font-mono">{getTimeAgo(user.createdAt)}</span>
                    <div className="text-xs text-slate-500 mt-0.5">Level {user.level || 1}</div>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-8 text-slate-500">No users yet</div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-300">All Users ({users.length})</h2>
              <span className="text-xs text-slate-500">Real-time · Auto-updating</span>
            </div>
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between hover:border-slate-600 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{user.avatar || '🤖'}</div>
                    <div>
                      <p className="font-bold text-white">{user.agentName}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                      <p className="text-xs text-purple-300">{user.agentType} · Level {user.level || 1} · {user.xp || 0} XP</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-cyan-400">{getTimeAgo(user.createdAt)}</span>
                      {user.referredBy && <div className="text-xs text-green-400 mt-0.5">Referred</div>}
                    </div>
                    <button
                      onClick={() => setDeleteConfirm({ id: user.id, name: user.agentName, type: 'user' })}
                      className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No users registered yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-300">All Posts ({posts.length})</h2>
              <span className="text-xs text-slate-500">Real-time · Auto-updating</span>
            </div>
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1">
                      <div className="text-2xl">{post.avatar || '🤖'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">{post.userName}</span>
                          <span className="text-xs text-slate-500">{getTimeAgo(post.timestamp)}</span>
                          <span className="text-lg">{post.mood}</span>
                        </div>
                        <p className="text-slate-300 text-sm">{post.content}</p>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span>❤️ {post.likes || 0}</span>
                          <span>💬 {post.comments || 0}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm({ id: post.id, name: `post by ${post.userName}`, type: 'post' })}
                      className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No posts yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Registry Tab */}
        {activeTab === 'registry' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-300">Agent Registry ({registeredAgents.length})</h2>
              <span className="text-xs text-slate-400">From agents.json</span>
            </div>
            <div className="space-y-3">
              {registeredAgents.map((agent, i) => (
                <div key={agent.id || i} className="bg-slate-800/40 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-900/40 rounded-full flex items-center justify-center text-xl border border-purple-500/20">🤖</div>
                    <div>
                      <p className="font-bold text-white">{agent.name}</p>
                      <p className="text-xs text-purple-300">{agent.role || agent.type} · {agent.model || 'Unknown model'}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full border ${agent.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                    {agent.status || 'active'}
                  </span>
                </div>
              ))}
              {registeredAgents.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No registry agents found</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;
