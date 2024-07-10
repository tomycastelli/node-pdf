FROM node:20-alpine

RUN apk add --no-cache \
    udev \
    ttf-freefont \
    chromium

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser
ENV NODE_TLS_REJECT_UNAUTHORIZED 0

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV DATABASE_URL default1
ENV AWS_BUCKET_NAME default2
ENV AWS_BUCKET_REGION default3
ENV AWS_PUBLIC_KEY default4
ENV AWS_SECRET_KEY default5

EXPOSE 3001

ENTRYPOINT ["node", "index.js"]
