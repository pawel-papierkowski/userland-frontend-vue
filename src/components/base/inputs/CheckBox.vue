<script setup lang="ts">
/**
 * Custom checkbox implementation.
 *
 * Features:
 * - Accept null (not set) value.
 *
 * Models:
 * - v-model - Variable holding checkbox value. Must be boolean|null.
 *
 * Properties:
 * - allowNull - If true, will cycle null value after true and false. Optional, default is false.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 */
const currValue = defineModel<boolean | null>({ required: true });

const props = withDefaults(defineProps<{
  /** Does this checkbox allow setting null value? */
  allowNull?: boolean;
  /**  If true, acts as disabled component. Optional, default is false. */
  disabled?: boolean;
}>(), {
  allowNull: false,
  disabled: false
});

//

/** Cycle through all allowed values. */
const cycle = () => {
  if (props.disabled) return;

  switch (currValue.value) {
    case null: currValue.value = true; break;
    case true: currValue.value = false; break;
    case false: currValue.value = props.allowNull ? null : true; break;
  }
}

/**
 * What should be shown as checkbox value?
 * @returns Checkbox character.
 */
const showSymbol = (): string => {
  if (currValue.value === null) return '◼';
  if (currValue.value) return '✔';
  return ' ';
};
</script>

<template>
  <div class="checkbox-wrapper">
    <div class="checkbox" :class="{ disabled: disabled }" @click="cycle()">
      <div class="checkbox-inside">
        {{ showSymbol() }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkbox-wrapper {
  display: inline-flex;
  align-items: left;
  justify-content: left;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  color: var(--checkbox-color);
  background: var(--checkbox-background);
  border: var(--checkbox-border);
  border-radius: var(--checkbox-border-radius);

  width: 1em;
  height: 1em;

  cursor: pointer;
  user-select: none;
}

.checkbox:hover {
  color: var(--checkbox-hover-color);
  background-color: var(--checkbox-hover-background);
}

.checkbox-wrapper.err .checkbox {
  color: var(--checkbox-err-color);
  background: var(--checkbox-err-background);
  border: var(--checkbox-err-border);
}

.checkbox.disabled {
  color: var(--checkbox-disabled-color);
  background: var(--checkbox-disabled-background);

  cursor: default;
}

/**/

.checkbox-inside {
  line-height: 1;
  transform: translateY(-0.075em);
}
</style>
