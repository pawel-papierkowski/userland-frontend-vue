/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

import i18n from '@/code/lang/i18n.ts';

import type { UserTableFilterForm } from '@/code/data/features/user/admin-user-type.ts';
import { enUserStatus } from '@/code/data/features/user/user-const.ts';

import AdminUserFilter from '@/components/pages/admin/user/main/AdminUserFilter.vue';
import ComboBox from '@/components/base/inputs/ComboBox.vue';
import DateTimePicker from '@/components/base/inputs/datetimepicker/DateTimePicker.vue';
import CheckBox from '@/components/base/inputs/CheckBox.vue';

// ////////////////////////////////////////////////////////////////////////////
// Test data

const defaultForm: UserTableFilterForm = {
  username: 'test',
  email: 'test@example.com',
  status: 'ACTIVE',
  locked: false,
  createdFromAt: new Date('2024-01-01'),
  createdToAt: new Date('2024-12-31'),
  tableMeta: null,
};

// ////////////////////////////////////////////////////////////////////////////
// Helpers

function createComponent(form: UserTableFilterForm, isBusy: boolean) {
  return shallowMount(AdminUserFilter, {
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue: form,
      isBusy,
    },
  });
}

// ////////////////////////////////////////////////////////////////////////////
// Tests

/** Tests of AdminUserFilter component. */
describe('AdminUserFilter', () => {
  // //////////////////////////////////////////////////////////////////////////
  // Rendering

  describe('rendering', () => {
    it('renders the filter heading', () => {
      const wrapper = createComponent(defaultForm, false);
      const heading = wrapper.find('h4');
      expect(heading.exists()).toBe(true);
      expect(heading.text()).toBe('🔍 User filter');
    });

    it('renders the form with data-testid', () => {
      const wrapper = createComponent(defaultForm, false);
      const form = wrapper.find('[data-testid="form-user-filter"]');
      expect(form.exists()).toBe(true);
    });

    it('renders username and email text inputs', () => {
      const wrapper = createComponent(defaultForm, false);
      const usernameInput = wrapper.find('[data-testid="username"]');
      const emailInput = wrapper.find('[data-testid="email"]');
      expect(usernameInput.exists()).toBe(true);
      expect(emailInput.exists()).toBe(true);
      expect(usernameInput.element.tagName).toBe('INPUT');
      expect(emailInput.element.tagName).toBe('INPUT');
    });

    it('renders status ComboBox', () => {
      const wrapper = createComponent(defaultForm, false);
      const combos = wrapper.findAllComponents(ComboBox as any);
      expect(combos).toHaveLength(1);
    });

    it('renders two DateTimePickers', () => {
      const wrapper = createComponent(defaultForm, false);
      const pickers = wrapper.findAllComponents(DateTimePicker as any);
      expect(pickers).toHaveLength(2);
    });

    it('renders locked CheckBox', () => {
      const wrapper = createComponent(defaultForm, false);
      const boxes = wrapper.findAllComponents(CheckBox as any);
      expect(boxes).toHaveLength(1);
    });

    it('renders the submit button', () => {
      const wrapper = createComponent(defaultForm, false);
      const btn = wrapper.find('button');
      expect(btn.exists()).toBe(true);
      expect(btn.text()).toBe('Refresh');
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
    it('is enabled when isBusy is false', () => {
      const wrapper = createComponent(defaultForm, false);
      const btn = wrapper.find('button');
      expect(btn.attributes('disabled')).toBeUndefined();
    });

    it('is disabled when isBusy is true', () => {
      const wrapper = createComponent(defaultForm, true);
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
  // ComboBox props

  describe('ComboBox props', () => {
    it('passes correct options, langPrefix and placeholder to status ComboBox', () => {
      const wrapper = createComponent(defaultForm, false);
      const combos = wrapper.findAllComponents(ComboBox as any);
      expect(combos[0]!.props('options')).toEqual(enUserStatus);
      expect(combos[0]!.props('langPrefix')).toBe('tech.user.status');
      expect(combos[0]!.props('placeholder')).toBe('tech.user.status.null');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // DateTimePicker date constraints

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
  // CheckBox props

  describe('CheckBox props', () => {
    it('passes allowNull to locked CheckBox', () => {
      const wrapper = createComponent(defaultForm, false);
      const boxes = wrapper.findAllComponents(CheckBox as any);
      expect(boxes[0]!.props('allowNull')).toBe(true);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Model binding

  describe('model binding', () => {
    it('updates username on input', async () => {
      const form: UserTableFilterForm = {
        username: null, email: null, status: null, locked: null,
        createdFromAt: null, createdToAt: null, tableMeta: null,
      };
      const wrapper = createComponent(form, false);
      const input = wrapper.find('[data-testid="username"]');
      await input.setValue('newuser');
      expect(form.username).toBe('newuser');
    });

    it('updates email on input', async () => {
      const form: UserTableFilterForm = {
        username: null, email: null, status: null, locked: null,
        createdFromAt: null, createdToAt: null, tableMeta: null,
      };
      const wrapper = createComponent(form, false);
      const input = wrapper.find('[data-testid="email"]');
      await input.setValue('new@example.com');
      expect(form.email).toBe('new@example.com');
    });

    it('updates status when ComboBox emits', async () => {
      const form: UserTableFilterForm = {
        username: null, email: null, status: null, locked: null,
        createdFromAt: null, createdToAt: null, tableMeta: null,
      };
      const wrapper = createComponent(form, false);
      const combos = wrapper.findAllComponents(ComboBox as any);
      combos[0]!.vm.$emit('update:modelValue', 'PENDING');
      expect(form.status).toBe('PENDING');
    });

    it('updates createdFromAt when from picker emits', async () => {
      const form: UserTableFilterForm = {
        username: null, email: null, status: null, locked: null,
        createdFromAt: null, createdToAt: null, tableMeta: null,
      };
      const wrapper = createComponent(form, false);
      const newDate = new Date('2024-06-15');
      const pickers = wrapper.findAllComponents(DateTimePicker as any);
      pickers[0]!.vm.$emit('update:modelValue', newDate);
      expect(form.createdFromAt).toBe(newDate);
    });

    it('updates createdToAt when to picker emits', async () => {
      const form: UserTableFilterForm = {
        username: null, email: null, status: null, locked: null,
        createdFromAt: null, createdToAt: null, tableMeta: null,
      };
      const wrapper = createComponent(form, false);
      const newDate = new Date('2024-06-15');
      const pickers = wrapper.findAllComponents(DateTimePicker as any);
      pickers[1]!.vm.$emit('update:modelValue', newDate);
      expect(form.createdToAt).toBe(newDate);
    });

    it('updates locked when CheckBox emits', async () => {
      const form: UserTableFilterForm = {
        username: null, email: null, status: null, locked: null,
        createdFromAt: null, createdToAt: null, tableMeta: null,
      };
      const wrapper = createComponent(form, false);
      const boxes = wrapper.findAllComponents(CheckBox as any);
      boxes[0]!.vm.$emit('update:modelValue', true);
      expect(form.locked).toBe(true);
    });
  });
});
