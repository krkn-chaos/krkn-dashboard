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
```
$ podman run --net=host -p 3000:3000 -d  --name <container_name> <new_image_name>:latest
```

Go to http://localhost:3000 to check the dashboard and trigger krkn scenarios!
