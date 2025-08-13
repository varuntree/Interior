"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PresetItem } from "@/libs/app-config/runtime";

interface PresetSelectorProps {
  label: string;
  description?: string;
  options: PresetItem[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PresetSelector({
  label,
  description,
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  required = false,
  disabled = false,
  className
}: PresetSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedOption = options.find((option) => option.id === value);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <div>
        <label className="text-sm font-medium leading-none">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      setSearchValue("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface PresetSelectorsProps {
  roomTypes: PresetItem[];
  styles: PresetItem[];
  selectedRoomType?: string;
  selectedStyle?: string;
  onRoomTypeChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function PresetSelectors({
  roomTypes,
  styles,
  selectedRoomType,
  selectedStyle,
  onRoomTypeChange,
  onStyleChange,
  disabled = false,
  className
}: PresetSelectorsProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h3 className="text-lg font-semibold mb-2">Room & Style</h3>
        <p className="text-sm text-muted-foreground">
          Choose the room type and design style for your generation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PresetSelector
          label="Room Type"
          description="What type of room are you designing?"
          options={roomTypes}
          value={selectedRoomType}
          onChange={onRoomTypeChange}
          placeholder="Select room type..."
          disabled={disabled}
        />

        <PresetSelector
          label="Style"
          description="What design style would you like to apply?"
          options={styles}
          value={selectedStyle}
          onChange={onStyleChange}
          placeholder="Select style..."
          disabled={disabled}
        />
      </div>
    </div>
  );
}