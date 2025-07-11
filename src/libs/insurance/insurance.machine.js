import { createChildFormMachine } from '@/libs/shared/base-machines/child-form.machine';
import { last, set } from 'lodash';

const defaultFormState = {
  employer: '',
  insurance: '',
  group_number: null,
  division: null,
};

const formFieldEffects = {};

const insuranceOrchestrator = {
  defaultFormState,
  updateField: (context, event) => {
    const { key, value } = event;
    const inputKey = last(key.split('.'));

    const updater = formFieldEffects[inputKey];

    if (!updater) {
      const newContext = { ...context.formState };
      set(newContext, key, value);
      console.log('🚀 ~ newContext:', newContext);
      return newContext;
    }

    return updater({ formState: context.formState }, value, key);
  },
};

export function createInsuranceMachine({
  bridge,
  orchestrator = insuranceOrchestrator,
  id = 'insurance-machine'
}) {
  return createChildFormMachine({ bridge, orchestrator, id });
}
