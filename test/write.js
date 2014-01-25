var should = require( "should" );
var godot = require( "godot" );
var ReadWriteStream = godot.common.ReadWriteStream;
var Reactor = require( ".." );
var nock = require( "nock" );

describe( "sending request to opsgenie", function(){
  beforeEach(function(){
    this.reactor = godot.reactor()
      .opsgenie({
        customerKey: "foo"
      });
    this.source = new ReadWriteStream();
    this.stream = this.reactor.createStream( this.source );
  });

  it( "should create an alert", function( done ){
    var self = this;
    var scope = nock( "https://api.opsgenie.com" )
      .post( "/v1/json/alert", {
        "customerKey":"foo",
        "alias":"oroce-app/health/heartbeat",
        "message":"app/health/heartbeat service on oroce went to critical",
        "recipients":"all",
        "details":{
          "service":"app/health/heartbeat",
          "metric":1,
          "ttl":50,
          "host":"oroce",
          "state":"critical"
        },
        "source":"oroce"
      })
      .reply(200, function(){
        self.stream.on( "data", function( data ){
          should.exist( data );
          data.service.should.eql( "app/health/heartbeat" );
          scope.done();
          done();
        });
        return {
          status: "successful"
        };
      });

    this.stream.write({
      "service": "app/health/heartbeat",
      "metric": 1,
      "ttl": 50,
      "host": "oroce",
      "state": "critical"
    });
  });

  it( "should just emit data is state isnt ok or critical", function( done ){
    // we don't need to mock request to opsgenie, because reactor is broken and
    // trying to create a request opsgenie would return with RestException[Could not authenticate]
    this.stream.on( "data", function(data){
      data.state.should.eql( "warning" );
      done();
    });

    this.stream.write({
      "service": "app/health/heartbeat",
      "metric": 1,
      "ttl": 50,
      "host": "oroce",
      "state": "warning"
    });
  });

  it( "should handle errors and emit error", function( done ){
    var self = this;
      var scope = nock( "https://api.opsgenie.com" )
        .post( "/v1/json/alert/close", {
          "customerKey":"foo",
          "alias":"oroce-app/health/heartbeat"
        })
        .reply(200, function(){
          self.reactor.on( "error", function( err ){
            should.exist( err );
            err.should.be.instanceOf( Error );
            err.toString().should.match( /RestException\[Could not authenticate\.\]/ );
            scope.done();
            done();
          });
          return {
            error: "RestException[Could not authenticate.]",
            code: 2
          };
        });

      this.stream.write({
        "service": "app/health/heartbeat",
        "metric": 1,
        "ttl": 50,
        "host": "oroce",
        "state": "ok"
      });
  });

  describe( "closeing alert", function(){
    it( "if state is ok and alert with alias isnt available " +
      "(we missed last critical or somebody solved it meanwhile) should silently skip the error", function( done ){
      var self = this;
      var scope = nock( "https://api.opsgenie.com" )
        .post( "/v1/json/alert/close", {
          "customerKey":"foo",
          "alias":"oroce-app/health/heartbeat"
        })
        .reply(200, function(){
          self.stream.on( "data", function( data ){
            should.exist( data );
            data.service.should.eql( "app/health/heartbeat" );
            data.state.should.eql( "ok" );
            scope.done();
            done();
          });
          return {
            error: "RestException[Alert with alias [oroce-app/health/heartbeat] does not exist.]",
            code: 5
          };
        });

      this.stream.write({
        "service": "app/health/heartbeat",
        "metric": 1,
        "ttl": 50,
        "host": "oroce",
        "state": "ok"
      });
    });

    it( "we should close the alert without problem", function( done ){
      var self = this;
      var scope = nock( "https://api.opsgenie.com" )
        .post( "/v1/json/alert/close", {
          "customerKey":"foo",
          "alias":"oroce-app/health/heartbeat"
        })
        .reply(200, function(){
          self.stream.on( "data", function( data ){
            should.exist( data );
            data.service.should.eql( "app/health/heartbeat" );
            data.state.should.eql( "ok" );
            scope.done();
            done();
          });
          return {
            status: "successful",
            code: 200
          };
        });

      this.stream.write({
        "service": "app/health/heartbeat",
        "metric": 1,
        "ttl": 50,
        "host": "oroce",
        "state": "ok"
      });
    });

  });

});