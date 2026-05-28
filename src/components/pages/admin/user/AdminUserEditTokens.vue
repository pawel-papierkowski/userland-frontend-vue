<script setup lang="ts">
/**
 * View of user's tokens.
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
  ADMIN USER TOKENS PLACEHOLDER
</template>

<style scoped></style>
