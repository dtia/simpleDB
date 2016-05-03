/*
Thumbtack Coding Challenge
Simple Database
Derek Tia
5/1/16
 */
 
var _ = require('underscore');
var readline = require('readline');
var rl;
 
var database = {}; // main database
var databaseIndex = {}; // reverse index database to ensure at most log(n) performance for NUMEQUALTO
var transactions = [database]; // keeps track of the database at different levels of transactions
var databaseIndices = [databaseIndex]; // corresponding reverse index for each level
 
// error message dictionary to ensure consistent error messages
var ERROR_DICT = {
    0: 'Unrecognized command. Please try again.',
    1: 'Not enough arguments. Please try again.',
    2: 'NO TRANSACTION'
};
 
var main = function() {
    console.log('\nWelcome to Derek\'s Simple Database program!');
    console.log('To quit the program at any time, just enter END');
    console.log('Please enter a command to get started:\n');
 
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
 
    // standard input handler
    rl.on('line', function(line){
        processLine(line);
    });
};
 
// routes a command to its handler
var processLine = function(line) {
    var tokens = line.split(' ');
    var command = tokens[0];
    var args = tokens.slice(1);
 
    switch(command) {
 
        case 'BEGIN':
            handleBegin();
            break;
 
        case 'ROLLBACK':
            handleRollback();
            break;
 
        case 'COMMIT':
            handleCommit();
            break;
 
        case 'SET':
            handleSet(args);
            break;
 
        case 'GET':
            processOutput(handleGet(args));
            break;
 
        case 'UNSET':
            handleUnset(args);
            break;
 
        case 'NUMEQUALTO':
            processOutput(handleNumequalto(args));
            break;
 
        case 'END':
            process.exit(0);
            break;
 
        // for unrecognized commands
        default:
            console.log(ERROR_DICT[0]);
            break;
    }
};
 
/*
Helper Functions
 */
 
// currently output is sent to stdout, 
// but can be modified later to be 
// written to a file for example
var processOutput = function(value) {
    console.log(value);
};
 
// deep clone a dictionary
var clone = function(dictionary) {
    return JSON.parse(JSON.stringify(dictionary));
};
 
// get database from the deepest level
var getCurrentDatabase = function() {
    return _.last(transactions);
};
 
// get database index from the deepest level
var getCurrentDatabaseIndex = function() {
    return _.last(databaseIndices);
};
 
/*
Command Handlers
 */
 
var handleBegin = function() {
    // create new database
    transactions.push({});
 
    // clone database index to carry over state to next level of transaction
    var lastDatabaseIndex = clone(getCurrentDatabaseIndex());
    databaseIndices.push(lastDatabaseIndex);
};
 
var handleRollback = function() {
    if (transactions.length <= 1) {
        console.log(ERROR_DICT[2]);
        return;
    }
     
    // remove transaction and index from list
    transactions.pop();
    databaseIndices.pop();
};
 
var handleCommit = function() {
    if (!transactions.length) {
        console.log(ERROR_DICT[2]);
        return;
    }
    
    commit();
};

var commit = function() {
    // iterate through transactions and set all values
    _.each(transactions, function(tempDict) {
        _.each(tempDict, function(val, key) {
            database[key] = val;
        });
    });
 
    // base state transaction contains the original database
    transactions = [database];
    databaseIndices = [databaseIndex];
};
 
var handleSet = function(args) {
    if (args.length < 2) {
        console.log(ERROR_DICT[1]);
        return;
    }
 
    var name = args[0];
    var value = args[1];
    
    set(name, value);
};

var set = function(name, value) {
    var currentDatabase = getCurrentDatabase();
    var currentDatabaseIndex = getCurrentDatabaseIndex();
    var oldValue = currentDatabase[name];
 
    currentDatabase[name] = value;
 
    // update index for a variable that is reassigned a value
    if (oldValue && currentDatabaseIndex[oldValue]) {
        delete currentDatabaseIndex[oldValue][name];
    }
 
    if (!currentDatabaseIndex[value])
        currentDatabaseIndex[value] = {};
     
    currentDatabaseIndex[value][name] = true;
}
 
var handleGet = function(args) {
    if (args.length < 1) {
        console.log(ERROR_DICT[1]);
        return;
    }
 
    var name = args[0];

    return get(name);
};

var get = function(name) {
    var currentDatabase = getCurrentDatabase();
    var lastValue = getLastDatabaseValue(name);
    var val =  lastValue ? lastValue : 'NULL';

    return val;
};

// find last database with this key
var getLastDatabaseValue = function(key) {
    for (var i=transactions.length-1; i >= 0; i--) {
        var db = transactions[i];
        if (db[key])
            return db[key];
    }

    return null;
};
 
var handleUnset = function(args) {
    if (args.length < 1) {
        console.log(ERROR_DICT[1]);
        return;
    }
 
    var name = args[0];

    unset(name);
};

var unset = function(name) {
    var currentDatabase = getCurrentDatabase();
    var currentDatabaseIndex = getCurrentDatabaseIndex();
     
    var oldValue = currentDatabase[name];
 
    // remove index for this variable
    if (currentDatabaseIndex[oldValue])
        delete currentDatabaseIndex[oldValue][name];
 
    // set variable to null to keep track of removal
    currentDatabase[name] = null;
};
 
var handleNumequalto = function(args) {
    if (args.length < 1) {
        console.log(ERROR_DICT[1]);
        return;
    }
 
    var val = args[0];
    var currentDatabase = getCurrentDatabase();
    var currentDatabaseIndex = getCurrentDatabaseIndex();
 
    return currentDatabaseIndex[val] ? _.keys(currentDatabaseIndex[val]).length : 0;
};
 
main();