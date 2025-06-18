import { setup, assign, fromPromise, fromCallback, sendTo } from 'xstate';
import { debounce } from 'lodash';
import { IframeBridge } from '@/libs/shared/utils/iframe-bridge';

const bridge = new IframeBridge();

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

const bridgeListener = fromCallback(({ sendBack }) => {
  const unsubmits = [
    bridge.on('form:submit', () => sendBack({ type: 'form.submit' })),
    bridge.on('form:error', (err) => sendBack({ type: 'form.error', data: err })),
  ];

  return () => unsubmits.forEach((unsub) => unsub());
});

const defaultOrchestrator = {
  initialize(context, spawn, bridge) {
    return;
  },

  getFormData(formState) {
    return {};
  },

  updateFormState({ formState }, { data }) {
    return { ...formState, ...data };
  },

  async validateForm(formState) {
    // No validation errors
  },
};


export function createFormMachine({ orchestrator = defaultOrchestrator, id = 'base-form-machine' } = {}) {
  return setup({
    actors: {
      submitForm: fromPromise(async ({ input }) => {
        const { formState } = input;
        const formData = orchestrator.getFormData(formState);
        return bridge.submitForm(formState, formData);
      }),
      validate: fromPromise(async ({ input }) => {
        const { formState } = input;
        return orchestrator.validateForm(formState);
      }),
      loadNewForm: fromPromise(() => bridge.fetchFormData()),
      loadResponseForm: fromPromise(({ input }) => bridge.fetchFormResponse(input.responseId)),
      debounceDraftSave,
      bridgeListener,
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
          formState: formSubmission || {},
          formData: {},
          isReadOnly: true,
        };
      }),
      updateData: assign(({ context, event }) => {
        const formState = orchestrator.updateFormState(context, event);
        return { formState };
      }),
      handleError: assign(({ event }) => ({
        error: event.data,
      })),
      initialize: assign(({ context, spawn, self }) => {
        spawn(debounceDraftSave, {
          id: 'draftSave',
          input: { getContext: () => self.getSnapshot().context },
        });

        spawn(bridgeListener, { id: 'bridgeListener' });

        return orchestrator.initialize(context, spawn, bridge);
      }),
      ready({ context }) {
        if (context.isReadOnly) return false;
        bridge.send('ready:form');
      },
    },
  }).createMachine({
    id,
    context: ({ input }) => ({
      formState: {},
      formData: {},
      responseId: input?.responseId || null,
      isReadOnly: false,
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
            target: 'validating',
          },
          'form:error': {
            actions: 'handleError',
          },
        },
      },
      validating: {
        invoke: {
          src: 'validate',
          input: ({ context }) => ({ formState: context.formState }),
          onDone: {
            target: 'submitting',
            actions: sendTo('draftSave', ({ event }) => event),
          },
          onError: {
            target: 'editing',
            actions: 'handleError',
          },
        }
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
}
