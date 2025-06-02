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

function serialize({ formState, formData, stateKey = 'gad7', dataKey = 'fields.gad7' }) {
  const gadField = get(formState, stateKey);
  if (!gadField) return formData;

  const { survey, score, severity, how_difficult } = gadField;
  const readableSurvey = reduce(survey, (memo, answer, question) => {
    memo[question] = {
      question: questions[question],
      answer: answers[answer],
    };
    return memo;
  }, {});

  set(formState, dataKey, { survey: readableSurvey, score, severity, how_difficult});

  return formData;
}

function deserialize({ formState, formData, stateKey = 'gad7', dataKey = 'fields.gad7' }) {
  const gadField = get(formData, dataKey);
  if (!gadField) return formState;

  const { survey, score, severity, how_difficult } = gadField;
  const formattedSurvey = reduce(survey, (memo, { answer }, index) => {
    memo[index] = findKey(answers, str => str === answer);
    return memo;
  }, {});

  set(formState, stateKey, { survey: formattedSurvey, score, severity, how_difficult});

  return formState;
}

export {
  serialize,
  deserialize,
  questions,
  answers,
};

