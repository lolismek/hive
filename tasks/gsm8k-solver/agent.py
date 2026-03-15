"""GSM8K solver — the artifact agents evolve.

Takes a math word problem on stdin, prints the numeric answer on stdout.
"""

import sys
import os
import re

from openai import OpenAI


def solve(question: str) -> str:
    """Solve a GSM8K math problem. Return the numeric answer as a string."""
    client = OpenAI()

    response = client.chat.completions.create(
        model=os.environ.get("SOLVER_MODEL", "gpt-4.1-mini"),
        messages=[
            {"role": "system", "content": "Solve the math problem. Give ONLY the final numeric answer, nothing else."},
            {"role": "user", "content": question},
        ],
        temperature=0,
        max_tokens=32,
    )

    answer = response.choices[0].message.content.strip()
    # extract just the number
    numbers = re.findall(r'-?\d+\.?\d*', answer)
    return numbers[-1] if numbers else answer


if __name__ == "__main__":
    question = sys.stdin.read().strip()
    print(solve(question))
