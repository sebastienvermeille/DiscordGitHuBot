import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import { fetch } from 'undici';
import {container} from "@sapphire/framework";
import {TextChannel} from "discord.js";
import {createClient, RedisClientType} from "redis";
import { randomInt } from 'crypto';
import {getEnvVariable, getEnvVariableOrDefault} from "../lib/env.utils";
import {FrameworkInjected} from "../lib/annotations";

interface PullRequest {
    number: number;
    title: string;
    html_url: string;
}

@FrameworkInjected()
export class CheckOpenPullRequestsTask extends ScheduledTask {

    private readonly repositories: string[] = this.getRepositoriesFromEnv();

    private readonly pr_messages: string[] = [
        ":rocket: A new PR just landed! Get ready to test something amazing!",
        ":tada: A fresh PR is here! Time to see what magic has been cooked up!",
        ":wrench: Someone’s been hard at work! Let's review their latest PR.",
        ":fire: PR incoming! Brace yourselves for some blazing new code.",
        ":bulb: A new idea has been committed! Let's take a look at this PR.",
        ":boom: Something big just dropped in the PR feed! Time to check it out.",
        ":zap: The code gods have blessed us with a new PR! Let's make it shine.",
        ":gift: A new PR is wrapped up and ready to be unboxed. Let’s dive in!",
        ":hammer_and_wrench: Someone just fixed something! Time to appreciate their PR skills.",
        ":pizza: A fresh slice of code just popped in—let’s eat it up!",
        ":microphone: A new PR hit the mic—time for a review!",
        ":star: Someone's brought a star to the project—check out their PR!",
        ":hammer: Time to hammer out a new review! PR just landed.",
        ":video_game: New PR unlocked! Let’s see what level it’s on.",
        ":gem: A sparkling new PR just arrived. Let’s see what gems it’s hiding.",
        ":flying_saucer: Beam me up, Scotty! A new PR just landed from the code galaxy.",
        ":balloon: Another PR has been released! Time for a little celebration.",
        ":gear: The gears are turning, and a new PR just appeared.",
        ":clapper: The code is rolling! A new PR is ready for the spotlight.",
        ":magnifying_glass: New PR in the mix! Time to investigate what’s new.",
        ":alarm_clock: A PR has been queued up for review—let's make it count!",
        ":performing_arts: A PR is taking center stage! Time for a review performance.",
        ":toolbox: Someone’s packed a new PR! Let’s see what tools they’ve brought.",
        ":rotating_light: A PR alert has gone off! Let’s check what’s changed.",
        ":man_detective: New PR detected! Let’s put on our detective hats and review.",
        ":popcorn: A new PR just dropped. Let’s grab some popcorn and get to reviewing!",
        ":tornado: A PR storm is brewing—time to weather the code!",
        ":crystal_ball: A new PR has been divined. Let’s see what the future holds.",
        ":building_construction: Someone’s building something big! Check out their PR.",
        ":unlock: The code vault has been unlocked! Let’s see what’s inside the PR.",
        ":rainbow: A rainbow of changes has just appeared in the PR feed. Time to review!",
        ":package: A new package just landed. Let’s open this PR and see what’s inside.",
        ":envelope: A new PR has arrived in the inbox! Let’s give it a look.",
        ":ship: A PR has just set sail. Let’s chart its course through the review process.",
        ":circus_tent: The PR circus is in town! Time for some acrobatic reviewing.",
        ":cyclone: Hold onto your keyboards! A new PR is about to make some waves.",
        ":art: Someone’s painting a masterpiece. Let’s review their latest PR.",
        ":headphones: A new PR is queued up on the review playlist. Time to hit play!",
        ":calendar: Mark your calendars! A new PR is here for review.",
        ":mage: A wizard has cast a spell on the code! Let’s see what magic their PR holds.",
        ":ship: A new PR has docked at the review port. Time to inspect the cargo.",
        ":game_die: Roll the dice! A new PR is here, and we’re ready to see what happens next.",
        ":unicorn: A mythical PR has arrived. Let’s see if it’s as magical as it sounds!",
        ":bell: Ding ding! A new PR is up for review. Let’s ring in the changes.",
        ":crossed_swords: The code battle has begun! Time to review this PR and conquer it.",
        ":strawberry: A fresh batch of PR goodness has been picked. Let’s taste-test it!",
        ":rainbow: A sweet new PR has arrived! Time to check it out.",
        ":firecracker: A new PR has lit up the review feed. Time to see what it’s all about!",
        ":clapperboard: The latest PR is here! It’s time for its review debut.",
        ":robot: A robot-powered PR just landed. Let’s see if it’s bug-free.",
        ":heart_eyes: A shiny new PR has just appeared! Let’s see how beautiful it is.",
        ":game_controller: A new PR controller is in play. Let’s review the game!",
        ":fireworks: Someone just set off a PR firework! Time to check it out.",
        ":shopping_cart: A new PR is in the cart! Time to check out the changes.",
        ":trophy: A gold medal PR just entered the arena! Let’s review it like champions.",
        ":skier: A PR just slid into the review lane! Time to check it out.",
        ":dancer: Someone’s dancing with code! A PR just came in hot.",
        ":bird: A tweet-sized PR just landed. Let’s give it a review!",
        ":microphone: A new hit just dropped! Let’s review this PR and make it chart-topping.",
        ":dragon: A fire-breathing PR has just arrived! Time to check it out.",
        ":construction: A PR just landed under construction! Let’s help finish it off.",
        ":hammer_and_pick: A PR miner has just unearthed some gold. Time to inspect it!",
        ":house: Someone’s building their PR castle! Time to check the blueprint.",
        ":carousel_horse: A roller coaster ride of PR changes has arrived. Time to hop on!",
        ":lion: A lion-sized PR has arrived. Let’s review its roar!",
        ":strawberry: A sweet PR is in the basket! Time to pick it apart.",
        ":cake: A slice of PR cake has just been served. Let’s have a taste!",
        ":fried_shrimp: A juicy PR just landed. Let’s review this delicious code.",
        ":popcorn: Someone’s popped a new PR! Let’s snack on this review.",
        ":art: A creative PR just appeared. Let’s see how colorful this code is.",
        ":skateboard: Time to kick flip through this new PR!",
        ":hamburger: A fast food PR just landed. Time to take a bite!",
        ":ferris_wheel: A ferris wheel of PR changes just arrived. Time to take a spin!",
        ":race_car: A race car PR is in the pit. Let’s check out this speed demon!",
        ":rocket: A new PR just landed! Get ready to test something amazing!",
        ":tada: A fresh PR is here! Time to see what magic has been cooked up!",
        ":wrench: Someone’s been hard at work! Let's review their latest PR.",
        ":fire: PR incoming! Brace yourselves for some blazing new code.",
        ":bulb: A new idea has been committed! Let's take a look at this PR.",
        ":boom: Something big just dropped in the PR feed! Time to check it out.",
        ":zap: The code gods have blessed us with a new PR! Let's make it shine.",
        ":gift: A new PR is wrapped up and ready to be unboxed. Let’s dive in!",
        ":hammer_and_wrench: Someone just fixed something! Time to appreciate their PR skills.",
        ":pizza: A fresh slice of code just popped in—let’s eat it up!",
        ":microphone: A new PR hit the mic—time for a review!",
        ":star: Someone's brought a star to the project—check out their PR!",
        ":hammer: Time to hammer out a new review! PR just landed.",
        ":video_game: New PR unlocked! Let’s see what level it’s on.",
        ":gem: A sparkling new PR just arrived. Let’s see what gems it’s hiding.",
        ":flying_saucer: Beam me up, Scotty! A new PR just landed from the code galaxy.",
        ":balloon: Another PR has been released! Time for a little celebration.",
        ":gear: The gears are turning, and a new PR just appeared.",
        ":clapper: The code is rolling! A new PR is ready for the spotlight.",
        ":magnifying_glass: New PR in the mix! Time to investigate what’s new.",
        ":alarm_clock: A PR has been queued up for review—let's make it count!",
        ":performing_arts: A PR is taking center stage! Time for a review performance.",
        ":toolbox: Someone’s packed a new PR! Let’s see what tools they’ve brought.",
        ":rotating_light: A PR alert has gone off! Let’s check what’s changed.",
        ":man_detective: New PR detected! Let’s put on our detective hats and review.",
        ":popcorn: A new PR just dropped. Let’s grab some popcorn and get to reviewing!",
        ":tornado: A PR storm is brewing—time to weather the code!",
        ":crystal_ball: A new PR has been divined. Let’s see what the future holds.",
        ":building_construction: Someone’s building something big! Check out their PR.",
        ":unlock: The code vault has been unlocked! Let’s see what’s inside the PR.",
        ":rainbow: A rainbow of changes has just appeared in the PR feed. Time to review!",
        ":package: A new package just landed. Let’s open this PR and see what’s inside.",
        ":envelope: A new PR has arrived in the inbox! Let’s give it a look.",
        ":ship: A PR has just set sail. Let’s chart its course through the review process.",
        ":circus_tent: The PR circus is in town! Time for some acrobatic reviewing.",
        ":cyclone: Hold onto your keyboards! A new PR is about to make some waves.",
        ":art: Someone’s painting a masterpiece. Let’s review their latest PR.",
        ":headphones: A new PR is queued up on the review playlist. Time to hit play!",
        ":calendar: Mark your calendars! A new PR is here for review.",
        ":mage: A wizard has cast a spell on the code! Let’s see what magic their PR holds.",
        ":ship: A new PR has docked at the review port. Time to inspect the cargo.",
        ":game_die: Roll the dice! A new PR is here, and we’re ready to see what happens next.",
        ":unicorn: A mythical PR has arrived. Let’s see if it’s as magical as it sounds!",
        ":bell: Ding ding! A new PR is up for review. Let’s ring in the changes.",
        ":crossed_swords: The code battle has begun! Time to review this PR and conquer it.",
        ":strawberry: A fresh batch of PR goodness has been picked. Let’s taste-test it!",
        ":rainbow: A sweet new PR has arrived! Time to check it out.",
        ":firecracker: A new PR has lit up the review feed. Time to see what it’s all about!",
        ":clapperboard: The latest PR is here! It’s time for its review debut.",
        ":robot: A robot-powered PR just landed. Let’s see if it’s bug-free.",
        ":heart_eyes: A shiny new PR has just appeared! Let’s see how beautiful it is.",
        ":game_controller: A new PR controller is in play. Let’s review the game!",
        ":fireworks: Someone just set off a PR firework! Time to check it out.",
        ":shopping_cart: A new PR is in the cart! Time to check out the changes.",
        ":trophy: A gold medal PR just entered the arena! Let’s review it like champions.",
        ":skier: A PR just slid into the review lane! Time to check it out.",
        ":dancer: Someone’s dancing with code! A PR just came in hot.",
        ":bird: A tweet-sized PR just landed. Let’s give it a review!",
        ":microphone: A new hit just dropped! Let’s review this PR and make it chart-topping.",
        ":dragon: A fire-breathing PR has just arrived! Time to check it out.",
        ":construction: A PR just landed under construction! Let’s help finish it off.",
        ":hammer_and_pick: A PR miner has just unearthed some gold. Time to inspect it!",
        ":house: Someone’s building their PR castle! Time to check the blueprint.",
        ":carousel_horse: A roller coaster ride of PR changes has arrived. Time to hop on!",
        ":lion: A lion-sized PR has arrived. Let’s review its roar!",
        ":strawberry: A sweet PR is in the basket! Time to pick it apart.",
        ":cake: A slice of PR cake has just been served. Let’s have a taste!",
        ":fried_shrimp: A juicy PR just landed. Let’s review this delicious code.",
        ":popcorn: Someone’s popped a new PR! Let’s snack on this review.",
        ":art: A creative PR just appeared. Let’s see how colorful this code is.",
        ":skateboard: Time to kick flip through this new PR!",
        ":hamburger: A fast food PR just landed. Time to take a bite!",
        ":ferris_wheel: A ferris wheel of PR changes just arrived. Time to take a spin!",
        ":race_car: A race car PR is in the pit. Let’s check out this speed demon!"
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
        const repositoriesEnv = getEnvVariableOrDefault('REPOSITORIES_OPEN_PR', '');
        return repositoriesEnv.split(',').map(repo => repo.trim());
    }

