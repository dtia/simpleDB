/*
Thumbtack Coding Challenge
Simple Database
Derek Tia
5/4/16
 */
 
var _ = require('underscore');
var readline = require('readline');
var rl;
 
var database; // main database
var numEqualToMap; // reverse number mapping to ensure at most log(n) performance for NUMEQUALTO
var transactions; // transactions get pushed into this array
 
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
 
    initialize();

    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
 
    // standard input handler
    rl.on('line', function(line){
        processLine(line);
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
 
/***************
Command Handlers
****************/
 
var handleBegin = function() {
    // create new Transaction object
    transactions.push(new Transaction());
};
 
var handleRollback = function() {
    if (transactions.length < 1) {
        console.log(ERROR_DICT[2]);
        return;
    }
     
    // remove Transaction object from list
    transactions.pop();
};
 
var handleCommit = function() {
    if (!transactions.length) {
        console.log(ERROR_DICT[2]);
        return;
    }
    
    return commit();
};
 
var handleSet = function(args) {
    if (args.length < 2) {
        console.log(ERROR_DICT[1]);
        return;
    }
 
    var name = args[0];
    var value = args[1];
    
    return set(name, value);
};

var handleUnset = function(args) {
    if (args.length < 1) {
        console.log(ERROR_DICT[1]);
        return;
    }
 
    var name = args[0];

    return unset(name);
};

var handleGet = function(args) {
    if (args.length < 1) {
        console.log(ERROR_DICT[1]);
        return;
    }
 
    var name = args[0];

    return get(name);
};

var handleNumequalto = function(args) {
    if (args.length < 1) {
        console.log(ERROR_DICT[1]);
        return;
    }
 
    var val = args[0];
    var lastNumEqualTo = getLastNumEqualTo(val);
 
    return lastNumEqualTo ? lastNumEqualTo : 0;
};

/***************
Helper Functions
****************/
 
// currently output is sent to stdout, 
// but can be modified later to be 
// written to a file for example
var processOutput = function(value) {
    console.log(value);
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
 
    // update index for a variable that is reassigned a value
    if (lastValue && currentNumEqualToMap[lastValue]) {
        currentNumEqualToMap[lastValue]--;
    }

    currentDatabase[name] = value;
};

var unset = function(name) {
    var currentDatabase = getCurrentDatabase();
    var currentNumEqualToMap = getCurrentNumEqualToMap();     
    var lastValue = getLastDatabaseValue(name);
 
    // decrement count for this variable
    if (lastValue && currentNumEqualToMap[lastValue])
        currentNumEqualToMap[lastValue]--;
    else if (lastValue)
        currentNumEqualToMap[lastValue] = 0;
 
    // set variable to null to keep track of removal
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


function Transaction() {
    this.db = {};
    this.numEqualToMap = {};
}

 
main();