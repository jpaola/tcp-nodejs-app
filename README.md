# TCP NodeJS Package Indexer App

This server is written using Nodejs and ES6. It uses Node v17.5.0 and npm v8.4.1. Along with the server there is a client file that can be run against the server to test client connection and edge cases.

## Installation
This application runs on node, so the use of a node package manager would be ideal to get it up and running. 

### Downloading and installing Node.js and npm
To publish and install packages to and from the public npm registry or a private npm registry, you must install Node.js and the npm command line interface using either a Node version manager or a Node installer.

To install node you need to download the Node.js source code or a pre-built installer for your platform here: https://nodejs.org/en/download/.

See https://docs.npmjs.com/downloading-and-installing-node-js-and-npm for further details.

Note: to download the latest version of npm, on the command line, run the following command

```bash
npm install -g npm
```

To see if you already have Node.js and npm installed and check the installed version, run the following commands:

```bash
node -v
npm -v
```

## Usage

Once npm has been successfully installed you can start up the server with the following command:

```bash
npm start
```

To start up the client simply run the following command:

```bash
node client.js
```

## The package contents

Together with this `README.md` you will find three files: `client.js`, `server.js`, and a `package.json`.

`client.js` - contains a single client connection and various tests which simulates real client messages sent to the server.

`package.json` - a light package.json file with the script to run the server.

`server.js` - the server which includes logic for handling multiple client connections, error handling, parsing messages and distributing them to the proper command prompt against a package. I have provided more internal documentation than usual to help the reader follow along the logic and reasoning for my approach to this assignment due to using a JS versus a language like GO or Ruby that would likely be best suited for this type of program.

## The problem this solves

This is a fictional problem, which requires I write a package indexer.

*Packages* are executables or libraries that can be installed in a system, often via a package manager such as apt, RPM, or Homebrew. Many packages use libraries that are also made available as packages themselves, so usually a package will require you to install its dependencies before you can install it on your system.

This system is meant to keep track of package dependencies. Clients will connect to the server and inform which packages should be indexed, and which dependencies they might have on other packages. To keep the index consistent, the server must not index any package until all of its dependencies have been indexed first. The server should also not remove a package if any other packages depend on it.

The server will open a TCP socket on port 8080. It must accept connections from multiple clients at the same time, all trying to add and remove items to the index concurrently. Clients are independent of each other, and it is expected that they will send repeated or contradicting messages. New clients can connect and disconnect at any moment, and sometimes clients can behave badly and try to send broken messages.

Messages from clients follow this pattern:

```
<command>|<package>|<dependencies>\n
```

Where:
* `<command>` is mandatory, and is either `INDEX`, `REMOVE`, or `QUERY`
* `<package>` is mandatory, the name of the package referred to by the command, e.g. `mysql`, `openssl`, `pkg-config`, `postgresql`, etc.
* `<dependencies>` is optional, and if present it will be a comma-delimited list of packages that need to be present before `<package>` is installed. e.g. `cmake,sphinx-doc,xz`
* The message always ends with the character `\n`

Here are some sample messages:
```
INDEX|cloog|gmp,isl,pkg-config\n
INDEX|ceylon|\n
REMOVE|cloog|\n
QUERY|cloog|\n
```

For each message sent, the client will wait for a response code from the server. Possible response codes are `OK\n`, `FAIL\n`, or `ERROR\n`. After receiving the response code, the client can send more messages.

The response code returned should be as follows:
* For `INDEX` commands, the server returns `OK\n` if the package can be indexed. It returns `FAIL\n` if the package cannot be indexed because some of its dependencies aren't indexed yet and need to be installed first. If a package already exists, then its list of dependencies is updated to the one provided with the latest command.
* For `REMOVE` commands, the server returns `OK\n` if the package could be removed from the index. It returns `FAIL\n` if the package could not be removed from the index because some other indexed package depends on it. It returns `OK\n` if the package wasn't indexed.
* For `QUERY` commands, the server returns `OK\n` if the package is indexed. It returns `FAIL\n` if the package isn't indexed.
* If the server doesn't recognize the command or if there's any problem with the message sent by the client it should return `ERROR\n`.

## The tests included in this assignment

Although formal unit and integration tests were the aim, due to certain gray areas on libraries use and time constraints I decided to provide another source of testing. This includes testing the server against edge cases. The tests are written in form of separate functions with distinct names. These tests may be found within the `client.js` file. They will all be enabled, so when running the client connection you will see every response from the server logging in the terminal all at once.

If you desire to see the results of a single test simply comment out the rest, then restart the server and client.

