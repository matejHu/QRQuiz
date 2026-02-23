"use client";

interface Option {
  id: string;
  option_text: string;
}

interface Props {
  questionText: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  correctOptionIds?: string[];
}

export function MultipleSelectQuestion({
  questionText,
  options,
  selected,
  onChange,
  disabled,
  correctOptionIds,
}: Props) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-medium text-base">{questionText}</p>
        <p className="text-xs text-muted-foreground mt-1">Select all that apply</p>
      </div>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          const isCorrect = correctOptionIds?.includes(opt.id);
          const showCorrect = disabled && isCorrect;
          const showWrong = disabled && isSelected && !isCorrect;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(opt.id)}
              className={[
                "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-center gap-3",
                showCorrect
                  ? "border-green-500 bg-green-50 text-green-900"
                  : showWrong
                  ? "border-red-500 bg-red-50 text-red-900"
                  : isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                disabled ? "cursor-default" : "cursor-pointer",
              ].join(" ")}
            >
              <span
                className={[
                  "w-4 h-4 border rounded flex-shrink-0 flex items-center justify-center",
                  isSelected ? "bg-primary border-primary" : "border-border",
                ].join(" ")}
              >
                {isSelected && (
                  <svg viewBox="0 0 10 10" className="w-3 h-3 text-white fill-white">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              {opt.option_text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
