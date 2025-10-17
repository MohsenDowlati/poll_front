import React, { useEffect, useMemo, useState } from "react";

interface Option {
  value: string;
  text: string;
  selected?: boolean;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
  value?: string[];
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
  value,
  placeholder,
}) => {
  const isControlled = value !== undefined;
  const [internalSelected, setInternalSelected] = useState<string[]>(defaultSelected);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isControlled) {
      setInternalSelected(defaultSelected);
    }
  }, [defaultSelected, isControlled]);

  const resolvedSelected = useMemo(
    () => (isControlled ? value ?? [] : internalSelected),
    [isControlled, value, internalSelected],
  );

  const updateSelection = (nextSelection: string[]) => {
    if (!isControlled) {
      setInternalSelected(nextSelection);
    }
    onChange?.(nextSelection);
  };

  const toggleDropdown = () => {
    if (disabled) {
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    const isAlreadySelected = resolvedSelected.includes(optionValue);
    const nextSelection = isAlreadySelected
      ? resolvedSelected.filter((value) => value !== optionValue)
      : [...resolvedSelected, optionValue];
    updateSelection(nextSelection);
  };

  const removeOption = (valueToRemove: string) => {
    const nextSelection = resolvedSelected.filter((value) => value !== valueToRemove);
    updateSelection(nextSelection);
  };

  const selectedLabels = useMemo(() => {
    return resolvedSelected
      .map((value) => options.find((option) => option.value === value)?.text || "")
      .filter((text) => text.length > 0);
  }, [options, resolvedSelected]);

  const resolvedPlaceholder = placeholder ?? "Select option";

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </label>

      <div className="relative z-20 inline-block w-full">
        <div className="relative flex flex-col items-center">
          <div onClick={toggleDropdown} className="w-full">
            <div className="mb-2 flex h-11 rounded-lg border border-gray-300 py-1.5 pl-3 pr-3 shadow-theme-xs outline-hidden transition focus:border-brand-300 focus:shadow-focus-ring dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-300">
              <div className="flex flex-wrap flex-auto gap-2">
                {selectedLabels.length > 0 ? (
                  selectedLabels.map((text, index) => (
                    <div
                      key={`${text}-${index}`}
                      className="group flex items-center justify-center rounded-full border-[0.7px] border-transparent bg-gray-100 py-1 pl-2.5 pr-2 text-sm text-gray-800 hover:border-gray-200 dark:bg-gray-800 dark:text-white/90 dark:hover:border-gray-800"
                    >
                      <span className="flex-initial max-w-full">{text}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeOption(resolvedSelected[index]);
                        }}
                        className="pl-2 text-gray-500 cursor-pointer group-hover:text-gray-400 dark:text-gray-400"
                        aria-label={`Remove ${text}`}
                      >
                        <svg
                          className="fill-current"
                          role="presentation"
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z"
                          />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <input
                    placeholder={resolvedPlaceholder}
                    className="w-full h-full p-1 pr-2 text-sm bg-transparent border-0 outline-hidden appearance-none placeholder:text-gray-800 focus:border-0 focus:outline-hidden focus:ring-0 dark:placeholder:text-white/90"
                    readOnly
                    value={resolvedPlaceholder}
                  />
                )}
              </div>
              <div className="flex items-center py-1 pl-1 pr-1 w-7">
                <button
                  type="button"
                  onClick={toggleDropdown}
                  className="w-5 h-5 text-gray-700 outline-hidden cursor-pointer focus:outline-hidden dark:text-gray-400"
                  aria-label={isOpen ? "Close category selector" : "Open category selector"}
                >
                  <svg
                    className={`stroke-current ${isOpen ? "rotate-180" : ""}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {isOpen && (
            <div
              className="absolute left-0 z-40 w-full overflow-y-auto bg-white rounded-lg shadow-sm top-full max-h-select dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-col">
                {options.map((option) => {
                  const isSelected = resolvedSelected.includes(option.value);
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={`hover:bg-primary/5 w-full cursor-pointer border-b border-gray-200 px-2 text-left transition-colors last:border-none dark:border-gray-800 ${
                        isSelected ? "bg-primary/10" : ""
                      }`}
                    >
                      <div className="relative flex w-full items-center py-2 leading-6 text-gray-800 dark:text-white/90">
                        {option.text}
                      </div>
                    </button>
                  );
                })}
                {options.length === 0 && (
                  <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No options available
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiSelect;
