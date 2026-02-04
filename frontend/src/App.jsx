import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Mic, StopCircle, Play, Loader2, Volume2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
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
          mode: "shadowing",
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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          EchoNative
        </h1>
        <p className="text-gray-400 mt-2">Hear your perfect self.</p>
      </header>

      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700">
        
        {/* Recording Control */}
        <div className="flex justify-center mb-8">
          {isProcessing ? (
             <div className="flex flex-col items-center animate-pulse">
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
                <span className="mt-2 text-sm text-purple-400">Perfecting your voice...</span>
             </div>
          ) : !isRecording ? (
            <button 
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg hover:scale-105"
            >
              <Mic className="w-10 h-10 text-white" />
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all border-4 border-red-500 animate-pulse"
            >
              <StopCircle className="w-10 h-10 text-red-500" />
            </button>
          )}
        </div>

        {/* Results Area */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Diff View */}
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-xs font-uppercase text-gray-500 mb-2 tracking-wider">CORRECTION</h3>
              <div className="text-lg leading-relaxed">
                {result.diff.length > 0 ? (
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
                  <span className="text-green-400">Perfect! No corrections needed.</span>
                )}
                {result.diff.length > 0 && <div className="mt-2 text-sm text-gray-400">({result.corrected_text})</div>}
              </div>
            </div>

            {/* Audio Player */}
            {result.audio_url && (
              <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Volume2 className="text-purple-400" />
                    <span className="text-sm font-medium text-purple-200">Your Native Echo</span>
                </div>
                <audio controls src={result.audio_url} className="h-8 w-40" />
              </div>
            )}

            {/* Pitch Visualization (Guitar Hero Placeholder) */}
            {result.pitch_data && result.pitch_data.length > 0 && (
                <div className="h-32 w-full bg-gray-900 rounded-lg overflow-hidden relative">
                    <div className="absolute top-2 left-2 text-xs text-gray-500">INTONATION (Hz)</div>
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

        {!result && !isProcessing && (
            <p className="text-center text-gray-500 text-sm mt-4">
                Tap the mic to say something like <br/>
                <span className="italic text-gray-400">"I think I go home now."</span>
            </p>
        )}
      </div>
    </div>
  )
}

export default App
