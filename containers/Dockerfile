# Use an official Fedora base image
FROM fedora:latest

# Update and install necessary packages
RUN dnf update -y && \
    dnf install -y curl git podman-remote procps-ng nodejs python3 python3-pip python3-setuptools make gcc-c++ \
      python3.13 \
    && dnf clean all

ENV PYTHON=/usr/bin/python3

# Display installed versions
RUN node -v && \
    npm -v && \
    echo -n "python3 (default): " && python3 --version && \
    echo -n "MCP python3.13: " && python3.13 --version && \
    podman-remote --version

WORKDIR /usr/src/chaos-dashboard

ENV CONTAINER_BUILD=true
# Install app dependencies
COPY package*.json ./
RUN npm install

COPY mcp_summary/requirements.txt mcp_summary/requirements.txt
RUN python3.13 -m ensurepip --upgrade && \
    python3.13 -m pip install --no-cache-dir --upgrade pip && \
    python3.13 -m pip install --no-cache-dir -r mcp_summary/requirements.txt

# Bundle application source
COPY . .

# Node uses this to spawn uvicorn (see package.json dev:mcp)
ENV MCP_PYTHON=python3.13
# Same-network URL for Node proxy → MCP (Summary /comparison /alerts pages)
ENV MCP_SUMMARY_URL=http://127.0.0.1:5000

# dev:all = uvicorn (mcp_summary) + nodemon (API/socket) + vite (UI)
EXPOSE 3000 8000 5000
CMD ["npm", "run", "dev:all"]
