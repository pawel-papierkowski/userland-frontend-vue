<script setup lang="ts">
/**
 * View/edit of single, selected user.
 * For now we are only viewing user.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { ref, reactive, watch } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import backendApi from '@/services/api-common.ts';
import backendApiAdminUser from '@/services/features/api-admin-users.ts';

import type { UserTableEntry, UserFullDataReq, UserFullDataResp, UserFullDataForm } from '@/code/data/features/user/admin-user.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

const { t } = useI18n();

/** User data for form. */
const form: UserFullDataForm = reactive({
  createdAt: '',
  modifiedAt: '',
  username: '',
  email: '',
  status: '',
  locked: null,
  lang: '',
  name: '',
  surname: '',
});

/** Selected user record. */
const selUserRecord = defineModel<UserTableEntry | null>();

/** True if busy doing something, otherwise false. Used to disable buttons. */
const isBusy: Ref<boolean> = ref(false);
/** True if data load is in progress, otherwise false. Used to hide form. */
const isLoading: Ref<boolean> = ref(false);
/** Can spinner spin? */
const canSpin: Ref<boolean> = ref(true);

/** Change in selection requires reload of form. */
watch(selUserRecord, () => {
  loadUserData();
});

//

/** Load user data and fill form. */
const loadUserData = async () => {
  clearForm();
  const data = await resolveUserData();
  if (data === null) return null; // no user selected or failed to load user data
  fillFormData(data);
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
    backendApi.logError(error, 'Loading user data failed!');
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

  fillFormData(data); // Update local form.
}

/**
 * Save user data.
 * @returns Updated user data or null if something failed.
 */
const saveUserData = async (): Promise<UserFullDataResp|null> => {
  if (!selUserRecord.value) return null;
  isBusy.value = true;

  try {
    const editReq = convertToReq(form);
    const response = await backendApiAdminUser.editUserData(editReq); // API CALL
    return response.data;
  } catch (error) {
    AppMessager.errorT(error, 'admin.user.msg.error.title', 'admin.user.msg.error.content');
    backendApi.logError(error, 'Updating user data failed!');
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
    id: selUserRecord.value?.id || -1,
    username: form.username,
    email: form.email,
    locked: null,
    lang: null,
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

  fillFormData(data); // Update local form.
}

/**
 * Lock or unlock user.
 * @param locked New value of 'locked' field.
 * @returns Updated user data or null if something failed.
 */
const flipLock = async (locked: boolean): Promise<UserFullDataResp|null> => {
  if (!selUserRecord.value) return null;
  isBusy.value = true;

  try {
    const editReq = convertLockToReq(locked);
    const response = await backendApiAdminUser.editUserData(editReq); // API CALL
    return response.data;
  } catch (error) {
    AppMessager.errorT(error, 'admin.user.msg.error.title', 'admin.user.msg.error.content');
    backendApi.logError(error, 'Updating user data failed!');
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
  return {
    id: selUserRecord.value?.id || -1,
    username: null,
    email: null,
    locked: locked,
    lang: null,
    profile: null
  };
};

//

/** Clear entire form. */
const clearForm = () => {
  form.createdAt = '';
  form.modifiedAt = '';
  form.username = '';
  form.email = '';
  form.status = '';
  form.locked = null;
  form.lang = '';
  form.name = '';
  form.surname = '';
};

/** Fill form data. */
const fillFormData = async (data: UserFullDataResp) => {
  form.createdAt = data.createdAt;
  form.modifiedAt = data.modifiedAt;
  form.username = data.username;
  form.email = data.email;
  form.status = data.status;
  form.locked = data.locked;
  form.lang = data.lang;
  form.name = data.profile.name;
  form.surname = data.profile.surname;
};

const isUnloaded = (): boolean => {
  return selUserRecord.value === null;
};
</script>

<template>
  <div class="form-wide">
    <div class="spinner-container" v-if="isLoading">
      <SpinnerTorus data-testid="spinner" display="block" size="100px" :canSpin="canSpin" />
    </div>

    <form @submit.prevent="" novalidate v-if="!isLoading" data-testid="form-user-main">
      <div class="form-group">
        <h4>{{ t('admin.user.main.form.general') }}</h4>
        <div class="form-subform">
          <div>{{ t('admin.user.main.form.createdAt') }}:</div>
          <div>{{ form.createdAt }}</div>

          <div>{{ t('admin.user.main.form.modifiedAt') }}:</div>
          <div>{{ form.modifiedAt }}</div>

          <label for="username">{{ t('admin.user.main.form.username') }}:</label>
          <input
            id="username"
            data-testid="username"
            type="text"
            v-model="form.username"
            required
            :disabled="isUnloaded()"
            autocomplete="off"
          />

          <label for="email">{{ t('admin.user.main.form.email') }}:</label>
          <input
            id="email"
            data-testid="email"
            type="email"
            v-model="form.email"
            required
            :disabled="isUnloaded()"
            autocomplete="off"
          />

          <div>{{ t('admin.user.main.form.status') }}:</div>
          <div>{{ form.status }}</div>

          <div>{{ t('admin.user.main.form.locked') }}:</div>
          <div>{{ form.locked === null ? '' : t('state.' + form.locked) }}</div>

          <div>{{ t('admin.user.main.form.lang') }}:</div>
          <div>{{ form.lang }}</div>
        </div>

        <h4>{{ t('admin.user.main.form.profile') }}</h4>
        <div class="form-subform">
          <label for="name">{{ t('admin.user.main.form.name') }}:</label>
          <input
            id="name"
            data-testid="name"
            type="text"
            v-model="form.name"
            required
            :disabled="isUnloaded()"
            autocomplete="off"
          />

          <label for="surname">{{ t('admin.user.main.form.surname') }}:</label>
          <input
            id="surname"
            data-testid="surname"
            type="text"
            v-model="form.surname"
            required
            :disabled="isUnloaded()"
            autocomplete="off"
          />
        </div>
      </div>
      <div class="items-horizontal">
        <button data-testid="btn-update" :disabled="isBusy || selUserRecord === null" @click="handleUserUpdate()">
          {{ isBusy ? t('admin.user.main.button.busy') : t('admin.user.main.button.update') }}
        </button>
        <button data-testid="btn-lock" class="danger" :disabled="isBusy || selUserRecord === null" @click="handleUserLock()">
          {{ isBusy ? t('admin.user.main.button.busy') :
              form.locked ? t('admin.user.main.button.unlock') : t('admin.user.main.button.lock') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
