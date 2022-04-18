import net from 'net';

/*
 Package dictionary. 
{
     'packageName':{
        dependencies: dependencyArray,
        dependencyCounter: packageNameTotalDependenciesCount
    }
    ...
}
*/
let packages = {};

// Handle multiple client connections using an array
let sockets = [];

// Run localhost on port 8080
const port = 8080;
const host = '127.0.0.1';
const socktimeout = 600000;

// Server responses
const ERROR = `ERROR\n`;
const FAIL = `FAIL\n`;
const OK = `OK\n`;

// Create Server
const server = net.createServer();
connectServer();

function connectServer() {
    // Handle connection events.
    server.on('connection', function (sock) {
        const clientAddress = sock.remoteAddress;
        const port = sock.remotePort;

        console.log(`CONNECTED: ${clientAddress}:${port}`);
        sockets.push(sock);

        sock.setTimeout(socktimeout, function () {
            sock.end("timeout");
            sock.destroy();
        });

        sock.on('data', function (data) {
            // Parse messages sent from every client that is connected. Each client will then receive an appropriate response message from the server.
            sockets.forEach(function (sock, index, array) {
                // Parse message
                parse(data.toString(), sock);
            });
        });

        sock.on('error', function (err) {
            console.log(`Error occurred in ${clientAddress}:${port} ERROR: ${err.message}`);
        });

        // Attach a 'close' event handler to each client connection.
        sock.on('close', function () {
            let index = sockets.findIndex(function (o) {
                return o.remoteAddress === clientAddress && o.remotePort === port;
            })
            if (index !== -1) sockets.splice(index, 1);
            console.log(`CLOSED: ${clientAddress}:${port}`);

        });

    });

    // Start up the server and listen on localhost on port 8080.
    server.listen(port, host, () => {
        console.log('TCP Server is running on port ' + port + '.');
    });

    // Handle server errors and restart server if port or address is under use.
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log('Address or Port in use, retrying...');
            setTimeout(() => {
                server.close();
                server.listen(config);
            }, 5000);
        } else {
            console.log({ err: `Server error ${err}` });
        }
    });
}
/**
 * Parses client messages. Messages from clients follow the pattern: 
 *                  <command>|<package>|<dependencies>\n
 * <command> and <package> are both recquired. <dependencies> are optional.
 * Each client message is split into 3 segments separated by pipes. A complete * client message ends with \n. Expected and correct commands are either INDEX, * QUERY, or REMOVE. All in uppercase. The <package> should not have spaces or * special characters. The <dependencies> can be a list separated by commas. 
 * Any client message that does not follow this criteria is considered a 
 * broken message and the client will recieve a response of ERROR\n.
 */
