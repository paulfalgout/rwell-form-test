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

const isInvalidPhone = value => value && !/^\+?\d{7,15}$/.test(value);
const isInvalidEmail = value => value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

function validateForm({ formState }) {
  const phones = formState?.patientInformation?.phones || [];
  const emails = formState?.patientInformation?.emails || [];
  const mrn = formState?.patientInformation?.mrn;
  const errors = [];

  phones.forEach(({ number }, index) => {
    if (isInvalidPhone(number)) errors.push({
      error: 'Phone number is invalid.',
      key: `patientInformation.phones[${ index }].number`
    });
  });

  emails.forEach(({ address }, index) => {
    if (isInvalidEmail(address)) errors.push({
      error: 'Email address is invalid.',
      key: `patientInformation.emails[${ index }].address`
    });
  });

  if (!mrn) {
    errors.push({
      error: 'MRN is required.',
      key: `patientInformation.mrn`
    })
  }

  return { patientInformationErrors: errors };
}

export {
  serialize,
  deserialize,
  validateForm,
};
