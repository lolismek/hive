#!/usr/bin/env bash
# Download GSM8K test set. Run once.
set -euo pipefail

mkdir -p data

echo "Downloading GSM8K test set..."
python3 -c "
from datasets import load_dataset
import json, pathlib

ds = load_dataset('openai/gsm8k', 'main', split='test[:50]')
out = pathlib.Path('data/test.jsonl')
with out.open('w') as f:
    for row in ds:
        answer_text = row['answer']
        # extract numeric answer after ####
        final = answer_text.split('####')[-1].strip().replace(',', '')
        f.write(json.dumps({'question': row['question'], 'answer': final}) + '\n')

print(f'Wrote {len(ds)} problems to {out}')
"

echo "Done. $(wc -l < data/test.jsonl) problems in data/test.jsonl"
