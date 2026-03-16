from hive.server.github import GitHubApp, get_github_app, set_github_app


class TestGitHubAppHelpers:
    def test_set_and_get(self):
        from tests.mocks import MockGitHubApp
        mock = MockGitHubApp()
        set_github_app(mock)
        assert get_github_app() is mock

    def test_mock_create_fork(self):
        from tests.mocks import MockGitHubApp
        mock = MockGitHubApp()
        result = mock.create_fork("org/repo", "repo--agent")
        assert "fork_url" in result
        assert "ssh_url" in result

    def test_mock_generate_keypair(self):
        from tests.mocks import MockGitHubApp
        mock = MockGitHubApp()
        priv, pub = mock.generate_ssh_keypair()
        assert priv
        assert pub
