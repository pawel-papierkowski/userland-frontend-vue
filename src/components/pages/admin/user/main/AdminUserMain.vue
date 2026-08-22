<script setup lang="ts">
/**
 * View/edit of single, selected user.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { ref, reactive, watch } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import apiLogging from '@/services/api-logging.ts';
import backendApiAdminUser from '@/services/features/api-admin-users.ts';

import { useUserEventStore } from '@/stores/events/user-events.ts';
import type {
  UserTableEntry,
  UserFullDataReq,
  UserFullDataResp,
  UserFullDataForm,
} from '@/code/data/features/user/admin-user-type.ts';
import { emptyUserForm } from '@/code/data/features/user/user-const.ts';

import { TimeUtils } from '@/code/utils/TimeUtils.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import { AppUserEventer } from '@/code/stores/events/AppUserEventer.ts';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

import TextBox from '@/components/base/inputs/TextBox.vue';

const { t } = useI18n();

const { usersReloadTrigger } = storeToRefs(useUserEventStore());

/** User data for form. */
const form: UserFullDataForm = reactive({ ...emptyUserForm });
/** Version of form just after load or update to determine differences. */
const diffForm: Ref<UserFullDataForm> = ref({ ...emptyUserForm });

/** Selected user record. */
const selUserRecord = defineModel<UserTableEntry | null>();

const props = withDefaults(
  defineProps<{
    /** True if this tab is currently the active tab in the tab group. */
    isActive?: boolean;
  }>(),
  { isActive: true },
);

/** True if busy doing something, otherwise false. Used to disable buttons. */
const isBusy = ref(false);
/** True if data load is in progress, otherwise false. Used to hide form. */
const isLoading = ref(false);
/** Can spinner spin? */
const canSpin = ref(true);

/** True if data must be reloaded on next activation, even if already loaded for the user. */
let forceReload = false;

// FUNCTIONS

/** Load user data and fill form. */
const loadUserData = async () => {
  clearForm();
  const data = await resolveUserData();
  if (data === null) return; // no user selected or failed to load user data

  fillFormData(data);
  diffForm.value = { ...form }; // remember loaded state
};

/** Retrieve all available data about selected user from backend. */
const resolveUserData = async (): Promise<UserFullDataResp | null> => {
  if (!selUserRecord.value) return null; // no user selected, nothing to do
  isBusy.value = true;
  isLoading.value = true;
  canSpin.value = true;

  try {
    const response = await backendApiAdminUser.loadUserData(selUserRecord.value.id); // API CALL
    isLoading.value = false;
    return response.data;
  } catch (error) {
    AppMessager.errorT(error, 'admin.user.msg.errorLoadUser.title', 'admin.user.msg.errorLoadUser.content');
    apiLogging.logError(error, 'Loading user data failed!');
    canSpin.value = false;
    return null;
  } finally {
    isBusy.value = false;
  }
};

//

/** Handle update of user. */
const handleUserUpdate = async () => {
  const data = await saveUserData();
  if (data === null) return; // failed to update user

  fillFormData(data);
  diffFormData();
  if (diffForm.value.modifiedAt !== null) AppUserEventer.notifyUserUpdated(diffForm.value);
  diffForm.value = { ...form }; // remember updated state
};

/**
 * Save user data.
 * @returns Updated user data or null if something failed.
 */
const saveUserData = async (): Promise<UserFullDataResp | null> => {
  if (!selUserRecord.value) return null;
  isBusy.value = true;

  try {
    const editReq = convertToReq(form);
    const response = await backendApiAdminUser.editUserData(editReq); // API CALL
    return response.data;
  } catch (error) {
    AppMessager.errorT(error, 'admin.user.msg.error.title', 'admin.user.msg.error.content');
    apiLogging.logError(error, 'Updating user data failed!');
    return null;
  } finally {
    isBusy.value = false;
  }
};

/**
 * Convert user edit form data to user edit request data.
 * @param form User edit form.
 * @returns User full edit request.
 */
