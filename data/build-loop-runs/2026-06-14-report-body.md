Overnight build on the Renewal Command surface, so every expiring sponsor deal becomes a worked item with its proof attached. Two of three items shipped to production and verified; one piece is built and waiting on a single yes from you. No regressions, production healthy all night.

WHAT IS LIVE NOW (in production, verified)

1. The renewal book in one read. There is a new data feed that returns every closed deal with a contract end date, soonest to expire first, each one carrying its proof: value, days left, whether it is on paper, what we still owe them, and the main contact. I confirmed it returns your five dated renewals exactly: Eight Sleep (June 30, $10,000), Loombotic (July 13, $1,786), Jiga (Aug 15, $12,308), Express Manufacturing (Aug 15, $12,308), and nTop (Sep 15, $5,357).

2. A Renewals worklist screen. New "Renewals" item in the Savant sidebar, under Revenue next to Pipeline. It lists those renewals ranked by soonest expiry then biggest value, with a color days-to-expiry chip, a status badge, a "not papered" flag on the verbal handshakes, and the receipts pulled straight from each deal (placements delivered, latest metric, engagement, what is owed). Read only. Looks clean on desktop and phone.

WHAT I FOUND ALONG THE WAY (needs your call)

While setting up, I discovered your "$1M screen" was silently deleted from production yesterday. A commit titled "Add Savant events and Kinetic ticketing" (June 13, 12:17pm) quietly removed the entire $1M screen, its sidebar link, and the data feed that other agents read, with no mention in its description. Everything we have written treats that screen as live, so this was an accident from a parallel build, not a decision.

I rebuilt it exactly as it was and added the new "Renewals due, next 90 days" tile you asked for, sitting beside the "Owed deliverables" tile. It is fully tested and proven to merge cleanly, but I did NOT put it back into production on my own, because restoring a deleted screen is your call to make, not mine to make overnight.

THE ONE DECISION FOR YOU TODAY

Say the word and I will restore the $1M screen (and the new renewal tile rides along with it). If you actually meant to retire that screen, tell me and I will leave it gone. The work is saved and ready either way on a branch named renewal-command.

STATUS

All quality gates green at every step (style, full test suite at zero failures, security scan clean). Production health checks passed after each release. The data feeds other agents rely on were not changed or removed. Full written record is in the build log for June 14.
