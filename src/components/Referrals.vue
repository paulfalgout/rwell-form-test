<template>
    <div>
      <h2 class="text-xl font-bold mb-4">Navigation Referrals</h2>

      <div
        v-for="(actor, index) in referralActors"
        :key="actor.id || index"
        class="relative border rounded p-4"
      >
        <ReferralForm :actor="actor" />

        <button
          @click="removeReferral(index)"
          class="absolute top-2 right-2 text-sm text-red-600"
        >
          Remove
        </button>
      </div>

      <button
        @click="addReferral"
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + Add Additional Referral
      </button>
    </div>
  </template>

  <script setup>
  import { useSelector } from '@xstate/vue';
  import ReferralForm from './ReferralForm.vue';

  const props = defineProps({
    actor: Object,
  });

  const send = props.actor.send;

  const referralActors = useSelector(
    props.actor,
    state => state.context.referralActors
  );

  function addReferral() {
    send({ type: 'referral.add' });
  }

  function removeReferral(index) {
    send({ type: 'referral.remove', index });
  }
  </script>