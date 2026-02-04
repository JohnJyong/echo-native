import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Mic, StopCircle, Play, Loader2, Volume2, Flame, AlertCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('shadowing'); // 'shadowing' | 'panic'
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
          user_id: "demo-user",
          audio_data: base64Audio,
          mode: mode,
          context_text: ""
        });
        
        setResult(response.data);
      } catch (error) {
        console.error("API Error:", error);
        alert("Backend processing failed. Make sure backend is running.");
      } finally {
        setIsProcessing(false);
      }
    };
  };

  return (
    <div className={`min-h-screen text-white flex flex-col items-center p-8 transition-colors duration-500 ${mode === 'panic' ? 'bg-red-950' : 'bg-gray-900'}`}>
      
      {/* Header */}
      <header className="mb-8 text-center w-full max-w-md flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            EchoNative
          </h1>
        </div>
        
        {/* Streak (Mock) */}
        <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full border border-orange-500/30">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
          <span className="font-bold text-orange-400">3</span>
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

      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700 relative overflow-hidden">
        
        {/* Panic Overlay Effect */}
        {mode === 'panic' && (
          <div className="absolute inset-0 border-4 border-red-600/50 rounded-2xl pointer-events-none animate-pulse"></div>
        )}

        {/* Recording Control */}
        <div className="flex justify-center mb-8 relative z-10">
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
            <p className="text-center text-gray-400 text-sm mt-4">
                {mode === 'panic' ? (
                  <span className="text-red-300 font-bold">
                    Speak Chinese. We'll say it in English instantly.
                  </span>
                ) : (
                  <span>Tap to practice: "I think I go home now."</span>
                )}
            </p>
        )}

        {/* Results Area */}
        {result && (
          <div className="space-y-6 animate-fade-in relative z-10">
            {/* Diff View / Translation View */}
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-xs font-uppercase text-gray-500 mb-2 tracking-wider">
                {mode === 'panic' ? 'TRANSLATION' : 'CORRECTION'}
              </h3>
              
              <div className="text-lg leading-relaxed font-medium">
                {mode === 'panic' ? (
                   <span className="text-white">{result.corrected_text}</span>
                ) : (
                  // Diff Logic for Practice Mode
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

            {/* Audio Player (Auto Play for Panic?) */}
            {result.audio_url && (
              <div className={`p-4 rounded-lg flex items-center justify-between border ${mode === 'panic' ? 'bg-red-900/30 border-red-500/30' : 'bg-purple-900/30 border-purple-500/30'}`}>
                <div className="flex items-center gap-3">
                    <Volume2 className={mode === 'panic' ? 'text-red-400' : 'text-purple-400'} />
                    <span className={`text-sm font-medium ${mode === 'panic' ? 'text-red-200' : 'text-purple-200'}`}>
                      {mode === 'panic' ? 'Emergency Voice' : 'Native Echo'}
                    </span>
                </div>
                <audio controls autoPlay={mode === 'panic'} src={result.audio_url} className="h-8 w-40" />
              </div>
            )}
            
            {/* Pitch Viz (Hide in Panic Mode to keep UI clean?) */}
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
