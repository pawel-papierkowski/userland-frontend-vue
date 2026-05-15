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
