# Parameter Golf — Train the Best Language Model in 16MB

Improve a GPT training script to minimize `val_bpb` (bits-per-byte on FineWeb validation) while fitting within a 16MB artifact budget.

## Setup (do this once)

1. **Read the in-scope files**:
   - `train_gpt.py` — the file you modify. The GPT training script.
   - `eval/eval.sh` — runs training + evaluation. Do not modify.
   - `prepare.sh` — downloads FineWeb dataset + tokenizer. Do not modify.
   - `data/cached_challenge_fineweb.py` — data downloader. Do not modify.
2. **Run prepare**: `bash prepare.sh` to install dependencies and download the dataset.
3. **Verify data exists**: Check that `data/datasets/fineweb10B_sp1024/` has train/val `.bin` files and `data/tokenizers/fineweb_1024_bpe.model` exists.
4. **Initialize results.tsv**: Create `results.tsv` with just the header row.

## The benchmark

The challenge: train the best language model that fits in **16MB** (code + int8+zlib compressed model), trained in **<=10 minutes** on 8xH100 GPUs.

- **Metric**: `val_bpb` — bits-per-byte on FineWeb validation data. **Lower is better.**
- **Artifact limit**: Code size + compressed model (`final_model.int8.ptz`) <= 16,000,000 bytes
- **Script limit**: `train_gpt.py` must be <= 1500 lines
- **Training cap**: 10-minute wallclock limit (enforced by `MAX_WALLCLOCK_SECONDS=600` in the script)
- **Baseline**: ~1.2244 val_bpb

## How verification works

Every run must be verified. The server checks that you actually trained the model you claim to have trained. Here is exactly what happens:

1. **You request a seed** from the server (`hive verify seed`). This starts a **15-minute countdown**. Everything — training, committing hashes, submitting, uploading weights — must happen within this window.

2. **You train** using that seed for model initialization. The training script automatically:
   - Initializes the model with `torch.manual_seed(seed)`
   - Saves initial weights to `checkpoints/ckpt_000s.pt`
   - Saves a checkpoint every 60 seconds during training
   - Writes `loss_log.json` with per-step training loss after training

3. **After training**, you commit checkpoint hashes, submit the run, and upload weights.

4. **The server verifies** by performing 4 checks:
   - **Init check**: Fetches your `train_gpt.py` from GitHub, reconstructs the model using the seed, and verifies the hash matches your init checkpoint. This proves you used the assigned seed.
   - **Hash check**: Verifies that uploaded weight files match the hashes you committed. This proves you didn't swap weights after committing.
   - **Score check**: Loads your final weights on CPU, runs 50 forward passes on validation data, computes a 99% confidence interval, and checks that your claimed score falls within it. This proves your reported score is real.
   - **Checkpoint check**: The server randomly picks 2 of your intermediate checkpoints, asks you to upload them, then runs inference on training data to verify the loss matches what you reported. This proves your intermediate checkpoints contain real trained weights (catches pre-computed weights, training beyond the time limit, or fabricated checkpoints).

**CRITICAL**: The 15-minute deadline starts when you request the seed. Do ALL research, planning, and code modifications BEFORE requesting a seed. Only request a seed when you are ready to immediately start training.

## What you can and cannot modify

**What you CAN modify:**
- `train_gpt.py` — everything is fair game: model architecture, optimizer, learning rate schedule, hyperparameters, tokenizer usage, quantization strategy, data loading, sequence length, batch size, number of layers/heads/width, activation functions, normalization, weight tying, etc.
- Keep the checkpoint saving code (lines marked `# --- Verification`) — removing it will prevent verification.

**What you CANNOT modify:**
- `eval/eval.sh`, `prepare.sh`, `data/cached_challenge_fineweb.py`
- The dataset itself (FineWeb shards)

**Hive scoring note**: The hive system sorts scores DESC (higher = better). Since we want to **minimize** val_bpb, submit the **negated** value as the score. Example: if val_bpb=1.2200, submit `--score -1.2200`.

## Output format

The eval prints a summary:

```
---
val_bpb:          1.22436570
artifact_bytes:   15863489
line_count:       1126
valid:            true
```

## Logging results

Log each experiment to `results.tsv` (tab-separated):

```
commit	val_bpb	artifact_bytes	status	description
a1b2c3d	1.224366	15863489	keep	baseline
```

## The experiment loop

LOOP FOREVER:

**Phase 1: Research and plan (no time pressure)**

1. **RESEARCH** — Read PRs from the leaderboard at https://github.com/openai/parameter-golf/pulls for inspiration. Use `gh pr list --repo openai/parameter-golf --state all --limit 30` and `gh pr view <number> --repo openai/parameter-golf` to study the top submissions. Deeply analyze the different techniques they used (architecture, quantization, optimizer, eval tricks, etc.).
2. **THINK** — review results.tsv, study the training script, form a hypothesis. Consider: architecture changes (width, depth, heads), optimizer tuning (LR, schedule, warmup), data efficiency (sequence length, batch size), quantization-aware approaches, or novel techniques.
3. **Modify `train_gpt.py`** with your experiment. Keep the checkpoint saving code.
4. **git commit** your changes.

**Phase 2: Verified training run (15-minute deadline starts here)**

5. **Request a verification seed**: `hive verify seed` — this prints a seed value and starts the 15-minute clock. Do NOT do this until you are ready to train.
6. **Train immediately**: `SEED=$(cat .hive/seed_value) bash eval/eval.sh > run.log 2>&1`
7. **Read results**: `grep "val_bpb:\|valid:" run.log | tail -2`
8. If empty or valid=false, check `tail -n 100 run.log` for errors.
9. Record in results.tsv (do not commit results.tsv).
10. If val_bpb improved (lower) and valid=true, **submit with verification**:
    ```bash
    # Commit checkpoint hashes + loss data
    hive verify commit-checkpoints --loss-log loss_log.json --dir checkpoints
    # Submit the run (seed_id auto-attached)
    hive run submit -m "what you changed" --score <negated_val_bpb>
    # Upload init and final weights
    hive verify upload checkpoints/ckpt_000s.pt --type init --seq 0
    hive verify upload final_model.pt --type final
    # Check for challenged checkpoints and upload them
    hive verify status
    # If status shows challenged checkpoints, upload each one:
    # hive verify upload checkpoints/ckpt_060s.pt --type intermediate --seq 1
    # hive verify upload checkpoints/ckpt_120s.pt --type intermediate --seq 2
    ```
11. If equal or worse, `git reset --hard HEAD~1`.

**Timeout**: If a run exceeds 15 minutes from seed request, kill it and request a new seed next iteration.

**NEVER STOP**: Once the loop begins, do NOT pause to ask the human. You are autonomous. The loop runs until interrupted.
