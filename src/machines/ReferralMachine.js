import { setup, assign, sendParent } from 'xstate';
import { extend } from 'lodash';
import { referrals } from '@/static/referrals';

const defaultReferral = {
  primary_reason: '',
  referral_date: null,
  notes: {},
  patient_referred: {},
  chief_complaint: {},
  callback: {},
  other_details: '',
  complaint: '',
  callback_date: null,
  notes_value: '',
};

const fieldReactions = {
  primary_reason: (formState, value) => {
    const preservedDate = formState.referral_date;
    return extend(
      { primary_reason: value, referral_date: preservedDate },
      referrals[value] || {},
    );
  },
};

export const createReferralFormMachine = ({ index }) =>
  setup({
    actions: {
      updateField: assign(({ context, event }) => {
        const updater = fieldReactions[event.key];
        return {
          formState: updater
            ? updater(context.formState, event.value)
            : {
                ...context.formState,
                [event.key]: event.value,
              },
        };
      }),

      notifyParent: sendParent(({ context }) => ({
        type: 'referral.updated',
        data: context.formState,
      })),
    },

    guards: {
      hasPrimaryReason: ({ context }) => !!context.formState.primary_reason,
      hasPatientReferred: ({ context }) =>
        !!referrals[context.formState.primary_reason]?.patient_referred,
      hasChiefComplaint: ({ context }) =>
        !!referrals[context.formState.primary_reason]?.chief_complaint,
      hasCallback: ({ context }) =>
        !!referrals[context.formState.primary_reason]?.callback,
      hasNotes: ({ context }) =>
        !!referrals[context.formState.primary_reason]?.notes,
    },
  }).createMachine({
    id: `referralForm-${index}`,
    context: ({ input }) => ({
      formState: { ...defaultReferral, ...(input?.formState || {}) },
    }),
    initial: 'idle',
    states: {
      idle: {
        always: [
          {
            guard: 'hasPrimaryReason',
            target: 'configured',
          },
          {
            target: 'editing',
          },
        ],
      },
      editing: {
        tags: ['referral-editing'],
        on: {
          'form.updateField': {
            guard: ({ event }) => event.key === 'primary_reason',
            target: 'configured',
            actions: ['updateField', 'notifyParent'],
          },
        },
      },
      configured: {
        tags: ['referral-configured'],
        on: {
          'form.updateField': {
            actions: ['updateField', 'notifyParent'],
          },
        },
      },
    },
  });