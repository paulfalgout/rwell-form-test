<template>
  <div class="rounded-lg border border-gray-200 p-4 mb-3">
    <FormKit
      type="group"
      :disabled=" isReadOnly "
    >
      <h2 class="text-lg font-semibold mb-4">Patient Information</h2>
      <div class="space-y-4 w-full">
        <FormKit
          type="text"
          name="name"
          label="Patient Name"
          :value=" formState.name "
          @change="handleFieldUpdate('name', $event.target.value)"
          :disabled=" isReadOnly "
        />
        <FormKit
          type="date"
          name="dob"
          label="Birth Date"
          :value=" formState.dob "
          @change="handleFieldUpdate('dob', $event.target.value)"
          :disabled=" isReadOnly "
        />
        <FormKit
          type="text"
          name="mrn"
          label="MRN"
          :value=" formState.mrn "
          @change="handleFieldUpdate('mrn', $event.target.value)"
          :disabled=" isReadOnly "
        />

        <!-- Phone Numbers -->
        <ContactList
          :items=" formState.phones "
          :labels=" phoneLabels "
          :errors=" validationState.phones "
          field-key="phones"
          list-name="phones"
          legend="Phone Numbers"
          input-type="text"
          input-label="Number"
          input-placeholder="+1 (###) ###-####"
          @update=" handleFieldUpdate "
          @remove=" openConfirmationModal "
        />

        <!-- Email Addresses -->
        <ContactList
          :items=" formState.emails "
          :labels=" emailLabels "
          :errors=" validationState.emails "
          field-key="emails"
          list-name="emails"
          legend="Email Addresses"
          input-type="email"
          input-label="Address"
          @update=" handleFieldUpdate "
          @remove=" openConfirmationModal "
        />
      </div>
    </FormKit>

    <ConfirmationModal
      v-if="isModalOpen"
      title="Confirm Removal"
      :message=" confirmMsg "
      @confirm=" confirmRemoveItem "
      @cancel=" closeConfirmationModal "
    />
  </div>
</template>

<script setup>
  import { useSelector } from '@xstate/vue';
  import ContactList from './ContactList.vue';
  import ConfirmationModal from '../shared/components/ConfirmationModal.vue';
  import { ref, computed } from 'vue';
  import { getNode } from '@formkit/core';

  const props = defineProps({
    actor: Object,
  });

  const modalState = ref({
    isOpen: false,
    itemIndex: null,
    listName: null,
    listValue: null,
    displayValue: null,
  });

  const confirmMsg = computed(() => {
    const { listName, displayValue } = modalState.value;
    if (displayValue && listName === 'phones') return `Are you sure you want to remove phone number ${ displayValue }?`;
    if (displayValue && listName === 'emails') return `Are you sure you want to remove email address ${ displayValue }?`;
    return 'Are you sure you want to remove this item?';
  });

  const send = props.actor.send;
  const formState = useSelector(props.actor, s => s.context.formState);
  const validationState = useSelector(props.actor, s => s.context.validationState);
  const isReadOnly = useSelector(props.actor, s => s.hasTag('form-view-only'));

  const handleFieldUpdate = (key, value) => {
    send({ type: 'form.updateField', key, value });
  };

  const phoneLabels = ['Mobile', 'Home', 'Work'];
  const emailLabels = ['Home', 'Work', 'Other'];

  const openConfirmationModal = (index, listName, listValue, displayValue) => {
    modalState.value = {
      isOpen: true,
      itemIndex: index,
      listName,
      listValue,
      displayValue,
    };
  };

  const confirmRemoveItem = () => {
    const { listName, listValue, itemIndex } = modalState.value;
    const node = getNode(listName);
    node.input(listValue.filter((_, i) => i !== itemIndex));
    closeConfirmationModal();
  };

  const closeConfirmationModal = () => {
    modalState.value = {
      isOpen: false,
      itemIndex: null,
      listName: null,
      listValue: null,
      displayValue: null,
    };
  };

  // Computed properties for modal
  const isModalOpen = computed(() => modalState.value.isOpen);
</script>
