import { setup, assign, sendParent, stopChild } from 'xstate';
import { createReferralFormMachine } from './ReferralMachine';

export const referralsTabMachine = setup({
  actions: {
    addReferral: assign(({ context, spawn }) => {
      const index = context.referralActors.length;
      const actor = spawn(createReferralFormMachine({ index }), { name: `referral-${index}` });
      return {
        referralActors: [...context.referralActors, actor],
        formState: [...context.formState, {}],
      };
    }),

    removeReferral: assign(({ context, event }) => {
      const referralActors = [...context.referralActors];
      const formState = [...context.formState];
      const [removedActor] =referralActors.splice(event.index, 1);
      if (removedActor) stopChild(removedActor);
      formState.splice(event.index, 1);
      return { referralActors, formState };
    }),

    updateReferralData: assign(({ context, event }) => {
      const formState = [...context.formState];
      formState[event.index] = event.data;
      return { formState };
    }),

    notifyParent: sendParent(({context, self }) => ({
      type: 'form.dataUpdated',
      data: { [self.id]: context.formState },
    })),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCcwDMzOQQwDawDoBbbAO2ygEtSoBiVDLPA7CCAbQAYBdRUABwD2sSgBdKg0nxAAPRADYALAQCsKgBwaAnFoDMK3ZwBMAdl0AaEAE9Euo+oK6AjEYOcVTkypPqnAXz9LBkwcfGIyCmo6YKZcAlQiQQA3MC5eJBAhEXFJaTkED0dOTh8XFUsbBCNOZS1OeSN5FVd1Hzr5AKD0ELxCEnIqGnpu2IIAV34IbFFINOkssQkpDPzFIwrEX1UAwJBSQQg4aRjQ+AyFnOXQfIBaeQ2EO86QE97wgaj54UXclcQzAieLTydS6EFuUwWayINZaAgmJryEwlBFgkxGHZ+IA */
  id: 'referrals',
  context: ({ input }) => ({
    formState: input?.formState || [],
    referralActors: [],
  }),
  initial: 'managing',
  states: {
    managing: {
      on: {
        'referral.add': {
          actions: ['addReferral'],
        },
        'referral.remove': {
          actions: ['removeReferral', 'notifyParent'],
        },
        'referral.updated': {
          actions: ['updateReferralData', 'notifyParent'],
        },
      },
    },
  },
});
