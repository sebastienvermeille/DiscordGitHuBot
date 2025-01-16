import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import { fetch } from 'undici';
import {container} from "@sapphire/framework";
import {TextChannel} from "discord.js";
import {createClient, RedisClientType} from "redis";
import { randomInt } from 'crypto';
import {getEnvVariable, getEnvVariableOrDefault} from "../lib/env.utils";
import {FrameworkInjected} from "../lib/annotations";

interface Issue {
    number: number;
    title: string;
    html_url: string;
}

@FrameworkInjected()
export class CheckNewGitHubIssues extends ScheduledTask {

    private readonly repositories: string[] = this.getRepositoriesFromEnv();

    private readonly issue_messages: string[] = [
        ":warning: A new issue has been reported! Check it out!",
        ":exclamation: A new issue just appeared! Let's take a look.",
        ":bug: A fresh bug/question has arrived. Time to investigate!",
        ":memo: New issue reported! Time to prioritize it.",
        ":eyes: A new issue needs your attention!",
        ":bug: New issue alert! Let’s see what’s happening.",
        ":wrench: Someone’s raised an issue. Let’s fix it.",
        ":bell: A new issue just popped up. Let’s address it!",
    ];

    private redisClient: RedisClientType<Record<string, any>>;

    public constructor(context: ScheduledTask.LoaderContext, options: ScheduledTask.Options) {
        super(context, {
            ...options,
            pattern: '*/5 * * * *' // Each 5 minutes
        });

        this.redisClient = this.initializeRedisClient();
    }

    private initializeRedisClient(): RedisClientType<Record<string, any>> {
        const redisConfig = {
            socket: {
                host: getEnvVariable('REDIS_HOST'),
                port: parseInt(getEnvVariableOrDefault('REDIS_PORT', '6379')),
            },
            password: getEnvVariableOrDefault('REDIS_PASSWORD', ''),
        };

        const client: RedisClientType<Record<string, any>> = createClient(redisConfig);

        client.on('error', (err) => container.logger.error('Redis Client Error:', err));

        client.connect().catch((err) =>
            container.logger.error('Failed to connect to Redis:', err)
        );

        return client;
    }

    // Helper function to get repositories list from environment variable
    private getRepositoriesFromEnv(): string[] {
        const repositoriesEnv = getEnvVariableOrDefault('REPOSITORIES_ISSUES', '');
        return repositoriesEnv.split(',').map(repo => repo.trim());
    }

    public async run() {
        await this.checkOpenIssues();
    }

    private async checkOpenIssues(): Promise<void> {
        const token = getEnvVariable('GITHUB_TOKEN');
        const headers = {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'SapphireBot',
        };

        for (const repo of this.repositories) {
            const url = `https://api.github.com/repos/${repo}/issues?state=open`;
            try {
                const issues = await this.fetchIssues(url, headers);
                await this.processIssues(repo, issues);
            } catch (error) {
                container.logger.error(`Error fetching issues for ${repo}:`, error);
            }
        }
    }

    private async fetchIssues(url: string, headers: Record<string, string>): Promise<Issue[]> {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`Failed to fetch issues: ${response.statusText}`);
        }

        return (await response.json()) as Issue[];
    }

    private async processIssues(repo: string, issues: Issue[]): Promise<void> {
        for (const issue of issues) {
            const issueKey = this.getRedisKey(repo, issue.number);

            if (!(await this.isIssueAlreadyReported(issueKey))) {
                await this.reportNewIssue(repo, issue, issueKey);
            }
        }
    }

    private getRedisKey(repo: string, issueNumber: number): string {
        return `issue:${repo}:${issueNumber}`;
    }

    private async isIssueAlreadyReported(issueKey: string): Promise<boolean> {
        return Boolean(await this.redisClient.get(issueKey));
    }

    private async reportNewIssue(repo: string, issue: Issue, issueKey: string): Promise<void> {
        container.logger.info(`Reporting new issue in ${repo}: ${issue.title}`);
        await this.sendRandomIssueMessage(issue);
        await this.redisClient.set(issueKey, 'reported');
    }

    private async sendRandomIssueMessage(issue: Issue): Promise<void> {
        try {
            const randomMessage = this.selectRandomMessage();
            const messageContent = `${randomMessage}\n${issue.html_url}`;
            const channelId = getEnvVariable('ISSUE_NOTIFICATION_CHANNEL_ID'); // A channel different from the PR notifications
            const channel = container.client.channels.cache.get(channelId);

            if (channel instanceof TextChannel) {
                const sentMessage = await channel.send(messageContent);
                await sentMessage.react('🔧'); // Reaction to indicate the issue was acknowledged
            } else {
                container.logger.error('Invalid or non-text channel for issue notifications.');
            }
        } catch (error) {
            container.logger.error('Error sending issue message to Discord:', error);
        }
    }

    private selectRandomMessage(): string {
        const messages = this.issue_messages;
        const randomIndex = randomInt(0, messages.length);
        return messages[randomIndex];
    }

    public override async onUnload() {
        // Ensure Redis client is closed when the task is unloaded
        await this.redisClient.disconnect();
        this.container.logger.info('Redis client disconnected.');
    }
}

declare module '@sapphire/plugin-scheduled-tasks' {
    // appear unused, however this comes from the official documentation:
    // https://github.com/sapphiredev/plugins/tree/main/packages/scheduled-tasks#creating-the-piece-1
    interface ScheduledTasks {
        interval: never;
    }
}
