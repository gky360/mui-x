import * as React from 'react';
import { WrapperVariant } from '../components/wrappers/WrapperVariantContext';
import { useOpenState } from './useOpenState';
import { useUtils } from './useUtils';
import { MuiPickersAdapter } from '../models';

export interface PickerStateValueManager<TInputValue, TDateValue> {
  areValuesEqual: (
    utils: MuiPickersAdapter<TDateValue>,
    valueLeft: TDateValue,
    valueRight: TDateValue,
  ) => boolean;
  emptyValue: TDateValue;
  parseInput: (utils: MuiPickersAdapter<TDateValue>, value: TInputValue) => TDateValue;
  valueReducer?: (
    utils: MuiPickersAdapter<TDateValue>,
    prevValue: TDateValue | null,
    value: TDateValue | null,
  ) => TDateValue;
}

export type PickerSelectionState = 'partial' | 'shallow' | 'finish';

interface Draftable<T> {
  committed: T;
  draft: T;
}

interface DraftAction<DraftValue> {
  type: 'update' | 'reset';
  payload: DraftValue;
}

interface PickerStateProps<TInput, TDateValue> {
  disableCloseOnSelect?: boolean;
  open?: boolean;
  onAccept?: (date: TDateValue) => void;
  onChange: (date: TDateValue, keyboardInputValue?: string) => void;
  onClose?: () => void;
  onOpen?: () => void;
  value: TInput;
}

export const usePickerState = <TInput, TDateValue>(
  props: PickerStateProps<TInput, TDateValue>,
  valueManager: PickerStateValueManager<TInput, TDateValue>,
) => {
  const { disableCloseOnSelect, onAccept, onChange, value } = props;

  const utils = useUtils<TDateValue>();
  const { isOpen, setIsOpen } = useOpenState(props);

  function initDraftableDate(date: TDateValue): Draftable<TDateValue> {
    return { committed: date, draft: date };
  }

  const parsedDateValue = React.useMemo(
    () => valueManager.parseInput(utils, value),
    [valueManager, utils, value],
  );

  const [lastValidDateValue, setLastValidDateValue] = React.useState<TDateValue | null>(
    parsedDateValue,
  );

  React.useEffect(() => {
    if (parsedDateValue != null) {
      setLastValidDateValue(parsedDateValue);
    }
  }, [parsedDateValue]);

  const [draftState, dispatch] = React.useReducer(
    (state: Draftable<TDateValue>, action: DraftAction<TDateValue>): Draftable<TDateValue> => {
      switch (action.type) {
        case 'reset':
          return initDraftableDate(action.payload);
        case 'update':
          return {
            ...state,
            draft: action.payload,
          };
        default:
          return state;
      }
    },
    parsedDateValue,
    initDraftableDate,
  );
  if (!valueManager.areValuesEqual(utils, draftState.committed, parsedDateValue)) {
    dispatch({ type: 'reset', payload: parsedDateValue });
  }

  const [initialDate, setInitialDate] = React.useState<TDateValue>(draftState.committed);

  // Mobile keyboard view is a special case.
  // When it's open picker should work like closed, because we are just showing text field
  const [isMobileKeyboardViewOpen, setMobileKeyboardViewOpen] = React.useState(false);

  const acceptDate = React.useCallback(
    (acceptedDate: TDateValue, needClosePicker: boolean) => {
      onChange(acceptedDate);

      if (needClosePicker) {
        setIsOpen(false);
        setInitialDate(acceptedDate);
        if (onAccept) {
          onAccept(acceptedDate);
        }
      }
    },
    [onAccept, onChange, setIsOpen],
  );

  const wrapperProps = React.useMemo(
    () => ({
      open: isOpen,
      onClear: () => acceptDate(valueManager.emptyValue, true),
      onAccept: () => acceptDate(draftState.draft, true),
      onDismiss: () => acceptDate(initialDate, true),
      onSetToday: () => {
        const now = utils.date() as TDateValue;
        dispatch({ type: 'update', payload: now });
        acceptDate(now, !disableCloseOnSelect);
      },
    }),
    [
      acceptDate,
      disableCloseOnSelect,
      isOpen,
      utils,
      draftState.draft,
      valueManager.emptyValue,
      initialDate,
    ],
  );

  const pickerProps = React.useMemo(
    () => ({
      date: draftState.draft,
      isMobileKeyboardViewOpen,
      toggleMobileKeyboardView: () => setMobileKeyboardViewOpen(!isMobileKeyboardViewOpen),
      onDateChange: (
        newDate: TDateValue,
        wrapperVariant: WrapperVariant,
        selectionState: PickerSelectionState = 'partial',
      ) => {
        dispatch({ type: 'update', payload: newDate });
        if (selectionState === 'partial') {
          acceptDate(newDate, false);
        }

        if (selectionState === 'finish') {
          const shouldCloseOnSelect = !(disableCloseOnSelect ?? wrapperVariant === 'mobile');
          acceptDate(newDate, shouldCloseOnSelect);
        }

        // if selectionState === "shallow" do nothing (we already update the draft state)
      },
    }),
    [acceptDate, disableCloseOnSelect, isMobileKeyboardViewOpen, draftState.draft],
  );

  const handleInputChange = React.useCallback(
    (date: TDateValue, keyboardInputValue?: string) => {
      const cleanDate = valueManager.valueReducer
        ? valueManager.valueReducer(utils, lastValidDateValue, date)
        : date;
      onChange(cleanDate, keyboardInputValue);
    },
    [onChange, valueManager, lastValidDateValue, utils],
  );

  const inputProps = React.useMemo(
    () => ({
      onChange: handleInputChange,
      open: isOpen,
      rawValue: value,
      openPicker: () => setIsOpen(true),
    }),
    [handleInputChange, isOpen, value, setIsOpen],
  );

  const pickerState = { pickerProps, inputProps, wrapperProps };
  React.useDebugValue(pickerState, () => ({
    MuiPickerState: {
      pickerDraft: draftState,
      other: pickerState,
    },
  }));

  return pickerState;
};
