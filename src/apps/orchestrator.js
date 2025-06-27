import { createPatientInformationMachine } from '@/libs/patient_information/patientInformation.machine';
import * as patientInformation from '@/libs/patient_information/utils';
import { union } from 'lodash';

export default {
  initialize(context, spawn, bridge) {
    let formState = { ...context.formState };

    formState = patientInformation.deserialize({ formState, formData: context.formData });

    const patientInformationRef = spawn(createPatientInformationMachine({ bridge }), {
      id: 'patientInformation',
      input: {
        formState: formState || {},
        isEditable: !context.isReadOnly,
      },
    });

    return { formState, childRefs: [patientInformationRef] };
  },

  getFormData(formState) {
    let formData = {};
    formData = patientInformation.serialize({ formState, formData });

    // formData = foo.serialize({ formState, formData, key: 'fields.foo' });
    return formData;
  },

  updateFormState({ formState }, { data }) {
    return { formState: { ...formState, ...data } };
  },

  async validateForm(context) {
    const { patientInformationErrors } = patientInformation.validateForm(context);
    const errors = union(patientInformationErrors);
    if (errors.length > 0) {
      const messages = errors.map(err => `${ err.error } (${ err.key })`);
      messages.forEach(msg => console.error(msg));
      throw new Error(messages.join('; '));
    }
  }
};
