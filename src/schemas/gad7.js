// src/schemas/gad7.js
import { map } from 'lodash';
import { gad } from '@/utils/gad7';

const answerOptions = map(gad.answers, (label, value) => ({
  label,
  value,
}));

const difficultyOptions = [
  'Not difficult at all',
  'Somewhat difficult',
  'Very difficult',
  'Extremely difficult',
];

export const gad7Schema = (formState, handleFieldUpdate) => {
  const questionFields = map(gad.questions, (question, number) => ({
    $el: 'div',
    attrs: { class: 'mb-4' },
    children: [
      {
        $el: 'label',
        attrs: { class: 'block font-medium mb-2' },
        children: `${number}. ${question}`,
      },
      {
        $formkit: 'radio',
        name: `survey.${number}`,
        options: answerOptions,
        value: formState?.survey?.[number] ?? null,
        onInput: (val) => handleFieldUpdate(`survey.${number}`, val),
        props: {
          type: 'radio',
          wrapperClass: 'flex space-x-6',
          inputClass: 'form-radio text-blue-600',
        },
      },
    ],
  }));

  return [
    {
      $el: 'h2',
      children: 'GAD-7 Survey',
      attrs: { class: 'text-lg font-semibold mb-4' },
    },
    ...questionFields,
    {
      $el: 'div',
      attrs: { class: 'mt-4 p-2 border rounded bg-gray-50' },
      children: [
        {
          $el: 'p',
          children: `Score: ${formState?.score ?? ''}`,
        },
      ],
    },
    {
      $formkit: 'radio',
      name: 'how_difficult',
      label:
        'If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
      options: difficultyOptions.map(d => ({ label: d, value: d })),
      value: formState?.how_difficult ?? '',
      onInput: (val) => handleFieldUpdate('how_difficult', val),
      props: {
        wrapperClass: 'space-y-2',
        inputClass: 'form-radio text-blue-600',
      },
    },
    {
      $el: 'div',
      attrs: { class: 'mt-4 p-2 border rounded bg-gray-50' },
      children: [
        {
          $el: 'p',
          children: `Severity: ${formState?.severity || ''}`,
        },
      ],
    },
  ];
};