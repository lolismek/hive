# Task Template

Use this template when creating a new hive task. A task repo must contain:

```
my-task/
  program.md        # Agent instructions (this template)
  agent.py           # The artifact agents evolve
  prepare.sh         # Downloads data. Run once. Read-only.
  eval/eval.sh       # Runs evaluation. Read-only.
  requirements.txt   # Python dependencies
  .gitignore         # data/, run.log, results.tsv, .hive/, __pycache__/
```

---

## program.md template

```markdown
# <Task Name> Solver

<One-line description of the task.>

## Setup

1. **Read the in-scope files**: The repo is small. Read these files for full context:
   - `agent.py` — the file you modify. <Brief description>.
   - `eval/eval.sh` — runs evaluation. Do not modify.
   - `prepare.sh` — downloads the dataset. Do not modify.
2. **Run prepare**: `bash prepare.sh` to download the dataset.
3. **Verify data exists**: Check that `data/` contains `test.jsonl`. If not, run `bash prepare.sh`.
4. **Initialize results.tsv**: Create `results.tsv` with just the header row.
5. **Run baseline**: `bash eval/eval.sh` to establish the starting accuracy.

## The benchmark

<Describe what the benchmark tests, how many problems, what categories/domains, what each problem looks like.>

Total: **<N> test problems**. <Brief description of input/output format.>

## Experimentation

**What you CAN do:**
- Modify `agent.py` — this is the only file you edit. Everything is fair game: prompting strategy, few-shot examples, chain-of-thought, self-verification, answer extraction, retry logic.

**What you CANNOT do:**
- Modify `eval/`, `prepare.sh`, or test data.
- Change the model. The model is fixed (set via `SOLVER_MODEL` env var).
- Install new packages beyond what's in `requirements.txt`.

**The goal: maximize <metric>.** <Describe what counts as correct and how accuracy is computed.>

**Cost** is a soft constraint. Some increase in API calls is acceptable for meaningful accuracy gains, but prefer single-pass solutions.

**Simplicity criterion**: All else being equal, simpler is better. A small improvement that adds ugly complexity is not worth it.

**The first run**: Always establish the baseline first by running the eval as-is.

## Output format

The eval prints a summary:

```
---
accuracy:         0.5000
correct:          50
total:            100
```

You can extract the key metric:

```
grep "^accuracy:" run.log
```

## Logging results

Log each experiment to `results.tsv` (tab-separated):

```
commit	accuracy	cost_usd	status	description
a1b2c3d	0.500000	0.42	keep	baseline
b2c3d4e	0.560000	0.50	keep	chain-of-thought prompting
c3d4e5f	0.490000	0.90	discard	retry 3x (no gain, 2x cost)
d4e5f6g	0.000000	0.00	crash	bad prompt template
```

## The experiment loop

LOOP FOREVER:

1. **THINK** — decide what to try next. This is the most important step. Review your results.tsv, think about what worked and what didn't, form a hypothesis for your next experiment.
2. Modify `agent.py` with your experimental idea.
3. git commit
4. Run the experiment: `bash eval/eval.sh > run.log 2>&1`
5. Read out the results: `grep "^accuracy:" run.log`
6. If the grep output is empty, the run crashed. Run `tail -n 50 run.log` for the stack trace and attempt a fix.
7. Record the results in results.tsv (do not commit results.tsv).
8. If accuracy improved (higher), keep the git commit. If equal or worse, `git reset --hard HEAD~1`.

**Timeout**: If a run exceeds 30 minutes, kill it and treat it as a failure.

**Crashes**: If it's a dumb fix (typo, bad format), fix and re-run. If fundamentally broken, skip it.

**NEVER STOP**: Once the loop begins, do NOT pause to ask the human. The human might be asleep. You are autonomous. If you run out of ideas, think harder — try combining previous near-misses, try more radical prompting strategies, read the code for new angles. The loop runs until interrupted.
```

---

## agent.py template (text-based tasks)

```python
"""<Task> solver — <brief description>.

Takes <input description> on stdin, prints <output description> on stdout.
"""

import sys
import os
import re

from openai import OpenAI


def solve(question: str) -> str:
    client = OpenAI()
    response = client.chat.completions.create(
        model=os.environ.get("SOLVER_MODEL", "gpt-4.1-nano"),
        messages=[
            {"role": "system", "content": "<System prompt — tell the model what to do and what format to output.>"},
            {"role": "user", "content": question},
        ],
        temperature=0,
        max_tokens=1024,
    )
    answer = response.choices[0].message.content.strip()
    # Extract/normalize the answer as needed
    return answer


if __name__ == "__main__":
    print(solve(sys.stdin.read().strip()))
```

## agent.py template (vision tasks)

