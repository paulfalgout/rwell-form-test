<template>
  <div id="app">
    <div class="form p-4 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-4">XState Form Example</h1>
      <p
        v-if="snapshot.context.error"
        class="text-red-600 bg-red-50 p-3 rounded border-l-4 border-red-400 mb-4"
      >
        {{ snapshot.context.error }}
      </p>
      <FormKit
        type="form"
        @submit=" handleSubmit "
        :disabled=" snapshot.matches('submitted') "
      >
        <PatientInformationForm
          v-if="patientInformationActor"
          :actor=" patientInformationActor "
        />
      </FormKit>
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

  const { snapshot, send } = useMachine(formMachine, { inspect, input: { responseId } });

  const patientInformationActor = computed(() => snapshot.value.children.patientInformation);

  const handleSubmit = () => {
    send({ type: 'form.submit' });
  }

</script>
