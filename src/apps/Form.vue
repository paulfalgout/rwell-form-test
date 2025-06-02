<template>
  <div id="app">
    <div class="form p-4 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-4">XState Form Example</h1>
      <Gad7Form
        v-if="gadActor"
        :actor="gadActor"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useMachine } from '@xstate/vue';
import { createBrowserInspector } from '@statelyai/inspect';
import orchestrator from './orchestrator';
import { createFormMachine } from '@/libs/shared/base-machines/form.machine';
import Gad7Form from '@/libs/gad7/Gad7Form.vue';
import { getQueryParam } from '@/libs/shared/utils/query';

const { inspect } = createBrowserInspector();

const responseId = getQueryParam('responseId');
const formMachine = createFormMachine({ orchestrator });

const { snapshot } = useMachine(formMachine, { inspect, input: { responseId } });

const gadActor = computed(() => snapshot.value.children.gad7);
</script>
