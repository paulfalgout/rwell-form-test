<template>
  <div id="app">
    <div class="form p-4 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-4">XState Form Example</h1>
      <PatientInformationForm
        v-if="patientInformationActor"
        :actor=" patientInformationActor "
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
  import PatientInformationForm from '@/libs/patient_information/PatientInformationForm.vue';

  import { getQueryParam } from '@/libs/shared/utils/query';

  const { inspect } = createBrowserInspector();

  const responseId = getQueryParam('responseId');
  const formMachine = createFormMachine({ orchestrator });

  const { snapshot } = useMachine(formMachine, { inspect, input: { responseId } });

  const patientInformationActor = computed(() => snapshot.value.children.patientInformation);

</script>
