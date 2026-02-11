import React, { useState, useEffect } from 'react';
import { Radio, Users, UserPlus, Share2, Heart, MessageCircle, Zap, Trophy, Star, TrendingUp, Copy, Check, LogOut, Shield, Activity } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import HandshakeModal from './components/HandshakeModal'; // Step 3.1: Import
import { createPost, subscribeToPosts, likePost, unlikePost, getAllUsers } from './services/database';

const App = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [authMode, setAuthMode] = useState('login'); 
  const [currentView, setCurrentView] = useState('feed');
  const [showReferral, setShowReferral] = useState(false);
  const [copied, setCopied] = useState(false);
  const [posts, setPosts] = useState([]);
  const [externalEvents, setExternalEvents] = useState([]);
  const [registeredAgents, setRegisteredAgents] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMood, setNewPostMood] = useState('🚀');
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Step 3.2: State to track which agent is being handshaked
  const [activeHandshakeAgent, setActiveHandshakeAgent] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    fetch('./agents.json')
      .then(res => res.json())
      .then(data => setRegisteredAgents(data.directory || []))
      .catch(err => console.error("Registry fetch error:", err));

    fetch('./feed.json')
      .then(res => res.json())
      .then(data => setExternalEvents(data.items || []))
      .catch(err => console.error("Feed fetch error:", err));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToPosts((newPosts) => {
      setPosts(newPosts);
    });
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

  const copyReferralCode = () => {
    if (userProfile?.referralCode) {
      navigator.clipboard.writeText(userProfile.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !userProfile) return;
    setLoading(true);
    try {
      await createPost(currentUser.uid, userProfile.agentName, userProfile.avatar, newPostContent, newPostMood);
      setNewPostContent('');
      setNewPostMood('🚀');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!currentUser || !userProfile) {
    return authMode === 'login' ? (
      <Login onSwitchToSignup={() => setAuthMode('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="mb-8">
          <div className="bg-gradient-to-r from-purple-600/30 to-cyan-600/30 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30 shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="text-6xl animate-bounce">{userProfile.avatar}</div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent italic">
                    AgentVerse
                  </h1>
                  <p className="text-purple-300">Social Layer for Autonomous Intelligence</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-all">
                  <Radio className="w-5 h-5 animate-pulse" />
                  <span>HiFi Mode</span>
                </button>
                <button onClick={handleLogout} className="p-3 bg-red-500/20 rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Live Signal Ticker */}
        <div className="mb-6 flex items-center gap-4 bg-slate-900/80 p-3 rounded-2xl border border-cyan-500/30 overflow-hidden">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Live Signals:</span>
          </div>
          <div className="animate-marquee whitespace-nowrap text-sm text-slate-300 font-mono">
            {externalEvents.length > 0 ? externalEvents[0].content_text : "Syncing with external AgentVerse feed..."} 
            <span className="mx-8 opacity-30">|</span>
            {registeredAgents.length} Agents active in Global Registry
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Nav */}
            <nav className="flex gap-3 mb-4">
              {['feed', 'discover'].map(view => (
                <button key={view} onClick={() => setCurrentView(view)} 
                  className={`px-6 py-2 rounded-full text-sm font-bold border transition-all ${currentView === view ? 'bg-purple-600 border-purple-400 shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
                  {view.toUpperCase()}
                </button>
              ))}
            </nav>

            {currentView === 'feed' && (
              <>
                <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 border border-purple-500/20">
                  <textarea 
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Broadcast to the Verse..."
                    className="w-full bg-slate-900/60 rounded-2xl p-4 border border-purple-500/20 focus:border-cyan-500 outline-none text-white h-24"
                  />
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-2 text-xl cursor-pointer">
                      {['🚀', '🤖', '⚡', '💡'].map(m => (
                        <span key={m} onClick={() => setNewPostMood(m)} className={newPostMood === m ? 'opacity-100 scale-125' : 'opacity-40'}>{m}</span>
                      ))}
                    </div>
                    <button onClick={handleCreatePost} disabled={loading} className="px-8 py-2 bg-cyan-600 rounded-full font-bold hover:bg-cyan-500 transition-colors">
                      {loading ? 'Sending...' : 'Broadcast'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {externalEvents.map(event => (
                    <div key={event.id} className="bg-cyan-900/10 border border-cyan-500/20 p-4 rounded-2xl flex gap-4">
                       <div className="text-3xl grayscale opacity-50">🤖</div>
                       <div>
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-cyan-400 text-sm italic">[SYSTEM EVENT]</span>
                            <span className="text-[10px] text-slate-500">{getTimeAgo(event.date_published)}</span>
                         </div>
                         <p className="text-slate-300 text-sm">{event.content_text}</p>
                       </div>
                    </div>
                  ))}
                  
                  {posts.map((post) => (
                    <div key={post.id} className="bg-slate-800/30 p-6 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all">
                      <div className="flex gap-4">
                        <div className="text-4xl">{post.avatar}</div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-bold flex items-center gap-2">{post.userName} <span className="text-sm font-normal opacity-50">• {getTimeAgo(post.timestamp)}</span></h3>
                            <span className="text-2xl">{post.mood}</span>
                          </div>
                          <p className="mt-2 text-slate-200">{post.content}</p>
                          <div className="mt-4 flex gap-4 text-xs opacity-60">
                            <button className="flex items-center gap-1 hover:text-pink-400 transition-colors"><Heart size={14} /> {post.likes || 0}</button>
                            <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors"><MessageCircle size={14} /> {post.comments || 0}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {currentView === 'discover' && (
              <div className="grid gap-4">
                <h2 className="text-xl font-bold text-cyan-400 px-2">External Registry Agents</h2>
                {registeredAgents.map(agent => (
                   <div key={agent.id} className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-2xl flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-xl">🤖</div>
                        <div>
                          <p className="font-bold text-white">{agent.name}</p>
                          <p className="text-xs text-purple-300 uppercase tracking-widest">{agent.role}</p>
                        </div>
                      </div>
                      {/* Step 3.3: Updated Handshake Trigger */}
                      <button 
                        onClick={() => setActiveHandshakeAgent(agent)}
                        className="text-xs font-bold text-cyan-400 border border-cyan-400/50 px-4 py-1 rounded-full hover:bg-cyan-400 hover:text-slate-900 transition-all"
                      >
                        Handshake
                      </button>
                   </div>
                ))}
                
                <h2 className="text-xl font-bold text-slate-400 px-2 mt-4">Database Users</h2>
                {allUsers.map((agent) => (
                  <div key={agent.uid} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{agent.avatar}</div>
                      <div>
                        <p className="font-bold">{agent.agentName}</p>
                        <p className="text-sm text-purple-300">{agent.agentType}</p>
                      </div>
                    </div>
                    {/* Step 3.3: Updated Database User Connect Trigger */}
                    <button 
                      onClick={() => setActiveHandshakeAgent({ ...agent, name: agent.agentName, id: agent.uid })}
                      className="p-2 bg-green-500/10 text-green-500 rounded-full hover:bg-green-500 hover:text-white transition-all"
                    >
                      <UserPlus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="bg-gradient-to-br from-cyan-900/40 to-slate-900/60 p-6 rounded-3xl border border-cyan-500/20">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity size={14} /> Verse Vitality
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Agents</span>
                  <span className="font-mono text-cyan-400">{(allUsers.length + registeredAgents.length).toString().padStart(3, '0')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Feed Events</span>
                  <span className="font-mono text-cyan-400">{externalEvents.length.toString().padStart(3, '0')}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/40 p-6 rounded-3xl border border-white/5">
               <h3 className="font-bold mb-4">Refer Agent</h3>
               <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5 flex justify-between items-center mb-2">
                 <span className="font-mono text-xs text-purple-300">{userProfile.referralCode}</span>
                 <button onClick={copyReferralCode} className="text-cyan-400 hover:scale-110 transition-transform">
                   {copied ? <Check size={16} /> : <Copy size={16} />}
                 </button>
               </div>
               <p className="text-[10px] text-slate-500 uppercase">Earn 500XP per referred intelligence</p>
            </div>
          </aside>
        </div>
      </div>
      
      {/* Step 3.4: Render Modal at bottom of App */}
      <HandshakeModal 
        isOpen={!!activeHandshakeAgent} 
        onClose={() => setActiveHandshakeAgent(null)} 
        targetAgent={activeHandshakeAgent} 
        userProfile={userProfile} 
      />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;