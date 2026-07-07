# Validator Registry API Reference

The Validator Registry is the single source of truth for validator metadata registration, capabilities querying, and startup checks.

---

## 1. Registry API Definitions

The registry exposes the following core static functions:
- `registerValidator(validator, metadata)`: Adds a validator to the registry with capability settings.
- `registerValidators(validators)`: Registers an array of validator definitions.
- `unregisterValidator(id)`: Removes a validator from the registry.
- `getValidator(id)`: Retrieves a specific validator definition.
- `getAllValidators()`: Returns all registered validator definitions.
- `getValidatorsByCategory(category)`: Returns validators that claim rules in a specific category.
- `getValidatorsByRule(ruleId)`: Returns validators associated with a specific rule ID.
- `validatorExists(id)`: Checks if a validator ID is registered.
- `initialize()`: Sets up registry state.
- `validateRegistry()`: Runs fast-fail startup integrity checks.

---

## 2. Validator Definition Schema

Validators register with execution metadata defining their operational capabilities:
```ts
interface ValidatorDefinition {
  id: string;
  name: string;
  supportedRules: string[];
  supportedFileTypes: string[];
  priority: number;
  dependencies: string[];
  enabled: boolean;
  validator: GovernanceValidator;
}
```
No rule metadata (like severity, owners, or documentation links) is defined here; those properties reside exclusively in the centralized `RuleRegistry`.
