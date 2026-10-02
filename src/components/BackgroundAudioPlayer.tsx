import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Volume1, Music, Sparkles, Zap, SlidersHorizontal } from 'lucide-react';
import { ThemeConfig, ThemeId } from '../types/theme';

export interface ThemeAudioConfig {
  videoId: string;
  youtubeUrl: string;
  title: string;
  themeName: string;
  vibeDescription: string;
}

export const THEME_AUDIO_TRACKS: Record<ThemeId, ThemeAudioConfig> = {
  'dark-virgo-gold': {
    videoId: 'yfsqGCO_ZfM',
    youtubeUrl: 'https://www.youtube.com/watch?v=yfsqGCO_ZfM&list=PLh6Ws4Fpphfqr7VL72Q6HK5Ole9YI54hv&index=12',
    title: 'Virgo Gold Celestial Lounge',
    themeName: 'Dark Virgo Gold',
    vibeDescription: 'Modern luxury & celestial celebration vibes',
  },
  'rose-blush': {
    videoId: 'jokHmrFq56E',
    youtubeUrl: 'https://www.youtube.com/watch?v=jokHmrFq56E&list=PLh6Ws4Fpphfqr7VL72Q6HK5Ole9YI54hv&index=9',
    title: 'Rose Blush Sweet Melody',
    themeName: 'Rose Blush',
    vibeDescription: 'Sweet, gentle & romantic celebration',
  },
  'midnight-violet': {
    videoId: 'KopFUu0F4gk',
    youtubeUrl: 'https://www.youtube.com/watch?v=KopFUu0F4gk&list=PLh6Ws4Fpphfqr7VL72Q6HK5Ole9YI54hv&index=21',
    title: 'Midnight Violet Neon Groove',
    themeName: 'Midnight Violet',
    vibeDescription: 'Electric euphoria & night party beats',
  },
};

// Extend Window interface for YouTube IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface BackgroundAudioPlayerProps {
  currentTheme: ThemeConfig;
  currentThemeId: ThemeId;
}

