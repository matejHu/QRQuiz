"use client";

interface Option {
  id: string;
  option_text: string;
}

interface Props {
  questionText: string;
  options: Option[];
  selected: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  correctOptionId?: string;
}

export function MultipleChoiceQuestion({
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
      <div className="flex flex-col gap-2">
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
                "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors",
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
