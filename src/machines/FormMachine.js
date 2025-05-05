import { setup, assign, fromPromise, stopChild } from 'xstate';
import { get, set, find, map, some, times } from 'lodash';
import { referralsTabMachine } from './ReferralsMachine';
import { sessionTabMachine } from './SessionMachine';
import { gadTabMachine } from './Gad7Machine';
import { setGad, loadGad } from '@/utils/gad7';

function spawnSessions(spawnFn, formState) {
  return times(formState.sessionCount +1, index => {
    const id = `session-${ index + 1 }`;
    const isEditable = index === formState.sessionCount;
    return spawnFn(sessionTabMachine, {
      id,
      input: {
        formState: formState[id],
        isEditable,
      },
    });
  });
}

function shouldShowGadTab(formState) {
  return some(formState, { update_gad: true });
}

function spawnGad7(spawnFn, formState) {
  return spawnFn(gadTabMachine, {
    id: 'gad',
    input: { formState: formState.gad || {} },
  });
}

function spawnReferrals(spawnFn, formState) {
  return spawnFn(referralsTabMachine, {
    id: 'referrals',
    input: { formState: formState.referrals || [] },
  });
}

function setReferralList({ formData, formState }) {
  // Store array of referral reasons for evaluations
  const referralList = get(formState, 'referral.referral_list');
  set(formData, 'action.referrals', map(referralList, 'primary_reason'));

  const { callback } = find(referralList, { primary_reason: 'FlexCare' }) || {};
  if (callback) set(formData, 'action.callback_date', callback.date);

  return formData;
}


export const formMachine = setup({
  actors: {
    submitForm: fromPromise(async ({ input }) => {
      const { formState } = input;
      let formData = {};
      formData = setGad({ formState, formData });
      formData = setReferralList({ formState, formData });
      console.log('Submitting...', { formState, formData });
      return Promise.resolve();
    }),
  },
  actions: {
    updateTabData: assign(({ context, spawn, event }) => {
      const formState = {
        ...context.formState,
        ...event.data,
      };

      const gadTabShouldExist = shouldShowGadTab(formState);
      const gadTabExists = !!context.tabActors.gad;

      const tabActors = { ...context.tabActors };

      if (gadTabShouldExist && !gadTabExists) {
        tabActors.gad = spawnGad7(spawn, formState);
      } else if (!gadTabShouldExist && gadTabExists) {
        stopChild('gad');
        delete formState.gad;
        delete tabActors.gad;
      }

      return {
        formState,
        tabActors,
      };
    }),
    handleSubmitError: assign(({ event }) => ({
      error: event.data,
    })),
    initializeTabs: assign(({ context, spawn }) => {
      const formState = {
        ...context.formState,
      };
      formState.sessionCount = (formState.sessionCount || 0) + 1;

      const sessionActors = spawnSessions(spawn, formState);

      const formData = context.formData;

      formState.gad = loadGad({ formState, formData });

      const shouldShowGad = shouldShowGadTab(formState);

      const tabActors = {
        ...(shouldShowGad && {
          gad: spawnGad7(spawn, formState),
        }),
        referrals: spawnReferrals(spawn, formState),
      };

      const tabOrder = [];
      sessionActors.forEach(actor => {
        tabActors[actor.id] = actor;
        tabOrder.push(actor.id);
      });

      return {
        formState,
        tabActors,
        tabOrder: [...tabOrder, 'gad', 'referrals'],
      };
    }),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QDMCuAbdAxA9gJwFsA6AIxxwBcBLAOygGIBtABgF1FQAHHWK6nGhxAAPRACYALADYiATgkBWAMwBGMQoA0IAJ7iA7AqJjmq9QF8zWtJlyEieMAEMI2+snzEIjio4CqnLwpIFnYkEG5efkEw0QQFeTk9KQUpdS1dBBU9ZiIlWXyADgk9CTUVZnkLKwxsD3snFzc62FQSAj4QoQi+KgEhWIklAqIipQN0xBVVIwUqkGtauxa2vmo6eggBMCJaADccAGtthdtiZfaKNagEPZwAY29emhDOsO6o-vFpOUVTTR1EAUlEQDHMTs1WhcrvQwHg8PgiJx0N53HZwUtIataNdbg8oi82F0eD0+jEvjJ5Mo1P8MioCioQbM5jQcBA4EJ0QQiZEnp8EABaKQTAVSME1U6kchXbkk6KgAZiYXqHLZP5imx1BzODJcYkfMkIKQSMQjSl-JV6BkFKnmSzzcUQlaXbEy-XyxB6PQjApielpAGZZjDW3VDUYp1BCCu3kG1ImrKyKQFcYB+lEJkWIA */
  id: 'cbt-form',
  context: ({ input }) => ({
    formState: input?.formState ||  {},
    formData: input?.formData || {},
    tabActors: {},
    error: null,
  }),
  initial: 'initializing',
  states: {
    initializing: {
      entry: 'initializeTabs',
      always: 'ready',
    },
    ready: {
      on: {
        'form.dataUpdated': {
          actions: 'updateTabData',
        },
        'form.submit': 'submitting',
      },
    },
    submitting: {
      invoke: {
        src: 'submitForm',
        input: ({ context: { formState } }) => ({ formState }),
        onDone: {
          target: 'submitted',
        },
        onError: {
          target: 'ready',
          actions: 'handleSubmitError',
        },
      },
    },
    submitted: {
      type: 'final',
    },
  },
});
