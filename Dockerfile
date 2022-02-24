FROM node:16-alpine

RUN apk add thttpd
RUN apk add git
RUN apk add nano

# Create a non-root user to own the files and run our server
RUN adduser -D static
WORKDIR /home/static

COPY bin /home/static/bin
RUN chmod +x /home/static/bin/*.mjs

USER static
