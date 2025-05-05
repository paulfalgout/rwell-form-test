import { setup, assign } from 'xstate';
import { values, reduce } from 'lodash';

const defaultFormState = {
  survey: {},
  score: '',
  how_difficult: null,
  severity: '',
};

function getGadScore(survey) {
  const scores = values(survey);
  return reduce(scores, (score, value) => score + parseInt(value, 10), 0);
}

function getGadSeverity(score) {
  if (score < 5) return 'Minimal Anxiety';
  if (score < 10) return 'Mild Anxiety';
  if (score < 15) return 'Moderate Anxiety';
  return 'Severe Anxiety';
}

const formFieldEffects = {
  survey: (formState, value) => {
    const score = getGadScore(value);
    const severity = getGadSeverity(score);
    return {
      ...formState,
      survey: value,
      score,
      severity,
    };
  },
};

const { createMachine } = setup({
  actions: {
    updateField: assign(({ context, event }) => {
      const updater = formFieldEffects[event.key];

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

    notifyParent: ({ context, self }) => {
      self.sendParent({
        type: 'form.dataUpdated',
        data: context.formState,
      });
    },

    setData: assign(({ event }) => ({
      formState: { ...defaultFormState, ...event.data },
    })),
  },
});

export const gadTabMachine = createMachine({
  id: 'gad',
  context: ({ input }) => ({
    formState: { ...defaultFormState, ...(input?.formState || {}) },
  }),
  initial: 'editing',
  states: {
    /**
     * Main editable state for GAD-7 tab.
     * Handles field updates and incoming data.
     */
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
