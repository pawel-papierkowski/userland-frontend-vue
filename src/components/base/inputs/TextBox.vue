<script setup lang="ts">
/** Custom input type="text" implementation.
 * For now it is just wrapper for actual <input>.
 *
 * Features:
 * - Accept string or null (not set) value.
 * - Can disable or mark as invalid.
 *
 * Models:
 * - v-model - Variable holding text.
 *
 * Properties:
 * - id - Used for identification and id attribute in focusable element (so <label> etc. work properly). Optional.
 * - type - Type of input. Optional, default is 'text'.
 * - required - Is required?
 * - allowPaste - If false, this input does not allow pasting text into field. Optional, default is true.
 * - autocomplete - For autocomplete attribute of <input>. Optional.
 * - placeholder - Shows grayed out text in background of input if null/empty. Optional.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 * - invalid - If true, shows component as having invalid state. Visual only. Optional, default is false.
 */

/** Current value of textbox. */
const currValue = defineModel<string | null>({ required: true });

const props = withDefaults(
  defineProps<{
    /** Used for identification and id attribute in focusable element (so <label> etc. work properly). Optional. */
    id?: string;
    /** Type of input. Optional, default is 'text'. */
    type?: string;
    /** If true, this input has required attribute. Optional, default is false. */
    required?: boolean;
    /** If false, this input does not allow pasting text into field. Optional, default is true. */
    allowPaste?: boolean;
    /** For autocomplete attribute of <input>. Optional. */
    autocomplete?: string;
    /** Shows grayed out text in background of input if null/empty. Optional. */
    placeholder?: string;
    /** If true, acts as disabled component. Optional, default is false. */
    disabled?: boolean;
    /** If true, shows component as having invalid state. Visual only. Optional, default is false. */
    invalid?: boolean;
  }>(),
  {
    id: '',
    type: 'text',
    required: false,
    allowPaste: true,
    placeholder: '',
    disabled: false,
    invalid: false,
  },
);

/**
 * Handle paste event.
 * @param event Event data.
 */
function onPaste(event: ClipboardEvent) {
  if (!props.allowPaste) event.preventDefault();
}
</script>

<template>
  <div class="input-wrapper" :data-testid="`textbox_${id}`">
    <input
      :id="id"
      :data-testid="id"
      :class="{ err: invalid }"
      :type="type"
      v-model="currValue"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :tabindex="disabled ? -1 : 0"
      @paste="onPaste"
    />
  </div>
</template>

<style scoped>
.input-wrapper {
  width: 100%;
}
</style>
