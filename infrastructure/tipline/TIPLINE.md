# ReportersDesk — Secure Tip Line

## Why this is its own document, on its own server, in its own repo folder

Every other piece of infrastructure in this project — the CMS, the landing pages, the payments webhook — assumes a breach is recoverable: restore from backup, rotate a key, move on. A breach of the tip line is not recoverable in the same way, because the thing it would expose is a person's safety. That's the entire design constraint here, and it overrides convenience every time the two are in tension.

## The isolation rule

`infra/tipline/` never talks to `infra/vps/` (the main CMS server) or to the Postgres database in `reportersdesk-cms/`. Not via a shared network, not via a shared backup destination, not via a cron job that happens to touch both. If a future contributor's instinct is "let's just add a `tips` table to Payload, it'd be so much easier to manage" — that instinct is the thing to override. (`SCHEMA.md` in the CMS package has the long version of this argument.)

## What actually crosses the boundary, and how

Nothing automatic. When a reporter reviews a tip on the tip-line instance and decides it's worth following up, **they manually create an `RTIRequests` or draft `Articles` entry in the main CMS themselves**, writing only what they choose to carry forward — never an export, never a sync job, never the original submission text or any metadata about it. The tip line and the newsroom's working tools are bridged by a human's judgment, on purpose, not by a pipe.

## Operational rules for whoever runs this

- **No request logging at the reverse-proxy layer** — see the `Caddyfile` comment. If you need to know the service is up, hit a health endpoint from outside; don't turn on access logs "just for debugging" and forget to turn them back off.
- **No shared credentials** with the main infrastructure. A different SSH key, a different cloud account if you can manage it, certainly a different VPS.
- **Prefer the Tor hidden service** over exposing this on the public web with a normal domain — the compose file sets this up as an option. A source using Tor Browser to reach a `.onion` address leaks far less than one filling out a form on `tips.reportersdesk.in`.
- **Confirm the actual deployment steps against Hush Line's current docs before going live.** I flagged this in the compose file too: I don't have a verified, current image reference for their project, and guessing one for a tool source safety depends on would be worse than leaving it blank.

## What this document is not

It's not a substitute for the newsroom having an actual, written source-protection policy that every reporter has read — what you will and won't do if law enforcement asks for tip-line data, how long anything is retained, who has access to the server. That's an editorial and legal document, not an infrastructure one, and it should exist before this goes live.
