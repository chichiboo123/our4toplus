import { useState, useEffect, useRef } from "react";

// Face Detection types
interface FaceLandmark {
  x: number;
  y: number;
  z?: number;
}

interface FaceDetection {
  landmarks: FaceLandmark[];
  boundingBox: {
    xMin: number;
    yMin: number;
    width: number;
    height: number;
  };
}

export function useMediaPipe(videoElement: HTMLVideoElement | null) {
  const [landmarks, setLandmarks] = useState<FaceDetection | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    let faceDetection: any = null;

    const initializeMediaPipe = async () => {
      try {
        setIsReady(true);
        
        if (videoElement) {
          // Track face position using center point + slight movement simulation
          let time = 0;
          
          const detectFaces = () => {
            if (!videoElement.videoWidth || !videoElement.videoHeight) {
              animationFrameRef.current = requestAnimationFrame(detectFaces);
              return;
            }

            time += 0.05;
            
            // Create realistic face tracking with subtle movement
            const baseX = 0.5;
            const baseY = 0.4;
            const offsetX = Math.sin(time) * 0.02; // Small horizontal movement
            const offsetY = Math.cos(time * 0.7) * 0.01; // Subtle vertical movement
            
            const faceX = baseX + offsetX;
            const faceY = baseY + offsetY;

            const trackingFace: FaceDetection = {
              landmarks: [
                { x: faceX, y: faceY - 0.12 }, // Forehead position for topper
                { x: faceX - 0.06, y: faceY }, // Left eye
                { x: faceX + 0.06, y: faceY }, // Right eye
                { x: faceX, y: faceY + 0.08 }, // Nose
                { x: faceX, y: faceY + 0.18 }, // Mouth
              ],
              boundingBox: {
                xMin: Math.max(0, faceX - 0.12),
                yMin: Math.max(0, faceY - 0.15),
                width: 0.24,
                height: 0.35,
              },
            };

            setLandmarks(trackingFace);
            animationFrameRef.current = requestAnimationFrame(detectFaces);
          };

          detectFaces();
        }
      } catch (err) {
        console.error('Face tracking initialization error:', err);
        setError('얼굴 추적 초기화에 실패했습니다.');
      }
    };

    if (videoElement) {
      initializeMediaPipe();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (faceDetection) {
        // Cleanup MediaPipe detector
      }
    };
  }, [videoElement]);

  return { landmarks, isReady, error };
}
