# Building your own Kraken dashboard image

### Clone the repository 
```
$ git clone https://github.com/krkn-chaos/krkn-dashboard.git
```

### Build the image
```
$ cd krkn-dashboard
$ podman build -t <new_image_name>:latest -f containers/Dockerfile .
``` 

### Run

Do the following as root
```
$ export CHAOS_ASSETS=/var/tmp/chaos

$ mkdir -p $CHAOS_ASSETS

$ podman run --env CHAOS_ASSETS -v $CHAOS_ASSETS:/usr/src/chaos-dashboard/src/assets:z -v /run/podman/podman.sock:/run/podman/podman.sock --net=host -d --name <container_name> <new_image_name>:latest
```

Go to http://localhost:3000 to check the dashboard and trigger krkn scenarios!
