import { isAxiosError } from 'axios';
import { useMessageStore } from '@/stores/messages';
import i18n from '@/code/lang/i18n.ts';

const { t } = i18n.global;

/**
 * Class for generating user feedback messages, including error messages with special handling that depends on error object.
 */
export class AppMessager {
  /**
   * Generates info message.
   * @param title Title as i18n key.
   * @param content Content as i18n key.
   */
  public static info(title: string, content: string) {
    this.showInfo(title, content);
  }
  /**
   * Generates success message.
   * @param title Title as i18n key.
   * @param content Content as i18n key.
   */
  public static success(title: string, content: string) {
    this.showSuccess(title, content);
  }

  /**
   * Generates warning message.
   * @param title Title as i18n key.
   * @param content Content as i18n key.
   */
  public static warn(title: string, content: string) {
    this.showWarn(title, content);
  }
  /**
   * Generates failure message.
   * @param title Title as i18n key.
   * @param content Content as i18n key.
   */
  public static failure(title: string, content: string) {
    this.showFailure(title, content);
  }

  //

  /**
   * Generates error message to show as user feedback on error.
   * @param error Error object.
   * @param fallbackTitle Title to use if cannot process error (i18n key).
   * @param fallbackContent Content to use if cannot process error (i18n key).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static error(error: any, fallbackTitle: string, fallbackContent: string) {
    if (isAxiosError(error)) {
      if (error.response) {
        // The server actually responded with an error (e.g., 400 Bad Request). Show it.
        this.processResponseError(error, fallbackTitle, fallbackContent);
        return;
      }
      if (error.request) {
        // Request was made but no response was received (e.g. backend is down).
        this.processRequestError();
        return;
      }
    }
    // Some other error happened, use fallback texts.
    this.showError(fallbackTitle, fallbackContent);
  }

  /**
   * Process error with response from server.
   * @param error Axios error.
   * @param fallbackTitle Fallback title.
   * @param fallbackContent Fallback content.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static processResponseError(error: any, fallbackTitle: string, fallbackContent: string) {
    const data = error.response.data;
    const errCode = data?.errCode;

    // First, check if error code is present in response.
    const errCodeTitleKey = `msgs.${errCode}.title`;
    if (errCode && i18n.global.te(errCodeTitleKey)) {
      this.showError(errCodeTitleKey, `msgs.${errCode}.content`, errCode);
      return;
    }

    // Second, check if we can tell something based on HTTP status.
    const errCodeHttpKey = `msgs.${error.response.status}.title`; // will ignore status if lang key does not exist
    if (i18n.global.te(errCodeHttpKey)) {
      this.showError(errCodeHttpKey, `msgs.${error.response.status}.content`);
      return;
    }

    // If all else fails, use fallback texts.
    this.showError(fallbackTitle, fallbackContent);
  }

  /**
   * Process error without response from server (network issue).
   */
  private static processRequestError() {
    this.showError('msgs.networkError.title', 'msgs.networkError.content');
  }

  //

  /**
   * Helper to show info message using store.
   * @param title I18n key for title.
   * @param content I18n key for content.
   */
  private static showInfo(title: string, content: string) {
    const messageStore = useMessageStore();
    messageStore.info(t(title), t(content));
  }

  /**
   * Helper to show success message using store.
   * @param title I18n key for title.
   * @param content I18n key for content.
   */
  private static showSuccess(title: string, content: string) {
    const messageStore = useMessageStore();
    messageStore.success(t(title), t(content));
  }

  /**
   * Helper to show warning message using store.
   * @param title I18n key for title.
   * @param content I18n key for content.
   */
  private static showWarn(title: string, content: string) {
    const messageStore = useMessageStore();
    messageStore.warn(t(title), t(content));
  }

  /**
   * Helper to show failure message using store.
   * @param title I18n key for title.
   * @param content I18n key for content.
   */
  private static showFailure(title: string, content: string) {
    const messageStore = useMessageStore();
    messageStore.failure(t(title), t(content));
  }

  /**
   * Helper to show error message using store.
   * @param title I18n key for title.
   * @param content I18n key for content.
   * @param errCode Optional error code.
   */
  private static showError(title: string, content: string, errCode: string = '') {
    const messageStore = useMessageStore();
    messageStore.error(t(title), t(content), errCode);
  }
}
