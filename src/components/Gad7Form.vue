<template>
    <div>
      <FormKit type="group" :disabled="isReadOnly">
        <h2 class="text-lg font-semibold mb-4">GAD-7 Survey</h2>

        <table class="w-full text-sm border border-collapse">
          <thead>
            <tr class="bg-gray-100 text-center">
              <th class="text-left p-3">Question</th>
              <th
                v-for="opt in answerOptions"
                :key="opt.value"
                class="p-2"
              >
                {{ opt.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(label, number) in questions"
              :key="number"
              class="border-t"
            >
              <td class="p-2 align-top">
                {{ number }}. {{ label }}
              </td>
              <td
                v-for="opt in answerOptions"
                :key="opt.value"
                class="text-center"
              >
                <input
                  type="radio"
                  :name="`survey.${number}`"
                  :value="opt.value"
                  :checked="formState?.survey?.[number] === String(opt.value)"
                  @change="handleFieldUpdate(`survey.${number}`, opt.value)"
                  :disabled="isReadOnly"
                  class="form-radio w-4 h-4 text-blue-600"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div class="mt-4 p-2 border rounded bg-gray-50">
          <p><strong>Score:</strong> {{ formState.score ?? '' }}</p>
        </div>

        <div class="mt-6">
            <p class="font-semibold mb-2">
                If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?
            </p>

            <div class="space-y-2">
                <label
                v-for="option in difficultyOptions"
                :key="option"
                class="flex items-center space-x-2"
                >
                <input
                    type="radio"
                    name="how_difficult"
                    :value="option"
                    :checked="formState.how_difficult === option"
                    @change="handleFieldUpdate('how_difficult', option)"
                    :disabled="isReadOnly"
                    class="form-radio text-blue-600"
                />
                <span>{{ option }}</span>
                </label>
            </div>
        </div>

        <div class="mt-4 p-2 border rounded bg-gray-50">
          <p><strong>Severity:</strong> {{ formState.severity || '' }}</p>
        </div>
      </FormKit>
    </div>
  </template>

  <script setup>
  import { map } from 'lodash';
  import { useSelector } from '@xstate/vue';
  import { gad } from '@/utils/gad7';

  const props = defineProps({
    actor: Object,
  });

  const send = props.actor.send;
  const formState = useSelector(props.actor, s => s.context.formState);
  const isReadOnly = useSelector(props.actor, s => s.hasTag('form-view-only'));

  const handleFieldUpdate = (key, value) => {
    send({
      type: 'form.updateField',
      key,
      value,
    });
  };

  const questions = gad.questions;
  const answerOptions = map(gad.answers, (label, value) => ({ label, value }));
  const difficultyOptions = [
    'Not difficult at all',
    'Somewhat difficult',
    'Very difficult',
    'Extremely difficult',
];
  </script>