import { setup, assign, fromPromise } from 'xstate';
import { gadTabMachine } from '@/libs/gad7/gad7.machine';
import * as gad from '@/libs/gad7/utils';
import { IframeBridge } from '@/libs/shared/utils/iframe-bridge';

const bridge = new IframeBridge();

function spawnGad7(spawnFn, formState) {
  return spawnFn(gadTabMachine, {
    id: 'gad',
    input: { formState: formState.gad || {} },
  });
}

const GAD_KEY = 'gad7';

export const formMachine = setup({
  actors: {
    submitForm: fromPromise(async ({ input }) => {
      console.log('Submitting form with input:', input);
      const { formState } = input;
      let formData = {};
      console.log('pre-serialize')
      formData = gad.serialize({ formState, formData, key: GAD_KEY });
      console.log('Submitting form with formState:', { formState, formData });
      return bridge.submitForm(formState, formData);
    }),
    loadForm: fromPromise(async ({ input }) => {
      console.log('Loading form data with input:', input);
      if (input?.responseId) {
        return bridge.fetchFormResponse(input.responseId);
      }
      return bridge.fetchFormData();
    }),
  },
  actions: {
    ingestLoadedForm: assign(({ context, event }) => {
      const { formState, formData } = event.output || {};
      console.log('Loaded form data:', context, event);
      return {
        formState: { ...context.formState, ...(formState || {}) },
        formData : { ...context.formData , ...(formData  || {}) },
      };
    }),
    updateData: assign(({ context, event }) => {
      console.log('Updating form data with event:', event);
      const formState = {
        ...context.formState,
        ...event.data,
      };

      return { formState };
    }),
    handleError: assign(({ event }) => ({
      error: event.data,
    })),
    initialize: assign(({ context, spawn }) => {
      console.log('Initializing form with context:', context);
      const formState = {
        ...context.formState,
        gad: gad.deserialize({
          ...context,
          key: GAD_KEY,
        }),
      };

      const gadActor = spawnGad7(spawn, formState);

      return { formState, gadActor };
    }),
    ready() {
      bridge.send('ready:form');
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QDMCuAbdAxA9gJwFsA6AIxxwBcBLAOygGIBtABgF1FQAHHWK6nGhxAAPRACYALADYiATgkBWAMwBGMQoA0IAJ7iA7AqJjmq9QF8zWtJlyEieMAEMI2+snzEIjio4CqnLwpIFnYkEG5efkEw0QQFeTk9KQUpdS1dBBU9ZiIlWXyADgk9CTUVZnkLKwxsD3snFzc62FQSAj4QoQi+KgEhWIklAqIipQN0xBVVIwUqkGtauxa2vmo6eggBMCJaADccAGtthdtiZfaKNagEPZwAY29emhDOsO6o-vFpOUVTTR1EAUlEQDHMTs1WhcrvQwHg8PgiJx0N53HZwUtIataNdbg8oi82F0eD0+jEvjJ5Mo1P8MioCioQbM5jQcBA4EJ0QQiZEnp8EABaKQTAVSME1U6kchXbkk6KgAZiYXqHLZP5imx1BzODJcYkfMkIKQSMQjSl-JV6BkFKnmSzzcUQlaXbEy-XyxB6PQjApielpAGZZjDW3VDUYp1BCCu3kG1ImrKyKQFcYB+lEJkWIA */
  id: 'example-form',
  context: ({ input }) => ({
    formState: input?.formState ||  {},
    formData: input?.formData || {},
    responseId: input?.responseId || null,
    gadActor: null,
    error: null,
  }),
  initial: 'loading',
  states: {
    loading: {
      invoke: {
        src: 'loadForm',
        input: ({ context }) => ({ responseId: context.responseId }),
        onDone: {
          actions: 'ingestLoadedForm',
          target: 'initializing',
        },
        onError: {
          actions: 'handleError',
        },
      },
    },
    initializing: {
      entry: 'initialize',
      always: 'ready',
    },
    ready: {
      entry: 'ready',
      on: {
        'form.dataUpdated': {
          actions: 'updateData',
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
          actions: 'handleError',
        },
      },
    },
    submitted: {
      type: 'final',
    },
  },
});
