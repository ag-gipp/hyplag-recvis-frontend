# hyplag-recviz-frontend

## About RecVis
- RecVis project provides a novel approach to discover scientific literature based on Hyplag.org open source project. Users are able to discover relevant papers based on only given input academic paper. RecVis will recommend similar literature and will provide a visualization with custimizable weights for filtering out most relavent papers.

## Screenshots from RecVis
- The user interface is developed using standard web development technologies such as HTMl, Javascript, CSS and Bootstrap. Following is the welcome page of RecVis.

- User dashboard.

- Visualization of recommended literature. Visualization of the data is created using D3.js.

## Deployment/Development
### Configuration of front-end.
- cd /path/to/repo
- cd src/js/
- nano config.js
    - You should probably need to adjust 'BACKEND_URL' according to where recviz/hyplag backend is running.

### Getting the front-end up and running.
- The front-end source code simply needs to be served from a webserver.
- We suggest using "http-server" tool for development phase which is a very simple "npm" based tool. However any webserver at your disposal should do the job as well.

### Installing http-server npm tool
- https://www.npmjs.com/package/http-server

### Running website using http-server tool.
- cd /path/to/repo
- http-server ./ -p 3000

### Accessing to the website
- Open your web browser and go to localhost:3000

## Related Links
- RecVis Backend Repository: https://github.com/ag-gipp/hyplag-recvis-backend
- RecVis Tiny Scholar API (Currently Required by RecVis Backend): https://github.com/ag-gipp/hyplag-recvis-tiny-scholar-api

## Credits
- This project is developed by Data & Knowledge Engineering Group: https://dke.uni-wuppertal.de/de.html