function parse(data, sock) {
    const msg = data.split("\n");
    const specialChars = /[ `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;

    msg.forEach(line => {
        // let's verify there is a message to parse
        if (line.length > 1) {
            // we may have an empty string
            if (line !== "") {
                const parsedLine = line.split("|", 3);
                /*
                let's parse the message and limit delimeter to 3 segments. Before we pass the message along to the appropriate command action, let's first make sure we evaluate for proper commands otherwise we respond with ERROR\n
                */
                if (parsedLine[0] === 'INDEX' || parsedLine[0] === 'QUERY' || parsedLine[0] === 'REMOVE') {

                    /* Validate package name for presence, empty string, and that it does not include white spaces, special characters, or emojis (NOTE: targeting the snowman emoji to aim for test suite criteria, but this can possibly be done with a regex)
                    */

                    if (!parsedLine[1] || parsedLine[1] === "" || specialChars.test(parsedLine[1]) || parsedLine[1].includes('☃')) {
                       sock.write(ERROR);
                    } else if (parsedLine[0] === "INDEX") {
                        index(parsedLine, sock);
                    } else if (parsedLine[0] === "QUERY") {
                        query(parsedLine, sock);
                    } else if (parsedLine[0] === "REMOVE") {
                        remove(parsedLine, sock);
                    } else {
                        sock.write(ERROR);
                    }
                } else {
                    // if we are here, this means we have a broken message
                    sock.write(ERROR);
                }
            }
        }
    });
}

/**
 * Package indexer. The server returns `OK\n` if the package can be indexed. It 
 * returns `FAIL\n` if the package cannot be indexed because some of its 
 * dependencies are not indexed yet and need to be installed first. If a 
 * package already exists, then its list of dependencies is updated to the one 
 * provided with the latest command.
 */
function index(msg, sock) {
    const deps = msg[2] ? msg[2].split(",") : [];

    // if there are no dependencies..
    if (deps.length < 1) {
        // and the package has not yet been indexed..
        if (!packages[msg[1]]) {
            // ..index the new package and send OK response
            packages[msg[1]] = {
                dependencies: deps,
                dependencyCounter: 0
            };
            sock.write(OK);
        } else {
            // otherwise the package is already indexed
            // so we update others packages dependencyCounter
            // older dependencies against new dependencies
            reduceDependenciesCount(msg[1], deps);
            // then we update this package dependencies
            packages[msg[1]].dependencies = deps;
        }
        //if the the package does have dependecies  
    } else {
        // Verify if all the new received dependencies are already indexed
        const allDepsAreIndexed = deps.every(d => d in packages);

        if (!allDepsAreIndexed) {
            // package cannot be indexed because there is at least one dependency that needs to be indexed first
            sock.write(FAIL);
        } else {

            if (!packages[msg[1]]) {
                // when the package has no yet been indexed, index the new package and increment the dependency counter of the dependencies that have previously been indexed, send OK
                packages[msg[1]] = {
                    dependencies: deps,
                    dependencyCounter: 0
                };
                deps.forEach(d => packages[d].dependencyCounter++);
                sock.write(OK);
            } else {
                // when the package is already indexed
                // update others packages dependencyCounter
                // older dependencies against new dependencies
                reduceDependenciesCount(msg[1], deps);
                // then update this package dependencies
                packages[msg[1]].dependencies = deps;
            }
        }
    }
}

/**
 * Reduces a package's dependency count. Some packages will have multiple 
 * dependencies. It is possible that multiple packages depend on one package.
 * dependencyCounter helps reduce search time for package removal. Only 
 * packages with zero count can be removed. Checks current dependency list 
 * against new dependency list per package and reduces the dependencyCounter on 
 * incoming dependency package.
 */
function reduceDependenciesCount(index, newDependencies) {
    let currentDependencies = packages[index] ? packages[index].dependencies : [];
    let differenceDependencies = currentDependencies.filter(x => !newDependencies.includes(x));
    differenceDependencies.forEach(dd => {
        packages[dd].dependencyCounter--;
    });
}

/**
 * Removes a package. The server returns `OK\n` if the package could be removed 
 * from the index. It returns `FAIL\n` if the package could not be removed from 
 * the index, because some other indexed package depends on it. It returns 
 * `OK\n` if the package was not indexed.
 */
function remove(msg, sock) {
    if (!packages[msg[1]]) {
        // Package was not indexed
        sock.write(OK);
    } else if (packages[msg[1]].dependencyCounter > 0) {
        // package was indexed but is a dependency of one or more packages
        sock.write(FAIL);
    } else {
        // otherwise package can and is removed, so we update the dependencyCounter for the dependencies of this package before removing it, send OK
        reduceDependenciesCount(msg[1], []);
        delete packages[msg[1]];
        sock.write(OK);
    }
}

/**
 * Queries a package. The server returns `OK\n` if the package is indexed. It 
 * returns `FAIL\n` if the package is not indexed. 
 */
function query(msg, sock) {
    if (!packages[msg[1]]) {
        sock.write(FAIL);
    } else {
        sock.write(OK);
    }
}
