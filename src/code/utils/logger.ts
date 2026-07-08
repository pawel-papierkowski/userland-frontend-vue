import { createLogger } from 'vue-logger-plugin';

import { projectProp } from '@/code/data/app/const.ts';

// Initialize the logger here.
export const logger = createLogger({
  enabled: true, // Enable the logger.

  // Set the log level based on environment.
  level: projectProp.build === 'PROD' ? 'error' : 'debug',

  // Optional formatting settings.
  callerInfo: true, // Prints the file and line number.
  prefixFormat: ({ level, caller }) => {
    return `[${level.toUpperCase()}] ${caller ? `[${caller.fileName}:${caller.lineNumber}]` : ''}`;
  },
});
