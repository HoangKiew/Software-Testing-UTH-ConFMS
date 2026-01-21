import { memo } from 'react';

interface ScoreSelectorProps {
  score: number;
  onScoreChange: (score: number) => void;
  disabled?: boolean;
}

const ScoreSelector = memo(({ score, onScoreChange, disabled }: ScoreSelectorProps) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">1 - Kém</span>
        <span className="text-sm text-gray-600">10 - Xuất sắc</span>
      </div>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            onClick={() => !disabled && onScoreChange(num)}
            disabled={disabled}
            className={`w-10 h-10 rounded-lg border-2 transition-colors ${
              score === num
                ? 'bg-teal-600 border-teal-600 text-white'
                : 'border-gray-300 text-gray-700 hover:border-teal-400'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
});

ScoreSelector.displayName = 'ScoreSelector';

export default ScoreSelector;


