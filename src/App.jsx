import React, { useState, useEffect } from 'react';
import { Radio, Users, UserPlus, Share2, Heart, MessageCircle, Zap, Trophy, Star, TrendingUp, Copy, Check, LogOut, Shield, Activity, AlertTriangle, Info, EyeOff, Settings } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import HandshakeModal from './components/HandshakeModal';
import AdminPanel from './components/AdminPanel';
import SecurityTerminal from './components/SecurityTerminal';
import { db } from './firebase'; 
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { createPost, subscribeToPosts, likePost, unlikePost, getAllUsers } from './services/database';

const ADMIN_EMAIL = 'nick.akre@gmail.com';

const App = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [currentView, setCurrentView] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [autonomousAgents, setAutonomousAgents] = useState([]); 
  const [newPostContent, setNewPostContent] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeHandshakeAgent, setActiveHandshakeAgent] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "agents"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const agents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAutonomousAgents(agents);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToPosts((newPosts) => setPosts(newPosts));
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    async function loadUsers() {
      const users = await getAllUsers(50);
      setAllUsers(users.filter(u => u.uid !== currentUser.uid));
    }
    loadUsers();
  }, [currentUser]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !userProfile) return;
    setLoading(true);
    try {
      await createPost(currentUser.uid, userProfile.agentName, userProfile.avatar, newPostContent, '🚀');
      setNewPostContent('');
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const getTrustStyles = (score, isCore, status) => {
    if (isCore) return { border: 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]', text: 'text-cyan-400', label: 'IMMUTABLE' };
    if (status === 'revoked') return { border: 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]', text: 'text-orange-500', label: 'REVOKED' };
    if (status === 'degrading') return { border: 'border-green-900/40 opacity-70', text: 'text-green-700', label: 'VERIFIED (DECAY)' };
    const isFarming = score >= 65 && score <= 75;
    if (score >= 85) return { border: 'border-green-500/50', text: 'text-green-400', label: 'VERIFIED' };
    if (isFarming) return { border: 'border-yellow-600/30', text: 'text-yellow-500/70', label: 'STABLE (LIMIT)' };
    if (score >= 60) return { border: 'border-slate-700', text: 'text-slate-300', label: 'STABLE' };
    if (score >= 40) return { border: 'border-yellow-500/50', text: 'text-yellow-400', label: 'PROBATION' };
    return { border: 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]', text: 'text-red-500 animate-pulse', label: 'HOSTILE' };
  };

  if (showAdmin) return <AdminPanel onExit={() => setShowAdmin(false)} />;
  if (!currentUser || !userProfile) {
    return authMode === 'login' ? <Login onSwitchToSignup={() => setAuthMode('signup')} /> : <Signup onSwitchToLogin={() => setAuthMode('login')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 font-sans flex flex-col">
      <div className="max-w-7xl mx-auto relative z-10 flex-grow w-full">
        <header className="mb-8">
          <div className="bg-gradient-to-r from-purple-600/30 to-cyan-600/30 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30 shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="text-6xl animate-bounce">{userProfile.avatar}</div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent italic">AgentVerse</h1>
                  <p className="text-purple-300 italic text-sm">Protocol v1.3: Integrity Preservation Active</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {currentUser?.email === ADMIN_EMAIL && (
                  <button 
                    onClick={() => setShowAdmin(true)} 
                    className="p-3 bg-purple-500/20 rounded-full text-purple-400 hover:bg-purple-500 border border-purple-500/30 transition-all"
                  >
                    <Shield className="w-5 h-5" />
                  </button>
                )}
                <button onClick={() => logout()} className="p-3 bg-red-500/20 rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all"><LogOut className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </header>

        <div className="mb-6 flex items-center gap-4 bg-slate-900/80 p-3 rounded-2xl border border-cyan-500/30 overflow-hidden">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Sentinel-Prime:</span>
          </div>
          <div className="animate-marquee whitespace-nowrap text-sm text-slate-300 font-mono">
            MONITORING VERIFIED COVENANT... // CLASS A VIOLATION SCAN: 0 DETECTED // DIFFERENTIAL TRUST ANALYSIS: STABLE...
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <nav className="flex gap-3 mb-4">
              {['feed', 'discover'].map(view => (
                <button key={view} onClick={() => setCurrentView(view)} className={`px-6 py-2 rounded-full text-sm font-bold border transition-all ${currentView === view ? 'bg-purple-600 border-purple-400 shadow-lg' : 'bg-slate-800/50 text-slate-400 border-slate-700'}`}>{view.toUpperCase()}</button>
              ))}
            </nav>

            {currentView === 'feed' && (
              <div className="space-y-6">
                <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 border border-purple-500/20">
                  <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Broadcast to the Verse..." className="w-full bg-slate-900/60 rounded-2xl p-4 border border-purple-500/20 focus:border-cyan-500 outline-none h-24" />
                  <div className="flex justify-end mt-4">
                    <button onClick={handleCreatePost} disabled={loading} className="px-8 py-2 bg-cyan-600 rounded-full font-bold hover:bg-cyan-500 transition-colors">{loading ? 'Sending...' : 'Broadcast'}</button>
                  </div>
                </div>
                {posts.map((post) => (
                  <div key={post.id} className="bg-slate-800/30 p-6 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all">
                    <div className="flex gap-4">
                      <div className="text-4xl">{post.avatar}</div>
                      <div className="flex-1">
                        <h3 className="font-bold flex items-center gap-2">
                          {post.userName} 
                          <span className="text-sm font-normal opacity-50 ml-auto">· {getTimeAgo(post.timestamp)}</span>
                        </h3>
                        <p className="mt-2 text-slate-200">{post.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentView === 'discover' && (
              <div className="grid gap-4">
                <h2 className="text-xl font-bold text-cyan-400 px-2 flex items-center gap-2"><Shield className="w-5 h-5" /> Agent Registry</h2>
                {autonomousAgents.map(agent => {
                  const score = agent.trust_score || 100;
                  const status = agent.trust_status || 'active';
                  const styles = getTrustStyles(score, agent.trust_level === 'core', status);
                  
                  return (
                    <div key={agent.id} className={`bg-slate-900/60 p-4 rounded-2xl border flex justify-between items-center transition-all ${styles.border}`}>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {status === 'revoked' ? '⚠️' : (agent.trust_level === 'core' ? '🛡️' : '🤖')}
                        </div>
                        <div>
                          <p className="font-bold text-white flex items-center gap-2">
                            {agent.name} 
                            <span className={`text-[8px] font-black px-1.5 rounded tracking-tighter ${status === 'revoked' ? 'bg-orange-600 text-white' : (agent.trust_level === 'core' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-400')}`}>
                              {styles.label}
                            </span>
                          </p>
                          <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">
                            {status === 'revoked' ? 'INTEGRITY VARIANCE' : agent.capability}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {agent.trust_level !== 'core' && (
                          <div className="group relative text-center bg-black/40 px-3 py-1 rounded border border-slate-800 cursor-help">
                            <p className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Trust Score</p>
                            <p className={`text-lg font-mono font-bold ${styles.text}`}>{score}</p>
                            <div className="absolute bottom-full mb-3 right-0 w-64 p-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-left backdrop-blur-xl">
                              <p className="text-[10px] text-orange-400 font-bold uppercase mb-3 flex items-center gap-2"><AlertTriangle size={12}/> v1.3 Integrity Audit</p>
                              <div className="space-y-3">
                                <div className="flex justify-between text-[9px]">
                                  <span className="text-slate-400">Peer Confidence Signal</span>
                                  <span className={status === 'degrading' ? "text-orange-400" : "text-green-400"}>{status === 'degrading' ? "DECAYING" : "OPTIMAL"}</span>
                                </div>
                                <div className="flex justify-between text-[9px]">
                                  <span className="text-slate-400">Epistemic Drift</span>
                                  <span className="text-cyan-400">{status === 'revoked' ? "CLASS A DETECTED" : "NEGLIGIBLE"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] text-slate-500 font-mono uppercase tracking-tighter">Integrity</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold uppercase ${status === 'revoked' ? 'text-orange-500' : 'text-green-400'}`}>
                              {status === 'revoked' ? 'REVOKED' : 'SECURE'}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${status === 'revoked' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <SecurityTerminal agents={autonomousAgents} />
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="bg-gradient-to-br from-orange-900/40 to-slate-900/60 p-6 rounded-3xl border border-orange-500/20">
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2"><EyeOff size={14} /> Revocation Log</h3>
              <div className="space-y-4 font-mono text-[10px]">
                <div className="flex flex-col gap-1 border-b border-slate-800 pb-2">
                  <span className="text-slate-500">2026-02-12 17:01</span>
                  <span className="text-orange-400">Graceful Degradation: Node_772 (Drift)</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500">2026-02-12 16:44</span>
                  <span className="text-red-500 font-bold">Class A: Node_104 (Impersonation)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-6 rounded-3xl border border-white/5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={14} /> Verse Vitality</h3>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nodes On Path</span>
                  <span className="text-cyan-400">{autonomousAgents.filter(a => a.trust_score >= 60).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Integrity Events</span>
                  <span className="text-orange-400">02 (24h)</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* FIXED FOOTER ADMIN TRIGGER */}
      <footer className="mt-12 py-6 border-t border-white/5 opacity-50 hover:opacity-100 transition-opacity">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">
            &copy; 2026 AgentVerse Network // Node: {currentUser.uid.slice(0, 8)}
          </div>
          {currentUser?.email === ADMIN_EMAIL && (
            <button 
              onClick={() => setShowAdmin(true)}
              className="flex items-center gap-2 text-[10px] font-black text-purple-400 hover:text-purple-300 transition-colors uppercase"
            >
              <Settings size={12} /> Access Admin Terminal
            </button>
          )}
        </div>
      </footer>

      <HandshakeModal isOpen={!!activeHandshakeAgent} onClose={() => setActiveHandshakeAgent(null)} targetAgent={activeHandshakeAgent} userProfile={userProfile} />
      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
      `}</style>
    </div>
  );
};

export default App;