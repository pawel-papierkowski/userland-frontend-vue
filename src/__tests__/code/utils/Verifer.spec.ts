import { describe, it, expect } from 'vitest';

import { Verifer } from '@/code/utils/Verifer';

describe('Verifer', () => {
  // ////////////////////////////////////////////////////////////////////////////
  // verifyFieldInt

  describe('verifyFieldInt', () => {
    it('returns empty-field error when value is empty and form is used', () => {
      // Arrange: Form is used, field is empty.
      const fieldValue = '';
      const used = true;

      // Act: Verify field internally.
      const result = Verifer.verifyFieldInt(fieldValue, used);

      // Assert: Error is returned.
      expect(result).toBe('Field cannot be empty.');
    });

    it('returns null when value is empty and form is not used', () => {
      // Arrange: Form is not used, field is empty.
      const fieldValue = '';
      const used = false;

      // Act: Verify field internally.
      const result = Verifer.verifyFieldInt(fieldValue, used);

      // Assert: Null is returned — no error for unused form with empty field.
      expect(result).toBeNull();
    });

    it('returns empty string for non-empty value regardless of used flag', () => {
      // Arrange: Non-empty field, form used.
      const fieldValue = 'something';
      const used = true;

      // Act: Verify field internally.
      const result = Verifer.verifyFieldInt(fieldValue, used);

      // Assert: Empty string — field passes basic check, further verification needed.
      expect(result).toBe('');
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // verifyField

  describe('verifyField', () => {
    it('returns error for empty field when form is used', () => {
      // Arrange: Form used, field empty.
      const fieldValue = '';
      const used = true;

      // Act: Verify field.
      const result = Verifer.verifyField(fieldValue, used);

      // Assert: Error returned.
      expect(result).toBe('Field cannot be empty.');
    });

    it('returns null for non-empty field (passes basic check)', () => {
      // Arrange: Non-empty field, form used.
      const fieldValue = 'some text';
      const used = true;

      // Act: Verify field.
      const result = Verifer.verifyField(fieldValue, used);

      // Assert: Null — field is considered valid.
      expect(result).toBeNull();
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // verifyEmail

  describe('verifyEmail', () => {
    it('returns error for empty email when form is used', () => {
      // Arrange: Form used, email empty.
      const email = '';
      const used = true;

      // Act: Verify email.
      const result = Verifer.verifyEmail(email, used);

      // Assert: Error returned.
      expect(result).toBe('Field cannot be empty.');
    });

    it('returns error for email without @ symbol', () => {
      // Arrange: String without @ is not a valid email.
      const email = 'notanemail';
      const used = true;

      // Act: Verify email.
      const result = Verifer.verifyEmail(email, used);

      // Assert: Email format error.
      expect(result).toBe('Need to enter correct email.');
    });

    it('returns error for email without domain', () => {
      // Arrange: Missing domain part.
      const email = 'user@';
      const used = true;

      // Act: Verify email.
      const result = Verifer.verifyEmail(email, used);

      // Assert: Email format error.
      expect(result).toBe('Need to enter correct email.');
    });

    it('returns null for valid simple email', () => {
      // Arrange: Standard email format.
      const email = 'user@example.com';
      const used = true;

      // Act: Verify email.
      const result = Verifer.verifyEmail(email, used);

      // Assert: No error.
      expect(result).toBeNull();
    });

    it('returns null for email with plus addressing', () => {
      // Arrange: Email with plus tag (common pattern).
      const email = 'user+tag@example.co.uk';
      const used = true;

      // Act: Verify email.
      const result = Verifer.verifyEmail(email, used);

      // Assert: No error.
      expect(result).toBeNull();
    });

    it('returns null for email with dots in local part', () => {
      // Arrange: Dotted local part.
      const email = 'first.last@example.com';
      const used = true;

      // Act: Verify email.
      const result = Verifer.verifyEmail(email, used);

      // Assert: No error.
      expect(result).toBeNull();
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // verifyPassword

  describe('verifyPassword', () => {
    it('returns error for empty password when form is used', () => {
      // Arrange: Form used, password empty.
      const password = '';
      const used = true;

      // Act: Verify password.
      const result = Verifer.verifyPassword(password, used);

      // Assert: Error returned.
      expect(result).toBe('Field cannot be empty.');
    });

    it('returns too-short error for password under 8 characters', () => {
      // Arrange: Password shorter than minimum.
      const password = 'Ab1@';
      const used = true;

      // Act: Verify password.
      const result = Verifer.verifyPassword(password, used);

      // Assert: Too-short error with count param.
      expect(result).toBe('Password is too short. It must have at least 8 characters.');
    });

    it('returns too-long error for password over 100 characters', () => {
      // Arrange: Password longer than maximum.
      const password = 'Ab1@' + 'x'.repeat(100);
      const used = true;

      // Act: Verify password.
      const result = Verifer.verifyPassword(password, used);

      // Assert: Too-long error with count param.
      expect(result).toBe('Password is too long. It must have at most 100 characters.');
    });

    it('returns weak error when password lacks a digit', () => {
      // Arrange: Password without any digit.
      const password = 'Abcdefgh@';
      const used = true;

      // Act: Verify password.
      const result = Verifer.verifyPassword(password, used);

      // Assert: Weak password error.
      expect(result).toBe(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      );
    });

    it('returns weak error when password lacks uppercase letter', () => {
      // Arrange: Password without uppercase.
      const password = 'abcdef1@';
      const used = true;

      // Act: Verify password.
      const result = Verifer.verifyPassword(password, used);

      // Assert: Weak password error.
      expect(result).toBe(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      );
    });

    it('returns weak error when password lacks special character', () => {
      // Arrange: Password without special character.
      const password = 'Abcdefg1';
      const used = true;

      // Act: Verify password.
      const result = Verifer.verifyPassword(password, used);

      // Assert: Weak password error.
      expect(result).toBe(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      );
    });

    it('returns null for valid password meeting all criteria', () => {
      // Arrange: Password with uppercase, lowercase, digit, special char, proper length.
      const password = 'Abcdef1@';
      const used = true;

      // Act: Verify password.
      const result = Verifer.verifyPassword(password, used);

      // Assert: No error.
      expect(result).toBeNull();
    });

    it('returns null for maximum-length valid password', () => {
      // Arrange: Password at exactly 100 chars with all requirements.
      const password = 'Ab1@' + 'x'.repeat(96);
      const used = true;

      // Act: Verify password.
      const result = Verifer.verifyPassword(password, used);

      // Assert: No error.
      expect(result).toBeNull();
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // verifyConfirmPassword

  describe('verifyConfirmPassword', () => {
    it('returns error for empty confirmation when form is used', () => {
      // Arrange: Form used, confirmation empty.
      const password = 'Abcdef1@';
      const confirmPassword = '';
      const used = true;

      // Act: Verify confirmation.
      const result = Verifer.verifyConfirmPassword(password, confirmPassword, used);

      // Assert: Error returned.
      expect(result).toBe('Field cannot be empty.');
    });

    it('returns null when both passwords are empty and form is not used', () => {
      // Arrange: Form not used, both fields empty.
      const password = '';
      const confirmPassword = '';
      const used = false;

      // Act: Verify confirmation.
      const result = Verifer.verifyConfirmPassword(password, confirmPassword, used);

      // Assert: No error for unused form.
      expect(result).toBeNull();
    });

    it('returns mismatch error when passwords do not match', () => {
      // Arrange: Password and confirmation differ.
      const password = 'Abcdef1@';
      const confirmPassword = 'Different1@';
      const used = true;

      // Act: Verify confirmation.
      const result = Verifer.verifyConfirmPassword(password, confirmPassword, used);

      // Assert: Mismatch error.
      expect(result).toBe('Passwords do not match.');
    });

    it('returns null when passwords match', () => {
      // Arrange: Password and confirmation are identical.
      const password = 'Abcdef1@';
      const confirmPassword = 'Abcdef1@';
      const used = true;

      // Act: Verify confirmation.
      const result = Verifer.verifyConfirmPassword(password, confirmPassword, used);

      // Assert: No error.
      expect(result).toBeNull();
    });
  });
});
