import { get } from 'lodash';

function serialize({ formState, formData, stateKey = 'patient_information', dataKey = 'patient_information' }) {
  const patientInformation = get(formState, stateKey);
  if (!patientInformation) return formData;

  // Handle field formatting for submit

  return formData;
}

function deserialize({ formState, formData, stateKey = 'patient_information', dataKey = 'patient_information' }) {

  const patientInformation = get(formData, dataKey);
  if (!patientInformation) return formState;

  // Handle field formatting for load

  return formState;
}

export {
  serialize,
  deserialize,
};
