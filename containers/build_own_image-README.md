# Building your own Kraken dashboard image
- Git clone the Kraken repository using git clone https://github.com/krkn-chaos/krkn-dashboard.git
- Execute ` podman build -t <new_image_name>:latest . ` in the containers directory within krkn-dashboard to build an image from a Dockerfile.
- Once the build is completed, run ` docker image ls ` to list all the images. The newly created image can be found here.
-  To create and run a container with the image execute ` docker run --net=host -p 3000:3000 -d  --name <container_name> <new_image_name>:latest `
- Go to http://localhost:3000 to check the dashboard running on the docker container.
