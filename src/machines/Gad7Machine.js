import { setup, assign, sendParent } from 'xstate';
import { values, reduce, set } from 'lodash';

const defaultFormState = {
  survey: {},
  score: '',
  how_difficult: null,
  severity: '',
};

function calculateScore(survey) {
  const scores = values(survey);
  return reduce(scores, (score, value) => score + parseInt(value, 10), 0);
}

function calculateSeverity(score) {
  if (score < 5) return 'Minimal Anxiety';
  if (score < 10) return 'Mild Anxiety';
  if (score < 15) return 'Moderate Anxiety';
  return 'Severe Anxiety';
}

const formFieldEffects = {
  survey: (formState) => {
    const score = calculateScore(formState.survey);
    const severity = calculateSeverity(score);

    return {
      ...formState,
      score,
      severity,
    };
  },
};

export const gadTabMachine = setup({
  actions: {
    updateField: assign(({ context, event }) => {
      const formState = { ...context.formState };

      set(formState, event.key, event.value);

      const updater = formFieldEffects[event.key.split('.')[0]];

      if (updater) {
        return { formState: updater(context.formState, event.value, event.key) };
      }

      return { formState };
    }),

    notifyParent: sendParent(({context, self }) => ({
      type: 'form.dataUpdated',
      data: { [self.id]: context.formState },
    })),

    setData: assign(({  context, event }) => {
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
  },
}).createMachine({
  id: 'gad',
  context: ({ input }) => ({
    formState: { ...defaultFormState, ...(input?.formState || {}) },
  }),
  initial: 'editing',
  states: {
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
