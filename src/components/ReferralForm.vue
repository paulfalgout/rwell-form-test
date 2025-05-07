<template>
    <div class="border p-4 rounded space-y-4 bg-white shadow">
      <FormKit
        type="group"
        :value="formState"
        :disabled="isReadOnly"
        @input="noop"
      >
        <FormKit
          type="select"
          name="primary_reason"
          label="Primary Reason"
          :options="Object.keys(referralOptions)"
          @input="updateField('primary_reason', $event)"
        />

        <FormKit
          type="date"
          name="referral_date"
          label="Referral Date"
          :value="formState.referral_date"
          @input="updateField('referral_date', $event)"
        />

        <FormKit
          v-if="referralOptions[formState.primary_reason]?.chief_complaint"
          type="text"
          name="chief_complaint"
          label="Chief Complaint"
          :value="formState.chief_complaint"
          @input="updateField('chief_complaint', $event)"
        />

        <FormKit
          v-if="referralOptions[formState.primary_reason]?.notes"
          type="textarea"
          name="notes_value"
          label="Referral Notes"
          :value="formState.notes_value"
          @input="updateField('notes_value', $event)"
        />

        <FormKit
          v-if="referralOptions[formState.primary_reason]?.callback"
          type="date"
          name="callback_date"
          label="Callback Date"
          :value="formState.callback_date"
          @input="updateField('callback_date', $event)"
        />
      </FormKit>
    </div>
  </template>

  <script setup>
  import { useSelector } from '@xstate/vue';
  import { referrals as referralOptions } from '@/static/referrals';

  const props = defineProps({
    actor: Object,
  });

  const send = props.actor.send;
  const formState = useSelector(props.actor, s => s.context.formState);
  const isReadOnly = useSelector(props.actor, s => s.hasTag('form-view-only'));

  const updateField = (key, value) => {
    send({ type: 'form.updateField', key, value });
  };

  const noop = () => {}; // prevent @input from complaining when using :value
  </script>