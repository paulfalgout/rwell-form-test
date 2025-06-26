import { createPatientInformationMachine } from '@/libs/patient_information/patientInformation.machine';
import * as patientInformation from '@/libs/patient_information/utils';
import { omit, toPairs, isEmpty, omitBy, size } from 'lodash';

export default {
  initialize(context, spawn, bridge) {
    let formState = { ...context.formState };

    formState = patientInformation.deserialize({ formState, formData: context.formData });

    spawn(createPatientInformationMachine({ bridge }), {
      id: 'patientInformation',
      input: {
        formState: formState || {},
        validationState: context.validationState,
        isEditable: !context.isReadOnly,
      },
    });

    return { formState };
  },

  getFormData(formState) {
    let formData = {};
    formData = patientInformation.serialize({ formState, formData });
    
    // formData = foo.serialize({ formState, formData, key: 'fields.foo' });
    return formData;
  },

  updateFormState({ formState, validationState, error }, { data }) {
    const dataState = { ...data };
    // Key is the child machine id, value is the child machine formState
    const [key, value] = toPairs(dataState)[0];

    const validationStateByKey = { ...validationState, [key]: value.validationState };
    const cleanedValidationState = omitBy(validationStateByKey, isEmpty);

    return {
      validationState: cleanedValidationState,
      formState: { ...formState, [key]: omit(value, 'validationState') },
      error: size(cleanedValidationState) ? error : null
    };
  },

  async validateForm(context) {
    if (isEmpty(context.validationState)) return true;
    throw Error('Form invalid.');
  },
};
