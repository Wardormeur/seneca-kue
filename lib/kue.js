'use strict'

var Q = require('kue')
var _ = require('lodash')

module.exports = function Kue (role, seneca, options) {
  var queue
  /**
   * Create a queue taking parameters from Kue config
   * @param {Object} config
   */
  seneca.add({role: role, cmd: 'start'}, function (args, done) {
    var config = args.config || void 0
    if (!config && args.name) config = {name: args.name}
    queue = Q.createQueue(config)
    done(null, {'queue': queue})
  })

  /**
   * Stop the queue and its workers
   */
  seneca.add({role: role, cmd: 'stop'}, function (args, done) {
    queue.shutdown(5000, function (err) {
      seneca.log.debug('Kues shutdown: ', err || '')
      done(err)
    })
  })

  /**
   * Load a job
   * @param {String} id
   * @param {String} jobType
   */
  seneca.add({role: role, cmd: 'load'}, function (args, done) {
    var jobId = args.id
    var jobType = args.jobType || null
    Q.Job.get(jobId, jobType, done)
  })

  /**
   * Remove a job
   * @param {String} id
   */
  seneca.add({role: role, cmd: 'remove'}, function (args, done) {
    var jobId = args.id
    Q.Job.remove(jobId, done)
  })

  /**
   * Start a worker to execute seneca acts
   * @param {String} name
   */
  seneca.add({role: role, cmd: 'work'}, function (args, done) {
    var queueName = args.name || 'kue'
    var concurrency = _.has(args, 'params.concurrency')
    queue.process(queueName, concurrency || 1, function (job, cb) {
      seneca.log.debug('processing', job.id, queueName)
      seneca.act(job.data, cb)
    })
    done()
  })


  /**
   * Enqueue a job
   * @param {Object} job Contains the act to be called by the worker
   */
  seneca.add({role: role, cmd: 'enqueue'}, function (args, done) {
    var queueName = args.name || 'kue'
    if (!args.msg) {
      done(new Error('no message specified'))
      return
    }
    var job = queue.create(queueName, args.msg)
    _.each(args.params, function (value, key) {
      seneca.log.debug('Creating job with', key, value)
      job[key](value)
    })
    var removeOnComplete = args.removeOnComplete || false
    job.removeOnComplete(removeOnComplete).save(function (err) {
      if (err) {
        done(err)
        return
      }
      seneca.log.debug('job:', job.id, queueName)
      done(null, { job })
    })
  })
}
