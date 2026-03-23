import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, RotateCw, Play, Pause, Trash2 } from "lucide-react";
import { FrameType, TopperData } from "@/pages/home";
import { useCamera } from "@/hooks/use-camera";
import { useMediaPipe } from "@/hooks/use-mediapipe";
import { capturePhotoWithAR } from "@/lib/photo-utils";

interface PhotoCaptureProps {
  frameType: FrameType;
  topperData: TopperData[];
  onPhotosCaptured: (photos: string[], aspectRatio?: number) => void;
  onRemoveTopper: (topperId: string) => void;
}

export default function PhotoCapture({ frameType, topperData, onPhotosCaptured, onRemoveTopper }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [showTopper, setShowTopper] = useState(true);
  const [topperCounts, setTopperCounts] = useState<{[key: string]: number}>({});
  const [topperSize, setTopperSize] = useState(1.0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [topperPositions, setTopperPositions] = useState<{[key: string]: {x: number, y: number}}>({});
  const [draggedTopper, setDraggedTopper] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0});

  const { stream, error: cameraError } = useCamera();
  const { landmarks, isReady: mediaPipeReady } = useMediaPipe(videoRef.current);

  const requiredPhotos = frameType === '4cut' ? 4 : frameType === '2cut' ? 2 : 1;

  // Memoize expanded toppers to prevent setState during render warning
  const expandedToppers = useMemo(() => {
    const result: { topper: TopperData; instanceIndex: number; id: string }[] = [];
    topperData.forEach((topper) => {
      const count = topperCounts[topper.id] !== undefined ? topperCounts[topper.id] : 1;
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const instanceId = `${topper.id}_${i}`;
          result.push({ topper, instanceIndex: i, id: instanceId });
        }
      }
    });
    return result;
  }, [topperData, topperCounts]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (capturedPhotos.length >= requiredPhotos) {
      onPhotosCaptured(capturedPhotos);
    }
  }, [capturedPhotos, requiredPhotos, onPhotosCaptured]);

  // Store loaded images for better performance
  const [uploadedImageCaches, setUploadedImageCaches] = useState<Map<string, HTMLImageElement>>(new Map());

  // Cache uploaded images when topper data changes
  useEffect(() => {
    const newCaches = new Map<string, HTMLImageElement>();
    
    topperData.forEach(topper => {
      if (topper.type === 'upload') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setUploadedImageCaches(prev => {
            const updated = new Map(prev);
            updated.set(topper.id, img);
            return updated;
          });
        };
        img.src = topper.data;
      }
    });
  }, [topperData]);

  // Real-time AR overlay rendering
  const renderAROverlay = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !showTopper || !landmarks) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw multiple AR toppers with improved face tracking
    if (landmarks && landmarks.landmarks.length > 0 && topperData.length > 0) {
      const faceBox = landmarks.boundingBox;
      const faceWidth = faceBox.width * canvas.width;
      const faceHeight = faceBox.height * canvas.height;
      
      // Base position at the top center of the face
      const baseCenterX = (faceBox.xMin + faceBox.width / 2) * canvas.width;
      const baseCenterY = faceBox.yMin * canvas.height - faceHeight * 0.15;
      
      // Calculate topper size based on face width and size multiplier
      const baseTopperSize = Math.max(faceWidth * 0.4, 30);
      const adjustedTopperSize = baseTopperSize * topperSize;
      
      // Use memoized expanded toppers

      // Arrange multiple toppers with floating animation and drag support
      expandedToppers.forEach(({ topper, instanceIndex, id }, index) => {
        const totalToppers = expandedToppers.length;
        let topperX, topperY;
        
        // Check if topper has custom position from dragging
        const customPos = topperPositions[id];
        
        // Calculate base floating animation
        const time = isAnimating ? Date.now() / 1000 : 0;
        const floatOffset = isAnimating ? Math.sin(time + index * 0.5) * 15 : 0;
        const rotateOffset = isAnimating ? Math.cos(time * 0.7 + index * 0.3) * 5 : 0;
        
        if (customPos) {
          // Convert normalized coordinates back to canvas coordinates
          topperX = customPos.x * canvas.width + (isAnimating ? rotateOffset : 0);
          topperY = customPos.y * canvas.height + (isAnimating ? floatOffset : 0);
        } else {
          // Calculate default floating position
          if (totalToppers === 1) {
            topperX = baseCenterX + rotateOffset;
            topperY = baseCenterY + floatOffset;
          } else {
            // Use wider angle spread for better separation
            const angle = (index - (totalToppers - 1) / 2) * (Math.PI / (totalToppers + 1));
            const radius = Math.max(adjustedTopperSize * 1.5, 80);
            
            topperX = baseCenterX + Math.sin(angle) * radius + rotateOffset;
            topperY = baseCenterY - Math.abs(Math.cos(angle)) * radius * 0.5 + floatOffset;
          }
        }
        
        // Clamp position to stay within canvas bounds
        const safeX = Math.max(adjustedTopperSize / 2, Math.min(topperX, canvas.width - adjustedTopperSize / 2));
        const safeY = Math.max(adjustedTopperSize / 2, Math.min(topperY, canvas.height - adjustedTopperSize / 2));

        ctx.save();
        ctx.translate(safeX, safeY);

        // Add subtle glow effect when animating
        if (isAnimating && !customPos) {
          ctx.shadowColor = 'rgba(255, 223, 128, 0.4)';
          ctx.shadowBlur = 8;
          
          // Add gentle rotation when floating
          const time = isAnimating ? Date.now() / 1000 : 0;
          const rotationAngle = isAnimating ? Math.sin(time * 0.5 + index * 0.4) * 0.1 : 0;
          ctx.rotate(rotationAngle);
        }

        if (topper.type === 'emoji') {
          ctx.font = `${adjustedTopperSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(topper.data, 0, 0);
        } else if (topper.type === 'upload') {
          const cachedImg = uploadedImageCaches.get(topper.id);
          if (cachedImg) {
            ctx.drawImage(
              cachedImg,
              -adjustedTopperSize / 2,
              -adjustedTopperSize / 2,
              adjustedTopperSize,
              adjustedTopperSize
            );
          }
        }

        ctx.restore();
      });
    }
  }, [landmarks, topperData, showTopper, uploadedImageCaches, isAnimating, topperPositions, topperCounts, topperSize]);

  // Drag event handlers
  const getTopperAtPosition = (x: number, y: number) => {
    if (!canvasRef.current || !landmarks) return null;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;
    
    // Use memoized expanded toppers for hit detection
    
    const faceBox = landmarks.boundingBox;
    const faceWidth = faceBox.width * canvas.width;
    const faceHeight = faceBox.height * canvas.height;
    const baseTopperSize = Math.max(faceWidth * 0.4, 30);
    const adjustedTopperSize = baseTopperSize * topperSize;
    
    // Base position at the top center of the face
    const baseCenterX = (faceBox.xMin + faceBox.width / 2) * canvas.width;
    const baseCenterY = faceBox.yMin * canvas.height - faceHeight * 0.15;
    
    // Check each topper for hit detection (reverse order for top-most first)
    for (let i = expandedToppers.length - 1; i >= 0; i--) {
      const { id } = expandedToppers[i];
      const customPos = topperPositions[id];
      
      let topperX, topperY;
      
      if (customPos) {
        topperX = customPos.x * canvas.width;
        topperY = customPos.y * canvas.height;
      } else {
        // Calculate default floating position
        const time = isAnimating ? Date.now() / 1000 : 0;
        const floatOffset = isAnimating ? Math.sin(time + i * 0.5) * 15 : 0;
        const rotateOffset = isAnimating ? Math.cos(time * 0.7 + i * 0.3) * 5 : 0;
        
        if (expandedToppers.length === 1) {
          topperX = baseCenterX + rotateOffset;
          topperY = baseCenterY + floatOffset;
        } else {
          const angle = (i - (expandedToppers.length - 1) / 2) * (Math.PI / (expandedToppers.length + 1));
          const radius = Math.max(adjustedTopperSize * 1.5, 80);
          
          topperX = baseCenterX + Math.sin(angle) * radius + rotateOffset;
          topperY = baseCenterY - Math.abs(Math.cos(angle)) * radius * 0.5 + floatOffset;
        }
      }
      
      const distance = Math.sqrt(
        Math.pow(canvasX - topperX, 2) + Math.pow(canvasY - topperY, 2)
      );
      
      if (distance <= adjustedTopperSize / 2) {
        return { id, x: canvasX, y: canvasY };
      }
    }
    
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const topper = getTopperAtPosition(e.clientX, e.clientY);
    if (topper && canvasRef.current) {
      const canvas = canvasRef.current;
      setDraggedTopper(topper.id);
      const normalizedX = topper.x / canvas.width;
      const normalizedY = topper.y / canvas.height;
      setDragOffset({
        x: topper.x - (topperPositions[topper.id]?.x * canvas.width || normalizedX * canvas.width),
        y: topper.y - (topperPositions[topper.id]?.y * canvas.height || normalizedY * canvas.height)
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedTopper && canvasRef.current && landmarks) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;
      
      // Calculate topper size for boundary checking
      const faceBox = landmarks.boundingBox;
      const faceWidth = faceBox.width * canvas.width;
      const baseTopperSize = Math.max(faceWidth * 0.4, 30);
      const adjustedTopperSize = baseTopperSize * topperSize;
      
      // Clamp position to stay within canvas bounds
      const clampedX = Math.max(adjustedTopperSize / 2, Math.min(canvasX - dragOffset.x, canvas.width - adjustedTopperSize / 2));
      const clampedY = Math.max(adjustedTopperSize / 2, Math.min(canvasY - dragOffset.y, canvas.height - adjustedTopperSize / 2));
      
      // Store normalized coordinates (0-1 range) for proper cross-canvas consistency
      setTopperPositions(prev => ({
        ...prev,
        [draggedTopper]: {
          x: clampedX / canvas.width,
          y: clampedY / canvas.height
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggedTopper(null);
    setDragOffset({x: 0, y: 0});
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const topper = getTopperAtPosition(touch.clientX, touch.clientY);
    if (topper && canvasRef.current) {
      const canvas = canvasRef.current;
      setDraggedTopper(topper.id);
      const normalizedX = topper.x / canvas.width;
      const normalizedY = topper.y / canvas.height;
      setDragOffset({
        x: topper.x - (topperPositions[topper.id]?.x * canvas.width || normalizedX * canvas.width),
        y: topper.y - (topperPositions[topper.id]?.y * canvas.height || normalizedY * canvas.height)
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (draggedTopper && canvasRef.current && landmarks) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const touch = e.touches[0];
      const canvasX = (touch.clientX - rect.left) * scaleX;
      const canvasY = (touch.clientY - rect.top) * scaleY;
      
      // Calculate topper size for boundary checking
      const faceBox = landmarks.boundingBox;
      const faceWidth = faceBox.width * canvas.width;
      const baseTopperSize = Math.max(faceWidth * 0.4, 30);
      const adjustedTopperSize = baseTopperSize * topperSize;
      
      // Clamp position to stay within canvas bounds
      const clampedX = Math.max(adjustedTopperSize / 2, Math.min(canvasX - dragOffset.x, canvas.width - adjustedTopperSize / 2));
      const clampedY = Math.max(adjustedTopperSize / 2, Math.min(canvasY - dragOffset.y, canvas.height - adjustedTopperSize / 2));
      
      // Store normalized coordinates (0-1 range) for proper cross-canvas consistency
      setTopperPositions(prev => ({
        ...prev,
        [draggedTopper]: {
          x: clampedX / canvas.width,
          y: clampedY / canvas.height
        }
      }));
    }
  };

  const handleTouchEnd = () => {
    setDraggedTopper(null);
    setDragOffset({x: 0, y: 0});
  };

  // Start AR overlay animation loop
  useEffect(() => {
    let animationFrame: number;
    
    const animate = () => {
      renderAROverlay();
      animationFrame = requestAnimationFrame(animate);
    };

    if (stream && mediaPipeReady) {
      animate();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [stream, mediaPipeReady, renderAROverlay]);

  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdownNumber(3);
    
    const timer = setInterval(() => {
      setCountdownNumber((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCountingDown(false);
          capturePhoto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !landmarks) return;

    // Calculate the actual topper sizes for each topper instance
    const canvas = canvasRef.current;
    const faceBox = landmarks.boundingBox;
    const faceWidth = faceBox.width * canvas.width;
    const baseTopperSize = Math.max(faceWidth * 0.4, 30);
    const actualTopperSize = baseTopperSize * topperSize;

    // Create a map of topper sizes for each instance
    const topperSizes: {[key: string]: number} = {};
    expandedToppers.forEach(({ id }) => {
      topperSizes[id] = actualTopperSize;
    });

    try {
      const photo = await capturePhotoWithAR(
        videoRef.current,
        canvasRef.current,
        landmarks,
        topperData,
        showTopper,
        flipHorizontal,
        flipVertical,
        topperCounts,
        topperPositions,
        topperSizes
      );

      if (photo) {
        const newPhotos = [...capturedPhotos, photo];
        setCapturedPhotos(newPhotos);
        
        // Calculate and pass aspect ratio from video
        const video = videoRef.current;
        const aspectRatio = video ? video.videoWidth / video.videoHeight : 16/9;
        
        // Check if we have enough photos for the frame type
        const requiredPhotos = frameType === '4cut' ? 4 : frameType === '2cut' ? 2 : 1;
        if (newPhotos.length >= requiredPhotos) {
          onPhotosCaptured(newPhotos, aspectRatio);
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  };

  if (cameraError) {
    return (
      <Card className="card-shadow">
        <CardContent className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <Camera className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-bold">카메라 접근 오류</h3>
            <p className="mt-2">카메라에 접근할 수 없어요. 브라우저에서 카메라 권한을 허용해주세요.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="font-playful text-3xl font-bold text-gray-800 mb-4">
          📷 사진을 촬영해요
        </h2>
        <p className="text-gray-600 text-lg">떠다니는 토퍼와 함께 사진을 찰칵 찍어문어!</p>
        <p className="text-sm text-gray-500 mt-2">
          {capturedPhotos.length}/{requiredPhotos} 장 촬영 완료
        </p>
      </div>

      <Card className="card-shadow mb-6">
        <CardContent className="p-4 md:p-8">
          {/* 카메라 미리보기 영역 */}
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden mb-4 max-h-[60vh]" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${flipHorizontal ? 'scale-x-[-1]' : ''} ${flipVertical ? 'scale-y-[-1]' : ''}`}
            />
            
            {/* AR 오버레이 캔버스 */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 cursor-pointer"
              style={{ width: '100%', height: '100%' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />

            {/* MediaPipe 상태 표시 */}
            {!mediaPipeReady && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                얼굴 인식 초기화 중...
              </div>
            )}

            {/* 카운트다운 오버레이 */}
            {isCountingDown && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-8xl font-bold animate-pulse-gentle">
                  {countdownNumber}
                </div>
              </div>
            )}
          </div>

          {/* 카메라 컨트롤 */}
          <div className="flex justify-center items-center space-x-4 mb-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setFlipHorizontal(!flipHorizontal)}
              className="p-4 rounded-2xl"
              title="좌우 반전"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => setFlipVertical(!flipVertical)}
              className="p-4 rounded-2xl"
              title="상하 반전"
            >
              <RotateCw className="w-6 h-6" />
            </Button>
            
            <Button
              onClick={startCountdown}
              className="button-primary text-white px-8 py-4 rounded-full font-bold text-lg transform hover:scale-105 transition-all duration-300"
              disabled={isCountingDown || !stream}
            >
              <Camera className="w-6 h-6 mr-3" />
              사진 촬영
            </Button>
            

          </div>

          {/* 토퍼 컨트롤 */}
          {topperData.length > 0 && (
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg">
              <h3 className="font-playful text-lg font-bold text-gray-800 mb-3 text-center">토퍼 설정</h3>
              
              {/* 토퍼 크기 조절 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  토퍼 크기: {Math.round(topperSize * 100)}%
                </label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">작게</span>
                  <input
                    type="range"
                    min="0.5"
                    max="4.0"
                    step="0.1"
                    value={topperSize}
                    onChange={(e) => setTopperSize(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">크게</span>
                </div>
              </div>

              {/* 개별 토퍼 개수 조절 */}
              <div className="grid gap-4">
                <h4 className="font-medium text-gray-700">토퍼별 개수 설정</h4>
                {topperData.map((topper) => (
                  <div key={topper.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                        {topper.type === 'emoji' ? (
                          <span className="text-lg">{topper.data}</span>
                        ) : (
                          <img src={topper.data} alt="Topper" className="w-full h-full object-cover rounded" />
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {topper.type === 'emoji' ? topper.data : '업로드 이미지'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setTopperCounts(prev => ({
                          ...prev,
                          [topper.id]: Math.max(0, (prev[topper.id] !== undefined ? prev[topper.id] : 1) - 1)
                        }))}
                        className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">
                        {topperCounts[topper.id] !== undefined ? topperCounts[topper.id] : 1}
                      </span>
                      <button
                        onClick={() => setTopperCounts(prev => ({
                          ...prev,
                          [topper.id]: Math.min(10, (prev[topper.id] !== undefined ? prev[topper.id] : 1) + 1)
                        }))}
                        className="w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 촬영된 사진 미리보기 */}
          {capturedPhotos.length > 0 && (
            <div>
              <h3 className="font-playful text-2xl font-bold text-gray-800 mb-4 text-center">
                촬영된 사진
              </h3>
              <div className={`grid gap-4 mb-6 ${
                frameType === '4cut' ? 'grid-cols-2 md:grid-cols-4' : 
                frameType === '2cut' ? 'grid-cols-1 md:grid-cols-2' : 
                'grid-cols-1'
              }`}>
                {capturedPhotos.map((photo, index) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                    <img 
                      src={photo} 
                      alt={`Captured photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              
              {capturedPhotos.length >= requiredPhotos && (
                <div className="text-center">
                  <Button 
                    onClick={() => onPhotosCaptured(capturedPhotos)}
                    className="button-secondary text-white px-12 py-4 rounded-2xl font-bold text-xl"
                  >
                    ✏️ 텍스트 추가하기
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
