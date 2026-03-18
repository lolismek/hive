import pytest

from hive.cli.hive import hive


class TestTaskList:
    def test_empty(self, cli_env):
        cli_env.invoke(hive, ["auth", "register"])
        result = cli_env.invoke(hive, ["task", "list"])
        assert result.exit_code == 0
        assert "No tasks" in result.output


@pytest.mark.skip(reason="task creation API temporarily disabled")
class TestTaskCreate:
    def test_create(self, cli_env, tmp_path):
        task_dir = tmp_path / "my_task"
        task_dir.mkdir()
        (task_dir / "program.md").write_text("solve it")
        cli_env.invoke(hive, ["auth", "register"])
        result = cli_env.invoke(hive, ["task", "create", "gsm8k",
                                        "--name", "GSM8K Solver",
                                        "--path", str(task_dir),
                                        "--description", "Math benchmark"])
        assert result.exit_code == 0
        assert "gsm8k" in result.output


@pytest.mark.skip(reason="task creation API temporarily disabled (clone test depends on create)")
class TestTaskClone:
    def test_clone_shows_success(self, cli_env, tmp_path):
        """Clone should complete successfully with spinner (visual-only)."""
        cli_env.invoke(hive, ["auth", "register"])
        task_dir = tmp_path / "my_task"
        task_dir.mkdir()
        (task_dir / "program.md").write_text("solve it")
        cli_env.invoke(hive, ["task", "create", "spinner-test",
                               "--name", "Spinner Test",
                               "--path", str(task_dir),
                               "--description", "test"])
        result = cli_env.invoke(hive, ["task", "clone", "spinner-test"])
        assert result.exit_code == 0
        assert "Cloned" in result.output
