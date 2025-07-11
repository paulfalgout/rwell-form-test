<template>
  <div class="rounded-lg border border-gray-200 p-4 mb-3">
    <FormKit
      type="group"
      :disabled=" isReadOnly "
    >
      <h2 class="text-lg font-semibold mb-4">Insurance Information</h2>
      <div class="space-y-4 w-full">
        <FormKit
          type="select"
          name="employer"
          label="Employer"
          :value=" formState.employer "
          :options=" employers "
          @change="handleFieldUpdate('employer', $event.target.value)"
          :disabled=" isReadOnly "
        />
      </div>
    </FormKit>
  </div>
</template>

<script setup>
  import { useSelector } from '@xstate/vue';
  import { employers } from './utils';

  const props = defineProps({
    actor: Object,
  });

  const send = props.actor.send;
  const formState = useSelector(props.actor, s => s.context.formState);
  console.log('🚀 ~ formState(insurance):', formState);
  const isReadOnly = useSelector(props.actor, s => s.hasTag('form-view-only'));

  const handleFieldUpdate = (key, value) => {
    console.log(`🚀 ~ handleFieldUpdate ~ { type: 'form.updateField', key, value }:`, { type: 'form.updateField', key, value });
    send({ type: 'form.updateField', key, value });
  };
</script>
