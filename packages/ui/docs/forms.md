# Form Architecture

The Esparex design system uses a strict compositional model for forms, backed by `react-hook-form`. Forms are complex, requiring state management, validation, accessibility, and layout coordination. This architecture centralizes these concerns to prevent page-level boilerplate and ensure consistent behavior across the application.

## Philosophy

1. **Composition over Configuration:** Forms are built using atomic primitives (`FieldRoot`, `FieldLabel`, `FieldControl`, `FieldMessage`).
2. **Auto-Wired Accessibility:** ARIA attributes (`aria-describedby`, `aria-invalid`, `aria-errormessage`) are automatically injected by the `FieldControl` wrapper. Do not manually wire them on primitives.
3. **Decoupled Primitives:** UI primitives (`Input`, `Select`, `Checkbox`) are pure and "dumb". They know nothing about context, validation, or layout. They only accept standard HTML attributes and forward refs.
4. **Controlled Wrappers:** The design system provides `Controlled*` wrappers (e.g. `ControlledInput`, `ControlledSelect`) for standard use-cases, significantly reducing boilerplate on feature pages.
5. **State Awareness:** Extended validation states (`pristine`, `dirty`, `touched`, `valid`, `invalid`, `submitted`, `validating`) are exposed via `useFormField()` for custom behaviors (e.g. real-time validation checks, optimistic UI).

## Usage

### 1. The Generic Form Provider

Always wrap your form with the `Form` component (which is a re-export of `react-hook-form`'s `FormProvider`).

```tsx
import { useForm } from "react-hook-form";
import { Form } from "@esparex/ui";

const methods = useForm({ ... });

<Form {...methods}>
  <form onSubmit={methods.handleSubmit(onSubmit)}>
    {/* Form Fields */}
  </form>
</Form>
```

### 2. Using Controlled Wrappers (Recommended)

For 90% of use cases, use the pre-built `Controlled*` wrappers. These components handle the `FieldRoot`, `FieldLabel`, `FieldControl`, and `FieldMessage` composition internally.

```tsx
import { ControlledInput, ControlledSelect, ControlledSwitch } from "@esparex/ui";

<ControlledInput
  name="email"
  label="Email Address"
  placeholder="john@example.com"
  description="We'll never share your email with anyone else."
  required
/>

<ControlledSelect
  name="role"
  label="User Role"
  placeholder="Select a role"
  options={[
    { label: "Admin", value: "admin" },
    { label: "User", value: "user" },
  ]}
  required
/>

<ControlledSwitch
  name="marketing"
  label="Marketing Emails"
  description="Receive emails about new products, features, and more."
/>
```

### 3. Custom Composition (Advanced)

If a pre-built wrapper doesn't fit your layout (e.g. you need a unique grid layout or multiple inputs in one field group), build it using the primitives:

```tsx
import {
  FieldRoot,
  FormItem,
  FieldLabel,
  FieldControl,
  FieldDescription,
  FieldMessage,
  Input
} from "@esparex/ui";

<FieldRoot
  name="username"
  render={({ field }) => (
    <FormItem>
      <FieldLabel required>Username</FieldLabel>
      <FieldControl>
        <Input placeholder="esparex_user" {...field} />
      </FieldControl>
      <FieldDescription>This is your public display name.</FieldDescription>
      <FieldMessage />
    </FormItem>
  )}
/>
```

### 4. Accessibility (A11y) Note

Never manually pass `aria-invalid` or `aria-describedby` to primitives if they are wrapped in a `FieldControl`. The `FieldControl` automatically links the input to its corresponding `FieldMessage` and `FieldDescription` using `React.useId()`.

If you are using an `Input` outside of a `FieldRoot` (e.g. a simple search bar without a form context), you may manually pass standard ARIA attributes as needed.
