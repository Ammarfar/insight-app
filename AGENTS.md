# AGENTS.md

Read and follow relevant instructions or skills in .agents/skills/.

## Plan Mode

Create concise but sufficiently detailed implementation plans.

For each change:

* Explain the affected domain and current behavior.
* Describe the expected use-case flow in implementation order.
* Identify affected components, modules, services, APIs, models, or persistence.
* Highlight important business rules, dependencies, edge cases, and compatibility risks.
* Explain how the change should be validated.

Prioritize **domain understanding and use-case flow** over generic implementation details.

Do not repeat obvious code changes.

---

## Core Principles

* Prefer simple, readable, maintainable code.
* Prefer small focused changes over broad refactors.
* Follow the existing architecture and conventions unless there is a strong reason not to.
* Do not introduce abstractions without a clear benefit.
* Do not refactor unrelated code.
* Do not add speculative behavior or complexity.
* Use existing dependencies and utilities before introducing new ones.
* Ask before adding major dependencies or making broad architectural changes.

---

## Scope

Implement only what is required by the task.

Before changing code:

1. Understand the existing behavior.
2. Identify where the responsibility currently belongs.
3. Trace affected consumers and dependencies.
4. Determine the smallest correct change.

Preserve unrelated behavior.

Do not perform opportunistic cleanup, renaming, moving, deduplication, or architectural refactoring unless required for correctness.

---

## Business Logic & Ownership

Every business rule should have **one clear owner**.

The owner must handle the complete decision, including:

* defaults;
* validation;
* edge cases;
* derived state;
* relevant side effects.

Do not split the same business decision across multiple callers.

Keep orchestration focused on:

* preparing inputs;
* sequencing operations;
* delegating decisions;
* consuming results.

Prefer small named functions for meaningful calculations or rules.

Use domain-specific names.

Prefer early returns over deep nesting.

Keep related logic close together.

Extract logic only when it creates a meaningful responsibility or improves domain readability—not merely to reduce line count.

The main use-case function should reveal the business flow from top to bottom without requiring the reader to inspect implementation details first.

---

## Architecture

Respect the project's existing boundaries.

As a general rule:

* transport/routing layers should handle transport concerns;
* application/service layers should own business rules and orchestration;
* persistence layers should own database access and persistence-specific transformations;
* shared utilities should contain only genuinely reusable behavior.

Simple operations do not require additional abstraction.

Use a dedicated service/use-case boundary when logic involves:

* multiple business rules;
* multi-step workflows;
* multiple dependencies or repositories;
* complex calculations;
* reusable domain behavior.

Do not create forwarding wrappers that only pass arguments through.

---

## Contracts & Data Boundaries

When exposing data across module, API, or application boundaries:

* Return resolved data appropriate for the consumer.
* Keep domain decisions on the owning side of the boundary.
* Do not force consumers to reconstruct business rules, defaults, permissions, statuses, or derived state.
* Keep persistence models separate from external contracts when their responsibilities differ.
* Avoid leaking storage-specific or legacy details into public contracts.

When intentionally replacing a contract:

* use one clear current contract;
* update affected in-scope consumers;
* remove superseded behavior when safe and required by the task;
* do not add compatibility aliases, dual paths, or fallbacks unless explicitly required.

---

## Comments

Add comments only when they explain:

* business intent;
* important invariants;
* non-obvious side effects;
* reasoning that cannot be understood from the code itself.

Do not add comments that merely restate the code.

---

## Tests & Validation

When behavior changes, add or update focused tests for:

* affected business rules;
* meaningful edge cases;
* regressions;
* important state transitions or transformations.

Before completing a task:

1. Run relevant tests, build, type checks, and linting when available.
2. Fix issues introduced by the change.
3. Remove unused imports, debug logs, placeholders, and dead/commented-out code.
4. Review the final diff.
5. Verify each changed business rule has one clear owner.
6. Revert unrelated cleanup or refactoring.

Keep tests focused on behavior rather than implementation details.
