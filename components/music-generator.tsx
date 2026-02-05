'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Play, Pause, Download, Wand2 } from 'lucide-react';
import { createMusicFromJSON, downloadAudio, type MusicComposition } from '@/lib/tone-utils';

export function MusicGenerator() {
  const [style, setStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingAudio, setIsCreatingAudio] = useState(false);
  const [composition, setComposition] = useState<MusicComposition | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const generateCoverImage = async (musicStyle: string) => {
    try {
      const response = await fetch('/api/generate-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ style: musicStyle }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setCoverImage(imageUrl);
      }
    } catch (error) {
      console.error('[v0] Error generating cover:', error);
    }
  };

  const handleGenerate = async () => {
    if (!style.trim()) return;

    setIsGenerating(true);
    setComposition(null);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setCoverImage(null);
    setIsPlaying(false);

    try {
      await generateCoverImage(style);

      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ style }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate music');
      }

      const data = await response.json();
      setComposition(data.composition);

      setIsCreatingAudio(true);
      const blob = await createMusicFromJSON(data.composition);
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setIsCreatingAudio(false);
    } catch (error) {
      console.error('[v0] Error:', error);
      alert('Failed to generate music. Please try again.');
    } finally {
      setIsGenerating(false);
      setIsCreatingAudio(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (audioBlob) {
      downloadAudio(audioBlob, `${style.replace(/\s+/g, '_')}_music.webm`);
    }
  };

  const isLoading = isGenerating || isCreatingAudio;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <div className="w-full max-w-7xl mx-auto mb-12 text-center animate-in fade-in slide-in-from-bottom duration-700">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-4 text-balance">
          SOUNDCR
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground text-balance">
          {'AI-Powered Music Generation'}
        </p>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
        {/* Input Section with Glassmorphism */}
        <div className="relative backdrop-blur-xl bg-card/60 border border-border/50 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Describe your music style (e.g., upbeat electronic, chill lo-fi, epic orchestral)"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              disabled={isLoading}
              className="flex-1 h-14 text-lg backdrop-blur-sm bg-background/50 border-border/50"
            />
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !style.trim()}
              size="lg"
              className="h-14 px-8 gap-2 text-lg"
            >
              {isLoading ? (
                <>
                  <Spinner className="h-5 w-5" />
                  {isGenerating ? 'Generating' : 'Creating Audio'}
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Music Player Section */}
        {(composition || coverImage) && (
          <div className="relative backdrop-blur-xl bg-card/60 border border-border/50 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-500">
            {/* Cover Image */}
            {coverImage && (
              <div className="relative w-full aspect-square md:aspect-video overflow-hidden">
                <img
                  src={coverImage || "/placeholder.svg"}
                  alt={`${style} music cover`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              </div>
            )}

            {/* Player Controls */}
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-balance">
                  {style}
                </h2>
                {composition && (
                  <p className="text-muted-foreground">
                    {composition.bpm} BPM • {composition.tracks.length} Tracks • {composition.duration}s
                  </p>
                )}
              </div>

              {audioUrl && (
                <>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                  />

                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={togglePlay}
                      size="lg"
                      className="gap-2"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-5 w-5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5" />
                          Play
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="lg"
                      className="gap-2 backdrop-blur-sm bg-background/50"
                    >
                      <Download className="h-5 w-5" />
                      Download
                    </Button>
                  </div>
                </>
              )}

              {isCreatingAudio && (
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <Spinner className="h-5 w-5" />
                  <span>Creating audio file...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
          <div className="backdrop-blur-xl bg-card/40 border border-border/30 rounded-xl p-4">
            <div className="font-semibold text-foreground mb-1">{'Multiple Instruments'}</div>
            <div>{'Synth, FM, Pluck, Drums & More'}</div>
          </div>
          <div className="backdrop-blur-xl bg-card/40 border border-border/30 rounded-xl p-4">
            <div className="font-semibold text-foreground mb-1">{'Harmonic Composition'}</div>
            <div>{'Melody, Bass, Chords & Rhythm'}</div>
          </div>
          <div className="backdrop-blur-xl bg-card/40 border border-border/30 rounded-xl p-4">
            <div className="font-semibold text-foreground mb-1">{'AI Generated'}</div>
            <div>{'Powered by POLLINATIONS'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
