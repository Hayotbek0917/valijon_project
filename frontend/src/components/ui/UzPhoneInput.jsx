import { InputAdornment, TextField } from '@mui/material';
import {
  formatUzPhoneDisplay,
  isUzPhoneComplete,
  parseUzPhoneInput,
  uzPhoneValidationError,
} from '../../utils/phone';

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

/** Telefon input — chapda +998, ichida 9 raqam (barcha forma uchun bir xil shablon) */
export default function UzPhoneInput({
  label = 'Telefon',
  value,
  onChange,
  required = false,
  size = 'small',
  fullWidth = true,
  helperText,
  error: errorProp,
  sx,
  ...rest
}) {
  const digits = parseUzPhoneInput(value);
  const validationError = uzPhoneValidationError(digits, { required, label });
  const incomplete = digits.length > 0 && !isUzPhoneComplete(digits);
  const hasError = Boolean(errorProp) || incomplete;

  return (
    <TextField
      label={label}
      value={digits}
      onChange={(e) => {
        const next = e.target.value.replace(/\D/g, '').slice(0, 9);
        onChange?.(next);
      }}
      required={required}
      size={size}
      fullWidth={fullWidth}
      error={hasError}
      placeholder="901234567"
      helperText={
        errorProp
        || (incomplete ? validationError : '')
        || helperText
        || (isUzPhoneComplete(digits) ? formatUzPhoneDisplay(digits) : '+998 · 9 ta raqam (90 123 45 67)')
      }
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <span className="text-gray-600 font-semibold text-sm whitespace-nowrap">+998</span>
          </InputAdornment>
        ),
      }}
      inputProps={{ inputMode: 'numeric', maxLength: 9 }}
      sx={{ ...fieldSx, ...sx }}
      {...rest}
    />
  );
}
