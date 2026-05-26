<script setup lang="ts">
/** User management page. Shows table with users and allows editing selected user. */
import { onMounted, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import backendApi from '@/services/api-common.ts';
import backendApiAdminUser from '@/services/features/api-admin-users.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager.ts';

import type { UserTableReq, UserTableResp, UserTableEntry } from '@/code/data/features/user/admin-user.ts';
import { enUserStatus, userTableColumns } from '@/code/data/features/user/user-const.ts';

import TableWrapper from '@/components/common/table/TableWrapper.vue';
import TablePage from '@/components/common/table/TablePage.vue';
import ComboBox from '@/components/base/inputs/ComboBox.vue';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

const { t } = useI18n();

/** User table filtering form data. */
const form: UserTableReq = reactive({
  username: null,
  email: null,
  status: null,
  locked: null,
  createdFromAt: null,
  createdToAt: null,
  tableMeta: null,
});

/** Loaded page of users. */
const table: Ref<UserTableResp> = ref({ entries: []});
/** Selected record of table. */
const selRecord: Ref<UserTableEntry|null> = ref(null);

/** True if data load is in progress, otherwise false. */
const isLoading: Ref<boolean> = ref(false);
/** Can spinner spin? */
const canSpin: Ref<boolean> = ref(true);

/** Handle reload of user table with filtering. */
const handleReload = async () => {
  isLoading.value = true;
  canSpin.value = true;

  try {
    const result = await backendApiAdminUser.loadPage(form); // API CALL
    table.value = result.data;

    // TODO show results in table
  } catch (error) {
    canSpin.value = false;
    AppMessager.errorT(error, 'admin.user.msg.loadError.title', 'admin.user.msg.loadError.content');
    backendApi.logError(error, 'User table reload failed!');
  } finally {
    isLoading.value = false;
  }
};

//

onMounted(async () => { // automatically call once user enters page
  await handleReload();
});
</script>

<template>
  <TableWrapper>
    <template #filterPanel>
      <div class="form-filter">
        <h3>{{ t('admin.user.filter.title') }}</h3>

        <form @submit.prevent="handleReload" novalidate>
          <div class="form-divider">
            <div class="form-pairs">
              <label for="username">{{ t('admin.user.filter.username') }}:</label>
              <input id="username" data-testid="username" type="text" v-model="form.username" autocomplete="off" />

              <label for="email">{{ t('admin.user.filter.email') }}:</label>
              <input id="email" data-testid="email" type="text" v-model="form.email" autocomplete="email" />

              <label for="status">{{ t('admin.user.filter.status') }}:</label>
              <ComboBox data-testid="status" v-model="form.status" :options="enUserStatus"
                langPrefix="tech.user.status" placeholder="tech.user.status.null"/>
            </div>

            <div class="form-pairs">
              <label for="createdFromAt">{{ t('admin.user.filter.createdFromAt') }}:</label>
              <input
                id="createdFromAt"
                data-testid="createdFromAt"
                type="text"
                v-model="form.createdFromAt"
                autocomplete="off"
              />

              <label for="createdToAt">{{ t('admin.user.filter.createdToAt') }}:</label>
              <input
                id="createdToAt"
                data-testid="createdToAt"
                type="text"
                v-model="form.createdToAt"
                autocomplete="off"
              />

              <label for="locked">{{ t('admin.user.filter.locked') }}:</label>
              <input id="locked" data-testid="locked" type="checkbox" v-model="form.locked" autocomplete="off" />
            </div>
          </div>

          <button type="submit" :disabled="isLoading">
            {{ isLoading ? t('admin.user.filter.buttonBusy') : t('admin.user.filter.button') }}
          </button>
        </form>
      </div>
    </template>
    <template #tablePanel>
      <div class="spinner-container" v-if="isLoading">
        <SpinnerTorus data-testid="spinner" display="block" size="100px" :canSpin="canSpin" />
      </div>
      <div v-if="!isLoading">
        <TablePage v-model="selRecord" :columns="userTableColumns" :data="table.entries" />
      </div>
    </template>
    <template #entryEditor> ENTRY EDITOR PANEL </template>
  </TableWrapper>
</template>

<style scoped></style>
