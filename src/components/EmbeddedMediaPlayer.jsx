"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import useMediaProgress, {
  extractYouTubeId,
  extractGoogleDriveId,
  getMediaType,
} from "@/hooks/useMediaProgress";

/**
 * EmbeddedMediaPlayer - Inline media player for YouTube, Google Drive, PDFs, and articles
 * Simplified to let YouTube handle native controls (play, pause, seek)
 */
export default function EmbeddedMediaPlayer({
  resource,
  instanceId,
  onClose,
  onComplete,
  onPlayNext,
  isExpanded,
  theaterMode = false,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const timeSpentIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const hasCompletedRef = useRef(false);
  const progressRef = useRef(null);
  const saveProgressRef = useRef(null);
  const saveTimeSpentRef = useRef(null);
  const markAsCompleteRef = useRef(null);
  const onCompleteRef = useRef(null);
  const onPlayNextRef = useRef(null);

  const {
    progress,
    saveProgress,
    saveTimeSpent,
    markAsComplete,
    hasSavedProgress,
    isLoaded,
  } = useMediaProgress(instanceId, resource._id);

  const mediaType = getMediaType(resource.url, resource.type);
  const youtubeId =
    mediaType === "youtube" ? extractYouTubeId(resource.url) : null;
  const googleDriveId =
    mediaType === "google-drive-video"
      ? extractGoogleDriveId(resource.url)
      : null;

  // Reset completion flag when resource changes
  useEffect(() => {
    hasCompletedRef.current = false;
  }, [resource._id]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    saveProgressRef.current = saveProgress;
  }, [saveProgress]);

  useEffect(() => {
    saveTimeSpentRef.current = saveTimeSpent;
  }, [saveTimeSpent]);

  useEffect(() => {
    markAsCompleteRef.current = markAsComplete;
  }, [markAsComplete]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onPlayNextRef.current = onPlayNext;
  }, [onPlayNext]);

  // Handle YouTube player
  useEffect(() => {
    if (!isExpanded || mediaType !== "youtube" || !youtubeId || !isLoaded)
      return;

    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (playerRef.current) return; // Prevent double initialization

      playerRef.current = new window.YT.Player(
        `youtube-player-${resource._id}`,
        {
          videoId: youtubeId,
          playerVars: {
            autoplay: 1,
            start: Math.floor(progressRef.current?.currentTime || 0),
            rel: 0,
            modestbranding: 1,
            fs: 1, // Allow fullscreen
            disablekb: 0, // Enable keyboard controls (F, T, K, J, L, etc.)
            enablejsapi: 1,
          },
          events: {
            onReady: (event) => {
              setLoading(false);
              // Start progress tracking interval
              progressIntervalRef.current = setInterval(() => {
                if (playerRef.current && playerRef.current.getCurrentTime) {
                  const time = playerRef.current.getCurrentTime();
                  const dur = playerRef.current.getDuration();
                  if (saveProgressRef.current) {
                    saveProgressRef.current(time, dur);
                  }
                }
              }, 10000); // Save every 10 seconds
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PAUSED) {
                // Save progress on pause
                if (playerRef.current) {
                  const time = playerRef.current.getCurrentTime();
                  const dur = playerRef.current.getDuration();
                  if (saveProgressRef.current) {
                    saveProgressRef.current(time, dur);
                  }
                }
              } else if (event.data === window.YT.PlayerState.ENDED) {
                // Video ended - mark complete and play next
                if (!hasCompletedRef.current) {
                  hasCompletedRef.current = true;
                  if (markAsCompleteRef.current) {
                    markAsCompleteRef.current();
                  }
                  if (onCompleteRef.current)
                    onCompleteRef.current(resource._id);
                  // Auto-play next after short delay
                  if (onPlayNextRef.current) {
                    setTimeout(() => onPlayNextRef.current(resource._id), 500);
                  }
                }
              }
            },
            onError: (event) => {
              setLoading(false);
              const errorCodes = {
                2: "Invalid video ID",
                5: "HTML5 player error",
                100: "Video not found or private",
                101: "Video embedding disabled by owner",
                150: "Video embedding disabled by owner",
              };
              setError(errorCodes[event.data] || "Failed to load video");
            },
          },
        },
      );
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        // Save progress before destroying
        if (playerRef.current.getCurrentTime) {
          try {
            const time = playerRef.current.getCurrentTime();
            const dur = playerRef.current.getDuration();
            if (saveProgressRef.current) {
              saveProgressRef.current(time, dur);
            }
          } catch (e) {
            // Player may already be destroyed
          }
        }
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isExpanded, mediaType, youtubeId, resource._id, isLoaded]);

  // Handle time tracking for non-video content (PDFs, articles, Google Drive)
  useEffect(() => {
    if (!isExpanded || mediaType === "youtube") return;

    startTimeRef.current = Date.now();

    // Track time spent every 10 seconds
    timeSpentIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const totalTimeSpent = (progressRef.current?.timeSpent || 0) + elapsed;

        // Estimate total time for completion (in seconds)
        let estimatedTotal = 300; // Default 5 minutes
        if (resource.type === "pdf") {
          const pages = resource.metadata?.pages || 10;
          const minsPerPage = resource.metadata?.minsPerPage || 2;
          estimatedTotal = pages * minsPerPage * 60;
        } else if (resource.metadata?.estimatedMins) {
          estimatedTotal = resource.metadata.estimatedMins * 60;
        }

        const savedProgress = saveTimeSpentRef.current
          ? saveTimeSpentRef.current(totalTimeSpent, estimatedTotal)
          : null;

        if (
          savedProgress &&
          savedProgress.completed &&
          !hasCompletedRef.current
        ) {
          hasCompletedRef.current = true;
          if (onCompleteRef.current) onCompleteRef.current(resource._id);
          if (onPlayNextRef.current) {
            setTimeout(() => onPlayNextRef.current(resource._id), 500);
          }
        }
      }
    }, 10000);

    return () => {
      if (timeSpentIntervalRef.current) {
        clearInterval(timeSpentIntervalRef.current);
      }
      // Save final time spent
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const totalTimeSpent = (progressRef.current?.timeSpent || 0) + elapsed;
        if (saveTimeSpentRef.current) {
          saveTimeSpentRef.current(totalTimeSpent);
        }
      }
    };
  }, [isExpanded, mediaType, resource.type, resource.metadata, resource._id]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError("Failed to load content. The website may not allow embedding.");
  };

  // Get embed URL based on media type
  const getEmbedUrl = () => {
    switch (mediaType) {
      case "google-drive-video":
        if (googleDriveId) {
          return `https://drive.google.com/file/d/${googleDriveId}/preview`;
        }
        return null;
      case "pdf":
        if (resource.url.includes("drive.google.com")) {
          const driveId = extractGoogleDriveId(resource.url);
          if (driveId) {
            return `https://drive.google.com/file/d/${driveId}/preview`;
          }
        }
        return `https://docs.google.com/viewer?url=${encodeURIComponent(resource.url)}&embedded=true`;
      case "article":
      default:
        return resource.url;
    }
  };

  if (!isExpanded) return null;

  return (
    <div className="relative bg-black overflow-hidden">
      {/* Header Bar - Minimal, shows on hover */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-3 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-white text-sm font-medium">
          {hasSavedProgress && !error && progress.percentage > 0 && (
            <span className="px-2 py-0.5 bg-primary/80 rounded text-xs">
              {Math.round(progress.percentage)}% watched
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-5">
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-3" />
            <p className="text-white/80 text-sm">Loading...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center bg-slate-900 p-8 min-h-[300px] sm:min-h-[400px]">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-white font-semibold mb-2">Unable to Embed</h3>
          <p className="text-white/70 text-sm text-center mb-4 max-w-md">
            {error}
          </p>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Open in New Tab
          </a>
        </div>
      )}

      {/* YouTube Player */}
      {mediaType === "youtube" && !error && (
        <div className={`w-full ${theaterMode ? "h-[70vh]" : "aspect-video"}`}>
          <div
            id={`youtube-player-${resource._id}`}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Google Drive / PDF / Article iframe */}
      {mediaType !== "youtube" && !error && (
        <div className="relative">
          <div
            className={`w-full ${theaterMode ? "h-[70vh]" : mediaType === "pdf" ? "min-h-[500px] sm:min-h-[600px]" : "aspect-video"}`}
          >
            <iframe
              src={getEmbedUrl()}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox={
                mediaType === "article"
                  ? "allow-same-origin allow-scripts allow-popups allow-forms"
                  : undefined
              }
            />
          </div>
          {/* Link bar for non-YouTube content */}
          <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
            <span className="text-white/70 text-sm truncate flex-1 mr-4">
              {resource.url.length > 60
                ? resource.url.substring(0, 60) + "..."
                : resource.url}
            </span>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              <ExternalLink className="h-4 w-4" />
              Open Original
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
