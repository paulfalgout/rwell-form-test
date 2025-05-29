/**
 * IframeBridge implements a commands, requests, events pattern:
 * - commands: fire-and-forget messages via send()/convenience methods
 * - requests: message/response via request(), awaitable Promise
 * - events: unprompted notifications from parent via on()/off()
 */
export class IframeBridge {
  constructor(targetWindow = parent, targetOrigin = window.origin) {
    this.targetWindow = targetWindow;
    this.targetOrigin = targetOrigin;

    // Pending requests keyed by _requestId
    this.pending = new Map();
    // Handlers for unprompted notifications
    this.handlers = {};
    window.addEventListener('message', this.handleMessage.bind(this), false);
  }

  handleMessage({ data, origin }) {
    if (origin !== this.targetOrigin || !data || !data.message || !data.args) return;
    const { value, error } = data.args;

    if (this.pending.has(data.requestId)) {
      const { resolve, reject } = this.pending.get(data.requestId);
      this.pending.delete(data.requestId);

      error ? reject(error) : resolve(value);
    }

    // Dispatch unprompted notification
    (this.handlers[data.message] || []).forEach(fn => fn(error || value));
  }

  /**
   * Send a request and await a response.
   */
  request(message, args = {}) {
    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      this.targetWindow.postMessage({ message, args, requestId }, this.targetOrigin);
    });
  }

  /**
   * Send a fire-and-forget command.
   */
  send(message, args = {}) {
    this.targetWindow.postMessage({ message, args }, this.targetOrigin);
  }

  /**
   * Subscribe to unprompted notifications.
   */
  on(message, handler) {
    (this.handlers[message] = this.handlers[message] || []).push(handler);
  }

  /**
   * Unsubscribe a handler.
   */
  off(message, handler) {
    const arr = this.handlers[message] || [];
    this.handlers[message] = arr.filter(fn => fn !== handler);
  }

  // Convenience API methods
  updateField(fieldName, value) {
    return this.request('update:field', { fieldName, value });
  }
  getField(fieldName) {
    return this.request('fetch:field', { fieldName });
  }
  getClinicians(teamId) {
    return this.request('fetch:clinicians', { teamId });
  }
  getDirectory(directoryName, query) {
    return this.request('fetch:directory', { directoryName, query });
  }
  getIcd(by) {
    return this.request('fetch:icd', by);
  }
  fetchFormData() {
    return this.request('fetch:form:data');
  }
  fetchFormResponse(responseId) {
    return this.request('fetch:form:response', { responseId });
  }
  submitForm(formState = {}, formData = {}) {
    const response = { data: formState, ...formData };
    return this.request('submit:form', { response });
  }
}
