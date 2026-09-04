export enum EnMessageLevel {
  /** Informational message, blue. */
  Info,
  /** Success message, green. */
  Success,
  /** Warning message, yellow. */
  Warning,
  /** Failure message, red. */
  Failure,
  /** Error message, red. Only message level to have error handling. */
  Error,
}

export function messageLevelStr(level: EnMessageLevel): string {
  switch (level) {
    case EnMessageLevel.Info:
      return 'info';
    case EnMessageLevel.Success:
      return 'success';
    case EnMessageLevel.Warning:
      return 'warning';
    case EnMessageLevel.Failure:
      return 'failure';
    case EnMessageLevel.Error:
      return 'error';
  }
}

/** Single message. */
export type Message = {
  /** UUID of message. */
  id: string;
  /** Ordered number of message. Mainly for tests. */
  no: number;
  /** Level of message. */
  level: EnMessageLevel;
  /** Title of message. */
  title: string;
  /** Content of message. */
  content: string;

  /** Error code. */
  errCode: string;
};
