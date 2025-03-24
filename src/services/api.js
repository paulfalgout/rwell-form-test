// Mock API service for saving and loading state
export const api = {
  saveState: async (data) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    try {
      localStorage.setItem('form_state', JSON.stringify(data))
      return { success: true, id: `SESSION-${Date.now()}` }
    } catch (error) {
      throw new Error('Failed to save state')
    }
  },

  loadState: async (id) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    const data = localStorage.getItem('form_state')
    if (!data) throw new Error('No saved state found')
    return JSON.parse(data)
  }
}