import * as React from "react";

import { cn } from "@/lib/utils";

type SliderProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange"> & {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
};

function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  ...props
}: SliderProps) {
  const currentValue = value?.[0] ?? defaultValue?.[0] ?? min;

  return (
    <input
      data-slot="slider"
      type="range"
      min={min}
      max={max}
      step={step}
      value={currentValue}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
      className={cn("h-2 w-full cursor-pointer appearance-none rounded-full bg-muted", className)}
      {...props}
    />
  );
}

export { Slider };
