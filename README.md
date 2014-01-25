# godot-opsgenie

[![Build Status](https://travis-ci.org/oroce/godot-opsgenie.png?branch=master)](https://travis-ci.org/oroce/godot-opsgenie)

opsgenie reactor for godot.

If a service state goes to critical it'll create an alert, if service comes back (state becomes ok) it'll close the alert if it's still open (aka hasn't been solved by somebody).

## Options

- `customerKey`: required, opsgenie api key, grab yours from [https://www.opsgenie.com/customer/settings](https://www.opsgenie.com/customer/settings)
- `recipients`: name or group name of recipients, defaults to all

## Usage
    var godot = require( "godot" );
    godot.createServer({
        type: "udp",
        reactors: [
            godot.reactor()
                .where( "service", "elasticsearch/health/healthcheck" )
                .change( "state" )
                .opsgenie({
                    customerKey: "grab it from: https://www.opsgenie.com/customer/settings"
                })
        ]
    }).listen( 1337 );

## Debugging

Run your godot server with `DEBUG=godot:opsgenie:reactor`

## Tests

`npm test`

It uses [mocha](https://github.com/visionmedia/mocha) and [should](https://github.com/visionmedia/should.js) and it mocks the opsgenie using [nock](https://github.com/pgte/nock).

## LICENSE

MIT