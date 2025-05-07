<template>
    <div>
      <FormKit
        type="group"
        :disabled="isReadOnly"
        @input="handleInput"
        :value="formState"
      >
        <FormKit type="date" name="date" label="Date of session:" />
        <FormKit type="text" name="session_number" label="Session number:" />
        <FormKit type="number" name="appointment_duration" label="Duration of appointment:" suffix="min" />

        <FormKit type="textarea" name="reason_or_stressors" label="Current Stressors:" />
        <FormKit type="textarea" name="patient_presentation" label="Patient presentation:" />

        <FormKit
          type="checkbox"
          name="interventions_discussed"
          label="Interventions and techniques discussed:"
          :options="interventionOptions"
        />

        <FormKit type="textarea" name="techniques_used" label="Techniques used during session:" />
        <FormKit type="textarea" name="patient_response" label="Patient’s response to interventions:" />
        <FormKit type="textarea" name="progress_and_outcomes" label="Progress/Outcomes:" />

        <FormKit
          type="radio"
          name="update_gad"
          label="Update GAD-7 to track progress:"
          :options="[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' }
          ]"
        />

        <FormKit type="textarea" name="gad_notes" label="Notes on GAD progress:" />

        <FormKit
          type="radio"
          name="reported_suicidal_thoughts"
          label="Does patient report any suicidal thoughts/ideation, self-harm, or harm to others?"
          :options="['Yes', 'No']"
        />

        <FormKit type="textarea" name="stanley_brown_notes" label="Notes on Stanley – Brown Assessment:" />

        <FormKit type="textarea" name="homework_assignments" label="Homework/Assignments:" />
        <FormKit type="textarea" name="next_session_plan" label="Plan for next session:" />
        <FormKit type="textarea" name="additional_notes" label="Additional notes:" />
      </FormKit>
    </div>
  </template>

  <script setup>
  import { useSelector } from '@xstate/vue';

  const props = defineProps({
    actor: Object,
  });

  const send = props.actor.send;
  const formState = useSelector(props.actor, s => s.context.formState);
  const isReadOnly = useSelector(props.actor, s => s.hasTag('form-view-only'));

  const handleInput = data => {
    send({ type: 'form.setData', data });
  };

  const interventionOptions = [
    'Behavioral activation',
    'Positive activities',
    'Cognitive distortion',
    'Challenging anxious thoughts',
    'Challenging negative thoughts negative thoughts',
    'Core beliefs',
    'Automatic thoughts',
    'Thought record',
    'Mood tracking',
    'Cognitive restructuring',
    'Cost/benefit analysis',
    'Exposure hierarchy',
    'Feelings identification',
    'Thought diffusion',
    'Other',
  ];
  </script>
