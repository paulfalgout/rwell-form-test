# Building Complex Vue 3 Forms with XState and FormKit: A Comprehensive Guide

Managing a complex multi-step form with dynamic branching and multi-user collaboration can become challenging as the form grows in size and complexity ([Managing Multi-Step Forms in Vue with XState](https://mayashavin.com/articles/manage-multi-step-forms-vue-xstate#:~:text=For%20a%20simple%20form%20like,quickly%20become%20difficult%20to%20maintain)). In this guide, we’ll use **XState 5** as the backbone for form state management and **FormKit** for the form UI in a Vue 3 application (with Vite). We will cover how to structure the form state machine (including branching logic and navigation steps), how to persist/rehydrate state from JSON, how to sync form data across browser tabs (or users) without coupling to a specific network layer, and how to keep UI navigation state local to each tab. We’ll also discuss best practices for splitting the form into reusable sections and maintaining performance with Vue 3’s Composition API.

## Architecture Overview

**Key Idea:** Use XState to handle the *entire form’s logic and data*, and FormKit to handle the *rendering of form inputs*. The XState machine will hold all form values and control which sections/steps are active based on branching rules, while FormKit components will reflect those values and emit user inputs. The form state can be shared across different browser contexts for real-time collaboration, but each tab or user maintains their own view of which section they’re on.

 ([image]()) *Figure: Multi-Tab Form State Management Architecture.* Each browser tab (User A and User B) runs its own instance of the XState form machine, providing data to a FormKit-powered UI. FormKit inputs send events to the state machine (e.g. on input or on next/prev navigation), and the machine’s context updates feed back into the inputs as values. A persistence layer (API/Database) can initialize the machine context with saved JSON data, and a **Sync Channel** (e.g. using the BroadcastChannel API or WebSockets) propagates form data changes (events or state snapshots) between tabs so that all instances stay in sync. Note that the “current section” or UI navigation state is *not* synchronized – each user can navigate their view independently (local UI state). Only the form’s data and branching decisions are shared.

**Multi-User Sync:** We use a publish/subscribe mechanism to sync state across tabs. The HTML5 BroadcastChannel API, for example, “allows basic communication between browsing contexts (windows, tabs, frames, or iframes) on the same origin” ([Broadcast Channel API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API#:~:text=The%20Broadcast%20Channel%20API%20allows,workers%20on%20the%20same%20origin)). In practice, this means when the form machine updates (e.g. a field changes or a section is completed), the update is broadcast to other tabs which then update their own machine’s context (or process the same event). This approach is decoupled from the transport – you could later replace or augment BroadcastChannel with WebSockets or any other messaging system without changing the core form logic.

**Local UI State:** Each user’s interface should track its own navigation/viewport state (e.g. which tab or step of the form they are currently viewing). This is kept out of the shared state to allow independent navigation. The XState machine can still model the overall workflow (which sections exist, which are done, etc.), but we avoid a single “currentStep” in shared context. Instead, the UI components can use their own local state or a small local XState machine to track what the user is currently editing. This ensures two users can work on different sections simultaneously without “fighting” over the form’s step state.

## Setting Up the Project Structure

We will use **Vue 3** (v3.5+), **Vite**, **XState v5** (with the `@xstate/vue` integration), and **FormKit v1.6**. Begin by scaffolding a Vue 3 project with Vite (e.g. using `npm create vite@latest` or Vue CLI). Install the dependencies:

```bash
npm install vue@^3.5.13 vite @xstate/vue@^4.0.2 xstate@^5.0.0 @formkit/vue@^1.6.8
```

Once set up, organize your source files for clarity and modularity. An example project structure might look like:

```plaintext
src/
├── main.js                # App bootstrap (creates app, installs FormKit plugin, etc.)
├── machines/
│   ├── formMachine.js     # XState machine definition for the entire form
│   ├── sections/         # Optional: sub-state machines or configs for form sections
│   │   ├── personalInfoMachine.js
│   │   └── addressMachine.js
│   └── ... (other state machines or actors)
├── components/
│   ├── FormRoot.vue       # The main form container component
│   ├── PersonalInfoSection.vue  # A FormKit-based subform for personal info
│   ├── AddressSection.vue      # Another section component
│   └── ... (other reusable section components)
├── utils/
│   ├── syncChannel.js     # Utility to handle BroadcastChannel or WebSocket for syncing
│   └── ... (other utilities, e.g., form data API fetch)
└── App.vue                # Root component (if using one)
```

**FormKit Plugin:** In `main.js`, install the FormKit plugin with default configuration so that FormKit inputs can be used in components. For example:

```js
import { createApp } from 'vue';
import App from './App.vue';
import { plugin as FormKit, defaultConfig } from '@formkit/vue';

createApp(App)
  .use(FormKit, defaultConfig)
  .mount('#app');
```

This registers `<FormKit>` and related components globally.

**@xstate/vue:** No special plugin is required for XState; we will use the Composition API composables provided by `@xstate/vue` in our components.

## Designing the XState Form Machine

The core of our system is the XState **state machine** that represents the form. This machine will manage:

- **Form data (context):** All field values, possibly an object like `context.formData` holding key/value pairs for answers.
- **Branching logic:** Which section or step comes next depends on certain answers. This can be modeled with guarded transitions or conditional states.
- **Navigation steps:** The finite states of the machine can correspond to form sections or steps (e.g. `personalInfo`, `extraDetails`, `review`, etc.), including any intermediate or final states (like a `submitted` state after final submission).
- **Events:** We’ll define events like `NEXT` and `PREV` for navigation, `SUBMIT` for final submission, and custom events (e.g. `UPDATE_FIELD`) for updating field values in the context.

**State Machine Structure:** For a linear wizard-like form, you might have a simple state sequence. For a branching form, you include conditional transitions. In XState, we can use guards on events or even model some parts as parallel states if sections can be filled out in any order. Here’s an example state machine definition illustrating a multi-step form with a branch:

```js
// machines/formMachine.js
import { createMachine, assign } from 'xstate';

const formMachine = createMachine({
  id: 'complexForm',
  context: {
    formData: {},       // store all form field values
    // ... you can include other context such as flags or metadata
  },
  initial: 'section1',  // start at Section 1
  states: {
    section1: {
      on: {
        NEXT: [
          // conditional transition based on context
          { target: 'section2', cond: 'needsExtraDetails' },
          { target: 'section3' }
        ]
      }
    },
    section2: {
      on: { NEXT: 'section3', PREV: 'section1' }
    },
    section3: {
      on: { NEXT: 'review', PREV: 'section2' }
    },
    review: {
      on: {
        SUBMIT: 'submitted',
        PREV: 'section3'
      }
    },
    submitted: {
      type: 'final'  // final state
    }
  }
}, {
  // Definition of guard conditions
  guards: {
    needsExtraDetails: (context) => {
      // Example: if a certain field in section1 requires section2 to be filled
      return context.formData.hasExtra === true;
    }
  },
  // (Optional) actions for updates – see below
});
```

In this example, the machine has states `section1` → `section2` → `section3` → `review` → `submitted`. When in `section1`, a `NEXT` event will go to `section2` if `needsExtraDetails` guard passes, otherwise it skips to `section3`. Transitions for `PREV` allow backward navigation. The final `submitted` state represents form completion.

 ([image]()) *Figure: Example Form State Machine with Branching.* This statechart shows a possible flow: Section 1 goes to Section 2 or 3 depending on a condition (branch), then proceeds to a Review step and a final Done state. Users can also navigate back (dashed lines for `PREV` events). XState guards (like `cond: 'needsExtraDetails'`) implement the branching logic based on context data.

**Updating Form Data in Context:** We treat form inputs as part of the machine’s context. A straightforward approach is to update the context when an input changes. In XState, context updates are done via actions (like `assign`). We can define a generic event, say `UPDATE_FIELD`, carrying a field name and value, and handle it in the machine:

```js
// ... inside createMachine config
on: {
  UPDATE_FIELD: {
    actions: assign((context, event) => {
      const { field, value } = event;
      return {
        formData: {
          ...context.formData,
          [field]: value
        }
      };
    })
  }
}
```

This way, whenever an `UPDATE_FIELD` event is sent with `{ field: 'firstName', value: 'Alice' }`, the machine will merge that into `context.formData`. Using a single event for any field keeps the machine definition simpler. (You could also have specific events per field, but that’s less scalable.)

**Modularity – Nested Machines for Sections:** If your form is extremely large (hundreds of fields or many complex sections), a single machine can become very big (e.g. one developer reported a form machine of ~1.5k lines) ([Nested Machines MultiStep form · statelyai xstate · Discussion #2667 · GitHub](https://github.com/statelyai/xstate/discussions/2667#:~:text=Hello%21%20I%20have%20a%20Project,become%20bigger%20in%20the%20future)). XState allows you to break it down by invoking **child machines** for different sections or logic pieces. For example, you could have a `personalInfoMachine` managing all fields and validation of the personal info section, and invoke it as a child state in the main machine. Reusable sections can thus be defined once as their own machine and invoked in multiple forms. When doing this, you’ll send events to the child or listen to child state changes via `actions` or the actor model. This adds complexity in coordination, but greatly improves maintainability for very large forms. If sections are largely independent (can be filled in parallel), you might even model the main machine with **parallel states** where each section machine runs side by side (and then a final state waits for all to be “complete”). The choice of modeling (sequential vs parallel) depends on whether sections are truly independent. In most cases, a sequential flow with conditional skips (as above) suffices, and splitting is more about code organization (splitting the machine configuration into multiple files) rather than runtime independence.

## Persisting and Rehydrating Form State from JSON

A common requirement is to **load a saved form** (e.g. a user resumes an in-progress form fetched from an API) or to save the form state for later. We need to handle serializing the XState machine’s state (context and current step) to JSON and rehydrating it.

**Loading Initial Data:** Suppose our backend returns a JSON object representing the form’s current state (e.g. which step the user was on and all field values). With XState v5, we can directly restore a machine’s state using the snapshot mechanism. The XState docs demonstrate that you can pass a `snapshot` when creating an actor, which includes both the context and state value ([Persistence | Stately](https://stately.ai/docs/persistence#:~:text=In%20XState%2C%20you%20can%20obtain,snapshot%3A%20restoredState%20%7D%29.start)) ([Persistence | Stately](https://stately.ai/docs/persistence#:~:text=const%20restoredState%20%3D%20JSON)). For example:

```js
import { createActor } from 'xstate';
import { formMachine } from './machines/formMachine';

// Assume `savedState` is a JSON object from API with a saved snapshot
const savedState = await fetch('/api/form/123').then(res => res.json());

// Create an actor (service) from the machine, restoring its state
const formService = createActor(formMachine, { snapshot: savedState }).start();
```

Under the hood, the machine will initialize in the same state it was in when saved (same active section and context data). XState’s `actor.getPersistedSnapshot()` method provides the JSON snapshot you would send to your API or store in localStorage ([Persisting and restoring state in XState | Stately](https://stately.ai/blog/2023-10-02-persisting-state#:~:text=const%20actor%20%3D%20createActor%28someMachine%2C%20,snapshot%3A%20restoredState%2C)). For instance, after each state change you could do:

```js
formService.subscribe(() => {
  const snapshot = formService.getPersistedSnapshot();
  localStorage.setItem('formState', JSON.stringify(snapshot));
});
```

This would persist the machine’s latest state so you can reload it later ([Persisting and restoring state in XState | Stately](https://stately.ai/blog/2023-10-02-persisting-state#:~:text=actor.subscribe%28%28%29%20%3D,state%27%2C%20JSON.stringify%28persistedState)). The snapshot contains the context (form data) and state value (which state is active, e.g., “section3”). When rehydrating, pass the parsed snapshot into `createActor` as shown above to resume exactly where you left off.

**Rehydrating Only Data:** In some cases, you might only have the form’s data (context), but not the exact state step. You can still initialize the machine’s context with those values and let the machine logic determine the appropriate next state. For example, if the data indicates that a certain question was answered requiring an extra section, the machine’s guards will naturally take the correct path on the next `NEXT` event. You can set initial context by using `.withContext()` on the machine or specifying `context` in the createActor options. For example:

```js
const dataOnly = { formData: {/* ... */} };
const formService = createActor(formMachine.withContext(dataOnly)).start();
```

This starts the machine at the initial state but with predefined answers, so the branching conditions will reflect those answers. You might then send a `NEXT` event programmatically to advance to the proper section based on the context.

**Important:** Ensure that the JSON structure matches what XState expects. If you use `getPersistedSnapshot()`, store that exact object. If you only store `context.formData`, be mindful that upon reload some branching logic might need to re-run (you can handle that by sending a special event or by designing the machine to derive certain hidden context from the answers when starting).

## Syncing Form State Across Browser Tabs (or Users)

To support collaborative editing (or simply keeping two tabs of the same user in sync), we share updates between form instances. We want to broadcast form data changes and branch activation **without coupling our logic to a specific API**. The approach is to intercept state changes or events on one instance and propagate them to the others via a channel.

**Broadcasting Events vs. State:** There are two common strategies:
1. **Broadcast events** – whenever the user triggers an event (like input or next), send that event to other tabs’ machines. This way, each instance processes the same sequence of events, keeping contexts in sync.
2. **Broadcast state snapshots** – after each change, send the new snapshot (or just the changed data) to others, and update their context/state to match.

Using events is often simpler and ensures the state machines all follow the same transition logic (each tab will independently run the transition in response to the event). However, you must guard against infinite loops (e.g. avoid re-broadcasting an event that originated from another tab). Broadcasting snapshots can be useful if a tab goes offline for a while and needs to catch up in one go. In practice, you can combine both: broadcast events for real-time sync, and periodically persist snapshot for new joiners or reconnections.

**Implementation via BroadcastChannel:** For tabs within the *same origin*, the **BroadcastChannel API** is convenient. “By creating a BroadcastChannel object, you can receive any messages posted to it… (browsing contexts subscribe by using the same channel name) and have bi-directional communication” ([Broadcast Channel API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API#:~:text=The%20Broadcast%20Channel%20API%20allows,on%20the%20same%20%2035)) ([Broadcast Channel API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API#:~:text=By%20creating%20a%20BroadcastChannel%20,communication%20between%20all%20of%20them)). This requires no server – it’s purely client-side. For multiple users (different browsers), you would use a WebSocket or similar server-mediated channel, but you can encapsulate the logic so that your XState machine usage remains the same.

*Example:* In a `syncChannel.js` utility, create a BroadcastChannel and set up listeners:

```js
// utils/syncChannel.js
const channel = new BroadcastChannel('form-sync');

// Subscribe to outbound events from the XState service
export function wireSync(service) {
  // Whenever our machine transitions, broadcast the event and context
  service.subscribe(state => {
    if (state.event) {
      // Send event name and data, or send snapshot
      channel.postMessage({ event: state.event, context: state.context });
    }
  });
}

// Listen for inbound messages to update our local machine
export function listenForSync(service) {
  channel.addEventListener('message', ({ data }) => {
    const { event, context } = data;
    // If an event is broadcast, relay it to our machine
    if (event && event.type && event.type !== 'xstate.init') {
      service.send(event);
    }
    // (Optionally, handle context sync or snapshots if needed)
  });
}
```

In your form component setup, after starting the machine’s service (actor), call `wireSync(formService)` and `listenForSync(formService)` for each tab. This way, when one tab sends `UPDATE_FIELD` or transitions sections, the other tab receives that event and updates its state accordingly. The UI in the other tab will then react (e.g. the field value will appear).

**Keeping UI State Local:** The above sync shares **formService context and events** only. Notice we did not broadcast something like “current step” directly. Each instance will internally handle the navigation events. If User A is on Section 1 and hits Next (skipping to Section 3 for instance), User B’s machine will also process the `NEXT` event (and perhaps move to Section 3 in its statechart), but **User B’s UI doesn’t have to automatically navigate**. In collaborative scenarios, you might want to alert User B that a section was completed by someone else, but not forcibly yank their view. Our architecture supports this: because the form sections can be edited in any order, User B could remain on Section 1 UI while the machine state has technically moved on. We can design the UI to handle this gracefully (for example, showing a message “Section 1 data is up to date” or disabling inputs that are no longer relevant).

In a simpler same-user multi-tab scenario, you *could* choose to auto-navigate both tabs to the latest section, but given our goal of decoupling, it’s better to let each UI decide. The crucial part is both instances share **data and branch decisions**. In summary, only sync what’s necessary (field values, which sections are enabled/disabled) and let each UI manage the rest.

**Synchronization with WebSockets:** The BroadcastChannel logic can later be replaced or augmented with a WebSocket to a server so multiple users on different machines can collaborate. The server could maintain the “source of truth” machine or simply relay messages between clients. Because our XState logic is framework-agnostic, you could even run the state machine on the server and send patches to clients. That’s beyond this guide, but the architecture we’ve set up – separating state logic from UI and using broadcast of events/state – is compatible with that approach.

## Integrating XState with Vue 3 Components and FormKit

With the state machine defined and a sync strategy in place, the next step is to connect it to the Vue UI. The `@xstate/vue` package provides a Composition API function `useMachine(machine, options)` which starts the machine (as an actor) and returns reactive state. We will use that inside our form components. FormKit will be used for the input fields, either via its schema or individual input components.

**Using FormKit Schema vs Components:** FormKit allows you to define forms in a JSON-like *schema* which can be rendered with a `<FormKitSchema>` component ([FormKit Schema ⚡️ FormKit](https://formkit.com/essentials/schema#:~:text=FormKit%27s%20schema%20is%20a%20JSON,party%20components)) ([FormKit Schema ⚡️ FormKit](https://formkit.com/essentials/schema#:~:text=FormKit%20ships%20with%20first,prop)). This is powerful for dynamically generating forms from config or database. If your form structure itself comes from an API or you want to reuse schema definitions, you could use this feature. For example, you might store a section’s field definitions as JSON and load them with the form state. For our guide, we’ll assume the form structure is known at build time, so we’ll use standard `<FormKit>` input components in templates (it’s simpler to illustrate logic this way). Keep in mind that everything here could be adapted to schema-driven forms if needed.

**Reactive State from XState:** In a Vue component (e.g. `FormRoot.vue` or a specific section component), use `useMachine` to spawn the form machine. For example:

```vue
<script setup>
import { useMachine } from '@xstate/vue';
import { formMachine } from '../machines/formMachine';

const { snapshot: state, send, actorRef } = useMachine(formMachine, {
  // Optionally, provide context or state if loaded from API:
  // state: persistedState, or context: { formData: loadedData }
});
</script>

<template>
  <div>
    <!-- Example field binding -->
    <FormKit type="text" name="firstName" label="First Name"
             v-model="state.context.formData.firstName" />
    <!-- Example navigation -->
    <button @click="send('PREV')" :disabled="!state.can('PREV')">Back</button>
    <button @click="send('NEXT')" v-if="!isLastStep">Next</button>
    <button @click="send('SUBMIT')" v-if="isLastStep">Submit</button>
  </div>
</template>
```

When `useMachine` is called, it starts the machine and returns a **reactive** `state` object (here we aliased it as `state` for convenience) and a `send` function to dispatch events. We can access the current context via `state.context` and the current state value via `state.value` (or use `state.matches('stateName')` to check the active state). The `state` is a deep reactive object, so using it in the template will automatically re-render when it changes.

In the template above, we bind a FormKit input’s value with `v-model` to `state.context.formData.firstName`. This two-way binding means when the input changes, it will update that property in the context (and when context updates programmatically, the input reflects it) ([Managing Multi-Step Forms in Vue with XState](https://mayashavin.com/articles/manage-multi-step-forms-vue-xstate#:~:text=To%20bind%20form%20inputs%20to,model)). Under the hood, FormKit’s v-model will emit an `update:modelValue` event which Vue uses to set `state.context.formData.firstName`. This *does mutate the context directly* – in XState, typically we avoid directly modifying context outside of actions. However, since `state.context` is exposed as a reactive object, this approach works to keep the UI simple. The risk is that it bypasses XState’s transition logic for context updates. In our case, that might be acceptable (we’re just setting form data), but be cautious: if you need to run other actions or validations on that update, you might prefer dispatching an event instead.

**Updating via Events (Alternative):** A more controlled pattern is to listen to input events and call `send` with an `UPDATE_FIELD` event. FormKit inputs emit a `@input` (or use `@inputUpdated` depending on config). For example:

```vue
<FormKit type="text" name="firstName" label="First Name"
         :value="state.context.formData.firstName"
         @input="val => send({ type: 'UPDATE_FIELD', field: 'firstName', value: val })" />
```

This does the same thing but through the state machine’s event pipeline. The machine will catch the `UPDATE_FIELD` event and run the assign action to update context, producing a new context (and new `state.context`). The UI will update accordingly. This method ensures all changes go through XState, which can be useful for logging, debugging, or triggering other transitions. The downside is more boilerplate in the template. You can choose either approach. In many cases, the direct `v-model` binding is fine and simpler ([Managing Multi-Step Forms in Vue with XState](https://mayashavin.com/articles/manage-multi-step-forms-vue-xstate#:~:text=To%20bind%20form%20inputs%20to,model)), but if you run into issues (like context not updating due to XState context immutability), switch to the event approach. *(Note: In XState v5, context updates via assign produce a new object, which should be reflected in `state.context` since the snapshot is reactive. Direct v-model might mutate the context object in place. It’s worked in simple tests ([Managing Multi-Step Forms in Vue with XState](https://mayashavin.com/articles/manage-multi-step-forms-vue-xstate#:~:text=To%20bind%20form%20inputs%20to,model)), but keep an eye on it during complex usage.)*

**Navigation Buttons and UI:** We use `send('NEXT')`, `send('PREV')` etc. to move between steps. The example above shows enabling/disabling buttons based on whether those transitions are valid. XState’s `state.can(event)` method (available on the State object) can tell if an event will be accepted in the current state. We could use `state.can('PREV')` for Back button. Alternatively, manage it via checking `state.matches(...)` on the first/last states to hide or disable navigation. The exact UI logic will depend on your design (some forms have a persistent step indicator, others might hide previous sections entirely).

**Form Submission:** When the user clicks Submit (in the `review` step in our machine), we send `SUBMIT`. The machine transitions to `submitted` (a final state). You can use an `onDone` listener on the service or check for `state.done` in the component to know the form finished. Typically, you’d also perform an API call to save the data on submit. This can be modeled by invoking a promise or callback in the machine on the `SUBMIT` transition (to handle loading states, success, error states, etc.). For brevity, we haven’t included that, but XState can manage those side effects in states (e.g., a state for “submitting” that on entry invokes a service to POST the data, and has transitions for success/failure). That would integrate with FormKit’s validation or disabled states (FormKit has a concept of a form submitting state as well).

**Integrating FormKit Validation:** FormKit comes with validation rules and features like disabling the submit button when the form is invalid. You can use those out-of-the-box – they will not conflict with XState. XState can also hold validation logic (for example, states that represent “field X invalid”). A pragmatic approach is to let FormKit handle field-level validation (it will emit errors and block submission if using `<FormKit type="form">` wrapper), and use XState for higher-level flow validation (like cannot proceed to next step until certain context conditions are met). You can inspect FormKit’s state or use its `@submit` event to intercept submission and send XState events accordingly. Keep the concerns separated: **FormKit for per-field validation/UI hints, XState for flow control and overall form state**.

## Reusing and Organizing Form Sections

Large forms often have sections that could be reused in other forms (e.g. an address section might appear in different workflows). We should design our system to maximize reuse:

- **Reusable Vue Components:** Encapsulate each section’s UI into a component (e.g. `PersonalInfoSection.vue`) which contains the FormKit inputs for that section. This component can accept props or use injection to get access to the XState service (e.g. you might provide the `actorRef` of the form machine from a parent and inject it in child components). This way, the section component is not tied to a specific form – it just renders fields and possibly emits an event when that section is complete. It can be dropped into any form container and connected to that form’s state machine.

- **Modular Machine Definitions:** As discussed, you can split the machine config by sections. You might have each section’s transitions and context shape in separate files and import them into the main machine. For example, define a machine (or just a config object) for address collection that handles `UPDATE_FIELD` for address fields and maybe internal validation events. Then in the main `formMachine`, you either invoke that machine or merge its states/transitions. XState v5 supports composing machines, and you could also use the actor model (spawn a section actor that lives in the context). The approach can vary, but the goal is to avoid one monolithic definition.

- **FormKit Schema for Reuse:** If you use FormKit’s JSON schema, you can store section schemas and include them conditionally. FormKit’s schema supports composition – e.g. using `$formkit` to include a sub-form component or using conditional logic within the JSON ([FormKit Schema ⚡️ FormKit](https://formkit.com/essentials/schema#:~:text=A%20schema%20is%20an%20array,types%20of%20of%20schema%20nodes)). This means you could maintain a library of section schemas (for example, an address schema array) and then build a larger form schema by combining them. The advantage is you could save entire form configurations to a database, enabling forms to be defined without code. The trade-off is complexity in orchestrating state – you’d still use XState to handle the dynamic parts (showing/hiding sections, etc.), or you might encode some logic in the schema’s conditional if it’s simple. For highly dynamic multi-user forms, XState gives you more explicit control.

**Example Folder Structure for Reuse:** We showed a `machines/sections/` folder above. You might have, for instance, `personalInfoMachine.js` exporting a machine that manages the personal info fields and maybe has a state for “complete”. The main `formMachine` could invoke `personalInfoMachine` in state `section1`. Similarly for address. Each of those machines can also be used on its own elsewhere if needed.

Consider a `SectionWrapper.vue` component that takes a prop `actorRef` (the form’s actor reference) and a prop specifying which slice of context to bind (or maybe the actor itself can be scoped to a slice via `useSelector`). In Vue, you could also use Provide/Inject: the top-level form component provides the form service, and each section injects it and uses it (filtering the context it needs).

**Splitting Files:** At minimum, separate the machine logic from the component code. The statechart (even if not split by section) should reside in `formMachine.js` for clarity. This also allows using XState’s visualizer or testing the machine in isolation. For very large logic, group related states and transitions logically in the code (with comments or using the machine `.withConfig` to add pieces). Maintain a clear mapping between form steps and state names.

**Example:** If the Address section is reused, you might have:

```js
// machines/sections/addressMachine.js
export const addressMachine = createMachine({
  id: 'addressSection',
  initial: 'editing',
  context: { address: { street: '', city: '', country: '' } },
  states: {
    editing: {
      // maybe some validation or internal events
      on: {
        UPDATE_FIELD: { actions: assign((ctx, evt) => { /* update address ctx */ }) },
        DONE: 'completed'
      }
    },
    completed: { type: 'final' }
  }
});
```

Then in `formMachine.js`, instead of making address a simple state, you might do:

```js
import { addressMachine } from './sections/addressMachine';

const formMachine = createMachine({
  // ...other states...
  states: {
    section3: {
      invoke: {
        id: 'addressSection',
        src: addressMachine,
        data: {
          // map parent context to child context, if needed
          address: (ctx) => ctx.formData.address || {}
        },
        onDone: 'review'
      },
      on: {
        PREV: 'section2'
      }
    },
    // ...
  }
});
```

This invokes the `addressMachine` when entering `section3` (address step). When the address machine reaches its `completed` final state (perhaps when the user clicks a “Done Address” button), the parent receives an `onDone` event and moves to `review`. Meanwhile, any `UPDATE_FIELD` that is meant for address fields could be sent directly to the child actor (perhaps by targeting via the `id` of the invoked machine). Alternatively, handle address updates at the parent and forward them (XState allows sending events to child actors). This setup is more complex than a single machine, but it shows how modular pieces can be plugged in. Use this pattern only if needed; otherwise, a single machine with guarded transitions might suffice.

## Performance and Reactivity Considerations

Using XState with the Vue 3 Composition API is powerful, but we should be mindful of performance for very large forms:

- **Reactive Rendering:** The `state.snapshot` (or `state` as we named it) from `useMachine` is a reactive object. Accessing `state.context.formData` in many places could trigger re-renders whenever *any* part of the context changes. If your formData is huge, consider structuring it so that updates are as granular as possible. Vue’s reactivity will generally handle deep updates efficiently, but if you find bottlenecks, you can use `computed` or `toRef` to isolate specific fields. For example, `const firstName = computed(() => state.context.formData.firstName)` and use `firstName.value` in the template – then only changes to `formData.firstName` will affect that computed.

- **Splitting Components:** Don’t render all 100+ fields in one component if not needed. By splitting into section components, you ensure that when a user is on “Address” section, the component for “Personal Info” is unmounted or inactive, so updates to personal info fields (perhaps coming from another user) do not have to re-render that part of the DOM. Each section component can subscribe to the same machine, but only use the part of the context it needs. This is another good reason to use separate machines or at least separate context slices per section: it’s easier to watch for specific changes. If using a single context object, you might pass only the relevant portion as a prop to the section component (e.g. `<PersonalInfoSection :data="state.context.formData.personalInfo" ...>`). That way, Vue’s reactivity tracks `state.context.formData.personalInfo` separately.

- **XState Performance:** XState is quite efficient, but there is overhead to transitioning a state machine on every keystroke if using events for each input. In practice this is negligible for most forms (humans type ~10 characters per second max). Still, if you have extremely high-frequency updates, you could throttle events or use `debounce`. FormKit has a debounce prop for inputs if needed. It’s usually fine to update on each input event (for collaborative, you might even want real-time keystroke sync).

- **Avoiding Unnecessary Sync:** If multi-user editing, consider that not all field changes need to be broadcast instantly. For example, for text inputs, you might broadcast on blur or on section save rather than every character. This is an app-specific choice. The guide’s architecture supports even instant updates (since it’s just events), but you can optimize user experience by reducing noise.

- **DevTools and Debugging:** Use XState’s Inspector (Stately Viz) during development by connecting your machine to the inspector (there’s an inspector plugin you can use in development mode). This can show you the active state and context in real time, which is immensely helpful for debugging complex form flows. Also, logging transitions (XState allows an `actions: assign({...}, log(...) )`) can help trace issues.

- **Scaling to Many Forms:** If you plan to have multiple different forms in the app, try to reuse patterns. For example, create a base machine or utility that creates form machines given a schema of sections. You could encode the workflow in data (list of section IDs, which ones depend on others, etc.) and have a generic machine generator. This is advanced but can pay off if you have dozens of distinct forms with similar behavior. In that case, also modularize your FormKit schemas.

## Conclusion and Best Practices

Implementing complex forms with XState and FormKit in Vue 3 provides a robust, scalable architecture. We achieved a clear separation: the **state machine** governs the form’s state and logic deterministically, while **FormKit** handles the input rendering, validation, and user interaction. This decoupling means the form logic can be tested and evolved independently of the UI – for instance, you could write unit tests for the XState machine to ensure all branching logic works, without any DOM involved. It also means we could swap out the UI library (say, use a different form renderer) without rewriting the core logic, or reuse the same logic in a React app or Node CLI if ever needed.

**Summary of key takeaways and best practices:**

- *Use XState for what it’s best at:* managing complex state transitions (multi-step flows, conditional branches, asynchronous actions). This gives you predictability and prevents invalid states ([Managing Multi-Step Forms in Vue with XState](https://mayashavin.com/articles/manage-multi-step-forms-vue-xstate#:~:text=For%20a%20simple%20form%20like,quickly%20become%20difficult%20to%20maintain)). For example, you won’t accidentally allow submission before required steps are done because the machine won’t be in the `review`/`submitted` state yet.
- *Keep shared state minimal:* Only put form data and necessary flags in the machine’s context. UI-specific state (like which tab is open, which field is focused, etc.) can stay in component local state or outside the machine. This minimizes cross-tab chatter and complexity.
- *Leverage FormKit’s strengths:* Use FormKit’s built-in features for inputs (validation, masking, etc.) to avoid reinventing the wheel. Our architecture allows FormKit to do its thing on the frontend while the machine still tracks the outcomes. For example, if FormKit marks a field invalid, you could disable the Next button until the machine receives an event that the section is valid. You can integrate those by listening to FormKit’s form submit or validation events.
- *Modularize for reusability:* Identify sections of the form that repeat or could be isolated. Create sub-machines or at least separate config and component for them. This makes it easier to maintain large forms and encourages reuse.
- *Persist and sync state safely:* XState v5’s snapshot system makes it straightforward to save and restore machine state ([Persistence | Stately](https://stately.ai/docs/persistence#:~:text=In%20XState%2C%20you%20can%20obtain,snapshot%3A%20restoredState%20%7D%29.start)) ([Persistence | Stately](https://stately.ai/docs/persistence#:~:text=const%20restoredState%20%3D%20JSON)). Design your application to save progress (either to localStorage or server) at appropriate times (on each change or at checkpoints). For multi-tab sync, use a mechanism (BroadcastChannel, etc.) that doesn’t depend on any specific app logic. Our use of broadcasting events keeps things generic – tomorrow you could replace the channel with a call to an API that notifies other clients.
- *Test thoroughly:* With branching logic and multi-user scenarios, testing is crucial. Write tests for the state machine (feeding it sequences of events and asserting the state and context). Also test the sync mechanism (maybe with mocked channels or using localStorage events). Since the machine is decoupled, you can simulate two instances in tests by running two interpreters and exchanging events between them, similar to how the BroadcastChannel would.
- *Monitor performance:* If the form grows, keep an eye on render performance. Use Vue’s devtools to see components re-rendering. If a performance issue arises, consider optimization techniques (splitting context, etc.) as discussed, but avoid premature optimization. In most typical forms (even dozens of fields), this setup will run fine.

By following this guide, you set up a form system that is maintainable and scalable. You’ve structured your code logically (state logic vs UI), made it possible to collaborate in real-time, and can confidently handle complex conditional workflows that would be error-prone with ad-hoc state management. As you add more forms or more features (like conditional validation, dynamic addition/removal of sections, etc.), you can extend the state machine or reuse patterns established here. The combination of XState and FormKit provides a solid foundation for any advanced form-centric application.

