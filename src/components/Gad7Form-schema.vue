<template>
  <div>
    <FormKit type="group" :disabled="isReadOnly" :value="formState">
      <FormKitSchema v-if="schema" :schema="schema" :data="formState" />
    </FormKit>
  </div>
</template>

<script setup>
import { useSelector } from '@xstate/vue';
import { gad7Schema } from '@/schemas/gad7';
import { ref, watchEffect } from 'vue';

const props = defineProps({
  actor: Object,
});

const send = props.actor.send;
const formState = useSelector(props.actor, s => s.context.formState);
const isReadOnly = useSelector(props.actor, s => s.hasTag('form-view-only'));

const handleFieldUpdate = (key, value) => {
  send({
    type: 'form.updateField',
    key,
    value,
  });
};

const schema = ref();

watchEffect(() => {
  if (formState.value) {
    schema.value = gad7Schema(formState.value, handleFieldUpdate);
  }
});
</script>