<script setup lang="ts">
/** Custom checkbox implementation. Needed because standard HTML <input type="checkbox"> has very bad CSS support.
 *
 * Features:
 * - Accept null (not set) value.
 * - Can disable or mark as invalid.
 * - Keyboard (enter or space) cycles between possible values.
 * - Supports WAI-ARIA.
 *
 * Models:
 * - v-model - Variable holding checkbox value. Must be boolean|null.
 *
 * Properties:
 * - id - Used for identification and id attribute in focusable element (so <label> etc. work properly). Optional.
 * - allowNull - If true, will cycle null value after true and false. Optional, default is false.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 * - invalid - If true, shows component as having invalid state. Visual only. Optional, default is false.
 */

/** Current value of checkbox. */
const currValue = defineModel<boolean | null>({ required: true });

const props = withDefaults(
  defineProps<{
    /** Used for identification and id attribute in focusable element (so <label> etc. work properly). Optional. */
    id?: string;
    /** Does this checkbox allow setting null value? Optional, default is false. */
    allowNull?: boolean;
    /** If true, acts as disabled component. Optional, default is false. */
    disabled?: boolean;
    /** If true, shows component as having invalid state. Visual only. Optional, default is false. */
    invalid?: boolean;
  }>(),
  {
    id: '',
    allowNull: false,
    disabled: false,
    invalid: false,
  },
);

//

/** Cycle through all allowed values. */
const cycle = () => {
  if (props.disabled) return;

  // Order of cycle: true -> false -> null -> true -> etc.
  // Null is skipped if not allowed.
  switch (currValue.value) {
    case null:
      currValue.value = true;
      break;
    case true:
      currValue.value = false;
      break;
    case false:
      currValue.value = props.allowNull ? null : true;
      break;
  }
};

/**
 * Handle keyboard events for accessibility.
 * Space and Enter activate the checkbox.
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    cycle();
  }
};

/**
 * What should be shown as checkbox value?
 * @returns Checkbox character.
 */
const showSymbol = (): string => {
  if (currValue.value === null) return '◼';
  if (currValue.value) return '✔';
  return '';
};
</script>

<template>
  <div class="checkbox-wrapper" :data-testid="`checkbox_${id}`">
    <div
      :id="id"
      class="checkbox"
      :class="{ disabled: disabled, err: invalid }"
      role="checkbox"
      :aria-checked="currValue === null ? 'mixed' : currValue"
      :aria-disabled="disabled || undefined"
      :tabindex="disabled ? -1 : 0"
      @click="cycle()"
      @keydown="handleKeydown"
    >
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

.checkbox.err {
  color: var(--checkbox-err-color);
  background: var(--checkbox-err-background);
  border: var(--checkbox-err-border);
}

.checkbox:hover {
  color: var(--checkbox-hover-color);
  background-color: var(--checkbox-hover-background);
}

.checkbox.disabled {
  color: var(--checkbox-disabled-color);
  background: var(--checkbox-disabled-background);
  border: var(--checkbox-border); /* Override in case both err and disabled are present. */

  cursor: default;
}

/**/

.checkbox-inside {
  line-height: 1;
  transform: translateY(-0.075em);
}
</style>
