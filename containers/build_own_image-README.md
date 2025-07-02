# Building your own Kraken dashboard image


## Prerequisites
Before building, check available releases at: https://github.com/krkn-chaos/krkn-dashboard/releases


### Method 1: Clone specific release (Recommended)
```bash
# Replace <RELEASE_TAG> with your desired version (e.g., v1.0.0, v2.1.3)
# Check available releases at: https://github.com/krkn-chaos/krkn-dashboard/releases
$ git clone --branch <RELEASE_TAG> --single-branch https://github.com/krkn-chaos/krkn-dashboard.git
```


### Method 2: Download release tarball
```bash
# Replace <RELEASE_TAG> with your desired version (e.g., v1.0.0, v2.1.3)
$ wget https://github.com/krkn-chaos/krkn-dashboard/archive/refs/tags/<RELEASE_TAG>.tar.gz
$ tar -xzf <RELEASE_TAG>.tar.gz
$ mv krkn-dashboard-<VERSION_WITHOUT_V> krkn-dashboard  # Note: remove 'v' prefix from folder name
```


### Method 3: Clone latest release automatically
```bash
# Get the latest release tag and clone it
$ LATEST_TAG=$(curl -s https://api.github.com/repos/krkn-chaos/krkn-dashboard/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
$ git clone --branch $LATEST_TAG --single-branch https://github.com/krkn-chaos/krkn-dashboard.git
$ echo "Cloned release: $LATEST_TAG"
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