export const BackgroundAudioPlayer: React.FC<BackgroundAudioPlayerProps> = ({
  currentTheme,
  currentThemeId,
}) => {
  const playerRef = useRef<any>(null);
  const containerId = 'youtube-bg-audio-container';
  const currentTrack = THEME_AUDIO_TRACKS[currentThemeId] || THEME_AUDIO_TRACKS['dark-virgo-gold'];

  // Audio status state - Default volume 70%
  const [volume, setVolume] = useState<number>(70);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [showVolumeControl, setShowVolumeControl] = useState<boolean>(false);

  // Apply volume change to active player instance
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(newVolume);
        if (newVolume === 0) {
          setIsMuted(true);
          playerRef.current.mute();
        } else if (isMuted) {
          setIsMuted(false);
          playerRef.current.unMute();
        }
      } catch (err) {
        console.warn('Error setting volume:', err);
      }
    }
  }, [isMuted]);

  // Initialize and load YouTube Iframe API with lightweight buffering configuration
  useEffect(() => {
    let isMounted = true;

    const createPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      // Clean up previous instance if any
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore cleanup errors
        }
      }

      try {
        playerRef.current = new window.YT.Player(containerId, {
          height: '10',
          width: '10',
          videoId: currentTrack.videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            playlist: currentTrack.videoId,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            playsinline: 1,
            // Optimization for fastest lightweight audio stream:
            iv_load_policy: 3, // Disable annotations
            cc_load_policy: 0, // Disable closed captions
            vq: 'tiny',        // Request 144p/tiny stream for rapid lightweight audio buffering
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              setIsReady(true);
              try {
                // Request lowest stream quality for fastest buffer and minimal data usage
                if (typeof event.target.setPlaybackQuality === 'function') {
                  event.target.setPlaybackQuality('tiny');
                }
                // Set default volume 70%
                event.target.setVolume(70);
                // Attempt autoplay
                event.target.playVideo();
                if (!isMuted) {
                  event.target.unMute();
                } else {
                  event.target.mute();
                }
              } catch (err) {
                console.warn('YouTube autoplay warning:', err);
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
              if (event.data === 1) {
                setIsPlaying(true);
                // Ensure stream quality remains tiny for fast playback
                try {
                  if (typeof event.target.setPlaybackQuality === 'function') {
                    event.target.setPlaybackQuality('tiny');
                  }
                } catch (e) {
                  // ignore
                }
              } else if (event.data === 0) {
                // Loop video automatically
                try {
                  event.target.seekTo(0);
                  event.target.playVideo();
                } catch (e) {
                  // ignore
                }
              } else if (event.data === 2) {
                // Keep playing if user didn't intentionally pause
                try {
                  event.target.playVideo();
                } catch (e) {
                  // ignore
                }
              }
            },
            onError: (err: any) => {
              console.warn('YouTube audio player error:', err);
            },
          },
        });
      } catch (err) {
        console.warn('Failed to initialize YouTube Player:', err);
      }
    };

    if (!window.YT || !window.YT.Player) {
      // Check if script tag is already in head
      const existingScript = document.getElementById('youtube-iframe-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        if (isMounted) {
          createPlayer();
        }
      };
    } else {
      createPlayer();
    }

    return () => {
      isMounted = false;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Handle track changing when theme changes (with lightweight buffering & 70% volume)
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      try {
        playerRef.current.loadVideoById({
          videoId: currentTrack.videoId,
          startSeconds: 0,
          suggestedQuality: 'tiny',
        });
        if (typeof playerRef.current.setPlaybackQuality === 'function') {
          playerRef.current.setPlaybackQuality('tiny');
        }
        playerRef.current.setVolume(volume);
        if (isMuted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
        }
        playerRef.current.playVideo();

        // Show brief toast about new music
        setShowToast(true);
        const timer = setTimeout(() => setShowToast(false), 3500);
        return () => clearTimeout(timer);
      } catch (e) {
        console.warn('Error loading new track:', e);
      }
    }
  }, [currentThemeId, currentTrack.videoId]);

  // Handle Autoplay restrictions across modern browsers with a global one-time gesture
  useEffect(() => {
    const handleFirstUserGesture = () => {
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.setPlaybackQuality === 'function') {
            playerRef.current.setPlaybackQuality('tiny');
          }
          if (typeof playerRef.current.playVideo === 'function') {
            playerRef.current.playVideo();
          }
          if (!isMuted && typeof playerRef.current.unMute === 'function') {
            playerRef.current.unMute();
            playerRef.current.setVolume(volume);
          }
        } catch (e) {
          // ignore
        }
      }
    };

    window.addEventListener('click', handleFirstUserGesture, { once: true });
    window.addEventListener('touchstart', handleFirstUserGesture, { once: true });
    window.addEventListener('keydown', handleFirstUserGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstUserGesture);
      window.removeEventListener('touchstart', handleFirstUserGesture);
      window.removeEventListener('keydown', handleFirstUserGesture);
    };
  }, [isMuted, volume]);

  // Toggle Mute / Unmute function
  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume > 0 ? volume : 70);
        if (volume === 0) setVolume(70);
        playerRef.current.playVideo();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (e) {
      console.warn('Error toggling mute:', e);
    }
  }, [isMuted, volume]);

  return (
    <>
      {/* Hidden YouTube Iframe Container */}
      <div
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <div id={containerId} />
      </div>

      {/* Floating Audio Controller (Mute / Unmute & Track Info) */}
      <div className="fixed bottom-4 left-3 sm:bottom-6 sm:left-6 z-40 flex flex-col items-start gap-2 pointer-events-none select-none max-w-[calc(100vw-24px)]">
        {/* Track Notification Toast on theme change */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto px-3.5 py-2 rounded-2xl bg-slate-950/95 text-white border border-white/20 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 max-w-xs text-xs"
              style={{
                boxShadow: `0 8px 30px ${currentTheme.accentPrimary}30`,
              }}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${currentTheme.accentPrimary}25`,
                  color: currentTheme.accentPrimary,
                }}
              >
                <Music className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold truncate text-[11px]" style={{ color: currentTheme.accentPrimary }}>
                    {currentTrack.themeName} Sound
                  </p>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> Lite
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 truncate opacity-90">
                  {currentTrack.vibeDescription} • Vol {volume}%
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume Slider Popover Panel */}
        <AnimatePresence>
          {showVolumeControl && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="pointer-events-auto p-3.5 rounded-2xl bg-slate-950/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 w-60 sm:w-64 max-w-[calc(100vw-32px)]"
              style={{
                boxShadow: `0 12px 35px rgba(0,0,0,0.6), 0 0 20px ${currentTheme.accentPrimary}20`,
              }}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Volume Audio</span>
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {isMuted ? '0% (Mute)' : `${volume}%`}
                </span>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleVolumeChange(0)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Mute (0%)"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <button
                  type="button"
                  onClick={() => handleVolumeChange(100)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Max (100%)"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Zap className="w-2.5 h-2.5" /> 144p Audio Stream
                </span>
                <button
                  type="button"
                  onClick={() => handleVolumeChange(70)}
                  className="text-amber-300 hover:underline font-mono"
                  title="Kembalikan ke volume 70%"
                >
                  Reset 70%
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Audio Control Pill Button & Volume Toggle */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Main Audio Toggle Pill */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Nyalakan Musik (Unmute)' : 'Matikan Musik (Mute)'}
            title={isMuted ? 'Nyalakan Musik Latar' : 'Matikan Suara Musik'}
            className="group px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-full backdrop-blur-xl border flex items-center gap-2 sm:gap-2.5 shadow-xl transition-all cursor-pointer select-none"
            style={{
              backgroundColor: currentTheme.isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)',
              borderColor: isMuted ? 'rgba(148, 163, 184, 0.35)' : `${currentTheme.accentPrimary}80`,
              boxShadow: isMuted
                ? '0 4px 20px rgba(0,0,0,0.25)'
                : `0 4px 24px ${currentTheme.accentPrimary}35, 0 0 12px ${currentTheme.accentPrimary}20`,
            }}
          >
            {/* Animated Equalizer Wave Bars */}
            <div className="flex items-end gap-0.5 h-3.5 sm:h-4 w-3.5 sm:w-4 justify-center shrink-0">
              {isMuted ? (
                <VolumeX className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400" />
              ) : (
                <>
                  <motion.span
                    animate={{
                      height: isPlaying ? ['4px', '14px', '6px', '16px', '4px'] : '4px',
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.9,
                      ease: 'easeInOut',
                    }}
                    className="w-0.5 rounded-full"
                    style={{ backgroundColor: currentTheme.accentPrimary }}
                  />
                  <motion.span
                    animate={{
                      height: isPlaying ? ['14px', '6px', '16px', '8px', '14px'] : '6px',
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      ease: 'easeInOut',
                      delay: 0.15,
                    }}
                    className="w-0.5 rounded-full"
                    style={{ backgroundColor: currentTheme.accentPrimary }}
                  />
                  <motion.span
                    animate={{
                      height: isPlaying ? ['6px', '16px', '8px', '14px', '6px'] : '8px',
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.0,
                      ease: 'easeInOut',
                      delay: 0.3,
                    }}
                    className="w-0.5 rounded-full"
                    style={{ backgroundColor: currentTheme.accentPrimary }}
                  />
                  <motion.span
                    animate={{
                      height: isPlaying ? ['12px', '4px', '14px', '6px', '12px'] : '4px',
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.75,
                      ease: 'easeInOut',
                      delay: 0.45,
                    }}
                    className="w-0.5 rounded-full"
                    style={{ backgroundColor: currentTheme.accentPrimary }}
                  />
                </>
              )}
            </div>

            {/* Text Info */}
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold">
              {isMuted ? (
                <span className="text-slate-400 font-medium">
                  Muted
                </span>
              ) : (
                <span className="text-current font-bold flex items-center gap-1">
                  <span className="hidden xs:inline">Musik:</span>
                  <span
                    className="truncate max-w-[70px] xs:max-w-[110px] sm:max-w-[140px]"
                    style={{ color: currentTheme.accentPrimary }}
                  >
                    {currentTrack.themeName}
                  </span>
                </span>
              )}
            </div>

            {/* Volume State Dot Indicator */}
            <div
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 transition-colors"
              style={{
                backgroundColor: isMuted ? 'rgba(148, 163, 184, 0.15)' : `${currentTheme.accentPrimary}25`,
                color: isMuted ? '#94a3b8' : currentTheme.accentPrimary,
              }}
            >
              {isMuted ? (
                <VolumeX className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              ) : volume <= 35 ? (
                <Volume1 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              ) : (
                <Volume2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              )}
            </div>
          </motion.button>

          {/* Quick Volume Slider Button */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => setShowVolumeControl((prev) => !prev)}
            aria-label="Pengaturan Volume"
            title="Atur Volume Suara"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-lg transition-all cursor-pointer shrink-0"
            style={{
              backgroundColor: currentTheme.isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)',
              borderColor: showVolumeControl ? currentTheme.accentPrimary : 'rgba(148, 163, 184, 0.35)',
              color: showVolumeControl ? currentTheme.accentPrimary : '#94a3b8',
            }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.button>
        </div>
      </div>
    </>
  );
};

