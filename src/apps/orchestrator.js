import { createGad7Machine } from '@/libs/gad7/gad7.machine';
import * as gad7 from '@/libs/gad7/utils';

export default {
  initialize(context, spawn, bridge) {
    let formState = { ...context.formState };

    formState = gad7.deserialize({ formState, formData: context.formData });

    spawn(createGad7Machine({ bridge }), {
      id: 'gad7',
      input: {
        formState: formState.gad7 || {},
        isEditable: !context.isReadOnly,
      },
    });

    return { formState };
  },

  getFormData(formState) {
    let formData = {};
    formData = gad7.serialize({ formState, formData });
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
