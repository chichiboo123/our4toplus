import React from "react";

interface StepIndicatorProps {
  currentStep: number;
  stepCompleted: boolean[];
  onStepClick: (step: number) => void;
}

const steps = [
  { number: 1, label: "프레임 선택" },
  { number: 2, label: "토퍼 디자인" },
  { number: 3, label: "사진 촬영" },
  { number: 4, label: "완성!" },
];

export default function StepIndicator({ currentStep, stepCompleted, onStepClick }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-center items-center space-x-4">
        {steps.map((step, index) => {
          const isClickable = step.number === 1 || (stepCompleted && stepCompleted[step.number - 2]);
          const isActive = step.number <= currentStep;
          
          return (
            <div key={step.number} className="flex items-center">
              <div className="flex items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-300 text-gray-500'
                  } ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-60'}`}
                  onClick={() => isClickable && onStepClick(step.number)}
                >
                  {step.number}
                </div>
                <span 
                  className={`ml-2 text-sm font-medium transition-colors duration-300 ${
                    isActive 
                      ? 'text-gray-600' 
                      : 'text-gray-400'
                  } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={() => isClickable && onStepClick(step.number)}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-8 h-1 bg-gray-300 rounded ml-4"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
