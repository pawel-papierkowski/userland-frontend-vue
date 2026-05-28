<script setup lang="ts">
/**
 * View/edit of user's permissions. Only admin can edit permissions.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { useI18n } from 'vue-i18n';

import type { UserTableEntry } from '@/code/data/features/user/admin-user.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

const { t } = useI18n();

const selRecord = defineModel<UserTableEntry|null>();

</script>

<template>
  ADMIN USER PERMISSIONS PLACEHOLDER
</template>

<style scoped></style>
