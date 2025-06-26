import { createChildFormMachine } from '@/libs/shared/base-machines/child-form.machine';
import { last, findIndex, pullAt } from 'lodash';

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
  errors: {},
};

const formFieldEffects = {};

const validateFields = {
  number: (validationState, value, key) => {
    const newState = { ...validationState };
    const numberErrors = [...newState.phones || []];
    const prevErr = findIndex(numberErrors, { key });
    const isInvalid = value && !/^\+?\d{7,15}$/.test(value);

    if (isInvalid) {
      if (prevErr === -1) numberErrors.push({ error: 'Invalid phone number.', key });
    } else if (prevErr !== -1) {
      pullAt(numberErrors, prevErr);
    }

    if (numberErrors.length) {
      newState.phones = numberErrors;
    } else {
      delete newState.phones;
    }

    return newState;
  },

  address: (validationState, value, key) => {
    const newState = { ...validationState };
    const addressErrors = [...newState.emails || []];
    const prevErr = findIndex(addressErrors, { key });
    const isInvalid = value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

    if (isInvalid) {
      if (prevErr === -1) addressErrors.push({ error: 'Invalid email address.', key });
    } else {
      pullAt(addressErrors, prevErr);
    }

    if (addressErrors.length) {
      newState.emails = addressErrors;
    } else {
      delete newState.emails;
    }

    return newState;
  }
};

const patientInformationOrchestrator = {
  defaultFormState,
  updateField: (context, event) => {
    const { key, value } = event;
    const inputKey = last(key.split('.'));

    const updater = formFieldEffects[inputKey];

    if (!updater) {
      return {
        ...context.formState,
        [key.split('.').pop()]: value,
      };
    }

    return updater({ formState: context.formState }, value, key);
  },
  validateField: (context, event) => {
    const { key, value } = event;
    const inputKey = last(key.split('.'));

    const validator = validateFields[inputKey];

    if (!validator) {
      return {
        ...context.validationState,
      };
    }

    return validator(context.validationState, value, key);
  },
};

export function createPatientInformationMachine({
  bridge,
  orchestrator = patientInformationOrchestrator,
  id = 'patient-information-machine'
}) {
  return createChildFormMachine({ bridge, orchestrator, id });
}
