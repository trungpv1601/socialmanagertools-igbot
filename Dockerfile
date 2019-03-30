FROM amd64/ubuntu:18.10

WORKDIR /app

ADD . /app

RUN apt-get update && apt-get install -y apt-transport-https --assume-yes --no-install-recommends apt-utils
RUN apt-get update && apt-get install -y locales --assume-yes && rm -rf /var/lib/apt/lists/* && localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8
ENV LANG en_US.utf8

RUN apt-get update && apt-get install -y build-essential --assume-yes --no-install-recommends apt-utils
RUN apt-get update && apt-get install -y npm --assume-yes --no-install-recommends apt-utils
RUN apt-get update && apt-get install -y chromium-browser --assume-yes --no-install-recommends apt-utils

# Install pm2
RUN npm config set unsafe-perm true && npm config set registry http://registry.npmjs.org/ && npm install pm2 -g

# Install project dependencies
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
RUN npm config set unsafe-perm true && npm config set registry http://registry.npmjs.org/ && npm install

CMD ["pm2-runtime", ".pm2-process.json"]