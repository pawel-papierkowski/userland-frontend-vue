<script setup lang="ts">
/** View/edit of single, selected user.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { watch } from 'vue';

import type { UserTableEntry } from '@/code/data/features/user/admin-user-type.ts';

import { AppUserEventer } from '@/code/stores/events/AppUserEventer.ts';

import TabGroup from '@/components/base/layout/TabGroup.vue';
import AdminUserMain from '@/components/pages/admin/user/main/AdminUserMain.vue';
import AdminUserHistory from '@/components/pages/admin/user/history/AdminUserHistory.vue';
import AdminUserPermissions from '@/components/pages/admin/user/permissions/AdminUserPermissions.vue';
import AdminUserConfig from '@/components/pages/admin/user/config/AdminUserConfig.vue';
import AdminUserTokens from '@/components/pages/admin/user/tokens/AdminUserTokens.vue';
import AdminUserJwt from '@/components/pages/admin/user/jwt/AdminUserJwt.vue';

const selUserRecord = defineModel<UserTableEntry | null>();

//

/** Change in selection. */
watch(selUserRecord, () => {
  AppUserEventer.notifyUserSelected();
});
</script>

<template>
  <TabGroup langPrefix="admin.user.tabs" id="usertab">
    <template #main>
      <AdminUserMain v-model="selUserRecord" :isActive="isActive" />
    </template>
    <template #history="{ isActive }">
      <AdminUserHistory v-model="selUserRecord" :isActive="isActive" />
    </template>
    <template #permissions="{ isActive }">
      <AdminUserPermissions v-model="selUserRecord" :isActive="isActive" />
    </template>
    <template #config="{ isActive }">
      <AdminUserConfig v-model="selUserRecord" :isActive="isActive" />
    </template>
    <template #tokens="{ isActive }">
      <AdminUserTokens v-model="selUserRecord" :isActive="isActive" />
    </template>
    <template #jwt="{ isActive }">
      <AdminUserJwt v-model="selUserRecord" :isActive="isActive" />
    </template>
  </TabGroup>
</template>

<style scoped></style>
