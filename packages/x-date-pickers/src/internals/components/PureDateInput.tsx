import * as React from 'react';
import PropTypes from 'prop-types';
import { TextFieldProps as MuiTextFieldPropsType } from '@mui/material/TextField';
import { IconButtonProps } from '@mui/material/IconButton';
import { InputAdornmentProps } from '@mui/material/InputAdornment';
import { onSpaceOrEnter } from '../utils/utils';
import { ParseableDate } from '../models/parseableDate';
import { useUtils } from '../hooks/useUtils';
import { getDisplayDate, getTextFieldAriaText } from '../utils/text-field-helper';
import { MuiPickersAdapter } from '../models';

// TODO: make `variant` optional.
export type MuiTextFieldProps = MuiTextFieldPropsType | Omit<MuiTextFieldPropsType, 'variant'>;

export interface DateInputSlotsComponent {
  // Icon displaying for open picker button.
  OpenPickerIcon: React.ElementType;
}

export interface DateInputProps<TInputValue = ParseableDate<unknown>, TDateValue = unknown> {
  /**
   * Regular expression to detect "accepted" symbols.
   * @default /\dap/gi
   */
  acceptRegex?: RegExp;
  /**
   * The components used for each slot.
   * Either a string to use an HTML element or a component.
   */
  components?: Partial<DateInputSlotsComponent>;
  disabled?: boolean;
  /**
   * Disable mask on the keyboard, this should be used rarely. Consider passing proper mask for your format.
   * @default false
   */
  disableMaskedInput?: boolean;
  /**
   * Do not render open picker button (renders only text field with validation).
   * @default false
   */
  disableOpenPicker?: boolean;
  /**
   * Get aria-label text for control that opens picker dialog. Aria-label text must include selected date. @DateIOType
   * @template TDateValue
   * @param {ParseableDate<TDateValue>} value The date from which we want to add an aria-text.
   * @param {MuiPickersAdapter<TDateValue>} utils The utils to manipulate the date.
   * @returns {string} The aria-text to render inside the dialog.
   * @default (value, utils) => `Choose date, selected date is ${utils.format(utils.date(value), 'fullDate')}`
   */
  getOpenDialogAriaText?: (
    value: ParseableDate<TDateValue>,
    utils: MuiPickersAdapter<TDateValue>,
  ) => string;
  // ?? TODO when it will be possible to display "empty" date in datepicker use it instead of ignoring invalid inputs.
  ignoreInvalidInputs?: boolean;
  /**
   * Props to pass to keyboard input adornment.
   */
  InputAdornmentProps?: Partial<InputAdornmentProps>;
  inputFormat: string;
  InputProps?: MuiTextFieldProps['InputProps'];
  /**
   * Pass a ref to the `input` element.
   */
  inputRef?: React.Ref<HTMLInputElement>;
  label?: MuiTextFieldProps['label'];
  /**
   * Custom mask. Can be used to override generate from format. (e.g. `__/__/____ __:__` or `__/__/____ __:__ _M`).
   */
  mask?: string;
  // lib/src/wrappers/DesktopPopperWrapper.tsx:87
  onBlur?: () => void;
  onChange: (date: TDateValue, keyboardInputValue?: string) => void;
  open: boolean;
  openPicker: () => void;
  /**
   * Props to pass to keyboard adornment button.
   */
  OpenPickerButtonProps?: Partial<IconButtonProps>;
  rawValue: TInputValue;
  readOnly?: boolean;
  /**
   * The `renderInput` prop allows you to customize the rendered input.
   * The `props` argument of this render prop contains props of [TextField](https://mui.com/material-ui/api/text-field/#props) that you need to forward.
   * Pay specific attention to the `ref` and `inputProps` keys.
   * @example ```jsx
   * renderInput={props => <TextField {...props} />}
   * ````
   * @param {MuiTextFieldPropsType} props The props of the input.
   * @returns {React.ReactNode} The node to render as the input.
   */
  renderInput: (props: MuiTextFieldPropsType) => React.ReactElement;
  /**
   * Custom formatter to be passed into Rifm component.
   * @param {string} str The un-formatted string.
   * @returns {string} The formatted string.
   */
  rifmFormatter?: (str: string) => string;
  TextFieldProps?: Partial<MuiTextFieldProps>;
  validationError?: boolean;
}

export type ExportedDateInputProps<TInputValue, TDateValue> = Omit<
  DateInputProps<TInputValue, TDateValue>,
  | 'inputFormat'
  | 'inputValue'
  | 'onBlur'
  | 'onChange'
  | 'open'
  | 'openPicker'
  | 'rawValue'
  | 'TextFieldProps'
  | 'validationError'
>;

// TODO: why is this called "Pure*" when it's not memoized? Does "Pure" mean "readonly"?
export const PureDateInput = React.forwardRef(function PureDateInput(
  props: DateInputProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const {
    disabled,
    getOpenDialogAriaText = getTextFieldAriaText,
    inputFormat,
    InputProps,
    inputRef,
    label,
    openPicker: onOpen,
    rawValue,
    renderInput,
    TextFieldProps = {},
    validationError,
  } = props;

  const utils = useUtils();
  const PureDateInputProps = React.useMemo(
    () => ({
      ...InputProps,
      readOnly: true,
    }),
    [InputProps],
  );

  const inputValue = getDisplayDate(utils, rawValue, inputFormat);

  return renderInput({
    label,
    disabled,
    ref,
    inputRef,
    error: validationError,
    InputProps: PureDateInputProps,
    inputProps: {
      disabled,
      readOnly: true,
      'aria-readonly': true,
      'aria-label': getOpenDialogAriaText(rawValue, utils),
      value: inputValue,
      ...(!props.readOnly && { onClick: onOpen }),
      onKeyDown: onSpaceOrEnter(onOpen),
    },
    ...TextFieldProps,
  });
});

PureDateInput.propTypes = {
  getOpenDialogAriaText: PropTypes.func,
  renderInput: PropTypes.func.isRequired,
};
