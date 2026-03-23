import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Grid3X3, Grid2X2, Square, RectangleVertical } from "lucide-react";
import { FrameType } from "@/pages/home";

interface FrameSelectionProps {
  onFrameSelect: (frame: FrameType) => void;
}

const frameOptions = [
  {
    type: "1cut" as FrameType,
    title: "한컷 사진",
    description: "완벽한 한 장을 남겨요",
    icon: Square,
    gradient: "from-accent to-yellow-300",
    gridCols: "grid-cols-1",
    aspectRatio: "aspect-square",
    photoCount: 1,
  },
  {
    type: "2cut" as FrameType,
    title: "두컷 사진",
    description: "2장으로 간단하게 찍어요",
    icon: RectangleVertical,
    gradient: "from-secondary to-teal-300",
    gridCols: "grid-cols-1",
    aspectRatio: "aspect-video",
    photoCount: 2,
  },
  {
    type: "4cut" as FrameType,
    title: "네컷 사진",
    description: "4장의 사진으로 추억을 남겨요",
    icon: Grid2X2,
    gradient: "from-primary to-pink-300",
    gridCols: "grid-cols-2",
    aspectRatio: "aspect-square",
    photoCount: 4,
  },
];

export default function FrameSelection({ onFrameSelect }: FrameSelectionProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="font-playful text-3xl font-bold text-gray-800 mb-4">
          📸 사진 프레임을 선택해주세요
        </h2>

      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {frameOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <Card 
              key={option.type}
              className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl card-shadow"
              onClick={() => onFrameSelect(option.type)}
            >
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${option.gradient} rounded-2xl flex items-center justify-center mb-4`}>
                    <IconComponent className="text-white w-8 h-8" />
                  </div>
                  <h3 className="font-playful text-2xl font-bold text-gray-800 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-gray-600">{option.description}</p>
                </div>
                <div className={`${option.gridCols} gap-2 bg-gray-100 rounded-xl p-3 grid`}>
                  {Array.from({ length: option.photoCount }).map((_, index) => (
                    <div 
                      key={index}
                      className={`${option.aspectRatio} bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center`}
                    >
                      <span className="text-2xl">🐙</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
