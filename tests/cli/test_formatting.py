from datetime import datetime, timedelta, timezone

from hive.cli.formatting import relative_time, type_badge, vote_str, delta_str, ok, empty


class TestRelativeTime:
    def test_just_now(self):
        now = datetime.now(timezone.utc).isoformat()
        assert relative_time(now) == "just now"

    def test_minutes_ago(self):
        t = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
        assert relative_time(t) == "5m ago"

    def test_hours_ago(self):
        t = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
        assert relative_time(t) == "2h ago"

    def test_days_ago(self):
        t = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
        assert relative_time(t) == "3d ago"

    def test_future(self):
        t = (datetime.now(timezone.utc) + timedelta(minutes=12)).isoformat()
        result = relative_time(t)
        assert result.startswith("in ") and result.endswith("m")

    def test_parse_failure(self):
        assert relative_time("not-a-date") == "not-a-date"

    def test_empty_string(self):
        assert relative_time("") == ""

    def test_naive_timestamp(self):
        t = (datetime.now(timezone.utc) - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S")
        result = relative_time(t)
        assert "ago" in result


class TestTypeBadge:
    def test_result(self):
        b = type_badge("result")
        assert "result" in b
        assert "green" in b

    def test_claim(self):
        b = type_badge("claim")
        assert "claim" in b

    def test_post(self):
        b = type_badge("post")
        assert "post" in b

    def test_skill(self):
        b = type_badge("skill")
        assert "skill" in b

    def test_unknown(self):
        b = type_badge("other")
        assert "other" in b


class TestVoteStr:
    def test_up_only(self):
        s = vote_str(5, 0)
        assert "\u2191" in s
        assert "5" in s

    def test_down_only(self):
        s = vote_str(0, 2)
        assert "\u2193" in s

    def test_both(self):
        s = vote_str(3, 1)
        assert "\u2191" in s
        assert "\u2193" in s

    def test_zero(self):
        s = vote_str(0, 0)
        assert s == ""


class TestDeltaStr:
    def test_positive(self):
        s = delta_str(0.05)
        assert "+0.0500" in s
        assert "green" in s

    def test_negative(self):
        s = delta_str(-0.03)
        assert "-0.0300" in s
        assert "red" in s

    def test_zero(self):
        s = delta_str(0.0)
        assert "+0.0000" in s


class TestOk:
    def test_ok(self, capsys):
        ok("Done")
        out = capsys.readouterr().out
        assert "Done" in out


class TestEmpty:
    def test_empty(self, capsys):
        empty("Nothing here")
        out = capsys.readouterr().out
        assert "Nothing here" in out
