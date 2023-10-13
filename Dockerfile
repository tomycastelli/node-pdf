FROM --platform=linux/amd64 node:slim

# Update the package list and install the necessary dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  fonts-liberation \
  libgtk-3-0 \
  libwayland-client0 \
  xdg-utils \
  libu2f-udev \
  libvulkan1 \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  python3 \
  build-essential \
  ghostscript \
  libjpeg-dev \
  libpng-dev \
  libcurl4-openssl-dev \
  mupdf-tools \
  libfreetype6-dev \
  qpdf \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Install Node.js dependencies
RUN npm install

COPY . .

EXPOSE 3001

CMD [ "npm", "start" ]
