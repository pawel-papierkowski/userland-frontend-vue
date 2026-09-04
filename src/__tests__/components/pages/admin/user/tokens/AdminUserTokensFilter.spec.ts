 
import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

import i18n from '@/code/lang/i18n.ts';

import type { UserTokenTableFilterForm } from '@/code/data/features/user/admin-user-type.ts';

import AdminUserTokensFilter from '@/components/pages/admin/user/tokens/AdminUserTokensFilter.vue';
import DateTimePicker from '@/components/base/inputs/datetimepicker/DateTimePicker.vue';

// ////////////////////////////////////////////////////////////////////////////
// Test data

const defaultForm: UserTokenTableFilterForm = {
  userId: -1,
  createdFromAt: new Date('2024-01-01'),
  createdToAt: new Date('2024-12-31'),
  tableMeta: null,
};

// ////////////////////////////////////////////////////////////////////////////
// Helpers

function createComponent(form: UserTokenTableFilterForm, isBusy: boolean, disabled?: boolean) {
  return shallowMount(AdminUserTokensFilter, {
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue: form,
      isBusy,
      disabled,
    },
  });
}

// ////////////////////////////////////////////////////////////////////////////
// Tests

/** Tests of AdminUserTokensFilter component. */
describe('AdminUserTokensFilter', () => {
  // //////////////////////////////////////////////////////////////////////////
  // Rendering

  describe('rendering', () => {
    it('renders the filter heading', () => {
      // Arrange & Act: Create component.
      const wrapper = createComponent(defaultForm, false);

      // Assert: Heading exists with translated title.
      const heading = wrapper.find('h4');
      expect(heading.exists()).toBe(true);
      expect(heading.text()).toBe('🔍 User tokens filter');
    });

    it('renders the form with data-testid', () => {
      // Arrange & Act: Create component.
      const wrapper = createComponent(defaultForm, false);

      // Assert: Form has correct testid.
      const form = wrapper.find('[data-testid="form-user-filter"]');
      expect(form.exists()).toBe(true);
    });

    it('renders two DateTimePickers', () => {
      // Arrange & Act: Create component.
      const wrapper = createComponent(defaultForm, false);

      // Assert: Two pickers for from/to dates.
      const pickers = wrapper.findAllComponents(DateTimePicker);
      expect(pickers).toHaveLength(2);
    });

    it('renders the submit button', () => {
      // Arrange & Act: Create component.
      const wrapper = createComponent(defaultForm, false);

      // Assert: Button exists with normal text (not busy).
      const btn = wrapper.find('button');
      expect(btn.exists()).toBe(true);
      expect(btn.text()).toBe('Refresh');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Submit

  describe('submit', () => {
    it('emits reload on form submit', async () => {
      // Arrange: Create component.
      const wrapper = createComponent(defaultForm, false);

      // Act: Submit the form.
      const form = wrapper.find('[data-testid="form-user-filter"]');
      await form.trigger('submit');

      // Assert: Reload event emitted.
      expect(wrapper.emitted('reload')).toHaveLength(1);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Button disabled state

  describe('button disabled state', () => {
    it('is enabled when neither isBusy nor disabled', () => {
      // Arrange & Act: Create component with no restrictions.
      const wrapper = createComponent(defaultForm, false);

      // Assert: Button is enabled.
      const btn = wrapper.find('button');
      expect(btn.attributes('disabled')).toBeUndefined();
    });

    it('is disabled when isBusy is true', () => {
      // Arrange & Act: Busy state.
      const wrapper = createComponent(defaultForm, true);

      // Assert: Button is disabled.
      const btn = wrapper.find('button');
      expect(btn.attributes('disabled')).toBeDefined();
    });

    it('is disabled when disabled is true', () => {
      // Arrange & Act: Disabled state.
      const wrapper = createComponent(defaultForm, false, true);

      // Assert: Button is disabled.
      const btn = wrapper.find('button');
      expect(btn.attributes('disabled')).toBeDefined();
    });

    it('shows loading text when isBusy is true', () => {
      // Arrange & Act: Busy state.
      const wrapper = createComponent(defaultForm, true);

      // Assert: Button shows busy text.
      const btn = wrapper.find('button');
      expect(btn.text()).toBe('Loading...');
    });

    it('shows normal text when not busy', () => {
      // Arrange & Act: Not busy.
      const wrapper = createComponent(defaultForm, false);

      // Assert: Button shows normal text.
      const btn = wrapper.find('button');
      expect(btn.text()).toBe('Refresh');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // DateTimePicker disabled state

  describe('DateTimePicker disabled state', () => {
    it('disables pickers when disabled prop is true', () => {
      // Arrange & Act: Disabled state.
      const wrapper = createComponent(defaultForm, false, true);

      // Assert: Both pickers receive disabled=true.
      const pickers = wrapper.findAllComponents(DateTimePicker);
      expect(pickers[0]!.props('disabled')).toBe(true);
      expect(pickers[1]!.props('disabled')).toBe(true);
    });

    it('enables pickers when disabled prop is false', () => {
      // Arrange & Act: Not disabled.
      const wrapper = createComponent(defaultForm, false);

      // Assert: Both pickers receive disabled=false.
      const pickers = wrapper.findAllComponents(DateTimePicker);
      expect(pickers[0]!.props('disabled')).toBe(false);
      expect(pickers[1]!.props('disabled')).toBe(false);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Date constraints

  describe('date constraints', () => {
    it('binds dateTimeMax on from picker to createdToAt', () => {
      // Arrange & Act: Create component.
      const wrapper = createComponent(defaultForm, false);

      // Assert: First picker's max is the to-date.
      const pickers = wrapper.findAllComponents(DateTimePicker);
      expect(pickers[0]!.props('dateTimeMax')).toBe(defaultForm.createdToAt);
    });

    it('binds dateTimeMin on to picker to createdFromAt', () => {
      // Arrange & Act: Create component.
      const wrapper = createComponent(defaultForm, false);

      // Assert: Second picker's min is the from-date.
      const pickers = wrapper.findAllComponents(DateTimePicker);
      expect(pickers[1]!.props('dateTimeMin')).toBe(defaultForm.createdFromAt);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Model binding

  describe('model binding', () => {
    it('updates createdFromAt when from picker emits', async () => {
      // Arrange: Create component with reactive form.
      const form: UserTokenTableFilterForm = {
        userId: -1,
        createdFromAt: null,
        createdToAt: null,
        tableMeta: null,
      };
      const wrapper = createComponent(form, false);
      const newDate = new Date('2024-06-15');

      // Act: From picker emits new value.
      const pickers = wrapper.findAllComponents(DateTimePicker);
      pickers[0]!.vm.$emit('update:modelValue', newDate);

      // Assert: Form's createdFromAt updated.
      expect(form.createdFromAt).toBe(newDate);
    });

    it('updates createdToAt when to picker emits', async () => {
      // Arrange: Create component with reactive form.
      const form: UserTokenTableFilterForm = {
        userId: -1,
        createdFromAt: null,
        createdToAt: null,
        tableMeta: null,
      };
      const wrapper = createComponent(form, false);
      const newDate = new Date('2024-06-15');

      // Act: To picker emits new value.
      const pickers = wrapper.findAllComponents(DateTimePicker);
      pickers[1]!.vm.$emit('update:modelValue', newDate);

      // Assert: Form's createdToAt updated.
      expect(form.createdToAt).toBe(newDate);
    });
  });
});
