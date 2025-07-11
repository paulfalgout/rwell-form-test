import { createPatientInformationMachine } from '@/libs/patient_information/patientInformation.machine';
import { createInsuranceMachine } from '@/libs/insurance/insurance.machine';
import * as patientInformation from '@/libs/patient_information/utils';
import * as insurance from '@/libs/insurance/utils';
import { union, merge } from 'lodash';

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

    const insuranceRef = spawn(createInsuranceMachine({ bridge }), {
      id: 'insurance',
      input: {
        formState: formState || {},
        isEditable: !context.isReadOnly,
      },
    });

    return { formState, childRefs: [patientInformationRef, insuranceRef] };
  },

  getFormData(formState) {
    let formData = {};

    formData = {
      ...patientInformation.serialize({ formState, formData }),
      ...insurance.serialize({ formState, formData}),
    };

    console.log('🚀 ~ getFormData ~ formData:', formData);
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
