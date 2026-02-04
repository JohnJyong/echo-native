import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mic, StopCircle, Loader2, Volume2, Flame, AlertCircle, LogOut, User } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// Configure Axios default base URL if needed, or rely on Proxy
// axios.defaults.baseURL = 'http://127.0.0.1:8000'; 

function App() {
  // --- Auth State ---
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // --- App State ---
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('shadowing'); // 'shadowing' | 'panic'
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // --- Effects ---
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  // --- Auth Functions ---
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
    
    // Convert Blob to Base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      
      try {
        const response = await axios.post('/api/process', {
          user_id: user?.username || "demo", // Now using real user context
          audio_data: base64Audio,
          mode: mode,
          context_text: ""
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setResult(response.data);
        // Refresh stats to update streak/daily count
        fetchUserProfile(); 
      } catch (error) {
        console.error("API Error:", error);
        alert("Processing failed: " + (error.response?.data?.detail || "Backend error"));
      } finally {
        setIsProcessing(false);
      }
    };
  };

  // --- Render: Auth Screen ---
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
          <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            EchoNative
          </h1>
          <p className="text-center text-gray-400 mb-8">Hear your perfect self.</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-3 rounded-lg transition-all"
            >
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Main App ---
  return (
    <div className={`min-h-screen text-white flex flex-col items-center p-8 transition-colors duration-500 ${mode === 'panic' ? 'bg-red-950' : 'bg-gray-900'}`}>
      
      {/* Header */}
      <header className="mb-8 w-full max-w-md flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="bg-gray-800 p-2 rounded-full">
             <User className="w-5 h-5 text-gray-400" />
           </div>
           <div className="flex flex-col">
             <span className="text-sm font-bold text-gray-200">{user?.username}</span>
             <button onClick={logout} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1">
               <LogOut className="w-3 h-3" /> Logout
             </button>
           </div>
        </div>
        
        {/* Streak Display */}
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full border border-orange-500/30">
            <Flame className={`w-5 h-5 ${user?.streak_count > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-gray-600'}`} />
            <span className={`font-bold ${user?.streak_count > 0 ? 'text-orange-400' : 'text-gray-500'}`}>{user?.streak_count || 0}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
             Today: {user?.daily_process_count || 0}/3
          </div>
        </div>
      </header>

      {/* Mode Switcher */}
      <div className="flex gap-4 mb-8 bg-gray-800 p-1 rounded-xl">
        <button 
          onClick={() => setMode('shadowing')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'shadowing' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          Practice Mode
        </button>
        <button 
          onClick={() => setMode('panic')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'panic' ? 'bg-red-600 text-white shadow-lg animate-pulse' : 'text-gray-400 hover:text-white'}`}
        >
          <AlertCircle className="w-4 h-4" />
          Panic Button
        </button>
      </div>

      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700 relative overflow-hidden min-h-[400px]">
        
        {/* Panic Overlay Effect */}
        {mode === 'panic' && (
          <div className="absolute inset-0 border-4 border-red-600/50 rounded-2xl pointer-events-none animate-pulse"></div>
        )}

        {/* Recording Control */}
        <div className="flex justify-center mb-8 relative z-10 mt-4">
          {isProcessing ? (
             <div className="flex flex-col items-center animate-pulse">
                <Loader2 className={`w-20 h-20 animate-spin ${mode === 'panic' ? 'text-red-500' : 'text-purple-500'}`} />
                <span className="mt-4 text-sm font-medium tracking-wide">
                  {mode === 'panic' ? 'TRANSLATING URGENTLY...' : 'Perfecting your voice...'}
                </span>
             </div>
          ) : !isRecording ? (
            <button 
              onClick={startRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 group ${
                mode === 'panic' ? 'bg-red-600 hover:bg-red-500 shadow-red-900/50' : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500'
              }`}
            >
              <Mic className="w-10 h-10 text-white group-hover:animate-bounce" />
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              className="w-24 h-24 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all border-4 border-white animate-pulse"
            >
              <StopCircle className="w-10 h-10 text-white" />
            </button>
          )}
        </div>

        {/* Instructions */}
        {!result && !isProcessing && (
            <div className="text-center text-gray-400 text-sm mt-8">
                {mode === 'panic' ? (
                  <p className="text-red-300 font-bold text-lg">
                    Speak Chinese.<br/>We'll say it in English instantly.
                  </p>
                ) : (
                  <div>
                    <p className="mb-2">Tap to practice (Daily Goal: {user?.daily_process_count || 0}/3)</p>
                    <p className="italic text-gray-500">"I think I go home now."</p>
                  </div>
                )}
            </div>
        )}

        {/* Results Area */}
        {result && (
          <div className="space-y-6 animate-fade-in relative z-10">
            {/* Diff View / Translation View */}
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-xs font-uppercase text-gray-500 mb-2 tracking-wider">
                {mode === 'panic' ? 'TRANSLATION' : 'CORRECTION'}
              </h3>
              
              <div className="text-lg leading-relaxed font-medium break-words">
                {mode === 'panic' ? (
                   <span className="text-white">{result.corrected_text}</span>
                ) : (
                  // Diff Logic
                  result.diff && result.diff.length > 0 ? (
                    result.diff.map((change, idx) => (
                      <span key={idx} className={
                        change.type === 'replace' ? 'text-yellow-400 font-bold mx-1' :
                        change.type === 'insert' ? 'text-green-400 font-bold mx-1' :
                        change.type === 'delete' ? 'text-red-400 line-through mx-1 opacity-50' : ''
                      }>
                        {change.new || change.old}
                      </span>
                    ))
                  ) : (
                    <span className="text-green-400">{result.corrected_text}</span>
                  )
                )}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-800 text-sm text-gray-500 flex justify-between">
                 <span>Original: "{result.original_text}"</span>
              </div>
            </div>

            {/* Audio Player */}
            {result.audio_url && (
              <div className={`p-4 rounded-lg flex items-center justify-between border ${mode === 'panic' ? 'bg-red-900/30 border-red-500/30' : 'bg-purple-900/30 border-purple-500/30'}`}>
                <div className="flex items-center gap-3">
                    <Volume2 className={mode === 'panic' ? 'text-red-400' : 'text-purple-400'} />
                    <span className={`text-sm font-medium ${mode === 'panic' ? 'text-red-200' : 'text-purple-200'}`}>
                      {mode === 'panic' ? 'Native Echo' : 'Native Echo'}
                    </span>
                </div>
                <audio controls autoPlay={mode === 'panic'} src={result.audio_url} className="h-8 w-40" />
              </div>
            )}
            
            {/* Pitch Viz */}
            {mode !== 'panic' && result.pitch_data && result.pitch_data.length > 0 && (
                <div className="h-24 w-full bg-gray-900 rounded-lg overflow-hidden relative opacity-70">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={result.pitch_data}>
                            <YAxis domain={['dataMin', 'dataMax']} hide />
                            <Line type="monotone" dataKey="f" stroke="#8884d8" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
