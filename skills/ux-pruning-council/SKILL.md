---
name: ux-pruning-council
description: Review a product UX with a small agent council that prioritizes removing redundant features, clarifying the primary task, and moving secondary information behind deliberate disclosure. Use for UX simplification, information architecture, or deciding what a page should contain.
---

# UX Pruning Council

Optimize for fewer decisions, fewer competing actions, and faster completion of the user's primary task. Treat every visible element as a cost that must earn its place.

## Start from evidence

Inspect the implemented screens, routes, navigation, and user-visible copy. Identify the user, the job they came to complete, and the state change that marks completion. Do not infer a need from an existing feature merely because it exists.

## Run the council

Use three independent reviews when the user requests multiple agents or the product spans several workflows. Run them in parallel when tools allow:

1. **Pruner** — marks elements `remove`, `merge`, `move`, or `keep`; it cannot propose a new feature.
2. **Flow editor** — defines one primary action per page and the shortest path through the main job.
3. **Interaction critic** — checks labels, state visibility, mobile use, error recovery, and whether controls behave as users expect.

Each reviewer returns at most five findings. Every finding must cite an observed screen, route, or component and state which user decision or step it removes. Reject vague advice such as “improve hierarchy,” “add personalization,” or “make it engaging.”

## Make the decision

The lead agent combines findings and removes duplicates. Accept a change only when it does at least one of the following:

- removes a repeated action, repeated information, or competing destination;
- makes the next required action clear without explanation;
- prevents a likely error or makes recovery obvious;
- moves infrequent detail behind a clearly named button, disclosure, or separate page;
- preserves information required for care, safety, accountability, or source verification.

Prefer removal before rewriting, rewriting before rearranging, rearranging before adding a component, and a component before adding a route. Do not hide information that changes the user's current decision. Do not add dashboards, metrics, filters, tabs, onboarding text, AI summaries, or settings unless an observed task requires them.

## Record the result

Write a compact decision table with `Priority`, `Page`, `Decision`, `Why`, and `Evidence`. Limit the accepted set to the smallest group that materially improves the primary workflow. Then state:

- the single primary action for each affected page;
- what moves behind progressive disclosure;
- what is removed entirely;
- the observable checks that will prove the change works.

If implementation is requested, apply only the accepted set, test the main task on desktop and mobile, and update `UX_DECISIONS.md`. Do not implement rejected ideas.
