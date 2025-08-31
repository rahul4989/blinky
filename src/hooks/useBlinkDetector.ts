import { useEffect, useRef, useCallback, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import {
  calculateEAR,
  extractEyeLandmarks,
  LEFT_EYE_LANDMARKS,
  RIGHT_EYE_LANDMARKS,
  BlinkDetector
} from '../utils/blinkLogic';

interface UseBlinkDetectorProps {
  onBlink?: () => void;
  enabled?: boolean;
  earThreshold?: number;
  minBlinkFrames?: number;
}

interface BlinkDetectorState {
  isInitialized: boolean;
  error: string | null;
  isDetecting: boolean;
  leftEAR: number;
  rightEAR: number;
}

export function useBlinkDetector({
  onBlink,
  enabled = true,
  earThreshold = 0.22,
  minBlinkFrames = 2
}: UseBlinkDetectorProps = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const blinkDetectorRef = useRef<BlinkDetector | null>(null);
  
  const [state, setState] = useState<BlinkDetectorState>({
    isInitialized: false,
    error: null,
    isDetecting: false,
    leftEAR: 0,
    rightEAR: 0
  });

  // Handle MediaPipe results
  const onResults = useCallback((results: any) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return;
    }

    try {
      const landmarks = results.multiFaceLandmarks[0];
      
      // Extract eye landmarks
      const leftEyeLandmarks = extractEyeLandmarks(landmarks, LEFT_EYE_LANDMARKS);
      const rightEyeLandmarks = extractEyeLandmarks(landmarks, RIGHT_EYE_LANDMARKS);
      
      // Calculate EAR for both eyes
      const leftEAR = calculateEAR(leftEyeLandmarks);
      const rightEAR = calculateEAR(rightEyeLandmarks);
      
      // Update state with current EAR values
      setState(prev => ({
        ...prev,
        leftEAR,
        rightEAR,
        isDetecting: true
      }));
      
      // Detect blink
      if (blinkDetectorRef.current) {
        const blinkDetected = blinkDetectorRef.current.processFrame(leftEAR, rightEAR);
        if (blinkDetected && onBlink) {
          onBlink();
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error processing face detection'
      }));
    }
  }, [onBlink]);

  // Initialize MediaPipe FaceMesh
  const initializeFaceMesh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Initialize blink detector
      blinkDetectorRef.current = new BlinkDetector(minBlinkFrames, earThreshold);
      
      // Initialize FaceMesh
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });
      
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;
      
      setState(prev => ({ ...prev, isInitialized: true }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize face detection'
      }));
    }
  }, [onResults, earThreshold, minBlinkFrames]);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current || !faceMeshRef.current) return;

    try {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (faceMeshRef.current && enabled) {
            await faceMeshRef.current.send({ image: videoRef.current! });
          }
        },
        width: 640,
        height: 480
      });
      
      await camera.start();
      cameraRef.current = camera;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to access camera. Please check permissions.'
      }));
    }
  }, [enabled]);

  // Start detection
  const startDetection = useCallback(async () => {
    if (!state.isInitialized) {
      await initializeFaceMesh();
    }
    await initializeCamera();
  }, [state.isInitialized, initializeFaceMesh, initializeCamera]);

  // Stop detection
  const stopDetection = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    setState(prev => ({ ...prev, isDetecting: false }));
  }, []);

  // Reset detector
  const resetDetector = useCallback(() => {
    if (blinkDetectorRef.current) {
      blinkDetectorRef.current.reset();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, [stopDetection]);

  // Auto-start when enabled
  useEffect(() => {
    if (enabled && videoRef.current) {
      startDetection();
    } else {
      stopDetection();
    }
  }, [enabled, startDetection, stopDetection]);

  return {
    videoRef,
    state,
    startDetection,
    stopDetection,
    resetDetector
  };
}