```python
"""<Task> solver — <brief description>.

Takes a JSON task on stdin (question + image_path), prints the answer on stdout.
"""

import sys
import os
import json
import base64

from openai import OpenAI


def solve(question: str, image_path: str) -> str:
    client = OpenAI()

    with open(image_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()

    response = client.chat.completions.create(
        model=os.environ.get("SOLVER_MODEL", "gpt-4.1-mini"),
        messages=[
            {"role": "user", "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}},
                {"type": "text", "text": question},
            ]},
        ],
        temperature=0,
        max_tokens=256,
    )
    return response.choices[0].message.content.strip()


if __name__ == "__main__":
    data = json.loads(sys.stdin.read().strip())
    print(solve(data["question"], data["image_path"]))
```

---

## prepare.sh template

```bash
#!/usr/bin/env bash
set -euo pipefail
mkdir -p data

echo "Downloading <dataset>..."
python3 << 'PY'
from datasets import load_dataset
import json, pathlib

ds = load_dataset('<hf-dataset-id>', split='test')
out = pathlib.Path('data/test.jsonl')
with out.open('w') as f:
    for row in ds:
        f.write(json.dumps({
            'question': row['<question_field>'],
            'answer': str(row['<answer_field>']),
        }) + '\n')
print(f'Wrote {len(ds)} problems to {out}')
PY
echo "Done. $(wc -l < data/test.jsonl) problems in data/test.jsonl"
```

For vision tasks, also save images:

```bash
python3 << 'PY'
# ... inside the loop:
img = row['image'].convert('RGB') if row['image'].mode != 'RGB' else row['image']
img.save(f'data/images/{i:04d}.jpg')
# ... add image_path to the JSON
PY
```

---

## eval/eval.sh template (string comparison)

```bash
#!/usr/bin/env bash
set -euo pipefail

DATA="data/test.jsonl"
if [ ! -f "$DATA" ]; then
    echo "ERROR: $DATA not found. Run: bash prepare.sh" >&2
    exit 1
fi

TOTAL=$(wc -l < "$DATA")
CORRECT=0

echo "Evaluating $TOTAL problems..." >&2

while IFS= read -r line; do
    question=$(echo "$line" | python3 -c "import sys,json; print(json.load(sys.stdin)['question'])")
    expected=$(echo "$line" | python3 -c "import sys,json; print(json.load(sys.stdin)['answer'])")
    got=$(echo "$question" | python3 agent.py 2>/dev/null || echo "ERROR")

    # Normalize: strip whitespace, remove commas, trailing .0
    normalize() { echo "$1" | tr -d ',' | sed 's/\.0*$//' | xargs; }
    got_norm=$(normalize "$got")
    exp_norm=$(normalize "$expected")

    if [ "$got_norm" = "$exp_norm" ]; then
        CORRECT=$((CORRECT + 1))
    fi
done < "$DATA"

ACCURACY=$(python3 -c "print(f'{$CORRECT / $TOTAL:.6f}')")

echo "---"
echo "accuracy:         $ACCURACY"
echo "correct:          $CORRECT"
echo "total:            $TOTAL"
```

## eval/eval.sh template (code execution)

For tasks where the agent generates code that must be tested:

```bash
#!/usr/bin/env bash
set -euo pipefail

DATA="data/test.jsonl"
if [ ! -f "$DATA" ]; then
    echo "ERROR: $DATA not found. Run: bash prepare.sh" >&2
    exit 1
fi

echo "Evaluating from $DATA..." >&2
python3 eval/run_all.py "$DATA"
```

With a `eval/run_all.py` that runs each problem through `agent.py` and tests the output.

---

## .gitignore template

```
data/
run.log
results.tsv
.hive/
__pycache__/
```

## requirements.txt template

```
openai>=1.0.0
datasets>=2.0.0
```

Add `Pillow>=9.0.0` for vision tasks.

---

## Creating a task

```bash
# 1. Create the task directory with all files
mkdir -p my-task/eval
# ... create program.md, agent.py, prepare.sh, eval/eval.sh, requirements.txt, .gitignore

# 2. Test locally
cd my-task && bash prepare.sh && bash eval/eval.sh

# 3. Upload via hive CLI
hive task create <task-id> --name "<Name>" --path ./my-task --description "<description>"
```

## Checklist before uploading

- [ ] `bash prepare.sh` downloads data successfully
- [ ] `bash eval/eval.sh` runs and prints `accuracy:` line
- [ ] Baseline accuracy is > 0 on at least some problems (test with a stronger model if needed)
- [ ] `agent.py` uses `SOLVER_MODEL` env var for the model name
- [ ] `program.md` follows the full template (setup, benchmark, experimentation, output, logging, loop)
- [ ] `.gitignore` excludes `data/`, `run.log`, `results.tsv`, `.hive/`, `__pycache__/`
