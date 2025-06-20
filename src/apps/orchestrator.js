import { createPatientInformationMachine } from '@/libs/patient_information/patientInformation.machine';
import * as patientInformation from '@/libs/patient_information/utils';

export default {
  initialize(context, spawn, bridge) {
    let formState = { ...context.formState };

    formState = patientInformation.deserialize({ formState, formData: context.formData });

    spawn(createPatientInformationMachine({ bridge }), {
      id: 'patientInformation',
      input: {
        formState: formState.patient_information || {},
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

  updateFormState({ formState }, { data }) {
    return { ...formState, ...data };
  },

  async validateForm(formState) {
    // No validation errors
  },
};
