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

export const createReferralFormMachine = ({ index }) =>
  setup({
    actions: {
      updateField: assign(({ context, event }) => {
        const updater = fieldReactions[event.key];

        if (updater) {
          return { formState: updater(context.formState, event.value) };
        }

        return {
          formState: {
            ...context.formState,
            [event.key]: event.value,
          },
        };
      }),

      notifyParent: sendParent(({context }) => ({
        type: 'form.dataUpdated',
        data: context.formState,
      })),
    },
    guards: {
      hasPatientReferred: ({ context }) => {
        const reason = context.formState.primary_reason;
        return !!referrals[reason]?.patient_referred;
      },
      hasChiefComplaint: ({ context }) => {
        const reason = context.formState.primary_reason;
        return !!referrals[reason]?.chief_complaint;
      },
      hasCallback: ({ context }) => {
        const reason = context.formState.primary_reason;
        return !!referrals[reason]?.callback;
      },
      hasNotes: ({ context }) => {
        const reason = context.formState.primary_reason;
        return !!referrals[reason]?.notes;
      },
    },
  }).createMachine({
    id: `referralForm-${ index }`,
    context: ({ input }) => ({
      formState: { ...defaultReferral, ...(input?.formState || {}) },
    }),
    initial: 'idle',
    states: {
      idle: {
        always: [
          {
            target: 'configured',
            cond: ({ context }) => !!context.formState.primary_reason,
          },
          { target: 'editing' },
        ],
      },
      editing: {
        tags: ['referral-editing'],
        on: {
          'form.updateField': {
            actions: ['updateField', 'notifyParent'],
            target: 'configured',
            cond: ({ event }) => event.key === 'primary_reason',
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

const fieldReactions = {
  primary_reason: (formState, value) => {
    const preservedDate = formState.referral_date;
    return extend(
      { primary_reason: value, referral_date: preservedDate },
      referrals[value] || {},
    );
  },
};
