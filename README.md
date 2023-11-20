# krkn-dashboard

krkn Dashboard is the visualization component of [krkn-hub](https://github.com/redhat-chaos/krkn-hub/tree/main). It offers a set of user-friendly web interfaces through which users can manipulate and observe Chaos experiments.

# Dashboard directory structure

## public

Contains the root application `index.html` and React template artifacts.

## server

The source for an NPM express server that's used in developer mode.

## src

The krkn dashboard Javascript source plus additional CSS/LESS and artifacts.

### assets

Assets placed in the `src/assets/images` directory are only referenced within component or layout definitions and are packaged in the generated `***.js` file during the build process.

### reducers

Contains functions that manage store via actions 

### utils

Helper functions for the dashboard

## Prerequisites

### Install Node JS

Refer to the [Node.js](https://nodejs.org) official website

### Deploy Kubernetes cluster

If the Kubernetes cluster has not been deployed, refer to the links below to complete the deployment:

- [Kubernetes](https://kubernetes.io/docs/setup/)
- [minikube](https://minikube.sigs.k8s.io/docs/start/)
- [K3s](https://rancher.com/docs/k3s/latest/en/quick-start/)
- [Microk8s](https://microk8s.io/)
  

### Cloning and Running the Application Locally 

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

The application runs on http://localhost:3000 in the default browser.

## Storage
 
krkn dashboard stores data using local browser storage and cookies.

## Template

This application is based on v5 of PatternFly which is a production-ready UI solution for admin interfaces. For more information regarding the foundation and template of the application, please visit [PatternFly](https://www.patternfly.org/get-started/develop) 

## Resources

- [Vite](https://vitejs.dev/guide/)   

- [ReactJS](https://reactjs.org/) 

- [React-Redux](https://github.com/reduxjs/react-redux)