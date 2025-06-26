import { setup, assign, sendParent } from 'xstate';
import { set } from 'lodash';

const defaultOrchestrator = {
  defaultFormState: {},
  updateField: (context, event) => {
    return;
  },
  validateField: (context, event) => {
    return;
  },
};

export function createChildFormMachine({ orchestrator = defaultOrchestrator, id = 'child-form-machine', bridge } = {}) {
  return setup({
    guards: {
      isEditable: ({ context }) => context.isEditable,
    },
    actions: {
      updateField: assign(({ context, event }) => {
        const formStateUpdated = orchestrator.updateField(context, event);

        if (formStateUpdated) return { formState: formStateUpdated };

        const formState = { ...context.formState };

        set(formState, event.key, event.value);
        console.log('formState:', formState);
        return { formState };
      }),

      validateField: assign(({ context, event }) => {
        const validationStateUpdated = orchestrator.validateField(context, event);

        if (validationStateUpdated) return { validationState: validationStateUpdated };

        const validationState = { ...context.validationStateUpdated };

        set(validationState, event.key, event.value);
        console.log('validationState:', validationState);
        return { validationState };
      }),

      notifyParent: sendParent(({ context, self }) => ({
        type: 'form.dataUpdated',
        data: { [self.id]: { ...context.formState, validationState: context.validationState } },
      })),
    },
  }).createMachine({
    id,
    context: ({ input }) => ({
      isEditable: input.isEditable,
      formState: { ...orchestrator.defaultFormState, ...(input?.formState || {}) },
      validationState: input?.formState || {},
    }),
    initial: 'initializing',
    states: {
      initializing: {
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
        on: {
          'form.updateField': {
            actions: ['updateField', 'validateField', 'notifyParent'],
          },
        },
      },
    },
  });
};