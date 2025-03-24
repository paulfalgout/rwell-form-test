import { createMachine, assign } from 'xstate'

const PLAN_OPTIONS = [
  { id: 'basic', name: 'Basic Plan', price: 10 },
  { id: 'premium', name: 'Premium Plan', price: 20 },
  { id: 'enterprise', name: 'Enterprise Plan', price: 50 }
];

export const createPlanSelectorMachine = () =>
  createMachine({
    id: 'planSelector',
    initial: 'idle',
    context: {
      selectedPlan: 'basic',
      planOptions: PLAN_OPTIONS
    },
    states: {
      idle: {
        on: {
          SELECT_PLAN: {
            actions: assign({
              selectedPlan: (_, event) => event.planId
            })
          }
        }
      }
    }
  })