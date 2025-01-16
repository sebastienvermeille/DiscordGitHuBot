import './lib/setup';

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';

import '@sapphire/plugin-scheduled-tasks/register';
import {getEnvVariable, getEnvVariableOrDefault} from "./lib/env.utils";


const client = new SapphireClient({
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
	loadMessageCommandListeners: true,
	tasks: {
		bull: {
			connection: {
				host: getEnvVariable('REDIS_HOST'),
				port: parseInt(getEnvVariableOrDefault('REDIS_PORT', '6379')),
				password: getEnvVariableOrDefault('REDIS_PASSWORD', ''),
				db: 0 // Redis database number, defaults to 0 but can be any value between 0 and 15
			}
		}
	}
});



const main = async () => {
	try {
		client.logger.info('Logging in...');
		await client.login();
		client.logger.info('logged in');
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
