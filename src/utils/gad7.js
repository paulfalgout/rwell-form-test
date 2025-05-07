import { get, set, findKey, reduce } from 'lodash';

export const gad = {
  questions: {
    1: 'Feeling nervous, anxious, or on edge',
    2: 'Not being able to stop or control worrying',
    3: 'Worrying too much about different things',
    4: 'Trouble relaxing',
    5: 'Being so restless that it is hard to sit still',
    6: 'Becoming easily annoyed or irritable',
    7: 'Feeling afraid, as if something awful might happen',
  },
  answers: {
    0: 'Not at all',
    1: 'Several days',
    2: 'More than half the days',
    3: 'Nearly every day',
  },
};

export function setGad({ formState, formData }) {
  if (!formState.gad) return formData;
  const { score, how_difficult, survey, severity } = formState.gad;
  const readableSurvey = reduce(survey, (memo, a, q) => {
    memo[q] = {
      question: gad.questions[q],
      answer: gad.answers[a],
    };
    return memo;
  }, {});
  set(formData, 'fields.behavioral_health_gad', {
    survey: readableSurvey,
    score,
    severity,
    how_difficult,
  });
  return formData;
}

export function loadGad({ formState, formData }) {
  const gadField = get(formData, 'fields.behavioral_health_gad');
  if (!gadField) return formState.gad;

  const { survey, score, how_difficult, severity } = gadField;
  const formattedSurvey = reduce(survey, (memo, { answer }, key) => {
    memo[key] = findKey(gad.answers, str => str === answer);
    return memo;
  }, {});

  return { score, how_difficult, survey: formattedSurvey, severity };
}
