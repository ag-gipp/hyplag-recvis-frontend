# hyplag-recviz-frontend

## Configuration of front-end.
- cd /path/to/repo
- cd src/js/
- nano config.js
    - You should probably need to adjust 'BACKEND_URL' according to where recviz/hyplag backend is running.

## Getting the front-end up and running.
- The front-end source code simply needs to be served from a webserver.
- I suggest using "http-server" tool for development phase which is a very simple "npm" based tool. However any webserver at your disposel should do the job as well.

## Installing http-server npm tool
- https://www.npmjs.com/package/http-server

## Running website using http-server tool.
- cd /path/to/repo
- http-server ./ -p 3000

## Accessing to the website
- Open your web browser and go to localhost:3000
- Congratz!