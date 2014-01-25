var should = require( "should" );
var Reactor = require( ".." );

describe( "constructor", function(){
  it( "should throw error if customerKey is missing", function(){
    (function(){
      new Reactor();
    }).should.throw();
  });

  it( "should be recipients all if it wasnt passed", function(){
    var c = new Reactor({
      customerKey: "foo"
    });
    c.recipients.should.eql( "all" );
  });

  it( "should accept recipients", function(){
    var c = new Reactor({
      recipients: "foobar",
      customerKey: "foo"
    });
    c.recipients.should.eql( "foobar" );
  });
});

