import { get, set, findKey, reduce } from 'lodash';

const questions= {
  1: 'Feeling nervous, anxious, or on edge',
  2: 'Not being able to stop or control worrying',
  3: 'Worrying too much about different things',
  4: 'Trouble relaxing',
  5: 'Being so restless that it is hard to sit still',
  6: 'Becoming easily annoyed or irritable',
  7: 'Feeling afraid, as if something awful might happen',
};
const answers = {
  0: 'Not at all',
  1: 'Several days',
  2: 'More than half the days',
  3: 'Nearly every day',
};

function serialize({ formState, formData, key }) {
  if (!formState.gad) return formData;
  const { score, how_difficult, survey, severity } = formState.gad;
  const readableSurvey = reduce(survey, (memo, a, q) => {
    memo[q] = {
      question: questions[q],
      answer: answers[a],
    };
    return memo;
  }, {});
  set(formData, key, {
    survey: readableSurvey,
    score,
    severity,
    how_difficult,
  });
  return formData;
}

function deserialize({ formState, formData, key }) {
  const gadField = get(formData, key);
  if (!gadField) return formState.gad;

  const { survey, score, how_difficult, severity } = gadField;
  const formattedSurvey = reduce(survey, (memo, { answer }, key) => {
    memo[key] = findKey(answers, str => str === answer);
    return memo;
  }, {});

  return { score, how_difficult, survey: formattedSurvey, severity };
}

export {
  serialize,
  deserialize,
  questions,
  answers,
};

