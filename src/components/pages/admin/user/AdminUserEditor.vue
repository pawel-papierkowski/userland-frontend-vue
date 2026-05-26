<script setup lang="ts">
/**
 * View/edit of single, selected user.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { useI18n } from 'vue-i18n';

import type { UserTableEntry } from '@/code/data/features/user/admin-user.ts';
import { enUserStatus } from '@/code/data/features/user/user-const.ts';

import ComboBox from '@/components/base/inputs/ComboBox.vue';

const { t } = useI18n();

const selRecord = defineModel<UserTableEntry|null>();

</script>

<template>
  ADMIN USER EDIT PLACEHOLDER
</template>

<style scoped></style>
