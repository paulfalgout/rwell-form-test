<template>
  <div id="app">
    <div class="form p-4 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-4">XState Form Example</h1>
      <Gad7Form
        v-if="gadActor"
        :actor="gadActor"
      />
      <button
        @click="send({ type: 'form.submit' })"
        :disabled="!snapshot.can({ type: 'form.submit' })"
        class="mt-6 px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        Submit Form
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useMachine } from '@xstate/vue';
import { formMachine } from './form.machine';
import { createBrowserInspector } from '@statelyai/inspect';
import Gad7Form from '@/libs/gad7/Gad7Form.vue';
import { getQueryParam } from '@/libs/shared/utils/query';

const responseId = getQueryParam('responseId');
console.log('Response ID:', responseId);
const { inspect } = createBrowserInspector();
const { snapshot, send } = useMachine(formMachine, { inspect, input: { responseId } });

const gadActor = computed(() => snapshot.value.context.gadActor);
</script>
