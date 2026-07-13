# Inbox Sweep Files Sponsor Assets Autonomously

scope: decision · updated: 2026-07-13 · owner: Brian D'Erario

## Decision

When a sponsor sends usable creative to a mailbox covered by the inbox sweep,
the sweep files the supplied asset into the matching live Savant sponsor
commitment during the same run. Asset filing is autonomous internal fulfillment
work. It does not require Brian approval and must not be deferred to Benji when
the sweep already has the file and can match the commitment unambiguously.

This authorization does not expand external-send authority. The sweep does not
reply to the sponsor merely because it filed an asset.

## Required proof

The sweep must:

1. Download the actual attachment bytes from the correct mailbox.
2. Verify the sponsor, commitment, placement date, file type, decoded size, and
   dimensions when applicable.
3. Check Savant for an existing copy before uploading.
4. File the asset on the exact live commitment or its verified scoped sponsor
   portal.
5. Read Savant again and prove the asset appears and the missing-assets state
   changed.
6. Preserve compact mailbox and attachment provenance on the asset and the
   existing fulfillment card.

If the commitment is ambiguous, the file is corrupt, or the live write cannot
be verified, the sweep fails closed and routes one specific Team Task. It never
guesses a commitment or reports a metadata-only read as an upload.

## Origin

Brian's direct instruction in the July 13, 2026 Codex session after the Aris
Machina July 21 Primary Placement sweep received and validated the sponsor PNG
but stopped at task creation. The image was then filed to Aris Machina's live
Savant commitment and the hub changed from `Still needed: Hero Image` to
`Assets complete`.
