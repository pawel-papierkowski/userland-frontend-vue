
/** List of values for test combobox. */
export const enTestComboBox: (string|null)[] = [ null, 'PENDING', 'ACTIVE', 'DEMO' ];

/** Form for test area. */
export type TestAreaInputForm = {
  inputText: string | null;
  comboBox: string | null;
  checkbox: boolean | null;
  dateTime: Date | null;
  date: Date | null;
  time: Date | null;
};
