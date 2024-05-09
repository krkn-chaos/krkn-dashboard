## Prerequisites

### Install Node JS

Refer to the [Node.js](https://nodejs.org) official website

### Deploy Kubernetes cluster

If the Kubernetes cluster has not been deployed, refer to the links below to complete the deployment:

- [Kubernetes](https://kubernetes.io/docs/setup/)
- [minikube](https://minikube.sigs.k8s.io/docs/start/)
- [K3s](https://rancher.com/docs/k3s/latest/en/quick-start/)
- [Microk8s](https://microk8s.io/)
- [OpenShift](https://docs.openshift.com/container-platform/4.14/welcome/index.html)
  

## Cloning and Running the Application Locally 

- Clone the [krkn Dashboard code](https://github.com/redhat-chaos/krkn-dashboard) to a local file system
- Install all the npm packages

Type the following command to install all npm packages 

```bash
$ npm install
```

In order to start the express server and run the application use the following command 

```bash
$ npm run dev
```

The application runs on http://localhost:8000 in the default browser.
