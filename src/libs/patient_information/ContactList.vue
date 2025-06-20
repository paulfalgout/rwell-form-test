<template>
  <fieldset class="w-full border-none p-0 mb-4">
    <legend class="text-gray-700 font-bold mb-2">{{ legend }}</legend>
    <FormKit
      type="list"
      :value=" items "
      :name=" listName "
      :id=" listName "
      dynamic
      #default="{ items: listItems, node, value }"
    >
      <FormKit
        type="group"
        v-for="(item, index) in listItems"
        :key=" index "
        :index=" index "
      >
        <div class="grid grid-cols-3 gap-4 items-start">
          <FormKit
            type="select"
            label="Label"
            name="label"
            :options=" labels "
          />
          <FormKit
            @change="$emit('update', getInputKey(index), $event.target.value)"
            :type=" props.inputType "
            :name=" uniqueField "
            :label=" inputLabel "
            :placeholder=" inputPlaceholder "
            :errors=" props.errors "
          />
          <button
            type="button"
            @click="$emit('remove', index, listName, node.value, getDisplayValue(node._value[index]))"
            class="hover:text-red-900 text-red-700 font-bold py-2 px-3 rounded focus:outline-none mt-5 focus:shadow-outline w-fit"
          >
            <FormKitIcon icon="trash" />
          </button>
        </div>
      </FormKit>
      <button
        type="button"
        @click=" () => node.input(value.concat(getEmptyItem())) "
        class="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4"
      >
        + Add another
      </button>
    </FormKit>
  </fieldset>
</template>

<script setup>
  import { FormKitIcon } from '@formkit/vue';

  const props = defineProps({
    items: Array,
    labels: Array,
    errors: Object,
    fieldKey: String,
    listName: String,
    legend: String,
    inputType: String,
    inputLabel: String,
    inputPlaceholder: String,
  });

  const emit = defineEmits(['update', 'remove']);

  const getDisplayValue = (item) => {
    return item?.number || item?.address || '';
  };

  const getInputKey = index => `${ props.fieldKey }[${ index }].${ uniqueField }`;

  const getEmptyItem = () => {
    return props.inputType === 'email'
      ? { address: '', label: '' }
      : { number: '', label: '' };
  };

  const uniqueField = props.inputType === 'email' ? 'address' : 'number';
</script>

<style>
  .formkit-icon {
    display: inline-block;
    height: 1.75rem;
    width: 1.75rem;
  }
</style>
