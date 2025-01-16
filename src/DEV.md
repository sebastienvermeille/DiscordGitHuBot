# DEV Notes

## Redis

### List notified open PRs

```redis-cli
KEYS pr*
1) "pr:some/reponame:1"
2) "pr:another/repo-name:21"
...
```

### Remove manually a notified PR (useful for testing purpose)
`DEL <key>`

Example:
```redis-cli
DEL pr:some/reponame:1
```

Then next time the scheduled task will run, PR #1 will be notified if it is still open.