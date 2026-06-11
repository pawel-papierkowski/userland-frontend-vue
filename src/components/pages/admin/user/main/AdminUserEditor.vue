<script setup lang="ts">
/** View/edit of single, selected user.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { shallowRef } from 'vue';
import type { Component } from 'vue';
import { useI18n } from 'vue-i18n';

import type { TabData } from '@/code/data/features/common/type.ts';
import type { UserTableEntry } from '@/code/data/features/user/admin-user-type.ts';

import AdminUserMain from '@/components/pages/admin/user/main/AdminUserMain.vue';
import AdminUserHistory from '@/components/pages/admin/user/history/AdminUserHistory.vue';
import AdminUserPermissions from '@/components/pages/admin/user/permissions/AdminUserPermissions.vue';
import AdminUserConfig from '@/components/pages/admin/user/config/AdminUserConfig.vue';
import AdminUserTokens from '@/components/pages/admin/user/tokens/AdminUserTokens.vue';
import AdminUserJwt from '@/components/pages/admin/user/jwt/AdminUserJwt.vue';

const { t } = useI18n();

const selRecord = defineModel<UserTableEntry | null>();

const activeTab: Component = shallowRef(AdminUserMain);
const tabs: TabData[] = [
  { id: 'main', label: 'admin.user.main.tab', component: AdminUserMain },
  { id: 'history', label: 'admin.user.history.tab', component: AdminUserHistory },
  { id: 'permissions', label: 'admin.user.permissions.tab', component: AdminUserPermissions },
  { id: 'config', label: 'admin.user.config.tab', component: AdminUserConfig },
  { id: 'tokens', label: 'admin.user.tokens.tab', component: AdminUserTokens },
  { id: 'jwt', label: 'admin.user.jwt.tab', component: AdminUserJwt },
];

/**
 * Select given tab, making it active.
 * @param tab Tab to use.
 */
const selectTab = (tab: TabData) => {
  activeTab.value = tab.component;
};

/**
 * Determine CSS classes that this tab header should have.
 * @param tab Tab to use.
 */
const resolveClass = (tab: TabData) => {
  return {
    active: activeTab.value === tab.component,
  };
};
</script>

<template>
  <div class="tab-wrapper">
    <div class="tab-header">
      <div v-for="tab in tabs" :key="tab.id" class="tab-entry" :class="resolveClass(tab)" @click="selectTab(tab)">
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
  display: flex;
  flex-direction: column;
}

.tab-header {
  display: flex;

  margin-bottom: var(--spacing-sm);
}

.tab-entry {
  margin: 0px var(--spacing-xs);
  cursor: pointer;
}

.tab-entry.active {
  border-bottom: 2px solid var(--color-text-primary);
  font-weight: bold;
}

.tab-content {
}
</style>
