# Discord GitHuBot

Discord bot using [sapphire framework](https://sapphirejs.dev/) written in TypeScript.

Redis is used to store previously notified PRs and schedule tasks.

## Features

* Notify on a specific discord channel when a Pull request has been created
* Notify on a specific discord channel when a new issue has been created
* Ping command to be aware if the bot is alive or not

## How to use it?

### Install dependencies

```sh
yarn
```

### Development

Create a `.env.development.local` next to `.env` file and store all the env settings (this file is excluded from .gitignore).
Fill it with proper values and then run the following command:

```sh
yarn run watch:start
```

> This provides hot reload feature (convenient)

### Production

Use the Dockerfile