"use client";

interface Props {
  questionText: string;
  options: Array<{ id: string; option_text: string }>;
  selected: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  correctOptionId?: string;
}

export function TrueFalseQuestion({
  questionText,
  options,
  selected,
  onChange,
  disabled,
  correctOptionId,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-medium text-base">{questionText}</p>
      <div className="flex gap-3">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          const isCorrect = correctOptionId === opt.id;
          const isWrong = disabled && isSelected && !isCorrect;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={[
                "flex-1 py-4 rounded-lg border text-sm font-medium transition-colors",
                isCorrect && disabled
                  ? "border-green-500 bg-green-50 text-green-900"
                  : isWrong
                  ? "border-red-500 bg-red-50 text-red-900"
                  : isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                disabled ? "cursor-default" : "cursor-pointer",
              ].join(" ")}
            >
              {opt.option_text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
