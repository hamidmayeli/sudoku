import React from 'react';

interface KeypadProps {
  onNumberClick: (num: number) => void;
  onClear: () => void;
  disabled: boolean;
  selectedNumber?: number | null;
  isClearSelected?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({
  onNumberClick,
  onClear,
  disabled,
  selectedNumber,
  isClearSelected
}) => {
  return (
    <div className="keypad">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
        <button
          key={num}
          className={`keypad-button${selectedNumber === num ? ' selected' : ''}`}
          onClick={() => onNumberClick(num)}
          disabled={disabled}
        >
          {num}
        </button>
      ))}
      <button
        className={`keypad-clear${isClearSelected ? ' selected' : ''}`}
        onClick={onClear}
        disabled={disabled}
      >
        Clear
      </button>
    </div>
  );
};
