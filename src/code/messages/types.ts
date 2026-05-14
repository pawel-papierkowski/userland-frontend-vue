export enum EnMessageLevel {
  Info, // Informational, blue.
  Warning, // Warning, yellow.
  Error, // Error, red.
}

/** Single message. */
export type Message = {
  /** UUID of message. */
  id: string;
  /** Level of message. */
  level: EnMessageLevel;
  /** Title of message. */
  title: string;
  /** Content of message. */
  content: string;

  /** Error code. */
  errCode: string;
};
