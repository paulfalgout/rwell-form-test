import { setup, assign, fromPromise, fromCallback, sendTo } from 'xstate';
import { debounce } from 'lodash';
import { gadTabMachine } from '@/libs/gad7/gad7.machine';
import * as gad from '@/libs/gad7/utils';
import { IframeBridge } from '@/libs/shared/utils/iframe-bridge';

export const bridge = new IframeBridge();

function spawnGad7(spawnFn, formState, isReadOnly) {
  return spawnFn(gadTabMachine, {
    id: 'gad',
    input: {
      formState: formState.gad || {},
      isEditable: !isReadOnly,
    },
  });
}

const GAD_KEY = 'fields.gad7';

const debounceDraftSave = fromCallback(({ receive, input }) => {
  const { getContext } = input;
  const debounced = debounce(() => {
    const { formState } = getContext();
    bridge.request('update:storedSubmission', formState);
  }, 200);

  receive((event) => {
    if (event.type === 'form.dataUpdated') debounced();
    else if (event.type === 'form.submit') debounced.cancel();
  });

  return () => debounced.cancel();
});

export const formMachine = setup({
  actors: {
    submitForm: fromPromise(async ({ input }) => {
      const { formState } = input;
      let formData = {};
      formData = gad.serialize({ formState, formData, key: GAD_KEY });
      return bridge.submitForm(formState, formData);
    }),
    loadNewForm: fromPromise(async () => {
      return bridge.fetchFormData();
    }),
    loadResponseForm: fromPromise(async ({ input }) => {
      return bridge.fetchFormResponse(input.responseId);
    }),
    debounceDraftSave,
  },
  guards: {
    hasResponseId: ({ context }) => !!context.responseId,
    isEditable: ({ context }) => !context.isReadOnly,
  },
  actions: {
    ingestNewForm: assign(({ event }) => {
      const { formSubmission, storedSubmission, formData, isReadOnly } = event.output || {};
      return {
        formState: storedSubmission || formSubmission,
        formData,
        isReadOnly,
      };
    }),
    ingestResponseForm: assign(({ event }) => {
      const { formSubmission } = event.output || {};
      return {
        formState: formSubmission,
        formData: {},
        isReadOnly: true
      };
    }),
    updateData: assign(({ context, event }) => {
      const formState = {
        ...context.formState,
        ...event.data,
      };
      return { formState };
    }),
    handleError: assign(({ event }) => ({
      error: event.data,
    })),
    initialize: assign(({ context, spawn, self }) => {
      const getContext = () => self.getSnapshot().context;

      const formState = {
        ...context.formState,
        gad: gad.deserialize({
          ...context,
          key: GAD_KEY,
        }),
      };
      const gadActor = spawnGad7(spawn, formState, context.isReadOnly);

      const debounceActor = spawn(debounceDraftSave, {
        id: 'draftSave',
        input: { getContext },
      });

      return { formState, gadActor, debounceActor };
    }),
    ready({ context }) {
      if (context.isReadOnly) return false;
      bridge.send('ready:form');
    },
  },
}).createMachine({
  id: 'example-form',
  context: ({ input }) => ({
    formState: {},
    formData: {},
    responseId: input?.responseId || null,
    isReadOnly: false,
    gadActor: null,
    debounceActor: null,
    error: null,
  }),
  initial: 'decideLoading',
  states: {
    decideLoading: {
      always: [
        { guard: 'hasResponseId', target: 'loadingResponse' },
        { target: 'loadingNew' },
      ],
    },
    loadingResponse: {
      invoke: {
        src: 'loadResponseForm',
        input: ({ context }) => ({ responseId: context.responseId }),
        onDone: {
          actions: 'ingestResponseForm',
          target: 'initializing',
        },
        onError: {
          actions: 'handleError',
        },
      },
    },
    loadingNew: {
      invoke: {
        src: 'loadNewForm',
        onDone: {
          actions: 'ingestNewForm',
          target: 'initializing',
        },
        onError: {
          actions: 'handleError',
        },
      },
    },
    initializing: {
      entry: 'initialize',
      always: [
        { target: 'editing', guard: 'isEditable' },
        { target: 'viewing' },
      ],
    },
    viewing: {
      tags: ['form-view-only'],
    },
    editing: {
      tags: ['form-editable'],
      entry: 'ready',
      on: {
        'form.dataUpdated': {
          actions: [
            'updateData',
            sendTo('draftSave', ({ event }) => event),
          ],
        },
        'form.submit': {
          target: 'submitting',
          actions: sendTo('draftSave', ({ event }) => event),
        },
        'form:error': {
          actions: 'handleError',
        },
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
          target: 'editing',
          actions: 'handleError',
        },
      },
    },
    submitted: {
      type: 'final',
    },
  },
});
