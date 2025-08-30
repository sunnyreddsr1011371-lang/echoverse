import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Play, Pause, Square, Volume2, FileText, Mic, Brain, Download } from 'lucide-react';
import ToneAnalysis from './ToneAnalysis';

const VoiceSynthesis = () => {
  const [selectedVoice, setSelectedVoice] = useState<string>('michael');
  const [inputText, setInputText] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [detectedTone, setDetectedTone] = useState<string | null>(null);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioFrequency, setAudioFrequency] = useState<number[]>(Array.from({ length: 40 }, () => 20));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voices = [
    { id: 'lisa', name: 'Lisa', description: 'Warm and professional (Female)' },
    { id: 'michael', name: 'Michael', description: 'Deep and authoritative (Male)' },
    { id: 'allison', name: 'Allison', description: 'Friendly and conversational (Female)' }
  ];

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    // Enhanced tone analysis based on keywords and patterns
    const analyzeTone = (text: string): string => {
      const lowerText = text.toLowerCase();
      const sentences = text.split(/[.!?]+/).filter(s => s.trim());
      
      // Count emotional indicators
      let excitedCount = 0;
      let seriousCount = 0;
      let friendlyCount = 0;
      let sadCount = 0;
      let angryCount = 0;
      
      // Excited/enthusiastic patterns
      const excitedPatterns = /\b(exciting|amazing|fantastic|wonderful|great|awesome|incredible|brilliant|outstanding|excellent|superb|marvelous|terrific|fabulous|spectacular|magnificent)\b|[!]{2,}|\b(wow|yay|hooray)\b/gi;
      excitedCount += (text.match(excitedPatterns) || []).length;
      
      // Serious/formal patterns
      const seriousPatterns = /\b(important|serious|critical|urgent|business|professional|formal|official|significant|crucial|essential|vital|mandatory|required|necessary)\b/gi;
      seriousCount += (text.match(seriousPatterns) || []).length;
      
      // Friendly/casual patterns
      const friendlyPatterns = /\b(hello|hi|hey|thanks|thank you|please|friend|buddy|pal|welcome|appreciate|grateful|kind|nice|lovely|sweet|dear)\b/gi;
      friendlyCount += (text.match(friendlyPatterns) || []).length;
      
      // Sad patterns
      const sadPatterns = /\b(sad|sorry|disappointed|unfortunate|regret|tragic|terrible|awful|horrible|depressed|upset|hurt|pain|loss|grief)\b/gi;
      sadCount += (text.match(sadPatterns) || []).length;
      
      // Angry patterns
      const angryPatterns = /\b(angry|furious|mad|rage|outraged|disgusted|annoyed|irritated|frustrated|hate|terrible|awful|stupid|ridiculous)\b|[!]{3,}/gi;
      angryCount += (text.match(angryPatterns) || []).length;
      
      // Determine dominant tone
      const scores = { excited: excitedCount, serious: seriousCount, friendly: friendlyCount, sad: sadCount, angry: angryCount };
      const maxScore = Math.max(...Object.values(scores));
      
      if (maxScore === 0) return 'calm';
      
      const dominantTone = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore);
      return dominantTone || 'calm';
    };
    
    // Simulate analysis progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          setDetectedTone(analyzeTone(inputText));
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  // Enhanced voice mapping with better gender detection and humanization
  const getWebSpeechVoice = (voiceId: string) => {
    const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
    
    const femaleVoiceNames = [
      'samantha', 'victoria', 'karen', 'princess', 'vicki', 'susan', 'allison', 
      'catherine', 'kathy', 'lisa', 'sarah', 'jessica', 'emily', 'maria', 'amy',
      'anna', 'claire', 'emma', 'fiona', 'grace', 'helena', 'jane', 'julia',
      'kate', 'laura', 'michelle', 'nicole', 'olivia', 'rachel', 'stephanie'
    ];
    
    const maleVoiceNames = [
      'alex', 'daniel', 'fred', 'thomas', 'david', 'john', 'michael', 'james',
      'robert', 'william', 'richard', 'joseph', 'christopher', 'matthew', 'anthony',
      'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin'
    ];

    switch (voiceId) {
      case 'lisa': {
        // Find distinctly female voices for Lisa (warm professional woman)
        const femaleVoice = voices.find(v => 
          femaleVoiceNames.some(name => v.name.toLowerCase().includes(name))
        ) || voices.find(v => v.name.toLowerCase().includes('female'))
          || voices.find(v => !maleVoiceNames.some(name => v.name.toLowerCase().includes(name)));
        return femaleVoice || voices[0];
      }
      
      case 'michael': {
        // Find distinctly male voices for Michael (deep authoritative man)
        const maleVoice = voices.find(v => 
          maleVoiceNames.some(name => v.name.toLowerCase().includes(name))
        ) || voices.find(v => v.name.toLowerCase().includes('male'))
          || voices.find(v => v.name.toLowerCase().includes('alex'))
          || voices.find(v => v.name.toLowerCase().includes('daniel'));
        return maleVoice || voices[Math.min(1, voices.length - 1)];
      }
      
      case 'allison': {
        // Find different female voice for Allison (friendly conversational woman)
        const availableFemaleVoices = voices.filter(v => 
          femaleVoiceNames.some(name => v.name.toLowerCase().includes(name)) ||
          v.name.toLowerCase().includes('female') ||
          !maleVoiceNames.some(name => v.name.toLowerCase().includes(name))
        );
        
        // Try to get a different female voice than what Lisa would use
        const allisonVoice = availableFemaleVoices.find(v => 
          !v.name.toLowerCase().includes('samantha') && 
          !v.name.toLowerCase().includes('victoria')
        ) || availableFemaleVoices[0];
        
        return allisonVoice || voices[Math.min(2, voices.length - 1)];
      }
      
      default:
        return voices[0];
    }
  };

  // Apply voice-specific characteristics to make them more human and distinct
  const applyVoiceCharacteristics = (utterance: SpeechSynthesisUtterance, voiceId: string) => {
    switch (voiceId) {
      case 'lisa':
        // Professional, warm female voice
        utterance.rate = 0.95;
        utterance.pitch = 1.1;  // Higher pitch for female
        utterance.volume = 0.85;
        break;
      case 'michael':
        // Deep, authoritative male voice
        utterance.rate = 0.9;
        utterance.pitch = 0.8;  // Lower pitch for male
        utterance.volume = 0.9;
        break;
      case 'allison':
        // Friendly, conversational female voice
        utterance.rate = 1.05;
        utterance.pitch = 1.15; // Slightly higher pitch for friendliness
        utterance.volume = 0.88;
        break;
      default:
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
    }
  };

  // Apply tone-adaptive speech parameters with enhanced emotion mapping
  const applyToneAdaptation = (utterance: SpeechSynthesisUtterance, tone: string | null, voiceId: string) => {
    // First apply base voice characteristics
    applyVoiceCharacteristics(utterance, voiceId);
    
    // Then modify based on detected tone (additive adjustments)
    const baseRate = utterance.rate;
    const basePitch = utterance.pitch;
    const baseVolume = utterance.volume;

    switch (tone) {
      case 'calm':
        utterance.rate = baseRate * 0.9;
        utterance.pitch = basePitch * 0.95;
        utterance.volume = Math.min(baseVolume * 0.9, 1.0);
        break;
      case 'excited':
        utterance.rate = baseRate * 1.2;
        utterance.pitch = basePitch * 1.15;
        utterance.volume = Math.min(baseVolume * 1.1, 1.0);
        break;
      case 'serious':
        utterance.rate = baseRate * 0.85;
        utterance.pitch = basePitch * 0.9;
        utterance.volume = Math.min(baseVolume * 1.0, 1.0);
        break;
      case 'friendly':
        utterance.rate = baseRate * 1.05;
        utterance.pitch = basePitch * 1.08;
        utterance.volume = Math.min(baseVolume * 1.05, 1.0);
        break;
      case 'sad':
        utterance.rate = baseRate * 0.8;
        utterance.pitch = basePitch * 0.85;
        utterance.volume = Math.min(baseVolume * 0.8, 1.0);
        break;
      case 'angry':
        utterance.rate = baseRate * 1.1;
        utterance.pitch = basePitch * 0.95;
        utterance.volume = Math.min(baseVolume * 1.1, 1.0);
        break;
      default:
        // Keep base characteristics as-is
        break;
    }
    
    // Ensure values stay within valid ranges
    utterance.rate = Math.max(0.1, Math.min(utterance.rate, 10));
    utterance.pitch = Math.max(0, Math.min(utterance.pitch, 2));
    utterance.volume = Math.max(0, Math.min(utterance.volume, 1));
  };

  // Initialize audio context and setup audio recording
  const setupAudioRecording = () => {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      setAudioContext(ctx);
    }
  };

  // Start recording audio output
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        setAudioChunks(chunks);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
    } catch (error) {
      console.error('Error starting audio recording:', error);
    }
  };

  // Download recorded audio
  const downloadAudio = () => {
    if (audioChunks.length > 0) {
      const blob = new Blob(audioChunks, { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-synthesis-${detectedTone || 'default'}-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Animate audio visualization in sync with speech
  const animateAudioVisualization = () => {
    if (isPlaying) {
      const newFrequency = audioFrequency.map(() => Math.random() * 80 + 20);
      setAudioFrequency(newFrequency);
      setTimeout(animateAudioVisualization, 100);
    }
  };

  const handlePlayPause = async () => {
    if (!inputText.trim()) return;

    if (isPlaying) {
      // Pause/Resume functionality
      if (speechSynthesis.speaking) {
        if (speechSynthesis.paused) {
          speechSynthesis.resume();
          animateAudioVisualization();
        } else {
          speechSynthesis.pause();
        }
      }
      return;
    }

    // Stop any current speech
    speechSynthesis.cancel();
    
    // Setup audio recording
    setupAudioRecording();
    await startRecording();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(inputText);
    
    // Set voice
    const voice = getWebSpeechVoice(selectedVoice);
    if (voice) utterance.voice = voice;

    // Apply voice characteristics and tone adaptation
    applyToneAdaptation(utterance, detectedTone, selectedVoice);

    // Event handlers
    utterance.onstart = () => {
      setIsPlaying(true);
      animateAudioVisualization();
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentUtterance(null);
      setAudioFrequency(Array.from({ length: 40 }, () => 20));
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setCurrentUtterance(null);
      setAudioFrequency(Array.from({ length: 40 }, () => 20));
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };

    // Store and speak
    setCurrentUtterance(utterance);
    speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentUtterance(null);
    setAudioFrequency(Array.from({ length: 40 }, () => 20));
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInputText(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-voice bg-clip-text text-transparent">
          Voice Synthesis Studio
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transform your text into emotionally-aware speech with AI-powered tone adaptation
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="p-6 shadow-soft border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-semibold">Text Input</h2>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="voice"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Document
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <Textarea
                placeholder="Enter your text here or upload a document..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[200px] bg-input/50 border-border/50 focus:border-primary/50 resize-none"
              />

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {inputText.length} characters
                </span>
                <Button
                  onClick={handleAnalyze}
                  disabled={!inputText.trim() || isAnalyzing}
                  variant="tone"
                  className="flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Tone'}
                </Button>
              </div>

              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Analyzing emotional tone...</div>
                  <Progress value={analysisProgress} className="h-2" />
                </div>
              )}
            </div>
          </Card>

          {/* Voice Selection */}
          <Card className="p-6 shadow-soft border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-semibold">Voice Selection</h2>
              </div>

              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="bg-input/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{voice.name}</span>
                        <span className="text-sm text-muted-foreground">{voice.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePlayPause}
                  disabled={!inputText.trim()}
                  variant="voice"
                  size="lg"
                  className="flex items-center gap-2 shadow-voice"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  disabled={!isPlaying && !speechSynthesis.speaking}
                  onClick={handleStop}
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>

                <Button
                  variant="voice"
                  size="lg"
                  disabled={audioChunks.length === 0}
                  onClick={downloadAudio}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>

                <div className="flex items-center gap-2 ml-auto">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">100%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Analysis & Output Section */}
        <div className="space-y-6">
          {detectedTone && <ToneAnalysis tone={detectedTone} />}
          
          {/* Audio Waveform Visualization */}
          <Card className="p-6 shadow-soft border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                Audio Visualization
              </h3>
              <div className="h-32 bg-muted/20 rounded-lg flex items-end justify-center gap-1 p-4">
                {audioFrequency.map((height, i) => (
                  <div
                    key={i}
                    className={`w-2 bg-primary/60 rounded-full voice-wave transition-all duration-100 ${isPlaying ? 'animate-pulse' : ''}`}
                    style={{
                      height: `${height}%`,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
              
              {selectedVoice && (
                <div className="flex justify-center">
                  <Badge variant="secondary" className="text-sm">
                    Voice: {voices.find(v => v.id === selectedVoice)?.name}
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VoiceSynthesis;