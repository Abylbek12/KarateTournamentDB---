import React from 'react';

/**
 * Number input that can be cleared and retyped freely (no stuck «0» or «1»,
 * decimals like 74.5 work). The parent gets a number only when the text is a valid number;
 * on leaving the field an empty value becomes `emptyValue`.
 */
export const NumberField: React.FC<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
    value: number | null | undefined;
    onValueChange: (n: number) => void;
    emptyValue?: number;
    decimals?: boolean;
  }
> = ({ value, onValueChange, emptyValue = 0, decimals = false, onBlur, onFocus, ...rest }) => {
  const [text, setText] = React.useState(value == null ? '' : String(value));
  const focused = React.useRef(false);
  React.useEffect(() => {
    if (!focused.current) setText(value == null ? '' : String(value));
  }, [value]);
  return (
    <input
      {...rest}
      type="text"
      inputMode={decimals ? 'decimal' : 'numeric'}
      value={text}
      onFocus={(e) => {
        focused.current = true;
        onFocus?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(',', '.');
        const clean = decimals ? raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') : raw.replace(/[^0-9]/g, '');
        setText(clean);
        const n = Number(clean);
        if (clean !== '' && clean !== '.' && Number.isFinite(n)) onValueChange(n);
      }}
      onBlur={(e) => {
        focused.current = false;
        const n = Number(text);
        if (text === '' || !Number.isFinite(n)) {
          onValueChange(emptyValue);
          setText(String(emptyValue));
        } else setText(String(n));
        onBlur?.(e);
      }}
    />
  );
};
