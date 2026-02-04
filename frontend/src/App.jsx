import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mic, StopCircle, Loader2, Volume2, Flame, AlertCircle, LogOut, User, Clapperboard, Share2, Play } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

function App() {
  // --- Auth State ---
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // --- App State ---
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('shadowing'); // 'shadowing' | 'panic' | 'magic'
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // --- Magic Clip State ---
  const [clips, setClips] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);

  // --- Effects ---
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  useEffect(() => {
    if (mode === 'magic') {
      fetchClips();
    } else {
      setResult(null); // Clear previous results when switching modes
    }
  }, [mode]);

  // --- API Calls ---
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error("Auth Error:", error);
      logout();
    }
  };

  const fetchClips = async () => {
    try {
      const response = await axios.get('/api/clips');
      setClips(response.data);
      if (response.data.length > 0) {
        setSelectedClip(response.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch clips");
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        const response = await axios.post('/api/token', formData);
        const accessToken = response.data.access_token;
        localStorage.setItem('token', accessToken);
        setToken(accessToken);
      } else {
        await axios.post('/api/register', { username, password });
        alert("Registered successfully! Please login.");
        setAuthMode('login');
      }
    } catch (error) {
      alert("Auth failed: " + (error.response?.data?.detail || error.message));
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setResult(null);
  };

  // --- Voice Functions ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = handleStop;
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setResult(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleStop = async () => {
    setIsProcessing(true);
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      
      try {
        let response;
        if (mode === 'magic') {
          response = await axios.post('/api/magic-clip', {
            audio_data: base64Audio,
            clip_filename: selectedClip.filename,
            clip_text: selectedClip.quote
          }, { headers: { Authorization: `Bearer ${token}` } });
        } else {
          response = await axios.post('/api/process', {
            user_id: user?.username || "demo",
            audio_data: base64Audio,
            mode: mode,
            context_text: ""
          }, { headers: { Authorization: `Bearer ${token}` } });
        }
        
        setResult(response.data);
        if (mode !== 'magic') fetchUserProfile(); 
      } catch (error) {
        console.error("API Error:", error);
        alert("Processing failed: " + (error.response?.data?.detail || "Backend error"));
      } finally {
        setIsProcessing(false);
      }
    };
  };

  // --- UI Helpers ---
  const getTheme = () => {
    if (mode === 'panic') return 'bg-red-950 text-white';
    if (mode === 'magic') return 'bg-indigo-950 text-white';
    return 'bg-gray-900 text-white';
  };

  // --- Render Auth ---
  if (!token) {
     return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
          <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">EchoNative</h1>
          <p className="text-center text-gray-400 mb-8">Hear your perfect self.</p>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-purple-500" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-purple-500" required />
            <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-3 rounded-lg transition-all">{authMode === 'login' ? 'Login' : 'Create Account'}</button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-purple-400 hover:text-purple-300 font-medium">{authMode === 'login' ? 'Sign up' : 'Sign in'}</button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render App ---
  return (
    <div className={`min-h-screen flex flex-col items-center p-4 md:p-8 transition-colors duration-500 ${getTheme()}`}>
      
      {/* Top Bar */}
      <header className="mb-6 w-full max-w-lg flex justify-between items-center bg-black/20 p-4 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
           <div className="bg-gray-700 p-2 rounded-full"><User className="w-5 h-5 text-gray-300" /></div>
           <div className="flex flex-col leading-tight">
             <span className="font-bold text-gray-200">{user?.username}</span>
             <button onClick={logout} className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1"><LogOut className="w-3 h-3" /> Logout</button>
           </div>
        </div>
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-orange-500/30">
           <Flame className={`w-5 h-5 ${user?.streak_count > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-gray-500'}`} />
           <span className={`font-bold ${user?.streak_count > 0 ? 'text-orange-400' : 'text-gray-500'}`}>{user?.streak_count || 0}</span>
        </div>
      </header>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-8 bg-black/20 p-1.5 rounded-xl backdrop-blur-sm overflow-x-auto max-w-full">
        <button onClick={() => setMode('shadowing')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${mode === 'shadowing' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Practice</button>
        <button onClick={() => setMode('magic')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${mode === 'magic' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}><Clapperboard className="w-4 h-4" /> Magic Clip</button>
        <button onClick={() => setMode('panic')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${mode === 'panic' ? 'bg-red-600 text-white shadow-lg animate-pulse' : 'text-gray-400 hover:text-white'}`}><AlertCircle className="w-4 h-4" /> Panic</button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-lg bg-gray-800/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-gray-700/50 relative overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Panic Overlay */}
        {mode === 'panic' && <div className="absolute inset-0 border-[6px] border-red-600/30 rounded-3xl pointer-events-none animate-pulse z-0"></div>}

        {/* --- Magic Clip Selector --- */}
        {mode === 'magic' && (
          <div className="mb-6 z-10">
             <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
               {clips.map(clip => (
                 <div key={clip.id} 
                      onClick={() => {setSelectedClip(clip); setResult(null);}}
                      className={`flex-shrink-0 w-32 h-20 bg-gray-900 rounded-lg cursor-pointer border-2 transition-all overflow-hidden relative group ${selectedClip?.id === clip.id ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 group-hover:bg-black/40"><Play className="w-6 h-6 text-white" /></div>
                    {/* Placeholder for thumbnail */}
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-500">{clip.title}</div>
                 </div>
               ))}
             </div>
             {selectedClip && (
               <div className="mt-4 text-center">
                 <h3 className="text-indigo-300 font-bold text-lg">{selectedClip.title}</h3>
                 <p className="text-gray-300 italic text-lg mt-2">"{selectedClip.quote}"</p>
               </div>
             )}
          </div>
        )}

        {/* --- Video Result View --- */}
        {mode === 'magic' && result?.video_url ? (
           <div className="flex-1 flex flex-col items-center justify-center animate-fade-in z-10">
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-indigo-500/30 relative group">
                 <video src={result.video_url} controls autoPlay className="w-full h-full object-contain" />
              </div>
              <button onClick={() => alert("Shared to Xiaohongshu! 📱✨")} className="mt-6 flex items-center gap-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-400 hover:to-red-400 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all hover:scale-105 active:scale-95">
                 <Share2 className="w-5 h-5" /> Share to Socials
              </button>
              <button onClick={() => setResult(null)} className="mt-4 text-gray-500 hover:text-white text-sm">Record Again</button>
           </div>
        ) : (
          /* --- Standard Recording UI --- */
          <div className="flex-1 flex flex-col items-center justify-center z-10">
            {isProcessing ? (
              <div className="flex flex-col items-center animate-pulse">
                  <Loader2 className={`w-20 h-20 animate-spin ${mode === 'panic' ? 'text-red-500' : mode === 'magic' ? 'text-indigo-500' : 'text-purple-500'}`} />
                  <span className="mt-4 text-sm font-medium tracking-wide text-gray-300">
                    {mode === 'panic' ? 'TRANSLATING...' : mode === 'magic' ? 'GENERATING SCENE...' : 'PERFECTING VOICE...'}
                  </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button 
                  onClick={startRecording}
                  disabled={!isRecording && mode === 'magic' && !selectedClip}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl hover:scale-105 active:scale-95 group relative ${
                    isRecording 
                      ? 'bg-gray-700 ring-4 ring-white animate-pulse' 
                      : mode === 'panic' 
                        ? 'bg-red-600 hover:bg-red-500 shadow-red-900/50' 
                        : mode === 'magic'
                          ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50'
                          : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500'
                  }`}
                >
                  {isRecording ? <StopCircle className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white group-hover:animate-bounce" />}
                </button>
                {!isRecording && mode !== 'magic' && <p className="mt-6 text-gray-400 text-sm">Tap to speak</p>}
                {!isRecording && mode === 'magic' && !selectedClip && <p className="mt-6 text-red-400 text-sm">Select a clip first</p>}
              </div>
            )}
          </div>
        )}

        {/* --- Standard Text Result (Practice/Panic) --- */}
        {mode !== 'magic' && result && (
           <div className="mt-6 p-4 bg-black/40 rounded-xl border border-white/10 animate-fade-in z-10">
              <div className="text-lg font-medium leading-relaxed mb-4">
                {mode === 'panic' ? (
                   <span className="text-white text-xl">{result.corrected_text}</span>
                ) : (
                   /* Diff View */
                   result.diff?.length > 0 ? result.diff.map((c, i) => (
                     <span key={i} className={c.type === 'replace' ? 'text-yellow-400 mx-1' : c.type === 'insert' ? 'text-green-400 mx-1' : 'text-red-400 line-through mx-1 opacity-50'}>{c.new || c.old}</span>
                   )) : <span className="text-green-400">{result.corrected_text}</span>
                )}
              </div>
              {result.audio_url && (
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-bold flex items-center gap-2"><Volume2 className="w-4 h-4" /> Native Echo</span>
                  <audio controls autoPlay={mode === 'panic'} src={result.audio_url} className="h-6 w-32" />
                </div>
              )}
              {/* Pitch Viz */}
              {mode === 'shadowing' && result.pitch_data?.length > 0 && (
                <div className="h-16 w-full mt-4 opacity-50"><ResponsiveContainer><LineChart data={result.pitch_data}><Line type="monotone" dataKey="f" stroke="#8884d8" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
              )}
           </div>
        )}

      </div>
    </div>
  )
}

export default App
