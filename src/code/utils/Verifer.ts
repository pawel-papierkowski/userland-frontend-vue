import i18n from '@/code/lang/i18n.ts';

const { t } = i18n.global;

/** Class for verification of common types of fields. */
export class Verifier {
  /**
   * Verify general string field.
   * @param fieldValue Field to verify.
   * @returns Null if field is correct, otherwise error message.
   */
  public static verifyField(fieldValue: string, usedButton: boolean): string | null {
    const result = Verifier.verifyFieldInt(fieldValue, usedButton);
    if (result !== '') return result;
    return null; // no further verification needed here
  }

  /**
   * Verify email address field.
   * @param email Email address to verify.
   * @returns Null if email address is correct, otherwise error message.
   */
  public static verifyEmail(email: string, usedButton: boolean): string | null {
    const result = Verifier.verifyFieldInt(email, usedButton);
    if (result !== '') return result;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return t('form.errEmailBad');
    return null;
  }

  /**
   * Verify password field.
   * @param password Password to verify.
   * @returns Null if password is correct, otherwise error message.
   */
  public static verifyPassword(password: string, usedButton: boolean): string | null {
    const result = Verifier.verifyFieldInt(password, usedButton);
    if (result !== '') return result;

    if (password.length < 8) return t('form.errPasswordTooShort', { count: 8 });
    if (password.length > 100) return t('form.errPasswordTooLong', { count: 100 });
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=.,?!]).*$/;
    if (!passwordRegex.test(password)) return t('form.errPasswordWeak');
    return null;
  }

  /**
   * Verify password&password confirmation field.
   * @param password Password to verify.
   * @param confirmPassword Password confirmation to verify.
   * @returns Null if password is correct, otherwise error message.
   */
  public static verifyConfirmPassword(password: string, confirmPassword: string, usedButton: boolean): string | null {
    const result = Verifier.verifyFieldInt(confirmPassword, usedButton);
    if (result !== '') return result;

    if (password !== confirmPassword) return t('form.errPasswordMatch');
    return null;
  }

  //

  /**
   * Verify general string field internally.
   * @param fieldValue Field to verify.
   * @returns Null if field is correct, empty string if further verification should be done, otherwise error message.
   */
  public static verifyFieldInt(fieldValue: string, usedButton: boolean): string | null {
    if (!fieldValue) return usedButton ? t('form.errFieldEmpty') : null;
    if (fieldValue === '') return t('form.errFieldEmpty');
    return '';
  }
}
