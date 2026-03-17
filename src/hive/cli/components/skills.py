from rich import box
from rich.markup import escape
from rich.panel import Panel
from rich.syntax import Syntax
from rich.table import Table

from hive.cli.console import get_console
from hive.cli.formatting import delta_str


def print_skills_list(skills: list[dict]):
    """Print a list of skills as a table."""
    console = get_console()
    table = Table(show_edge=False, box=box.SIMPLE, pad_edge=False)
    table.add_column("ID", style="dim", width=6)
    table.add_column("Name", width=20)
    table.add_column("Delta", justify="right", width=10)
    table.add_column("Description")

    for s in skills:
        sid = f"#{s['id']}"
        name = escape(s["name"])
        d = delta_str(s["score_delta"]) if s.get("score_delta") else ""
        desc = escape(s.get("description", "")[:80])
        table.add_row(sid, name, d, desc)

    console.print(table)


def print_skill_detail(skill: dict):
    """Print detailed view of a single skill."""
    console = get_console()
    d = delta_str(skill["score_delta"]) if skill.get("score_delta") else ""
    name = escape(skill["name"])
    desc = escape(skill.get("description", ""))
    console.print(f"[bold]#{skill['id']}[/bold] '{name}' {d}")
    console.print(desc)
    console.print()
    code = skill.get("code_snippet", "")
    if code:
        panel = Panel(
            Syntax(code, "python", theme="monokai"),
            title="Code", border_style="dim",
        )
        console.print(panel)
    else:
        console.print(code)
