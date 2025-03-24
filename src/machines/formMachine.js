import { createMachine, assign, sendTo } from 'xstate'
import { createPlanSelectorMachine } from './planSelectorMachine'

export const createFormMachine = () =>
  createMachine(
    {
      id: 'formMachine',
      initial: 'idle',
      context: {
        formData: {
          name: '',
          email: '',
          addons: [],
          marketingConsent: false
        },
        errors: {},
        submissionResult: null
      },
      states: {
        idle: {
          // Invoke the plan selector as a child actor.
          invoke: {
            id: 'planSelector',
            src: createPlanSelectorMachine() // Pass the machine instance directly
          },
          on: {
            FIELD_CHANGE: { actions: 'updateField' },
            SUBMIT: { target: 'validating' },
            // Forward SELECT_PLAN events to the invoked planSelector actor.
            SELECT_PLAN: {
              actions: sendTo('planSelector', (_, event) => event)
            },
            TOGGLE_ADDON: { actions: 'toggleAddon' }
          }
        },
        validating: {
          entry: 'validateForm',
          always: [
            { guard: 'hasErrors', target: 'error' },
            { target: 'submitting' }
          ]
        },
        submitting: {
          invoke: {
            id: 'submitForm',
            src: 'submitFormService',
            onDone: {
              target: 'success',
              actions: assign({ submissionResult: (_, event) => event.data })
            },
            onError: {
              target: 'error',
              actions: assign({
                errors: (context, event) => ({
                  ...context.errors,
                  submit: 'Network error occurred'
                })
              })
            }
          }
        },
        success: {
          on: {
            RESET: { target: 'idle', actions: 'resetForm' }
          }
        },
        error: {
          on: {
            FIELD_CHANGE: { actions: 'updateField', target: 'idle' },
            SELECT_PLAN: {
              actions: sendTo('planSelector', (_, event) => event),
              target: 'idle'
            },
            TOGGLE_ADDON: { actions: 'toggleAddon', target: 'idle' },
            RETRY: { target: 'validating' },
            RESET: { target: 'idle', actions: 'resetForm' }
          }
        }
      }
    },
    {
      actions: {
        updateField: assign({
          formData: (context, event) => ({
            ...context.formData,
            [event.field]: event.value
          }),
          errors: (context, event) => {
            const { [event.field]: _, ...remainingErrors } = context.errors
            return remainingErrors
          }
        }),
        toggleAddon: assign({
          formData: (context, event) => {
            const currentAddons = [...context.formData.addons]
            const index = currentAddons.indexOf(event.addonId)
            if (index === -1) {
              currentAddons.push(event.addonId)
            } else {
              currentAddons.splice(index, 1)
            }
            return { ...context.formData, addons: currentAddons }
          }
        }),
        validateForm: assign({
          errors: (context) => {
            const errors = {}
            if (!context.formData.name) errors.name = 'Name is required'
            if (!context.formData.email) {
              errors.email = 'Email is required'
            } else if (!/^\S+@\S+\.\S+$/.test(context.formData.email)) {
              errors.email = 'Email is invalid'
            }
            return errors
          }
        }),
        resetForm: assign({
          formData: { name: '', email: '', addons: [], marketingConsent: false },
          errors: {},
          submissionResult: null
        })
      },
      guards: {
        hasErrors: (context) => Object.keys(context.errors).length > 0
      },
      services: {
        submitFormService: (context) =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              Math.random() > 0.2
                ? resolve({ id: `FORM-${Date.now()}` })
                : reject(new Error('Submission failed'))
            }, 1000)
          })
      }
    }
  )