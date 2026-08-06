I've been running data tickets through an AI coding agent for a while now — dbt models, tests, BI changes, the whole path from a ticket to a merged pull request. The interesting part wasn't the code generation. It was discovering that an agent left to its own devices produces work that *looks* finished, and that the fix is not a better prompt but a better **process** with places where the agent is forced to stop.

Here's the shape that ended up working.

## One command, one source of truth

The workflow is a short chain of slash commands, one per stage of a ticket's life:

- **Load context** — pull the ticket, then follow every ticket and pull request it references, and summarise each in a few lines. Almost every mistake I've watched an agent make traces back to context it never loaded.
- **Scope** — a top-down gap analysis: does the BI layer already serve this? If not, does the model layer expose the right columns at the right grain? If not, does the data exist in the warehouse at all? Stop descending as soon as a layer already has what you need. This step writes nothing — it just decides where the work actually lives.
- **Spec** — turn the loaded context into a written spec: constraints, acceptance criteria, files in scope, and an explicit list of anti-patterns to avoid. Then plan test-first.
- **Build** — the main command.
- **Prove** — a structured data proof against the built model.
- **Close** — commit, pull request with the evidence attached, ticket moved and commented.
- **Review loop** — pull every review comment, fix or decline each one, and reply under every single thread.

The build command is deliberately thin. It doesn't restate the rules; it points at a single configuration file that holds them. The moment process lives in two places, the two copies drift, and the agent follows whichever one it read most recently.

## The two gates are the whole trick

Everything above is scaffolding. These two are the reason the output is trustworthy.

### Gate 1 — plan review, before a single file is written

The agent explores, proposes an architecture, and then **stops** until I type "proceed". Not a summary I can skim — a checklist it has to answer:

- Does the grain of each model match the acceptance criteria?
- Are any new joins introduced? If so, where's the fan-out risk?
- Does this modify an existing model? Then what's downstream?
- Are all new columns covered by the test plan?
- Is the materialization justified? Was incremental explicitly evaluated, not just defaulted to?
- For large sources: is partition pruning confirmed? Is any full historical scan justified?

Nearly every bad idea I've caught was caught here, at zero cost. Once code exists, the sunk-cost pull is real for humans and agents alike.

### Gate 2 — parallel verification, before a single commit

Two agents, spawned at once, doing jobs that conflict of interest makes impossible for the author:

**A reviewer with fresh context**, told plainly that it did *not* write this code. It reads the diff and the conventions file and reports anti-patterns, naming violations, join cardinality risks, and missing or redundant tests — with file and line numbers.

**A data proof.** For every changed model: row count in dev versus production, a null count for each new column, a fan-out check comparing total rows against distinct primary keys, and a sample that exercises the specific change.

Then hard exit criteria. Not "looks good" — four boxes that must all be true before anything is committed. A non-zero null on a column that carries a not-null test means that test *will* fail in CI. A row count that doesn't match distinct primary keys means the uniqueness test *will* fail. Both are knowable in seconds, locally, for free.

This is the principle the whole thing rests on: **CI is the last line of defence, not the first.** If you let the pipeline be your first check, you've outsourced your judgement to a queue with a fifteen-minute feedback loop.

## The rules that earn their place

A few conventions in the config file do disproportionate work:

- **Raw sources never reach the BI layer directly.** Anything a dashboard touches goes through a staging model first, with types, tests and documentation — even when the ticket is described as "BI-only". The shortcut is always available and always costs more later.
- **Every model justifies its materialization.** Expected volume, growth rate, partitioning, whether incremental genuinely fits. Incremental is right when the source is large and growing and there's a stable timestamp; it's wrong when correctness needs full recomputation or history changes unpredictably. Making the agent write the justification down surfaces the cases where there isn't one.
- **Every acceptance criterion needs a named proof** — a query, a test, an output. And the line I keep coming back to: *no evidence equals failed verification*.
- **The loop closes in the tracker.** Every ticket ends with a comment carrying the pull request link, the verification numbers, and any follow-ups. Work that isn't written down didn't happen.

## Turning "probably fine, but…" into a ticket

My favourite small piece. Before committing, the agent has to ask itself whether it thought *probably fine, but…* at any point. If so: either fix it now, or run a command that files it as a real subtask on the current ticket.

That hesitation is the most valuable signal in the entire process and it is the one most likely to evaporate. Every unresolved doubt either becomes a fix or becomes a ticket. Nothing gets to stay a feeling.

## What makes it reproducible

The failure mode I ran into is worth more than the workflow itself: **for months, this only worked on my machine.** The commands lived in files I'd never committed. The configuration the whole chain depends on wasn't in version control. Two of the automated safety checks I'd documented turned out never to have been installed at all — they read like enforcement, but nothing ran them. And a few files carried hard-coded personal paths and personal schema names, so anyone else running them would quietly point at the wrong place.

So if you build something like this, the checklist is short:

- Commit the command files and the configuration. If a teammate's fresh clone can't run it, you have a personal habit, not a team workflow.
- Parameterise anything personal — paths, schema names, usernames.
- If you document an automated gate, verify it actually fires. A gate that exists only in prose is worse than no gate, because people trust it.
- Keep the permission list narrow. Read-only exploration allowed by default; anything that writes to production or deletes explicitly denied.

The agent is genuinely good at the work. What it can't do is decide when to stop and check — that part is still the engineering. 🌳
