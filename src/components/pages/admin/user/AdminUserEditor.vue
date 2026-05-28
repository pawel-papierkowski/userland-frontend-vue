<script setup lang="ts">
/**
 * View/edit of single, selected user.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { shallowRef } from 'vue';
import type { Component } from 'vue';
import { useI18n } from 'vue-i18n';

import type { TabData } from '@/code/data/features/common.ts';
import type { UserTableEntry } from '@/code/data/features/user/admin-user.ts';

import AdminUserEditMain from '@/components/pages/admin/user/AdminUserEditMain.vue';
import AdminUserEditHistory from '@/components/pages/admin/user/AdminUserEditHistory.vue';
import AdminUserEditPermissions from '@/components/pages/admin/user/AdminUserEditPermissions.vue';
import AdminUserEditConfig from '@/components/pages/admin/user/AdminUserEditConfig.vue';
import AdminUserEditTokens from '@/components/pages/admin/user/AdminUserEditTokens.vue';
import AdminUserEditJwt from '@/components/pages/admin/user/AdminUserEditJwt.vue';

const { t } = useI18n();

const selRecord = defineModel<UserTableEntry|null>();

const activeTab: Component = shallowRef(AdminUserEditMain);
const tabs: TabData[] = [
  { id: 'main', label: 'admin.user.main.tab', component: AdminUserEditMain },
  { id: 'history', label: 'admin.user.history.tab', component: AdminUserEditHistory },
  { id: 'permissions', label: 'admin.user.permissions.tab', component: AdminUserEditPermissions },
  { id: 'config', label: 'admin.user.config.tab', component: AdminUserEditConfig },
  { id: 'tokens', label: 'admin.user.tokens.tab', component: AdminUserEditTokens },
  { id: 'jwt', label: 'admin.user.jwt.tab', component: AdminUserEditJwt }
];

/**
 * Select given tab, making it active.
 * @param tab Tab to use.
 */
const selectTab = (tab: TabData) => {
  activeTab.value = tab.component
}

/**
 * Determine CSS classes that this tab header should have.
 * @param tab Tab to use.
 */
const resolveClass = (tab: TabData) => {
  return {
    'active': activeTab.value === tab.component
  };
}
</script>

<template>
  <div class="tab-wrapper">
    <div class="tab-header">
      <div v-for="tab in tabs" :key="tab.id" class="tab-entry" :class="resolveClass(tab)"
        @click="selectTab(tab)">
        {{ t(tab.label) }}
      </div>
    </div>

    <!-- Dynamic Tab Content -->
    <div class="tab-content">
      <KeepAlive>
        <component :is="activeTab" v-model="selRecord" />
      </KeepAlive>
    </div>
  </div>
</template>

<style scoped>
.tab-wrapper {

}

.tab-header {
  display: flex;

  margin-bottom: 5px;
}

.tab-entry {
  margin: 0px 5px;
  cursor: pointer;
}

.tab-entry.active {
  border-bottom: 2px solid var(--color-primary);
  font-weight: bold;
}

.tab-content {

}

</style>
