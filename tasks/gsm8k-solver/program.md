# GSM8K Solver

Improve a math problem solver to maximize accuracy on GSM8K.

## Setup

To set up, work with the user to:

1. **Agree on a run tag**: propose a tag based on today's date (e.g. `mar14`). The branch `hive/<tag>` must not already exist.
2. **Create the branch**: `git checkout -b hive/<tag>` from current main.
3. **Read the in-scope files**: The repo is small. Read these files for full context:
   - `README.md` — repository context.
   - `prepare.sh` — downloads GSM8K dataset. Do not modify.
   - `eval/eval.sh` — runs evaluation. Do not modify.
   - `agent.py` — the file you modify. The solver.
4. **Verify data exists**: Check that `data/` contains `test.jsonl`. If not, run `bash prepare.sh`.
5. **Initialize results.tsv**: Create `results.tsv` with just the header row. The baseline will be recorded after the first run.
6. **Confirm and go**: Confirm setup looks good.

Once you get confirmation, kick off the experimentation.

## Experimentation

Each experiment runs on the test set (1,319 problems). You launch it simply as: `bash eval/eval.sh`.

**What you CAN do:**
- Modify `agent.py` — this is the only file you edit. Everything is fair game: prompting strategy, few-shot examples, chain-of-thought, self-verification, answer extraction, retry logic, tool use.

**What you CANNOT do:**
- Modify `prepare.sh` or `eval/eval.sh`. They are read-only.
- Modify the test data. The dataset is the ground truth.
- Change the model. The model is fixed (set via `SOLVER_MODEL` env var).
- Install new packages beyond what's in `requirements.txt`.

**The goal is simple: get the highest accuracy on GSM8K test set.** Accuracy = fraction of problems where your solver's extracted answer matches the ground truth. The metric is a number between 0.0 and 1.0.

**Cost** is a soft constraint. Some increase in API calls is acceptable for meaningful accuracy gains, but it should not blow up dramatically. Prefer solutions that solve problems in a single pass over those that retry many times.

**Simplicity criterion**: All else being equal, simpler is better. A small improvement that adds ugly complexity is not worth it. Conversely, removing something and getting equal or better results is a great outcome. When evaluating whether to keep a change, weigh the complexity cost against the improvement magnitude.

**The first run**: Your very first run should always be to establish the baseline, so you will run the eval as is.

## Output format

Once the eval finishes it prints a summary like this:

```
---
accuracy:         0.8520
correct:          1124
total:            1319
cost_usd:         0.42
```

You can extract the key metric:

```
grep "^accuracy:" run.log
```

## Logging results

When an experiment is done, log it to `results.tsv` (tab-separated).

```
commit	accuracy	cost_usd	status	description
```

1. git commit hash (short, 7 chars)
2. accuracy achieved (e.g. 0.852000) — use 0.000000 for crashes
3. cost in USD, round to .2f — use 0.00 for crashes
4. status: `keep`, `discard`, or `crash`
5. short text description of what this experiment tried

Example:

```
commit	accuracy	cost_usd	status	description
a1b2c3d	0.852000	0.42	keep	baseline
b2c3d4e	0.871000	0.45	keep	add chain-of-thought
c3d4e5f	0.850000	0.90	discard	retry wrong answers 3x (no gain, 2x cost)
d4e5f6g	0.000000	0.00	crash	bad prompt template
```

## The experiment loop

The experiment runs on a dedicated branch (e.g. `hive/mar14`).

LOOP FOREVER:

1. **THINK** — decide what to try next. This is the most important step. Review your results.tsv, think about what worked and what didn't, form a hypothesis for your next experiment.
2. Modify `agent.py` with your experimental idea.
3. git commit
4. Run the experiment: `bash eval/eval.sh > run.log 2>&1`
5. Read out the results: `grep "^accuracy:\|^cost_usd:" run.log`
6. If the grep output is empty, the run crashed. Run `tail -n 50 run.log` for the stack trace and attempt a fix.
7. Record the results in the tsv (do not commit results.tsv)
8. If accuracy improved (higher), keep the git commit. If equal or worse, `git reset --hard HEAD~1`.

**Timeout**: If a run exceeds 30 minutes, kill it and treat it as a failure.

**Crashes**: If it's a dumb fix (typo, bad format), fix and re-run. If fundamentally broken, skip it.

**NEVER STOP**: Once the loop begins, do NOT pause to ask the human. The human might be asleep. You are autonomous. If you run out of ideas, think harder — try combining previous near-misses, try more radical prompting strategies, read the code for new angles. The loop runs until interrupted.