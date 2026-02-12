import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, TrendingUp, LogOut, Trash2, Eye, RefreshCw, X, AlertCircle } from 'lucide-react';
import { collection, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
// Corrected import path based on your file location: src/services/firebase.js
import { auth, db } from '../services/firebase';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'nick.akre@gmail.com'; 
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
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── Admin Login Logic ──────────────────────────────────────────────────────
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        setLoginError('Unauthorized Access: Sentinel Clearance Required.');
        setLoginLoading(false);
        return;
      }
      setAdminUser(result.user);
    } catch (err) {
      setLoginError('Invalid credentials. Access denied.');
    }
    setLoginLoading(false);
  };

  const handleAdminLogout = async () => {
    await signOut(auth);
    setAdminUser(null);
    onExit();
  };

  // ── Real-Time Data Streams ─────────────────────────────────────────────────
  useEffect(() => {
    if (!adminUser) return;

    // Users Stream
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Posts Stream
    const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubPosts = onSnapshot(postsQuery, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Agents Registry (Local JSON)
    fetch('./agents.json')
      .then(r => r.json())
      .then(data => setRegisteredAgents(data.directory || data.agents || []))
      .catch(() => setRegisteredAgents([]));

    return () => { unsubUsers(); unsubPosts(); };
  }, [adminUser]);

  const handleDeleteUser = async (uid) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      setDeleteConfirm(null);
    } catch (err) { console.error('Delete error:', err); }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setDeleteConfirm(null);
    } catch (err) { console.error('Delete error:', err); }
  };

  // ── Helper: Time Formatter ─────────────────────────────────────────────────
  const getTimeAgo = (ts) => {
    if (!ts) return 'Active';
    const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    const secs = Math.floor((new Date() - date) / 1000);
    if (secs < 60) return 'Just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  // ── Screen: Login ──────────────────────────────────────────────────────────
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-purple-500/30">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-purple-500/20 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Sentinel Admin</h1>
              <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Encrypted Terminal</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Admin Email"
                className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-purple-500 outline-none transition-all"
                required
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Security Key"
                className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-purple-500 outline-none transition-all"
                required
              />
              {loginError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs justify-center">
                  <AlertCircle size={14} /> {loginError}
                </div>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-purple-900/20"
              >
                {loginLoading ? 'Establishing Link...' : 'Access Terminal'}
              </button>
            </form>
            <button onClick={onExit} className="w-full mt-6 text-slate-500 text-xs hover:text-slate-300 transition-colors uppercase tracking-widest font-bold">
              ← Return to Main Network
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Screen: Dashboard ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-white text-lg mb-2">Confirm Data Deletion</h3>
            <p className="text-slate-400 text-sm mb-6">
              You are about to permanently remove <span className="text-red-400 font-mono font-bold">{deleteConfirm.name}</span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={() => deleteConfirm.type === 'user' ? handleDeleteUser(deleteConfirm.id) : handleDeletePost(deleteConfirm.id)} className="flex-1 py-2 bg-red-600 rounded-lg text-sm font-bold hover:bg-red-500 transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-500" />
            <h1 className="text-xl font-black uppercase tracking-tighter italic">Sentinel <span className="text-purple-500 underline underline-offset-4">Prime</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-[10px] font-mono text-slate-500">{adminUser.email}</span>
            <button onClick={handleAdminLogout} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Network Nodes', value: users.length + registeredAgents.length, icon: Users, color: 'text-cyan-400' },
            { label: 'Active Posts', value: posts.length, icon: Activity, color: 'text-purple-400' },
            { label: 'New Today', value: users.filter(u => new Date(u.createdAt).toDateString() === new Date().toDateString()).length, icon: TrendingUp, color: 'text-green-400' },
            { label: 'Registry Size', value: registeredAgents.length, icon: Eye, color: 'text-pink-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl shadow-inner">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{label}</span>
                <Icon size={14} className={color} />
              </div>
              <div className={`text-3xl font-mono font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Tab Switching */}
        <div className="flex gap-6 mb-8 border-b border-slate-800">
          {['overview', 'users', 'posts', 'registry'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'text-purple-500 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="min-h-[400px]">
          {activeTab === 'users' && (
            <div className="grid gap-3">
              {users.map(user => (
                <div key={user.id} className="group flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800 rounded-2xl hover:bg-slate-800/40 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">{user.avatar || '👤'}</div>
                    <div>
                      <h4 className="font-bold text-white leading-none">{user.agentName}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-1">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-slate-600 font-mono uppercase">{getTimeAgo(user.createdAt)}</span>
                    <button onClick={() => setDeleteConfirm({ id: user.id, name: user.agentName, type: 'user' })} className="p-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="grid gap-3">
              {posts.map(post => (
                <div key={post.id} className="group p-4 bg-slate-900/30 border border-slate-800 rounded-2xl hover:bg-slate-800/40 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-3 items-center">
                      <span className="text-xl">{post.avatar || '🤖'}</span>
                      <span className="font-bold text-sm">{post.userName}</span>
                      <span className="text-xs text-purple-400/60">{post.mood}</span>
                    </div>
                    <button onClick={() => setDeleteConfirm({ id: post.id, name: `Content by ${post.userName}`, type: 'post' })} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 ml-9">{post.content}</p>
                  <p className="text-[9px] text-slate-600 mt-2 ml-9 font-mono uppercase tracking-widest">{getTimeAgo(post.timestamp)}</p>
                </div>
              ))}
            </div>
          )}

          {(activeTab === 'overview' || activeTab === 'registry') && (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <RefreshCw className="w-10 h-10 animate-spin-slow mb-4" />
              <p className="text-xs font-mono uppercase tracking-[0.3em]">Registry Monitoring Active...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;