# node:22-alpine
FROM node@sha256:f2dc6eea95f787e25f173ba9904c9d0647ab2506178c7b5b7c5a3d02bc4af145

WORKDIR /bot

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

# Set the environment variable to tell the bot to run in production
ENV NODE_ENV=production

# Command to run the app
CMD ["yarn", "start"]
