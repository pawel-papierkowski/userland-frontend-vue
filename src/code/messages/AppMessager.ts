import { isAxiosError } from 'axios';
import { useMessageStore } from '@/stores/messages';
import i18n from '@/code/lang/i18n.ts';

const { t } = i18n.global;

/**
 * Class for generating user feedback messages, including error messages with special handling that depends on error object.
 */
export class AppMessager {
  /**
   * Generates info message from provided translation keys.
   * @param title Title as i18n key.
   * @param content Content as i18n key.
   */
  public static infoT(title: string, content: string) {
    this.info(t(title), t(content));
  }

  /**
   * Generates info message.
   * @param title Title as a string.
   * @param content Content as a string.
   */
  public static info(title: string, content: string) {
    this.showInfo(title, content);
  }

  //

  /**
   * Generates success message from provided translation keys.
   * @param title Title as i18n key.
   * @param content Content as i18n key.
   */
  public static successT(title: string, content: string) {
    this.success(t(title), t(content));
  }

  /**
   * Generates success message.
   * @param title Title as a string.
   * @param content Content as a string.
   */
  public static success(title: string, content: string) {
    this.showSuccess(title, content);
  }

  //

  /**
   * Generates warning message from provided translation keys.
   * @param title Title as i18n key.
   * @param content Content as i18n key.
   */
  public static warningT(title: string, content: string) {
    this.warning(t(title), t(content));
  }

  /**
   * Generates warning message.
   * @param title Title as a string.
   * @param content Content as a string.
   */
  public static warning(title: string, content: string) {
    this.showWarning(title, content);
  }

  //

  /**
   * Generates failure message from provided translation keys.
   * @param title Title as i18n key.
   * @param content Content as i18n key.
   */
  public static failureT(title: string, content: string) {
    this.failure(t(title), t(content));
  }

  /**
   * Generates failure message.
   * @param title Title as a string.
   * @param content Content as a string.
   */
  public static failure(title: string, content: string) {
    this.showFailure(title, content);
  }

  //

  /**
   * Generates error message to show as user feedback on error from provided translation keys.
   * @param error Error object.
   * @param fallbackTitle Title to use if cannot process error as i18n key.
   * @param fallbackContent Content to use if cannot process error as i18n key.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static errorT(error: any, fallbackTitle: string, fallbackContent: string) {
    this.error(error, t(fallbackTitle), t(fallbackContent))
  }

  /**
   * Generates error message to show as user feedback on error.
   * @param error Error object.
   * @param fallbackTitle Title string to use if cannot process error.
   * @param fallbackContent Content string to use if cannot process error.
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
      this.showError(t(errCodeTitleKey), t(`msgs.${errCode}.content`), errCode);
      return;
    }

    // Second, check if we can tell something based on HTTP status.
    const errCodeHttpKey = `msgs.${error.response.status}.title`; // will ignore status if lang key does not exist
    if (i18n.global.te(errCodeHttpKey)) {
      this.showError(t(errCodeHttpKey), t(`msgs.${error.response.status}.content`));
      return;
    }

    // If all else fails, use fallback texts.
    this.showError(fallbackTitle, fallbackContent);
  }

  /**
   * Process error without response from server (network issue).
   */
  private static processRequestError() {
    this.showError(t('msgs.networkError.title'), t('msgs.networkError.content'));
  }

  //

  /**
   * Helper to show info message using store.
   * @param title Title string.
   * @param content Content string.
   */
  private static showInfo(title: string, content: string) {
    const messageStore = useMessageStore();
    messageStore.info(title, content);
  }

  /**
   * Helper to show success message using store.
   * @param title Title string.
   * @param content Content string.
   */
  private static showSuccess(title: string, content: string) {
    const messageStore = useMessageStore();
    messageStore.success(title, content);
  }

  /**
   * Helper to show warning message using store.
   * @param title Title string.
   * @param content Content string.
   */
  private static showWarning(title: string, content: string) {
    const messageStore = useMessageStore();
    messageStore.warning(title, content);
  }

  /**
   * Helper to show failure message using store.
   * @param title Title string.
   * @param content Content string.
   */
  private static showFailure(title: string, content: string) {
    const messageStore = useMessageStore();
    messageStore.failure(title, content);
  }

  /**
   * Helper to show error message using store.
   * @param title Title string.
   * @param content Content string.
   * @param errCode Optional error code.
   */
  private static showError(title: string, content: string, errCode: string = '') {
    const messageStore = useMessageStore();
    messageStore.error(title, content, errCode);
  }
}
