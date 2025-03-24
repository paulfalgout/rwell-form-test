import { ref, computed } from 'vue'
import { useMachine } from '@xstate/vue'
import { createFormMachine } from '../machines/formMachine'
import { api } from '../services/api'

export function useFormMachines() {
  const isLoading = ref(false)
  const saveStatus = ref({ saved: false, sessionId: null })

  // Use useMachine to run the form machine.
  const { snapshot, send } = useMachine(createFormMachine())

  // Computed accessor for formData.
  const formData = computed(() =>
    snapshot.value?.context?.formData || {
      name: '',
      email: '',
      addons: [],
      marketingConsent: false
    }
  )

  // Computed accessor for planOptions.
  const planOptions = computed(() =>
    snapshot.value?.context?.planOptions || [
      { id: 'basic', name: 'Basic Plan', price: 10 },
      { id: 'premium', name: 'Premium Plan', price: 20 },
      { id: 'enterprise', name: 'Enterprise Plan', price: 50 }
    ]
  )

  // Event dispatchers.
  const updateField = (field, value) => {
    send({ type: 'FIELD_CHANGE', field, value })
  }
  const submitForm = () => send({ type: 'SUBMIT' })
  const resetForm = () => send({ type: 'RESET' })
  const selectPlan = (planId) => send({ type: 'SELECT_PLAN', planId })
  const toggleAddon = (addonId) => send({ type: 'TOGGLE_ADDON', addonId })
  const updateAddons = (addons) => send({ type: 'SET_ADDONS', addons })

  // Helper to check if the machine is in a given state.
  const isInState = (stateName) =>
    snapshot.value?.matches ? snapshot.value.matches(stateName) : false

  // Error accessors.
  const hasFieldError = (field) =>
    !!snapshot.value?.context?.errors?.[field]
  const getFieldError = (field) =>
    snapshot.value?.context?.errors?.[field] || ''
  const hasSubmitError = computed(
    () => !!snapshot.value?.context?.errors?.submit
  )
  const getSubmitError = () =>
    snapshot.value?.context?.errors?.submit || ''

  // Save state to API.
  const saveStateToApi = async () => {
    isLoading.value = true
    saveStatus.value = { saved: false, sessionId: null }
    try {
      const stateToSave = { formData: formData.value }
      const result = await api.saveState(stateToSave)
      saveStatus.value = { saved: true, sessionId: result.id }
      return result.id
    } catch (error) {
      console.error('Failed to save state:', error)
      saveStatus.value = { saved: false, error: error.message }
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Load state from API.
  const loadStateFromApi = async (sessionId) => {
    if (!sessionId) return false
    isLoading.value = true
    try {
      const loadedState = await api.loadState(sessionId)
      resetForm()
      if (loadedState.formData) {
        Object.entries(loadedState.formData).forEach(([field, value]) => {
          if (field === 'plan') {
            selectPlan(value)
          } else if (field === 'addons') {
            updateAddons(Array.isArray(value) ? value : [])
          } else {
            updateField(field, value)
          }
        })
      }
      return true
    } catch (error) {
      console.error('Failed to load state:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    snapshot,
    formData,
    planOptions,
    updateField,
    submitForm,
    resetForm,
    selectPlan,
    toggleAddon,
    updateAddons,
    isInState,
    hasFieldError,
    getFieldError,
    hasSubmitError,
    getSubmitError,
    saveStateToApi,
    loadStateFromApi,
    isLoading,
    saveStatus,
    send
  }
}