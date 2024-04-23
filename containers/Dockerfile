# Use an official Fedora base image
FROM fedora:latest

# Update and install necessary packages
RUN dnf update -y && \
    dnf install -y curl git podman-remote nodejs && \
    dnf clean all

# Display installed versions
RUN node -v && \
    npm -v && \
    podman-remote --version

WORKDIR /usr/src/chaos-dashboard
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install
#To bundle your app’s source code inside the Docker image, use the COPY instruction:
COPY . .
#Your app binds to port 3000 so you’ll use the EXPOSE instruction to have it mapped by the docker daemon:
EXPOSE 3000
CMD ["npm", "run", "dev"]