# Building your own Kraken dashboard image

### Clone the repository 
```
$ git clone https://github.com/krkn-chaos/krkn-dashboard.git
```

### Checkout the branch 

```
$ git checkout <feature_branch> 
```
### Enable podman.socket

Although the kernel mechanisms used to implement containers (for example, cgroups) can be nested, a container usually isn’t set up with all the extra context to support nested podman (or docker) containers. 

Instead, it’s generally better to create a separate container within the host OS, using the podman-remote command. 

First, the podman.socket service needs to be running outside the container.

It can be enabled either system-wide or as user-specific.

#### Enable system-wide:
```
$ systemctl enable --now podman.socket
```
Socket is: /run/podman/podman.sock

#### Enable user-specific
```
$ loginctl enable-linger <user>
$ systemctl --user enable --now podman.socket
```
Socket is: /run/user/${UID}/podman/podman.sock

The podman.remote socket must be mapped into the controlling container so that podman-remote will connect to the host podman server; for example using -v/run/user/{UID}/podman/podman.sock:/run/podman/podman.sock

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
