FROM node:20-alpine

WORKDIR /app

# node:20-alpine doesn't include the openssl package by default. Prisma
# needs it at build time to detect the OpenSSL version (see schema.prisma
# for why detection alone isn't relied on) and the resulting engine binary
# needs libssl.so.3 present at container runtime.
RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "dev"]
