/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

import i18n from '@/code/lang/i18n.ts';

import type { UserHistoryTableFilterForm } from '@/code/data/features/user/admin-user-type.ts';
import { enUserHistoryWho, enUserHistoryWhat } from '@/code/data/features/user/user-const.ts';

import AdminUserHistoryFilter from '@/components/pages/admin/user/history/AdminUserHistoryFilter.vue';
import DateTimePicker from '@/components/base/inputs/datetimepicker/DateTimePicker.vue';
import ComboBox from '@/components/base/inputs/ComboBox.vue';

// ////////////////////////////////////////////////////////////////////////////
// Test data

const defaultForm: UserHistoryTableFilterForm = {
  userId: -1,
  who: null,
  what: null,
  createdFromAt: new Date('2024-01-01'),
  createdToAt: new Date('2024-12-31'),
  tableMeta: null,
};

// ////////////////////////////////////////////////////////////////////////////
// Helpers

function createComponent(
  form: UserHistoryTableFilterForm,
  isBusy: boolean,
  disabled?: boolean,
) {
  return shallowMount(AdminUserHistoryFilter, {
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

/** Tests of AdminUserHistoryFilter component. */
describe('AdminUserHistoryFilter', () => {
  // //////////////////////////////////////////////////////////////////////////
  // Rendering

  describe('rendering', () => {
    it('renders the filter heading', () => {
      const wrapper = createComponent(defaultForm, false);
      const heading = wrapper.find('h4');
      expect(heading.exists()).toBe(true);
      expect(heading.text()).toBe('🔍 User history filter');
    });

    it('renders the form with data-testid', () => {
      const wrapper = createComponent(defaultForm, false);
      const form = wrapper.find('[data-testid="form-user-filter"]');
      expect(form.exists()).toBe(true);
    });

    it('renders two DateTimePickers', () => {
      const wrapper = createComponent(defaultForm, false);
      const pickers = wrapper.findAllComponents(DateTimePicker as any);
      expect(pickers).toHaveLength(2);
    });

    it('renders two ComboBoxes', () => {
      const wrapper = createComponent(defaultForm, false);
      const combos = wrapper.findAllComponents(ComboBox as any);
      expect(combos).toHaveLength(2);
    });

    it('renders the submit button', () => {
      const wrapper = createComponent(defaultForm, false);
      const btn = wrapper.find('button');
      expect(btn.exists()).toBe(true);
      expect(btn.text()).toBe('Refresh');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // ComboBox props

  describe('ComboBox props', () => {
    it('passes who options, langPrefix and placeholder to first ComboBox', () => {
      const wrapper = createComponent(defaultForm, false);
      const combos = wrapper.findAllComponents(ComboBox as any);
      expect(combos[0]!.props('options')).toEqual(enUserHistoryWho);
      expect(combos[0]!.props('langPrefix')).toBe('tech.user.who');
      expect(combos[0]!.props('placeholder')).toBe('tech.user.who.null');
    });

    it('passes what options, langPrefix and placeholder to second ComboBox', () => {
      const wrapper = createComponent(defaultForm, false);
      const combos = wrapper.findAllComponents(ComboBox as any);
      expect(combos[1]!.props('options')).toEqual(enUserHistoryWhat);
      expect(combos[1]!.props('langPrefix')).toBe('tech.user.what');
      expect(combos[1]!.props('placeholder')).toBe('tech.user.what.null');
    });

    it('disables ComboBoxes when disabled prop is true', () => {
      const wrapper = createComponent(defaultForm, false, true);
      const combos = wrapper.findAllComponents(ComboBox as any);
      expect(combos[0]!.props('disabled')).toBe(true);
      expect(combos[1]!.props('disabled')).toBe(true);
    });

    it('enables ComboBoxes when disabled prop is false', () => {
      const wrapper = createComponent(defaultForm, false);
      const combos = wrapper.findAllComponents(ComboBox as any);
      expect(combos[0]!.props('disabled')).toBe(false);
      expect(combos[1]!.props('disabled')).toBe(false);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Submit

  describe('submit', () => {
    it('emits reload on form submit', async () => {
      const wrapper = createComponent(defaultForm, false);
      const form = wrapper.find('[data-testid="form-user-filter"]');
      await form.trigger('submit');
      expect(wrapper.emitted('reload')).toHaveLength(1);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Button disabled state

  describe('button disabled state', () => {
    it('is enabled when neither isBusy nor disabled', () => {
      const wrapper = createComponent(defaultForm, false);
      const btn = wrapper.find('button');
      expect(btn.attributes('disabled')).toBeUndefined();
    });

    it('is disabled when isBusy is true', () => {
      const wrapper = createComponent(defaultForm, true);
      const btn = wrapper.find('button');
      expect(btn.attributes('disabled')).toBeDefined();
    });

    it('is disabled when disabled is true', () => {
      const wrapper = createComponent(defaultForm, false, true);
      const btn = wrapper.find('button');
      expect(btn.attributes('disabled')).toBeDefined();
    });

    it('shows loading text when isBusy is true', () => {
      const wrapper = createComponent(defaultForm, true);
      const btn = wrapper.find('button');
      expect(btn.text()).toBe('Loading...');
    });

    it('shows normal text when not busy', () => {
      const wrapper = createComponent(defaultForm, false);
      const btn = wrapper.find('button');
      expect(btn.text()).toBe('Refresh');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // DateTimePicker disabled state

  describe('DateTimePicker disabled state', () => {
    it('disables pickers when disabled prop is true', () => {
      const wrapper = createComponent(defaultForm, false, true);
      const pickers = wrapper.findAllComponents(DateTimePicker as any);
      expect(pickers[0]!.props('disabled')).toBe(true);
      expect(pickers[1]!.props('disabled')).toBe(true);
    });

    it('enables pickers when disabled prop is false', () => {
      const wrapper = createComponent(defaultForm, false);
      const pickers = wrapper.findAllComponents(DateTimePicker as any);
      expect(pickers[0]!.props('disabled')).toBe(false);
      expect(pickers[1]!.props('disabled')).toBe(false);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Date constraints

  describe('date constraints', () => {
    it('binds dateTimeMax on from picker to createdToAt', () => {
      const wrapper = createComponent(defaultForm, false);
      const pickers = wrapper.findAllComponents(DateTimePicker as any);
      expect(pickers[0]!.props('dateTimeMax')).toBe(defaultForm.createdToAt);
    });

    it('binds dateTimeMin on to picker to createdFromAt', () => {
      const wrapper = createComponent(defaultForm, false);
      const pickers = wrapper.findAllComponents(DateTimePicker as any);
      expect(pickers[1]!.props('dateTimeMin')).toBe(defaultForm.createdFromAt);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Model binding

  describe('model binding', () => {
    it('updates createdFromAt when from picker emits', async () => {
      const form: UserHistoryTableFilterForm = {
        userId: -1, who: null, what: null, createdFromAt: null, createdToAt: null, tableMeta: null,
      };
      const wrapper = createComponent(form, false);
      const newDate = new Date('2024-06-15');
      const pickers = wrapper.findAllComponents(DateTimePicker as any);
      pickers[0]!.vm.$emit('update:modelValue', newDate);
      expect(form.createdFromAt).toBe(newDate);
    });

    it('updates createdToAt when to picker emits', async () => {
      const form: UserHistoryTableFilterForm = {
        userId: -1, who: null, what: null, createdFromAt: null, createdToAt: null, tableMeta: null,
      };
      const wrapper = createComponent(form, false);
      const newDate = new Date('2024-06-15');
      const pickers = wrapper.findAllComponents(DateTimePicker as any);
      pickers[1]!.vm.$emit('update:modelValue', newDate);
      expect(form.createdToAt).toBe(newDate);
    });

    it('updates who when first ComboBox emits', async () => {
      const form: UserHistoryTableFilterForm = {
        userId: -1, who: null, what: null, createdFromAt: null, createdToAt: null, tableMeta: null,
      };
      const wrapper = createComponent(form, false);
      const combos = wrapper.findAllComponents(ComboBox as any);
      combos[0]!.vm.$emit('update:modelValue', 'USER');
      expect(form.who).toBe('USER');
    });

    it('updates what when second ComboBox emits', async () => {
      const form: UserHistoryTableFilterForm = {
        userId: -1, who: null, what: null, createdFromAt: null, createdToAt: null, tableMeta: null,
      };
      const wrapper = createComponent(form, false);
      const combos = wrapper.findAllComponents(ComboBox as any);
      combos[1]!.vm.$emit('update:modelValue', 'EDIT');
      expect(form.what).toBe('EDIT');
    });
  });
});
