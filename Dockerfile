FROM node:16-alpine

ARG DOCCER_TITLE
ARG DOCCER_REPOS

RUN apk add thttpd
RUN apk add git
RUN apk add nano
RUN apk add openssh-client
RUN apk add lighttpd

# Create a non-root user to own the files and run our server
RUN adduser -D static
WORKDIR /home/static

COPY bin /home/static/bin
RUN chmod +x /home/static/bin/*.mjs

RUN mkdir /home/static/.ssh
RUN chmod 700 /home/static/.ssh
RUN echo bitbucket.org,104.192.143.1 ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAubiN81eDcafrgMeLzaFPsw2kNvEcqTKl/VqLat/MaB33pZy0y3rJZtnqwR2qOOvbwKZYKiEO1O6VqNEBxKvJJelCq0dTXWT5pbO2gDXC6h6QDXCaHo6pOHGPUy+YBaGQRGuSusMEASYiWunYN0vCAI8QaXnWMXNMdFP3jHAJH0eDsoiGnLPBlBp4TNm6rYI74nMzgz3B9IikW4WVK+dc8KZJZWYjAuORU3jc1c/NPskD2ASinf8v3xnfXeukU0sJ5N6m5E8VLjObPEO+mN2t/FZTMZLiFqPWc/ALSqnMnnhwrNi2rbfg/rd/IpL8Le3pSBne8+seeFVBoGqzHM9yXw== > /home/static/.ssh/known_hosts

COPY package.json /home/static
RUN yarn install

RUN /home/static/bin/env-2-config.mjs /home/static/doccer.json
RUN /home/static/bin/doccer.mjs build-all

COPY lighttpd.conf /home/static
RUN mkdir -p /var/cache/lighttpd/compress/
RUN mkdir -p /var/log/lighttpd/
RUN chown static.static /var/log/lighttpd/ /var/cache/lighttpd/compress/
CMD ["/usr/sbin/lighttpd", "-D", "-f", "./lighttpd.conf"]
