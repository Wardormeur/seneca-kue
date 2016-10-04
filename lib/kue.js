'use strict'

var kue = require('kue')
var _ = require('lodash')

module.exports = function Kue (role, seneca, options) {
  var queue = void 0

  seneca.add({role: role, cmd: 'start'}, function (args, done) {
    var config = args.config || void 0
    queue = kue.createQueue(config)
    done(null, {'queue': queue})
  })

  seneca.add({role: role, cmd: 'stop'}, function (args, done) {
    queue.shutdown( 5000, function(err) {
      seneca.log.debug( 'Kue shutdown: ', err || '' )
      done(err);
    });
  })

  seneca.add({role: role, cmd: 'enqueue'}, function (args, done) {
    var queueName = args.name || 'kue';
    if (!args.msg) {
      return done(new Error('no message specified'))
    }
    var concurrency = _.has(args,'params.concurrency');
    if (concurrency) {
      delete args.params.concurrency
    }
    var job = queue.create(queueName, args.msg)
    _.each(args.params, function(value, key ){
      seneca.log.debug('Creating job with', key, value);
      job[key](value);
    })

    job.save(function(err){
       if( !err ) {
        seneca.log.debug( 'job:', job.id, queueName )
        done(null, {job: job})
      } else {
        done(err)
      }
    })
    queue.process(queueName, concurrency || 1, function(job, done){
      seneca.log.debug('processing', job.id, queueName);
      seneca.act(job.data, done)
    })
  })
}
