"use client";

import { useState, useRef, useEffect } from "react";

type Option = {
  value: string;
  label: string;
};

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione uma opção",
  required,
  disabled,
  error,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown" && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex((opt) => opt.value === value);
      const nextIndex = Math.min(currentIndex + 1, options.length - 1);
      onChange(options[nextIndex].value);
    } else if (e.key === "ArrowUp" && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex((opt) => opt.value === value);
      const prevIndex = Math.max(currentIndex - 1, 0);
      onChange(options[prevIndex].value);
    }
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          id={id}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-left text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${
            error
              ? "border-red-300 focus:border-red-400"
              : "border-slate-200 focus:border-teal-500"
          } ${!selectedOption ? "text-slate-400" : ""}`}
        >
          <span className="flex items-center justify-between">
            <span className={!selectedOption ? "text-slate-400" : ""}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {isOpen && !disabled && (
          <ul
            role="listbox"
            className="absolute z-10 mt-1 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            {options.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onClick={() => handleSelect(option.value)}
                className={`cursor-pointer px-3.5 py-2.5 text-slate-900 transition-colors hover:bg-teal-50 ${
                  option.value === value ? "bg-teal-50 font-medium text-teal-700" : ""
                }`}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
