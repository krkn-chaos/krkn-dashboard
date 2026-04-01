# krkn-dashboard

krkn Dashboard is the visualization component of [krkn-hub](https://github.com/redhat-chaos/krkn-hub/tree/main). It offers a set of user-friendly web interfaces through which users can manipulate and observe Chaos experiments.

## Prerequisites

Before building or running, check available releases at: https://github.com/krkn-chaos/krkn-dashboard/releases

## Run

For installation and run instructions (standalone and container), see the [Krkn documentation](https://krkn-chaos.dev/docs/installation/krkn-dashboard/).

## Dashboard directory structure

### public

Contains the root application `index.html` and React template artifacts.

### server

The source for an NPM express server that's used in developer mode.

### src

The krkn dashboard Javascript source plus additional CSS/LESS and artifacts.

#### assets

Assets placed in the `src/assets/images` directory are only referenced within component or layout definitions and are packaged in the generated `***.js` file during the build process.

#### reducers

Contains functions that manage store via actions.

#### utils

Helper functions for the dashboard.


## Storage

krkn dashboard stores data using local browser storage and cookies. When run in a container, the SQLite database is stored in the mounted `database` directory (or `/data` inside the container).

## Template

This application is based on v5 of PatternFly which is a production-ready UI solution for admin interfaces. For more information regarding the foundation and template of the application, please visit [PatternFly](https://www.patternfly.org/get-started/develop) 

## Resources

- [Vite](https://vitejs.dev/guide/)   

- [ReactJS](https://reactjs.org/) 

- [React-Redux](https://github.com/reduxjs/react-redux)
