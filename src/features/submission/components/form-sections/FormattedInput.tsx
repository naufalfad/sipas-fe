import { useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { inputClass } from './styles';

export const FormattedInput = ({
  name,
  placeholder,
  unit = 'm²',
  min = 0,
  isDecimal = false,
  onChangeCustom,
}: {
  name: string;
  placeholder?: string;
  unit?: string;
  min?: number;
  isDecimal?: boolean;
  onChangeCustom?: (val: number | undefined) => void;
}) => {
  const { control } = useFormContext<FullSubmissionFormValues>();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      control={control}
      name={name as any}
      render={({ field: { value, onChange, onBlur } }) => {
        const numVal = value !== undefined && value !== null && !isNaN(Number(value)) ? Number(value) : undefined;

        let displayVal = '';
        if (isFocused) {
          displayVal = numVal !== undefined ? String(numVal) : '';
        } else {
          displayVal = numVal !== undefined
            ? `${numVal.toLocaleString('id-ID', { maximumFractionDigits: isDecimal ? 2 : 0 })} ${unit}`.trim()
            : '';
        }

        const handleFocus = () => {
          setIsFocused(true);
        };

        const handleBlur = () => {
          setIsFocused(false);
          onBlur();
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const cleanText = e.target.value.replace(/[^0-9.-]/g, '');
          const num = Number(cleanText);
          if (cleanText === '' || isNaN(num)) {
            onChange(undefined);
            if (onChangeCustom) onChangeCustom(undefined);
          } else {
            const finalNum = Math.max(min, num);
            onChange(finalNum);
            if (onChangeCustom) onChangeCustom(finalNum);
          }
        };

        const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
          (e.target as HTMLInputElement).blur();
        };

        return (
          <input
            type="text"
            value={displayVal}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            onWheel={handleWheel}
            placeholder={placeholder}
            className={inputClass}
          />
        );
      }}
    />
  );
};
