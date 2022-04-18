import { Socket } from 'net';

// Run localhost on port 8080
const client = new Socket();
const port = 8080;
const host = '127.0.0.1';
const delayInMilliseconds = 500; 

clientOne();

function clientOne() {
    // Initiate Client connection. Once connected the client sends a greeting to the server to confirm connection was successfull.
    client.connect(port, host, function () {
        console.log('Connected');
        /**
         * To run these tests individually, simply comment out the rest and run 
         * client against the server.
         */

        failQueryingApackageNotYetIndexed();
        failRemoveWhenDepsNotYetIndexed();
        failRemovingApackageThatIsAdependencyOfAnotherPackage();
        failIndexingPackageWhoseDependenciesHaveNotYetBeenIndexed();
        errorIndexingBrokenMessages();
        okIndexingPackageWithNoDeps();
        okIndexingAnExistingPackage();
        okQueryingAnIndexedPackage();
        okRemovingApackageNotYetIndexed();
        okRemovingPackageWithDependencies();
        okIndexingPackageWhoseDepsHaveBeenAlreadyIndexed();

        client.on('data', function (data) {
            console.log('Server Says : ' + data);
        });
        client.on('close', function () {
            console.log('Connection closed');
        });
    });
}


function failQueryingApackageNotYetIndexed() {
    setTimeout(function () {
        client.write('QUERY|pypi|\n');
    }, delayInMilliseconds);
}

function failRemoveWhenDepsNotYetIndexed() {
    /**
     * `FAIL\n` when the package cannot be indexed because some of its 
     * dependencies aren't indexed yet and need to be installed first.
     */
    setTimeout(function () {
        client.write('INDEX|mysql|c,lua\n');
    }, delayInMilliseconds);
}

function failRemovingApackageThatIsAdependencyOfAnotherPackage() {
    // Index first
    setTimeout(function () {
        client.write('INDEX|python|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|vscode|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|golang|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|a|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|b|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|python|vscode,b\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|golang|vscode,a,b\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|java|vscode,a\n');
    }, delayInMilliseconds);

    // Fail Removal of 'a' because golang and java depend on it
    setTimeout(function () {
        client.write('REMOVE|a|\n');
    }, delayInMilliseconds);
    // Fail Removal of 'vscode' because python, golang and java depend on it
    setTimeout(function () {
        client.write('REMOVE|vscode|\n');
    }, delayInMilliseconds);
}

function failIndexingPackageWhoseDependenciesHaveNotYetBeenIndexed() {
    setTimeout(function () {
        client.write('INDEX|c|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|cplusplus|\n');
    }, delayInMilliseconds);

    // Fail indexing mysql because 1 of 3 deps, i.e. java has not yet been indexed
    setTimeout(function () {
        client.write('INDEX|mysql|c,cplusplus,java\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|java|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|mysql|c,cplusplus,java\n');
    }, delayInMilliseconds);

}

function errorIndexingBrokenMessages() {
    /**
     * `ERROR\n` on broken messages.
     */
    setTimeout(function () {
        client.write('BLINDEX|a|a\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('QUER|a|b\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('LIZARD|a|a\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('I|a|b\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('REMOVES|poop|\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('|poop|\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('REMOVE||ey\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('REMOVE|poo pee|\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('REMOVE|poo=pee|\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('REMOVE|poo☃pee|\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('hi|\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('||\n');
    }, delayInMilliseconds);
}

function okIndexingPackageWithNoDeps() {

    // `OK\n` if the package can be indexed.
    setTimeout(function () {
        client.write('INDEX|python|\n');
    }, delayInMilliseconds);
}

function okIndexingAnExistingPackage() {
    setTimeout(function () {
        client.write('INDEX|pypi|\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('INDEX|pip|\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('INDEX|numpy|\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('INDEX|pandas|\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('INDEX|matplotlib|\n');
    }, delayInMilliseconds);

    // indexing python once
    setTimeout(function () {
        client.write('INDEX|python|pypi,pip,numpy,pandas,matplotlib\n');
    }, delayInMilliseconds);
    // indexing python twice
    setTimeout(function () {
        client.write('INDEX|python|pandas,matplotlib\n');
    }, delayInMilliseconds);
    // indexing python thrice
    setTimeout(function () {
        client.write('INDEX|python|pip,numpy\n');
    }, delayInMilliseconds);
}

function okQueryingAnIndexedPackage() {
    // index package before querying for it
    setTimeout(function () {
        client.write('INDEX|pypi|\n');
    }, delayInMilliseconds);
    setTimeout(function () {
        client.write('QUERY|pypi|\n');
    }, delayInMilliseconds);
}

function okRemovingApackageNotYetIndexed() {
    setTimeout(function () {
        client.write('REMOVE|csharp|dotnet\n');
    }, delayInMilliseconds);
}

function okRemovingPackageWithDependencies() {

    // Index first
    setTimeout(function () {
        client.write('INDEX|pypi|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|pip|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|numpy|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|pandas|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|matplotlib|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|python|pypi,pip,numpy,pandas,matplotlib\n');
    }, delayInMilliseconds);

    // Remove once Indexed

    setTimeout(function () {
        client.write('REMOVE|python|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('REMOVE|pypi|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('REMOVE|pip|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('REMOVE|numpy|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('REMOVE|pandas|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('REMOVE|matplotlib|\n');
    }, delayInMilliseconds);

}

function okIndexingPackageWhoseDepsHaveBeenAlreadyIndexed() {
    setTimeout(function () {
        client.write('INDEX|pypi|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|pip|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|numpy|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|pandas|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|matplotlib|\n');
    }, delayInMilliseconds);

    setTimeout(function () {
        client.write('INDEX|python|pypi,pip,numpy,pandas,matplotlib\n');
    }, delayInMilliseconds);
}