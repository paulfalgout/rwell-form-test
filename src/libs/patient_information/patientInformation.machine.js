import { createChildFormMachine } from '@/libs/shared/base-machines/child-form.machine';
import { last, get } from 'lodash';

const defaultFormState = {
  patient_information: {
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
  },
};

const formFieldEffects = {
  number: (formState, value, key) => {
    const numberErrors = [];

    if (value && !/^\+?\d{7,15}$/.test(value)) {
      numberErrors.push('Invalid phone number.');
    }

    if (numberErrors.length) {
      formState.patient_information.errors.number = numberErrors;
    } else {
      delete formState.patient_information.errors.number;
    }

    return {
      ...formState
    };
  },
  address: (formState, value, key) => {
    const addressErrors = [];
    
    if (value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      addressErrors.push('Invalid email address.');
    }

    if (addressErrors.length) {
      formState.patient_information.errors.address = addressErrors;
    } else {
      delete formState.patient_information.errors.address;
    }

    return {
      ...formState
    }
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
        patient_information: {
          ...context.formState.patient_information,
          [key.split('.').pop()]: value,
        },
      };
    }

    return updater({ ...context.formState }, value, key);
  },
};

export function createPatientInformationMachine({ bridge, orchestrator = patientInformationOrchestrator, id = 'patient-information-machine' }) {
  return createChildFormMachine({ bridge, orchestrator, id });
}
