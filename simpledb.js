/*
Thumbtack Coding Challenge
Simple Database
Derek Tia
5/4/16
 */
 
var _ = require('underscore');

/***************
Global Variables
****************/ 
var database; // main database
var numEqualToMap; // reverse number mapping to ensure at most log(n) performance for NUMEQUALTO
var transactions; // transactions are stored here
 
// error message dictionary to ensure consistent error messages
var ERROR_DICT = {
    0: 'Unrecognized command. Please try again.',
    1: 'Not enough arguments. Please try again.',
    2: 'NO TRANSACTION'
};

/****
Main
*****/
 
var main = function() {
    initialize();

    process.stdin.resume();
    process.stdin.setEncoding("ascii");
    var input = "";
    process.stdin.on("data", function (chunk) {
        input += chunk;
    });
    process.stdin.on("end", function () {
        var input_arr = input.split("\n");
        for (var i=0; i < input_arr.length; i++) {
            var line = input_arr[i];
            processLine(line);
        }
    });
};

var initialize = function() {
    database = {};
    numEqualToMap = {};
    transactions = [];
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
            handleGet(args);
            break;
 
        case 'UNSET':
            handleUnset(args);
            break;
 
        case 'NUMEQUALTO':
            handleNumequalto(args);
            break;
 
        case 'END':
            process.exit(0);
            break;
 
        // for unrecognized commands
        default:
            processOutput(ERROR_DICT[0]);
            break;
    }
};
 
/***************
Command Handlers
****************/
 
var handleBegin = function() {
    // create new Transaction object
    transactions.push(new Transaction());
};
 
var handleRollback = function() {
    if (transactions.length < 1) {
        processOutput(ERROR_DICT[2]);
        return;
    }
     
    // remove Transaction object from list
    transactions.pop();
};
 
var handleCommit = function() {
    if (!transactions.length) {
        processOutput(ERROR_DICT[2]);
        return;
    }
    
    return commit();
};
 
var handleSet = function(args) {
    if (args.length < 2) {
        processOutput(ERROR_DICT[1]);
        return;
    }
 
    var name = args[0];
    var value = args[1];
    
    return set(name, value);
};

var handleUnset = function(args) {
    if (args.length < 1) {
        processOutput(ERROR_DICT[1]);
        return;
    }
 
    var name = args[0];

    return unset(name);
};

var handleGet = function(args) {
    if (args.length < 1) {
        processOutput(ERROR_DICT[1]);
        return;
    }
 
    var name = args[0];

    return processOutput(get(name));
};

var handleNumequalto = function(args) {
    if (args.length < 1) {
        processOutput(ERROR_DICT[1]);
        return;
    }
 
    var val = args[0];
    var lastNumEqualTo = getLastNumEqualTo(val);
    lastNumEqualTo = lastNumEqualTo ? lastNumEqualTo : 0;

    return processOutput(lastNumEqualTo);
};

/***************
Helper Functions
****************/
 
// currently output is sent to stdout, 
// but can be modified later to be 
// written to a file for example
var processOutput = function(value) {
    process.stdout.write(value + "\n");
};
 
// get most recent database
// default to global database
var getCurrentDatabase = function() {
    if (transactions.length)
        return _.last(transactions).db;

    return database;
};
 
// get most recent numequalto map
// default to global database
var getCurrentNumEqualToMap = function() {
    if (transactions.length)
        return _.last(transactions).numEqualToMap;
    
    return numEqualToMap;
};

// find last database with this name
var getLastDatabaseValue = function(name) {
    for (var i=transactions.length-1; i >= 0; i--) {
        var db = transactions[i].db;
        if (db[name])
            return db[name];
    }

    return database[name];
};

// find last mapping from this number
var getLastNumEqualTo = function(num) {
    for (var i=transactions.length-1; i >= 0; i--) {
        var transactionalNumEqualToMap = transactions[i].numEqualToMap;
        // _.isNumber() to detect for 0 values
        if (_.isNumber(transactionalNumEqualToMap[num])) {
            return transactionalNumEqualToMap[num];
        }
    }

    return numEqualToMap[num];
};

/***************
Command Functions
****************/

var get = function(name) {
    var lastValue = getLastDatabaseValue(name);
    var val =  lastValue && lastValue !== 'removed' ? lastValue : 'NULL';

    return val;
};

var set = function(name, value) {
    var currentDatabase = getCurrentDatabase();
    var currentNumEqualToMap = getCurrentNumEqualToMap();
    var lastValue = getLastDatabaseValue(name);
 
    if (currentNumEqualToMap[value])
        currentNumEqualToMap[value]++;
    else
        currentNumEqualToMap[value] = 1;
 
    // update numequaltomap for a variable that is reassigned a value
    if (lastValue && currentNumEqualToMap[lastValue]) {
        currentNumEqualToMap[lastValue]--;
    }

    currentDatabase[name] = value;
};

var unset = function(name) {
    var currentDatabase = getCurrentDatabase();
    var currentNumEqualToMap = getCurrentNumEqualToMap();     
    var lastValue = getLastDatabaseValue(name);
 
    if (lastValue && currentNumEqualToMap[lastValue])
        currentNumEqualToMap[lastValue]--;
    else if (lastValue)
        currentNumEqualToMap[lastValue] = 0;
 
    // set variable to 'removed' to keep track of removed name
    // especially in open transactions
    currentDatabase[name] = 'removed';
};

var commit = function() {
    // iterate through transactions and set all values
    _.each(transactions, function(transactionObject) {
        _.each(transactionObject.db, function(val, key) {
            database[key] = val;
        });
    });
 
    // clear transactions
    transactions = [];
};


// simple transaction object
function Transaction() {
    this.db = {};
    this.numEqualToMap = {};
}
 
main();