import i18n from '@/code/lang/i18n.ts';

const { t } = i18n.global;

/** Class for verification of common types of fields. */
export class Verifier {
  /**
   * Verify general string field.
   * @param fieldValue Field to verify.
   * @param used If true, form was used. Unused form should not show error on empty/null fields.
   * @returns Null if field is correct, otherwise error message.
   */
  public static verifyField(fieldValue: string, used: boolean): string | null {
    const result = Verifier.verifyFieldInt(fieldValue, used);
    if (result !== '') return result;
    return null; // no further verification needed here
  }

  /**
   * Verify email address field.
   * @param email Email address to verify.
   * @param used If true, form was used. Unused form should not show error on empty/null fields.
   * @returns Null if email address is correct, otherwise error message.
   */
  public static verifyEmail(email: string, used: boolean): string | null {
    const result = Verifier.verifyFieldInt(email, used);
    if (result !== '') return result;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return t('form.errEmailBad');
    return null;
  }

  /**
   * Verify password field.
   * @param password Password to verify.
   * @param used If true, form was used. Unused form should not show error on empty/null fields.
   * @returns Null if password is correct, otherwise error message.
   */
  public static verifyPassword(password: string, used: boolean): string | null {
    const result = Verifier.verifyFieldInt(password, used);
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
   * @param used If true, form was used. Unused form should not show error on empty/null fields.
   * @returns Null if password is correct, otherwise error message.
   */
  public static verifyConfirmPassword(password: string, confirmPassword: string, used: boolean): string | null {
    const result = Verifier.verifyFieldInt(confirmPassword, used);
    if (result !== '') return result;

    if (password !== confirmPassword) return t('form.errPasswordMatch');
    return null;
  }

  //

  /**
   * Verify general string field internally.
   * @param fieldValue Field to verify.
   * @param used If true, form was used. Unused form should not show error on empty/null fields.
   * @returns Null if field is correct, empty string if further verification should be done, otherwise error message.
   */
  public static verifyFieldInt(fieldValue: string, used: boolean): string | null {
    if (!fieldValue) return used ? t('form.errFieldEmpty') : null;
    if (fieldValue === '') return t('form.errFieldEmpty');
    return '';
  }
}
