# plan/

Design documents for work on this repo, filed by where the work has got to. The folder a document
sits in is the claim being made about it, so moving it is part of doing the work — not bookkeeping
to be done later.

| folder         | what is in it                                                                     |
| -------------- | --------------------------------------------------------------------------------- |
| `upcoming/`    | Agreed direction, not built yet. Safe to change freely; nothing depends on it.      |
| `review/`      | Built and on a branch, not yet proven. Waiting on a Jenkins run, a PR, or a deploy. |
| `implemented/` | Shipped. Kept as the record of why the code looks the way it does.                  |
| `context/`     | Reference material that is not a plan — investigations, measurements, background.   |

## Working with these

**A plan moves when its status changes, and it does not move silently.** On the way into
`implemented/`, add a `## Status` section at the top saying what actually shipped. That matters
more than it sounds: a plan is written before the work and is usually wrong somewhere, so a
document filed under `implemented/` without that section reads as "the code does this", which is a
claim nobody checked.

Record three things there:

- **What shipped** — one or two lines, and where the code lives.
- **Divergences** — where the built thing differs from the plan, and why. This is the part that
  earns the document its place; a plan that matched reality exactly would not need it.
- **Still open** — anything the plan proposed that was not done. If it is real work, it also gets
  an entry in `upcoming/`, because nobody goes looking for open items inside a file named
  "implemented".

**Do not edit a plan in `implemented/` to match the code.** Rewriting history loses the reason a
decision was made, which is the only thing the document is still good for. Correct it with a
`## Status` note instead.

**A plan that has been superseded outright** stays in `implemented/` if its work shipped in some
other form — say so under Divergences. Only delete one if it was never acted on at all, and then
say so in the commit message.

## Naming

`<YYYY-MM-DD>-<Short-Title>.md`, e.g. `2026-08-16-Containerized-Venv-Plan.md` — dated by when
the document was started. The tracker ticket goes inside the document (a `**Ticket:**` line at
the top), not in the file name: these repositories are public, while ticket keys point at a
private tracker that readers outside the organization cannot open. One ticket can have several
documents; keep them in the same folder only while they share a status.