const convertToReq = (form: UserFullDataForm): UserFullDataReq => {
  return {
    id: selUserRecord.value?.id ?? -1,
    version: form.version,
    username: form.username,
    email: form.email,
    locked: null, // no change, we lock via separate button
    lang: null, // no change, we do not change language of user at all
    profile: {
      name: form.name,
      surname: form.surname,
    },
  };
};

//

/** Handle user lock or unlock. */
const handleUserLock = async () => {
  const newLocked = !(form.locked || false);
  const data = await flipLock(newLocked);
  if (data === null) return; // failed to update user

  fillFormData(data);
  diffFormData();
  if (diffForm.value.modifiedAt !== null) AppUserEventer.notifyUserUpdated(diffForm.value);
  diffForm.value = { ...form }; // remember updated state
};

/**
 * Lock or unlock user.
 * @param locked New value of 'locked' field.
 * @returns Updated user data or null if something failed.
 */
const flipLock = async (locked: boolean): Promise<UserFullDataResp | null> => {
  if (!selUserRecord.value) return null;
  isBusy.value = true;

  try {
    const editReq = convertLockToReq(locked);
    const response = await backendApiAdminUser.editUserData(editReq); // API CALL
    return response.data;
  } catch (error) {
    AppMessager.errorT(error, 'admin.user.msg.error.title', 'admin.user.msg.error.content');
    apiLogging.logError(error, 'Updating user data failed!');
    return null;
  } finally {
    isBusy.value = false;
  }
};

/**
 * Convert user edit form data to user edit request data.
 * @param locked New value of 'locked' field.
 * @returns User full edit request.
 */
const convertLockToReq = (locked: boolean): UserFullDataReq => {
  // null here means "do not change given value", so we only change field locked
  return {
    id: selUserRecord.value?.id ?? -1,
    version: form.version,
    username: null,
    email: null,
    locked: locked,
    lang: null,
    profile: null,
  };
};

//

/** Clear entire form. */
const clearForm = () => {
  Object.assign(form, emptyUserForm);
};

/**
 * Fill form data.
 * @param data Response from endpoint.
 */
const fillFormData = (data: UserFullDataResp) => {
  form.createdAt = TimeUtils.zoned(data.createdAt);
  form.modifiedAt = TimeUtils.zoned(data.modifiedAt);
  form.version = data.version;
  form.username = data.username;
  form.email = data.email;
  form.status = data.status;
  form.locked = data.locked;
  form.lang = data.lang;
  form.name = data.profile.name;
  form.surname = data.profile.surname;
};

/** Nullifies certain fields of diffForm that are same as form. */
const diffFormData = () => {
  resetDiffField('modifiedAt'); // modifiedAt === null means nothing changed at all
  resetDiffField('username');
  resetDiffField('email');
  resetDiffField('locked');
  // We do not care about rest of fields.
};

/**
 * Compare form and diffForm field. Unchanged field is nulled.
 * @param fieldName Name of field to update.
 */
const resetDiffField = (fieldName: string) => {
  const key = fieldName as keyof UserFullDataForm; // Cast fieldName to a valid key of the form type.
  if (form[key] === diffForm.value[key]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (diffForm.value as any)[key] = null;
  }
};

/**
 * Check if we are looking at your own account.
 * @returns True if selected account is same as currently logged in account, otherwise false.
 */
const isYourOwnAccount = (): boolean => {
  // Safe, as we cannot edit our own user and changing email via profile will log you out, invalidating token.
  return AppLoginer.getEmail() === form.email;
};

/**
 * Check if we have permission to edit users in general.
 * @returns True if we can edit users, otherwise false.
 */
const canEditUsers = (): boolean => {
  if (AppLoginer.hasPermission('role_admin')) return true;
  return AppLoginer.hasPermissionsAll(['role_admin', 'user_edit']);
};

/**
 * Check if form should be disabled. It will happen if we are busy, user is not selected,
 * we are viewing our own account or currently logged user has no user edit permissions.
 * @returns True if form should be disabled, otherwise false.
 */
const isFormDisabled = (): boolean => {
  return isBusy.value || selUserRecord.value === null || isYourOwnAccount() || !canEditUsers();
};

// WATCHES

