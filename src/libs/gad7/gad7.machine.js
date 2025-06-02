
import { values, reduce, set } from 'lodash';
import { createChildFormMachine } from '@/libs/shared/base-machines/child-form.machine';

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
  survey: (formState, surveyItem, key) => {
    set(formState, key, surveyItem);

    const score = calculateScore(formState.survey);
    const severity = calculateSeverity(score);

    return {
      ...formState,
      score,
      severity,
    };
  },
};


const gad7Orchestrator = {
  defaultFormState,
  updateField: (context, event) => {
    const updater = formFieldEffects[event.key.split('.')[0]];

    if (!updater) return;

    return updater({ ...context.formState }, event.value, event.key);
  },
};

export function createGad7Machine({ bridge, orchestrator = gad7Orchestrator, id = 'gad7-machine' }) {
  return createChildFormMachine({ bridge, orchestrator, id });
}
