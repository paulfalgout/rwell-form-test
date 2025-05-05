import { setup, assign, sendParent } from 'xstate';

const defaultFormState = {
  date: null,
  session_number: null,
  appointment_duration: null,
  reason_or_stressors: '',
  patient_presentation: '',
  interventions_discussed: [],
  other_details: '',
  techniques_used: '',
  patient_response: '',
  progress_and_outcomes: '',
  update_gad: null,
  gad_notes: '',
  reported_suicidal_thoughts: null,
  stanley_brown_notes: '',
  homework_assignments: '',
  next_session_plan: '',
  additional_notes: '',
};

export const sessionTabMachine = setup({
  guards: {
    isEditable: ({ context }) => context.isEditable,
  },
  actions: {
    notifyParent: sendParent(({context, self }) => ({
      type: 'form.dataUpdated',
      data: { [self.id]: context.formState },
    })),

    setData: assign(({ event }) => ({
      formState: { ...defaultFormState, ...event.data },
    })),
  },
}).createMachine({
  id: 'session',
  context: ({ input }) => ({
    isEditable: input.isEditable,
    formState: { ...defaultFormState, ...(input.formState || {}) },
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
          actions: ['updateField', 'notifyParent'],
        },
        'form.setData': {
          actions: ['setData', 'notifyParent'],
        },
      },
    },
  },
});
