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
  <TabGroup langPrefix="admin.user.tabs">
    <template #main>
      <AdminUserMain v-model="selUserRecord" />
    </template>
    <template #history>
      <AdminUserHistory v-model="selUserRecord" />
    </template>
    <template #permissions>
      <AdminUserPermissions v-model="selUserRecord" />
    </template>
    <template #config>
      <AdminUserConfig v-model="selUserRecord" />
    </template>
    <template #tokens>
      <AdminUserTokens v-model="selUserRecord" />
    </template>
    <template #jwt>
      <AdminUserJwt v-model="selUserRecord" />
    </template>
  </TabGroup>
</template>

<style scoped></style>
