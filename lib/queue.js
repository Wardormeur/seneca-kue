'use strict'

var Kue = require('./kue')
var _ = require('lodash')

function queue (options) {
  var seneca = this

  // # Plugin options.
  // These are the defaults. You can override using the _options_ argument.
  options = seneca.util.deepextend({
    role: 'kue-queue',
    queues: [],
    timeout: 5000
  }, options)

  // You can change the _role_ value for the plugin patterns.
  // Use this when you want to load multiple versions of the plugin
  // and expose them via different patterns.
  var role = options.role

  Kue(role, seneca, options)

  seneca.add({init: role}, function (args, done) {
    done()
  })

  return {
    name: role
  }
}

module.exports = queue
