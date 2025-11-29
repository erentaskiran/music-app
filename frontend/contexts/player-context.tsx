"use client"

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Track } from '@/lib/types'
import { recordListen, isAuthenticated } from '@/lib/api'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface PlayerContextType {
  // State
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isLoading: boolean
  queue: Track[]

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void
  togglePlay: () => void
  pause: () => void
  resume: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  stop: () => void
  addToQueue: (track: Track) => void
  playNext: (track: Track) => void
  nextTrack: () => void
  previousTrack: () => void
  clearQueue: () => void
}

const PlayerContext = createContext<PlayerContextType | null>(null)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const initialVolumeRef = useRef(1)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [queue, setQueue] = useState<Track[]>([])
  const [history, setHistory] = useState<Track[]>([])

  // Refs for accessing state in event listeners
  const queueRef = useRef<Track[]>([])
  const historyRef = useRef<Track[]>([])
  const currentTrackRef = useRef<Track | null>(null)

  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { historyRef.current = history }, [history])
  useEffect(() => { currentTrackRef.current = currentTrack }, [currentTrack])

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    // Check authentication before playing
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const audio = audioRef.current
    if (!audio) return

    // Add current track to history if it exists and is different from the new track
    if (currentTrackRef.current && currentTrackRef.current.id !== track.id) {
      setHistory(prev => [...prev, currentTrackRef.current!])
    }

    if (newQueue) {
      setQueue(newQueue)
    }

    setIsLoading(true)
    setCurrentTrack(track)
    
    recordListen(track.id).catch(() => {
      // Silently fail - don't log errors for listen recording
    })
    
    // Use the streaming endpoint
    const streamUrl = `${BASE_URL}/api/tracks/${track.id}/stream`
    audio.src = streamUrl
    audio.load()
    
    audio.play().catch((error) => {
      console.error('Failed to play:', error)
      setIsLoading(false)
    })
  }, [router])

  const nextTrack = useCallback(() => {
    const queue = queueRef.current
    if (queue.length > 0) {
      const next = queue[0]
      setQueue(prev => prev.slice(1))
      playTrack(next)
    } else {
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [playTrack])

  const previousTrack = useCallback(() => {
    const history = historyRef.current
    if (history.length > 0) {
      const previous = history[history.length - 1]
      setHistory(prev => prev.slice(0, -1))
      
      // Add current track to front of queue so we can go "Next" back to it
      if (currentTrackRef.current) {
        setQueue(prev => [currentTrackRef.current!, ...prev])
      }
      
      // We need to bypass the history addition in playTrack for this specific case
      // But playTrack adds to history. 
      // Let's just manually set it here to avoid circular history addition
      
      const audio = audioRef.current
      if (!audio) return

      setIsLoading(true)
      setCurrentTrack(previous)
      
      const streamUrl = `${BASE_URL}/api/tracks/${previous.id}/stream`
      audio.src = streamUrl
      audio.load()
      audio.play().catch(console.error)
    } else {
      // If no history, just restart current track
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
      }
    }
  }, [])

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track])
  }, [])

  const playNext = useCallback((track: Track) => {
    setQueue(prev => [track, ...prev])
  }, [])

  const clearQueue = useCallback(() => {
    setQueue([])
  }, [])

  // Ref for nextTrack to be used in event listener
  const nextTrackRef = useRef(nextTrack)
  useEffect(() => { nextTrackRef.current = nextTrack }, [nextTrack])

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.volume = initialVolumeRef.current
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleEnded = () => {
      // Use ref to call nextTrack to avoid stale closure or dependency issues
      if (queueRef.current.length > 0) {
        nextTrackRef.current()
      } else {
        setIsPlaying(false)
        setCurrentTime(0)
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleWaiting = () => {
      setIsLoading(true)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    const handleError = (e: Event) => {
      console.error('Audio error:', e)
      setIsLoading(false)
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }
  }, [])



  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(console.error)
    }
  }, [isPlaying, currentTrack])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.play().catch(console.error)
  }, [])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    const audio = audioRef.current
    if (!audio) return
    
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    audio.volume = clampedVolume
    setVolumeState(clampedVolume)
    
    if (clampedVolume > 0 && isMuted) {
      setIsMuted(false)
    }
  }, [isMuted])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }, [isMuted, volume])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.pause()
    audio.currentTime = 0
    setCurrentTrack(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isLoading,
        queue,
        playTrack,
        togglePlay,
        pause,
        resume,
        seek,
        setVolume,
        toggleMute,
        stop,
        addToQueue,
        playNext,
        nextTrack,
        previousTrack,
        clearQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider')
  }
  return context
}
