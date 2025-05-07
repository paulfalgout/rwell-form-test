<template>
  <div class="form p-4 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">XState Form Tester</h1>

    <div class="flex space-x-2 mb-4">
      <template v-for="tabKey in tabOrder" :key="tabKey">
        <button
          v-if="tabActors[tabKey]"
          @click="currentTab = tabKey"
          class="px-4 py-2 rounded border"
          :class="{
            'bg-blue-600 text-white': currentTab === tabKey,
            'bg-gray-100': currentTab !== tabKey,
          }"
        >
          {{ getTabLabel(tabKey) }}
        </button>
      </template>
    </div>

    <div v-if="currentTab" class="border rounded p-4 shadow">
      <SessionForm
        v-if="currentTab.startsWith('session-')"
        :key="currentTab"
        :actor="tabActors[currentTab]"
      />
      <Gad7Form
        v-if="currentTab === 'gad'"
        :actor="tabActors[currentTab]"
      />
      <Referrals
        v-if="currentTab === 'referrals'"
        :actor="tabActors[currentTab]"
      />
    </div>

    <button
      @click="send({ type: 'form.submit' })"
      :disabled="!snapshot.can({ type: 'form.submit' })"
      class="mt-6 px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
    >
      Submit Form
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useMachine } from '@xstate/vue';
import { formMachine } from '@/machines/FormMachine';
import { createBrowserInspector } from '@statelyai/inspect';
import formData from '@/static/init-data';
import formState from '@/static/init-state';
import SessionForm from '@/components/SessionForm.vue';
import Gad7Form from '@/components/Gad7Form.vue';
import Referrals from '@/components/Referrals.vue';

const { inspect } = createBrowserInspector();
const { snapshot, send } = useMachine(formMachine, { inspect, input: { formData, formState } });

const currentTab = ref(null);

const tabActors = computed(() => snapshot.value.context.tabActors);
const tabOrder = snapshot.value.context.tabOrder;
currentTab.value = tabOrder[0]


function getTabLabel(key) {
  if (key === 'gad') return 'GAD-7';
  if (key === 'referrals') return 'Referrals';

  const index = key.split('-')[1];
  return `Session ${index}`;
}
</script>
