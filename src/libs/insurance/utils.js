import { get, set } from 'lodash';

const employers = [
  'VUMC',
  'MNPS',
  'Lee Company',
  'Ryman',
  'Harpeth Hall',
];

function serialize({ formState, formData, stateKey = 'insurance', dataKey = 'insurance' }) {
  const insurance = get(formState, stateKey);
  if (!insurance) return formData;

  set(formData, dataKey, insurance);

  return formData;
}

function deserialize({ formState, formData, stateKey = 'insurance', dataKey = 'insurance' }) {

  const insurance = get(formData, dataKey);
  if (!insurance) return formState;

  // Handle field formatting for load

  return formState;
}

function validateForm({ formState }) {
  return {};
}

export {
  serialize,
  deserialize,
  validateForm,
  employers,
};
