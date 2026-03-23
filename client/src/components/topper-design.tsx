import React, { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Check, CloudUpload } from "lucide-react";
import { TopperData } from "@/pages/home";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TopperDesignProps {
  onTopperSelect: (topper: TopperData) => void;
  onRemoveTopper: (topperId: string) => void;
  selectedToppers: TopperData[];
  onNext: () => void;
}

const emojiOptions = [
  "👑", "🎩", "🎀", "🌟", "🦄", "🐻", "🐰", "🌈",
  "🎪", "🎭", "🎨", "🎲", "🎸", "🎤", "🎺",
  "🎂", "🍰", "🧁", "🍭", "🍬", "🍎", "🍊", "🍌",
  "🌸", "🌺", "🌻", "🌷", "🌹", "💐", "🌼", "🌙",
  "⭐", "☀️", "🌤️", "⛅", "🌦️", "🌧️", "⚡", "❄️",
  "🦋", "🐝", "🐞", "🐛", "🕸️", "🐙", "🐠", "🐡",
  "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🏸",
  "🥊", "🥋", "🎯", "🏹", "🎣", "🤿", "🎿", "🛷"
];

export default function TopperDesign({ onTopperSelect, onRemoveTopper, selectedToppers, onNext }: TopperDesignProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload-topper', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadedImage(data.imageData);
      const newTopper: TopperData = { 
        type: 'upload', 
        data: data.imageData, 
        id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
      };
      onTopperSelect(newTopper);
      toast({
        title: "업로드 완료!",
        description: "이미지가 성공적으로 업로드되었어요.",
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "업로드 실패",
        description: "이미지 업로드에 실패했어요. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "잘못된 파일 형식",
          description: "이미지 파일만 업로드 가능해요.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "파일이 너무 커요",
          description: "5MB 이하의 이미지를 선택해주세요.",
          variant: "destructive",
        });
        return;
      }

      uploadMutation.mutate(file);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const newTopper: TopperData = { 
      type: 'emoji', 
      data: emoji, 
      id: `emoji_${emoji}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
    };
    onTopperSelect(newTopper);
  };

  const isEmojiSelected = (emoji: string) => {
    return selectedToppers.some(topper => topper.type === 'emoji' && topper.data === emoji);
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="font-playful text-3xl font-bold text-gray-800 mb-4">
          ✨ 토퍼 디자인을 선택해주세요
        </h2>
        <p className="text-gray-600 text-lg">머리 위에 올릴 재미있는 토퍼를 골라보세요!</p>
      </div>

      <Card className="card-shadow mb-8">
        <CardContent className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* 이미지 업로드 */}
            <div className="text-center">
              <h3 className="font-playful text-2xl font-bold text-gray-800 mb-4">나만의 이미지 업로드</h3>
              <div 
                className="border-3 border-dashed border-primary rounded-2xl p-8 mb-4 bg-pink-50 cursor-pointer hover:bg-pink-100 transition-colors duration-300"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadedImage ? (
                  <div className="space-y-4">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded topper" 
                      className="w-20 h-20 mx-auto object-cover rounded-lg"
                    />
                    <p className="text-green-600 font-medium">이미지가 업로드되었어요!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <CloudUpload className="text-primary w-12 h-12 mx-auto" />
                    <p className="text-gray-600 font-medium">클릭해서 이미지를 업로드하세요</p>
                    <p className="text-sm text-gray-500">PNG, JPG 파일을 지원해요 (최대 5MB)</p>
                  </div>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileSelect}
                />
              </div>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="button-primary text-white px-8 py-3 rounded-2xl font-bold text-lg"
                disabled={uploadMutation.isPending}
              >
                <Upload className="mr-2 w-4 h-4" />
                {uploadMutation.isPending ? '업로드 중...' : '업로드하기'}
              </Button>
            </div>

            {/* 이모지 선택 */}
            <div className="text-center">
              <h3 className="font-playful text-2xl font-bold text-gray-800 mb-4">이모지 선택</h3>
              <div className="grid grid-cols-6 gap-2 mb-4 max-h-48 overflow-y-auto">
                {emojiOptions.map((emoji) => (
                  <div 
                    key={emoji}
                    className={`aspect-square rounded-xl flex items-center justify-center text-2xl cursor-pointer transition-all duration-300 transform hover:scale-110 ${
                      isEmojiSelected(emoji) 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 hover:bg-primary hover:text-white'
                    }`}
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <Button 
                onClick={() => selectedToppers.length > 0 && onNext()}
                className="button-secondary text-white px-8 py-3 rounded-2xl font-bold text-lg"
                disabled={selectedToppers.length === 0}
              >
                <Check className="mr-2 w-4 h-4" />
                선택 완료
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Toppers Display */}
      {selectedToppers.length > 0 && (
        <Card className="card-shadow mb-8">
          <CardContent className="p-6">
            <h3 className="font-playful text-xl font-bold text-gray-800 mb-4 text-center">선택된 토퍼들</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {selectedToppers.map((topper) => (
                <div key={topper.id} className="relative">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center border-2 border-primary">
                    {topper.type === 'emoji' ? (
                      <span className="text-2xl">{topper.data}</span>
                    ) : (
                      <img src={topper.data} alt="Topper" className="w-full h-full object-cover rounded-xl" />
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveTopper(topper.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center mt-12">
        <Button 
          onClick={onNext}
          className="button-primary text-white px-12 py-4 rounded-2xl font-bold text-xl"
          disabled={selectedToppers.length === 0}
        >
          📸 사진 촬영하러 가기
        </Button>
      </div>
    </div>
  );
}