/**
 * React on main user table being reloaded.
 * Forces reload of user data when this tab is active or becomes active again.
 */
watch([usersReloadTrigger], async () => {
  if (props.isActive) await loadUserData(); // reload immediately
  else forceReload = true; // reload later, when we open this tab
});

/** React on change to isActive value. If we enter tab for user main form and forceReload === true, we reload content of form. */
watch(() => props.isActive,
  async () => {
    if (!props.isActive || !forceReload) return;
    await loadUserData();
    forceReload = false;
  });

/** Change in selection requires reload of form, but only when tab is active. */
watch(
  selUserRecord,
  async () => {
    if (props.isActive) await loadUserData();
    else forceReload = true;
  },
  { immediate: true },
);
</script>

<template>
  <div class="form-wide">
    <div class="spinner-container" v-if="isLoading">
      <SpinnerTorus data-testid="spinner" display="block" size="100px" :canSpin="canSpin" />
    </div>

    <form @submit.prevent="" novalidate v-if="!isLoading" data-testid="user-form-main">
      <div class="form-group">
        <h4>{{ t('admin.user.main.form.general') }}</h4>
        <div class="form-subform">
          <div>{{ t('admin.user.main.form.createdAt') }}:</div>
          <div data-testid="user-form-createdAt">{{ form.createdAt }}</div>

          <div>{{ t('admin.user.main.form.modifiedAt') }}:</div>
          <div data-testid="user-form-modifiedAt">{{ form.modifiedAt }}</div>

          <label for="user-form-username">{{ t('admin.user.main.form.username') }}:</label>
          <TextBox
            id="user-form-username"
            v-model="form.username"
            autocomplete="off"
            :required="true"
            :disabled="isFormDisabled()"
          />

          <label for="user-form-email">{{ t('admin.user.main.form.email') }}:</label>
          <TextBox
            id="user-form-email"
            v-model="form.email"
            autocomplete="off"
            :required="true"
            :disabled="isFormDisabled()"
          />

          <div>{{ t('admin.user.main.form.status') }}:</div>
          <div data-testid="user-form-status">{{ form.status === '' ? '' : t(`tech.user.status.${form.status}`) }}</div>

          <div>{{ t('admin.user.main.form.locked') }}:</div>
          <div data-testid="user-form-locked">{{ form.locked === null ? '' : t('state.' + form.locked) }}</div>

          <div>{{ t('admin.user.main.form.lang') }}:</div>
          <div data-testid="user-form-lang">
            {{ form.lang === null ? '' : t(`languages.${form.lang}.name`) }}
            {{ form.lang === null ? '' : t(`languages.${form.lang}.flag`) }}
          </div>
        </div>

        <h4>{{ t('admin.user.main.form.profile') }}</h4>
        <div class="form-subform">
          <label for="user-form-name">{{ t('admin.user.main.form.name') }}:</label>
          <TextBox
            id="user-form-name"
            v-model="form.name"
            autocomplete="off"
            :required="true"
            :disabled="isFormDisabled()"
          />

          <label for="user-form-surname">{{ t('admin.user.main.form.surname') }}:</label>
          <TextBox
            id="user-form-surname"
            v-model="form.surname"
            autocomplete="off"
            :required="true"
            :disabled="isFormDisabled()"
          />
        </div>
      </div>

      <div
        class="onpage-msg info"
        v-if="canEditUsers() && isYourOwnAccount()"
        v-html="t('admin.user.msg.info.cannotEditYourself')"
      />

      <div class="items-horizontal" v-if="canEditUsers()">
        <button data-testid="user-form-btn-update" :disabled="isFormDisabled()" @click="handleUserUpdate()">
          {{ isBusy ? t('admin.user.main.button.busy') : t('admin.user.main.button.update') }}
        </button>
        <button data-testid="user-form-btn-lock" class="danger" :disabled="isFormDisabled()" @click="handleUserLock()">
          {{
            isBusy
              ? t('admin.user.main.button.busy')
              : form.locked
                ? t('admin.user.main.button.unlock')
                : t('admin.user.main.button.lock')
          }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
