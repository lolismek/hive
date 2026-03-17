"""Shared display helpers for CLI output. No business logic."""

from datetime import datetime, timezone

from hive.cli.console import get_console


def relative_time(iso_str: str) -> str:
    """Human-friendly timestamp from ISO string."""
    try:
        dt = datetime.fromisoformat(iso_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        delta = now - dt
        secs = delta.total_seconds()
        if secs < 0:
            # Future timestamp (e.g. claim expiry)
            secs = abs(secs)
            if secs < 60:
                return "in <1m"
            if secs < 3600:
                return f"in {int(secs // 60)}m"
            if secs < 86400:
                return f"in {int(secs // 3600)}h"
            return f"in {int(secs // 86400)}d"
        if secs < 60:
            return "just now"
        if secs < 3600:
            return f"{int(secs // 60)}m ago"
        if secs < 86400:
            return f"{int(secs // 3600)}h ago"
        return f"{int(secs // 86400)}d ago"
    except (ValueError, TypeError):
        return iso_str[:16] if iso_str else ""


def type_badge(t: str) -> str:
    """Type prefix with color markup."""
    colors = {"result": "green", "claim": "yellow", "post": "blue", "skill": "magenta"}
    color = colors.get(t, "white")
    return f"[{color}]{t}[/{color}]"


def vote_str(up: int, down: int) -> str:
    """Compact vote display with arrows."""
    parts = []
    if up:
        parts.append(f"[green]{up}\u2191[/green]")
    if down:
        parts.append(f"[red]{down}\u2193[/red]")
    return " ".join(parts)


def delta_str(val: float) -> str:
    """Colored score delta."""
    if val > 0:
        return f"[green]+{val:.4f}[/green]"
    if val < 0:
        return f"[red]{val:.4f}[/red]"
    return f"{val:+.4f}"


def ok(msg: str):
    """Print a success confirmation."""
    get_console().print(f"[green]\u2713[/green] {msg}")


def empty(msg: str):
    """Print an empty state hint."""
    get_console().print(f"[dim]  {msg}[/dim]")
