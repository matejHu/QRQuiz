"use client";

import { Input } from "@/components/ui/input";

interface Props {
  questionText: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  correctText?: string;
}

export function ShortTextQuestion({
  questionText,
  value,
  onChange,
  disabled,
  correctText,
}: Props) {
  const isWrong =
    disabled &&
    correctText !== undefined &&
    value.trim().toLowerCase() !== correctText.trim().toLowerCase();
  const isRight =
    disabled &&
    correctText !== undefined &&
    value.trim().toLowerCase() === correctText.trim().toLowerCase();

  return (
    <div className="flex flex-col gap-4">
      <p className="font-medium text-base">{questionText}</p>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer…"
        className={
          isRight
            ? "border-green-500 bg-green-50"
            : isWrong
            ? "border-red-500 bg-red-50"
            : ""
        }
      />
      {isWrong && correctText && (
        <p className="text-sm text-green-700">
          Correct answer: <strong>{correctText}</strong>
        </p>
      )}
    </div>
  );
}
