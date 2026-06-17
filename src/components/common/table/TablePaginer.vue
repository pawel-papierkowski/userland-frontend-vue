<script setup lang="ts">
/** Bar that contains paging options like arrows, page number etc.
 *
 * Properties:
 * - meta - Table metadata.
 * - isDisabled - If true, disable paginer. Optional.
 */
import { ref, watch } from 'vue';
import type { TableMetaResp } from '@/code/data/features/common/type.ts';

const currPage = defineModel<number>('currPage', { required: true }); // Currently selected page.

const props = withDefaults(defineProps<{
  meta: TableMetaResp;
  isDisabled?: boolean;
}>(), {
  isDisabled: false,
});

/** Local page number. This is number shown in input (1-indexed). */
const localPage = ref(currPage.value + 1);

//

/** Sync local page number when model changes (like clicking on arrows). */
watch(currPage, (newVal) => {
  localPage.value = newVal + 1;
});

//

/** Update model from local page value. */
const applyPage = () => {
  if (props.isDisabled || props.meta.pageCount === 0) return;

  let page = Number(localPage.value) - 1;
  if (isNaN(page)) {
    localPage.value = currPage.value + 1;
    return;
  }
  if (page < 0) page = 0;
  if (page >= props.meta.pageCount) page = props.meta.pageCount - 1;

  currPage.value = page;
  localPage.value = page + 1; // Ensure input shows clamped value
};

/** Go to first page of results. */
const goFirstPage = () => {
  if (props.isDisabled || currPage.value === 0) return;
  currPage.value = 0;
};
/** Go to previous page of results. */
const goPrevPage = () => {
  if (props.isDisabled || currPage.value === 0) return;
  currPage.value--;
};
/** Go to next page of results. */
const goNextPage = () => {
  if (props.isDisabled || currPage.value === props.meta.pageCount - 1) return;
  currPage.value++;
};
/** Go to last page of results. */
const goLastPage = () => {
  if (props.isDisabled || currPage.value === props.meta.pageCount - 1) return;
  currPage.value = props.meta.pageCount - 1;
};

/** Style of first/previous page button. */
const stylePrevPage = () => {
  return {
    disabled: props.isDisabled || currPage.value === 0 || props.meta.pageCount === 0,
  };
};
/** Style of next/last page button. */
const styleNextPage = () => {
  return {
    disabled: props.isDisabled || currPage.value === props.meta.pageCount - 1 || props.meta.pageCount === 0,
  };
};

/** Is input disabled? */
const pageInputDisabled = () => {
  return props.isDisabled || props.meta.pageCount === 0;
};
</script>

<template>
  <div class="table-paginer">
    <div class="table-paginer-side"></div>
    <div class="table-paginer-navbtn" :class="stylePrevPage()" @click="goFirstPage()">⏮️</div>
    <div class="table-paginer-navbtn" :class="stylePrevPage()" @click="goPrevPage()">◀️</div>
    <div class="table-paginer-entry">
      <input
        type="number"
        v-model="localPage"
        class="input-paginer"
        :disabled="pageInputDisabled()"
        min="1"
        :max="meta.pageCount"
        @blur="applyPage"
        @keyup.enter="applyPage"
      />
      / {{ meta.pageCount }}
    </div>
    <div class="table-paginer-navbtn" :class="styleNextPage()" @click="goNextPage()">▶️</div>
    <div class="table-paginer-navbtn" :class="styleNextPage()" @click="goLastPage()">⏭️</div>
    <div class="table-paginer-side"></div>
  </div>
</template>

<style scoped></style>
