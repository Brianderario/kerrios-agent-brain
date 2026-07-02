# Decision: No Client-Facing Asset Submission Forms from the Savant Console

scope: decision · updated: 2026-07-02 · author: Brian (directive) + Kerri

## Decision

The Savant console must **NOT send asset submission forms (or any asset-chase email / sponsor asset portal invite) to customers**. The product is not ready. Effective immediately and until Brian explicitly re-enables it in writing.

Asset-due reminders are **internal-only**: they go to **Benji and Brian** (Console card and/or internal email) as a reminder to collect the assets themselves — never to the client.

Brian, 2026-07-02 (Claude Code remote session): "On the savant console we should definitely not be sending Asset submission forms to our customers yet. The product is simply not ready. Please cancel that capability immediately. It should only go to Benji and me as a reminder not to the client."

**Enforced in kerrihq-rails PR #315 (merge `48e9108`), deployed to Render 2026-07-02 21:55Z.** Client chase mailer deleted; `contact_email` disarmed (validation + stripped from forms/params/importers); prod data cleared (5 armed rows: Modelwise, Quilter, Xometry, Aris Machina x2 — addresses preserved in commitment notes); 💡 831f1ccd folded in (one open reminder card per commitment, 6 dupes collapsed). NOTE: before the fix landed, the 2026-07-02 13:00Z run had already emailed forms to lowri.davies@modelwise.ai and iryna@quilter.ai from info@hardwarefyi.com (the only client sends this path ever made); their portal links remain live — rotating those tokens is an open call for Brian. Savant brain record: fa1cc823 (candidate).

## The capability being cancelled

- kerrihq-rails ships a `sponsor_asset_reminders` Solid Queue job (registered in the production scheduler on Render, fires **13:00Z daily**) — the "7-day asset chase" built with the newsletter inventory console (kerrihq-rails `a2924ba` + `c6b50b0`, live since 2026-06-11; see brain/log.md 2026-06-11 newsletter-inventory-console).
- Today it files "Sponsor assets due — <Sponsor>" Console tasks for Benji, **and** contains a client-facing chase-email path that arms itself per SponsorCommitment the moment `contact_emails` are set on the commitment. As of the last verified evidence (2026-06-11) no sponsor contact_emails were imported, so client emails were dormant — but the capability exists in production and one data entry away from firing.
- The same build includes the **sponsor asset portal** (client-facing submission form). Portal invites / form links to sponsors are covered by this decision too.

## Required change (kerrihq-rails — queued for interactive apply)

This session could not touch kerrihq-rails or production (repo out of scope, no Savant credentials in the remote container), so the enforcement lands next interactive session:

1. **Remove or hard-disable the client-email path** in `sponsor_asset_reminders` (feature flag default-off; no code path that emails a sponsor contact an asset form/portal link).
2. **Route the reminder internally instead**: keep the Benji Console task and add Brian+Benji as the reminder recipients (internal email or card assignment) — the reminder's job is to prompt Benji/Brian to collect assets manually.
3. **Interim data guard**: audit SponsorCommitments for any populated `contact_emails` and clear them; do not set contact_emails on commitments while this decision stands (that field is what arms client sends).
4. Fold in the already-approved dedup fix 💡 **831f1ccd** (upsert one open reminder card per SponsorCommitment; collapse existing duplicate cards) — same job, same interactive apply.
5. Sweep any other Savant surface that could email a sponsor an asset form (portal invite mailers, event sponsor asset requests) and gate them the same way.

## Related

- [[2026-06-11-brain-console-storage-split]]
- [[2026-06-17-savant-as-company-hub]]
- brain/log.md 2026-06-11 newsletter-inventory-console (feature build + dormant-client-email note); 2026-06-18 15:39 ET 💡 831f1ccd (reminder-card dedup, approved, queued)
