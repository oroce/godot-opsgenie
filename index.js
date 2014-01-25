var util = require( "util" );
var godot = require( "godot" );
var ReadWriteStream = godot.common.ReadWriteStream;
var request = require( "request" );
var debug = require( "debug" )( "godot:opsgenie:reactor" );

var OpsGenieReactor = function OpsGenieReactor( options ){
  debug( "initializing OpsGenieReactor: %j", options );
  if (!options || !options.customerKey ){
    throw new Error( "options.customerKey is required" );
  }
  
  ReadWriteStream.call(this);

  this.customerKey = options.customerKey;
  this.recipients = options.recipients || "all";
};

util.inherits( OpsGenieReactor, ReadWriteStream );

OpsGenieReactor.prototype.write = function( data ){
  debug( "data arrived: %j", data );
  var self = this;
  var url = "https://api.opsgenie.com/v1/json/alert";
  var json = {
    customerKey: this.customerKey,
    alias: this.alias( data )
  };
  if( data.state === "ok" ){
    // we are back
    url += "/close"
  }
  else if( data.state === "critical" ){
    // ahhh error, we are down
    json.message = util.format( "%s service on %s went to %s", data.service, data.host, data.state );
    json.recipients = this.recipients;
    json.tags = data.tags;
    json.details = data;
    json.source = data.host;
  }
  else{
    // currently we don't care about other states
    debug( "just emitting data because state isnt ok or critical" );
    return this.emit( "data", data );
  }
  
  debug( "sending to %s url data: %j", url, json );
  request({
    url: url,
    method: "POST",
    json: json
  }, function( err, response, body ){
    if( err ){
      return self.emit( "error", err )
    }

    // this is a special case when somebody solved the problem (it isnt open anymore)
    // or we missed the critical state and should silently skip the error
    if( body.code === 5 ){
      return self.emit( "data", data );
    }

    if( body.error ){
      return self.emit( "error", new Error( body.error ) );
    }

    self.emit( "data", data );
  });
};

OpsGenieReactor.prototype.alias = function( data ){
  return [ data.host, data.service ].join( "-" )
};

godot.reactor.register( "opsgenie", OpsGenieReactor );

module.exports = OpsGenieReactor;
