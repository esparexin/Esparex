# State Machine Architecture

This document describes the state machine architecture for the ESPAREX marketplace frontend.

## 1. Overview
Complex multi-step processes such as login flows, ad placements, and business validations often resort to overly fragile `useState` and `useEffect` flag combinations (e.g., `isSubmitting`, `isVerifying`, `hasError`, `isSuccess`). The `src/state-machines/` directory standardizes these operations replacing generic boolean sets with firmly established deterministic state machines enforcing absolute transition restrictions structurally.

## 2. Global Machine Types
All machines conform tightly to the defined types located within `src/state-machines/machineTypes.ts`:
- **`MachineState`**: Defined states available natively across execution sequences.
- **`MachineEvent`**: External payload instructions dictating state mutations globally.
- **`MachineConfig`**: Safely structuring transition arrays statically blocking impossible flow alterations natively.

## 3. Hook Implementation (`useStateMachine`)
The abstract hook evaluates defined components mapping events linearly forward or resetting reliably without UI leaks:
```ts
const { state, send } = useStateMachine(otpAuthMachine);

// Mutate natively via string events:
send("SEND_OTP");
```
Using structured machines natively eliminates concurrent boolean conflicts (e.g. attempting to verify whilst simultaneously sending resend requests manually due to UI race conditions).

## 4. Migration Strategy
To implement deterministic structures for components:
1. Construct the rigid graph architecture outlining states and strict boundaries locally inside `src/state-machines/[name]Machine.ts`.
2. Delete standard localized flags (e.g., `const [loading, setLoading] = useState(false)`).
3. Import the strict machine configurations triggering `send("EVENT")` hooks sequentially across component lifecycles exclusively instead.
4. Align UI output renders (`disabled={state === "submitting"}`) accurately across execution passes.
