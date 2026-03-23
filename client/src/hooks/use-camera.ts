import { useState, useEffect, useRef } from "react";

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const initializeCamera = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            facingMode: 'user'
          },
          audio: false
        });

        currentStream = mediaStream;
        setStream(mediaStream);
      } catch (err) {
        console.error('Camera initialization error:', err);
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setError('카메라 접근이 허용되지 않았습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
          } else if (err.name === 'NotFoundError') {
            setError('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
          } else if (err.name === 'NotReadableError') {
            setError('카메라를 사용할 수 없습니다. 다른 앱에서 카메라를 사용중인지 확인해주세요.');
          } else {
            setError('카메라 초기화에 실패했습니다.');
          }
        } else {
          setError('알 수 없는 오류가 발생했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('이 브라우저는 카메라 기능을 지원하지 않습니다.');
      setIsLoading(false);
      return;
    }

    initializeCamera();

    // Cleanup function
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, [stream]);

  return { stream, error, isLoading };
}