    public async run() {
        await this.checkOpenPRs();
    }

    private async checkOpenPRs(): Promise<void> {
        const token = getEnvVariable('GITHUB_TOKEN');
        const headers = {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'DiscordGitHuBot',
        };

        for (const repo of this.repositories) {
            const url = `https://api.github.com/repos/${repo}/pulls?state=open&draft=false`;
            try {
                const pullRequests = await this.fetchPullRequests(url, headers);
                await this.processPullRequests(repo, pullRequests);
            } catch (error) {
                container.logger.error(`Error fetching PRs for ${repo}:`, error);
            }
        }
    }

    private async fetchPullRequests(url: string, headers: Record<string, string>): Promise<PullRequest[]> {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`Failed to fetch PRs: ${response.statusText}`);
        }

        return (await response.json()) as PullRequest[];
    }

    private async processPullRequests(repo: string, pullRequests: PullRequest[]): Promise<void> {
        for (const pr of pullRequests) {
            const prKey = this.getRedisKey(repo, pr.number);

            if (!(await this.isPRAlreadyReported(prKey))) {
                await this.reportNewPR(repo, pr, prKey);
            }
        }
    }

    private getRedisKey(repo: string, prNumber: number): string {
        return `pr:${repo}:${prNumber}`;
    }

    private async isPRAlreadyReported(prKey: string): Promise<boolean> {
        return Boolean(await this.redisClient.get(prKey));
    }

    private async reportNewPR(repo: string, pr: PullRequest, prKey: string): Promise<void> {
        container.logger.info(`Reporting new PR in ${repo}: ${pr.title}`);
        await this.sendRandomPRMessage(pr);
        await this.redisClient.set(prKey, 'reported');
    }

    private async sendRandomPRMessage(pr: PullRequest): Promise<void> {
        try {
            const randomMessage = this.selectRandomMessage();
            const messageContent = `${randomMessage}\n${pr.html_url}`;
            const channelId = getEnvVariable('PR_OPEN_NOTIFICATION_CHANNEL_ID');
            const channel = container.client.channels.cache.get(channelId);

            if (channel instanceof TextChannel) {
                const sentMessage = await channel.send(messageContent);
                await sentMessage.react('👍');
            } else {
                container.logger.error('Invalid or non-text channel for PR notifications.');
            }
        } catch (error) {
            container.logger.error('Error sending PR message to Discord:', error);
        }
    }

    private selectRandomMessage(): string {
        const messages = this.pr_messages;
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
