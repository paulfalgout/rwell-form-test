<template>
    <div class="subscription-form">
      <h1>Subscription Form</h1>

      <div v-if="isInState('success')" class="success-message">
        <h2>Thank you for subscribing!</h2>
        <p>Your form has been submitted successfully!</p>
        <button @click="resetForm" class="btn btn-primary">Start Over</button>
      </div>

      <div v-else-if="isLoading" class="loading">
        <p>Loading...</p>
      </div>

      <form v-else @submit.prevent="submitForm">
        <div class="form-actions form-session-controls">
          <button type="button" @click="handleSaveState" class="btn btn-secondary" :disabled="isLoading">
            Save Progress
          </button>
          <button type="button" @click="handleLoadState" class="btn btn-secondary" :disabled="isLoading">
            Load Saved Form
          </button>

          <div v-if="saveStatus.saved" class="save-confirmation">
            Form saved successfully! Session ID: {{ saveStatus.sessionId }}
          </div>
        </div>

        <div class="form-section">
          <h2>Personal Information</h2>

          <FormKit
            type="text"
            name="name"
            label="Your Name"
            :value="formData.name"
            @input="updateField('name', $event)"
            validation="required|length:2"
            :validation-visibility="isInState('error') ? 'live' : 'blur'"
            :validation-state="hasFieldError('name') ? 'invalid' : undefined"
            :help="getFieldError('name')"
          />

          <FormKit
            type="email"
            name="email"
            label="Email Address"
            :value="formData.email"
            @input="updateField('email', $event)"
            validation="required|email"
            :validation-visibility="isInState('error') ? 'live' : 'blur'"
            :validation-state="hasFieldError('email') ? 'invalid' : undefined"
            :help="getFieldError('email')"
          />
        </div>

        <div class="form-section plan-selection">
          <h2>Choose Your Plan</h2>

          <div class="plans">
            <div
              v-for="plan in planOptions"
              :key="plan.id"
              class="plan-option"
              :class="{ selected: formData.plan === plan.id }"
              @click="selectPlan(plan.id)"
            >
              <h3>{{ plan.name }}</h3>
              <p class="price">${{ plan.price }}/month</p>
              <ul class="features">
                <li v-for="feature in getPlanFeatures(plan.id)" :key="feature">
                  {{ feature }}
                </li>
              </ul>
            </div>
          </div>

          <div class="addons">
            <h3>Add-ons</h3>

            <FormKit
              type="checkbox"
              name="addons"
              :options="{
                storage: 'Extra Storage (+$5/month)',
                backup: 'Daily Backup (+$3/month)',
                support: 'Premium Support (+$10/month)'
              }"
              :value="formData.addons"
              @input="handleAddonChange"
            />
          </div>
        </div>

        <div class="form-section">
          <FormKit
            type="checkbox"
            name="marketingConsent"
            label="I agree to receive marketing emails"
            :value="formData.marketingConsent"
            @input="updateField('marketingConsent', $event)"
          />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="isInState('submitting')">
            <span v-if="isInState('submitting')">Submitting...</span>
            <span v-else>Subscribe Now</span>
          </button>
        </div>

        <div v-if="hasSubmitError" class="error-message">
          {{ getSubmitError() }}
          <button @click="submitForm">Try Again</button>
        </div>
      </form>
    </div>
  </template>

  <script setup>
  import { ref } from 'vue'
  import { useFormMachines } from '../composables/useFormMachines'

  const {
    formData,
    planOptions,
    updateField,
    submitForm,
    resetForm,
    selectPlan,
    updateAddons,
    isInState,
    hasFieldError,
    getFieldError,
    hasSubmitError,
    getSubmitError,
    saveStateToApi,
    loadStateFromApi,
    isLoading,
    saveStatus
  } = useFormMachines()

  const sessionId = ref('')

  const handleSaveState = async () => {
    try {
      const id = await saveStateToApi()
      sessionId.value = id
      console.log('State saved successfully with ID:', id)
    } catch (error) {
      console.error('Failed to save state:', error)
    }
  }

  const handleLoadState = async () => {
    const idToLoad = sessionId.value || prompt('Enter your session ID:')
    if (!idToLoad) return
    try {
      await loadStateFromApi(idToLoad)
      console.log('State loaded successfully')
    } catch (error) {
      alert(`Failed to load form: ${error.message}`)
      console.error('Failed to load state:', error)
    }
  }

  const getPlanFeatures = (planId) => {
    const features = {
      basic: ['1GB Storage', 'Email Support', '1 User'],
      premium: ['10GB Storage', 'Priority Support', '5 Users'],
      enterprise: ['100GB Storage', '24/7 Support', 'Unlimited Users', 'Custom Domain']
    }
    return features[planId] || []
  }

  const handleAddonChange = (newAddons) => {
    updateAddons(newAddons)
  }
  </script>

  <style scoped>
  .subscription-form {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .form-section {
    margin-bottom: 2rem;
  }

  .plans {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .plan-option {
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .plan-option:hover {
    border-color: #007bff;
  }

  .plan-option.selected {
    border-color: #007bff;
    background-color: rgba(0, 123, 255, 0.05);
  }

  .price {
    font-size: 1.25rem;
    font-weight: bold;
    color: #007bff;
  }

  .features {
    padding-left: 1.5rem;
    margin: 1rem 0;
  }

  .form-actions {
    margin-top: 2rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.25rem;
    font-weight: bold;
    cursor: pointer;
  }

  .btn-primary {
    background-color: #007bff;
    color: white;
  }

  .btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .success-message {
    background-color: #d4edda;
    color: #155724;
    padding: 1rem;
    border-radius: 0.25rem;
    text-align: center;
  }

  .error-message {
    background-color: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 0.25rem;
    margin-top: 1rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    font-size: 1.2rem;
    color: #6c757d;
  }

  .btn-secondary {
    background-color: #6c757d;
    color: white;
    margin-right: 0.5rem;
  }

  .form-session-controls {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
  }

  .save-confirmation {
    margin-left: 1rem;
    color: #28a745;
    font-size: 0.9rem;
  }
  </style>