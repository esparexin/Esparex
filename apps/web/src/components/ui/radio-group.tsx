import * as React from "react";

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  name?: string;
}

const RadioGroupContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  name: string;
} | null>(null);

export function RadioGroup({ value, onValueChange, children, className, name }: RadioGroupProps) {
  const generatedName = React.useId().replace(/:/g, "");
  const resolvedName = name ?? `radio-group-${generatedName}`;

  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name: resolvedName }}>
      <div className={className || "space-y-2"} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps {
  value: string;
  id: string;
  className?: string; // Add optional className
}

export function RadioGroupItem({ value, id, className }: RadioGroupItemProps) {
  const context = React.useContext(RadioGroupContext);

  if (!context) {
    throw new Error("RadioGroupItem must be used within a RadioGroup");
  }

  const { value: groupValue, onValueChange } = context;
  const isChecked = groupValue === value;

  return (
    <input
      type="radio"
      id={id}
      name={context.name}
      value={value}
      checked={isChecked}
      onChange={() => onValueChange(value)}
      className={`h-4 w-4 border-gray-300 text-green-600 focus:ring-green-600 cursor-pointer ${className || ''}`}
    />
  );
}
