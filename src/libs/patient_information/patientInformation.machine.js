import { createChildFormMachine } from '@/libs/shared/base-machines/child-form.machine';
import { last, set } from 'lodash';

const defaultFormState = {
  mrn: '',
  name: '',
  preferred_name: '',
  dob: '',
  phones: [
    {
      number: '',
      label: '',
    }
  ],
  emails: [
    {
      address: '',
      label: '',
    }
  ],
};

const formFieldEffects = {};

const patientInformationOrchestrator = {
  defaultFormState,
  updateField: (context, event) => {
    const { key, value } = event;
    const inputKey = last(key.split('.'));

    const updater = formFieldEffects[inputKey];

    if (!updater) {
      const newContext = { ...context.formState };
      set(newContext, key, value);
      return newContext;
    }

    return updater({ formState: context.formState }, value, key);
  },
};

export function createPatientInformationMachine({
  bridge,
  orchestrator = patientInformationOrchestrator,
  id = 'patient-information-machine'
}) {
  return createChildFormMachine({ bridge, orchestrator, id });
}
