var _ = require("underscore");
var url = require('url')
var fs = require('fs-extra');


module.exports = function(app,io,m){

  /**
  * routing event
  */
  app.get("/", getIndex);

  /**
  * routing functions
  */

  // GET
  function getIndex(req, res) {
    res.render("index", {title : "Photomaton | Dodoc"});
  };

};
