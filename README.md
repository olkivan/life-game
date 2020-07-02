## Conway's life game implemented in JavaScript and React.JS

## Live Demo (use arrow keys and [space] to control)

http://95.214.9.220:9002/life-game

### Build

**Prerequisites**

Ensure docker is preinstalled on your system. Otherwise go to https://docs.docker.com/get-docker/ and follow instructions on the site.


- Goto directory where Dockerfile is placed

`cd life`

- Buld a docker image (for example with the name
*tetris-content-nginx*). Note: The last dot is important!
Also you may need to lift the privelege (prefix each command with `sudo`)



`docker build -t life-game-content-nginx .`


- Run the image within a container container *tetris-nginx*:

`docker run --name life-game-nginx -d -p 8080:80 life-game-content-nginx`

- Open your browser and goto http://localhost:8080/tetris

- Enjoy!


### Clean up Docker container

Just execute (you may need to lift the privelege)

`docker stop life-game-nginx -t 1`

`docker rm life-game-nginx`
