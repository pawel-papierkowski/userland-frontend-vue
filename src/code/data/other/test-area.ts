/** Mode of inputs in test area. */
export enum EnInputMode {
  /** Show inputs normally. */
  Standard,
  /** Show inputs in disabled state. */
  Disabled,
  /** Show inputs in error state. */
  Error,
}

/** List of values for mode radiobox. */
export const enModeOptions: (number|null)[] = [ EnInputMode.Standard, EnInputMode.Disabled, EnInputMode.Error ];

/** Form for test area. */
export type TestAreaInputForm = {
  mode: EnInputMode;
  inputText: string | null;
  comboBox: string | null;
  checkbox: boolean | null;
  radiobox: string | null;
  dateTime: Date | null;
  date: Date | null;
  time: Date | null;
};

/** List of values for test combobox. */
export const enTestComboBox: (string|null)[] = [ null, 'PENDING', 'ACTIVE', 'DEMO' ];

/** List of values for test radiobox. */
export const enTestRadioBox: (string|null)[] = [ null, 'one', 'two', 'three' ];
