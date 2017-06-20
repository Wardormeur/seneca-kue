
var Queue = require('..')
var Seneca = require('seneca')
var expect = require('code').expect

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var beforeEach = lab.beforeEach
var afterEach = lab.afterEach

describe('seneca queue', function () {
  describe('Basics', function () {
    var s

    beforeEach(function (done) {
      s = Seneca({log: 'silent', debug: { undead: true }})
        .use(Queue, {role: 'kue1'})
        .use(Queue, {role: 'kue2'})
        .ready(done)
    })

    // afterEach(function (done) {
    //   seneca.act({ role: 'kue-queue', cmd: 'stop'}, done);
    // })

    it.skip('should process a task', function (done) {
      var task = {
        task: 'my task',
        param: 42
      }

      s.add({
        task: 'my task'
      }, function (args, cb) {
        expect(args).to.include(task)
        done()
      })

      s.act({ role: 'kue1', cmd: 'start' }, function (err) {
        if (err) { return done(err) }
        s.act({role: 'kue1', cmd: 'work'}, function (err, q) {
          s.act({ role: 'kue1', cmd: 'enqueue', msg: task }, function (err) {
            if (err) { return done(err) }
          })
        })
      })
    })

    it.skip('should not process a task until a worker is started', function (done) {
      var task = {
        task: 'my task',
        param: 42
      }
      // First create a named-queue
      s.act({ role: 'kue1', cmd: 'start' })
      // then enqueing
      s.act({ role: 'kue1', cmd: 'enqueue', msg: task })

      // then we add the task handler
      s.add({
        task: 'my task'
      }, function (args, cb) {
        expect(args).to.include(task)
        done()
      })

      // finally we start the worker
      s.act({ role: 'kue1', cmd: 'work'})
    })

    it.skip('should stop a worker', function (done) {
      var task = {
        task: 'my task',
        param: 43
      }

      s.add({
        task: 'my task'
      }, function (args, cb) {
        done(new Error('this should never be called'))
      })

      s.act({ role: 'kue1', cmd: 'start' })
      s.act({ role: 'kue1', cmd: 'work'})
      s.act({ role: 'kue1', cmd: 'stop' })
      s.act({ role: 'kue1', cmd: 'enqueue', msg: task }, function (err, result) {
        setTimeout(function () {
          s.act({ role: 'kue1', cmd: 'remove', id: result.job.id}, done)
        }, 1000)
      })

    })

    it.skip('should restart a worker', function (done) {
      var task = {
        task: 'my task',
        param: 42
      }
      var called = false;
      s.add({
        task: 'my task'
      }, function (args, cb) {
        expect(args).to.include(task)
        called = true;
        done()
      })

      s.act({ role: 'kue1', cmd: 'start' })
      s.act({ role: 'kue1', cmd: 'work' })
      s.act({ role: 'kue1', cmd: 'stop' })
      expect(called).to.be.equal(false);
      s.act({ role: 'kue1', cmd: 'start' })
      s.act({ role: 'kue1', cmd: 'enqueue', msg: task })
      s.act({ role: 'kue1', cmd: 'work' })
    })

    it.skip('should raise an error if no msg is passed', function (done) {
      s.act({role: 'kue1', cmd: 'start'}, function (err) {
        if (err) {
          return done(err)
        }

        s.act({ role: 'kue1', cmd: 'enqueue' }, function (err) {
          expect(err).to.be.an.object()
          done()
        })
      })
    })

    // Invalid : kue doens't support more than one K per process
    it('should not process a task from another queue', function (done) {
      var task1 = {q1task: 'my task', params: 42}
      var task2 = {q2task: 'my task', params: 42}
      var jobToBeRemoved = void 0;
      s.add({
        q1task: 'my task'
      }, function (args, cb) {
        done(new Error('this should never be called'))
      })

      s.add({
        q2task: 'my task'
      }, function (args, cb) {
        expect(args).to.include(task2)
        s.act({ role: 'kue1', cmd: 'stop', name: 'q1' })
        s.act({ role: 'kue2', cmd: 'stop', name: 'q2' })
        s.act({ role: 'kue1', cmd: 'remove', id: jobToBeRemoved.id }, done)
      })

      s.act({ role: 'kue1', cmd: 'start', name: 'q1' })
      s.act({ role: 'kue2', cmd: 'start', name: 'q2' })
      s.act({ role: 'kue2', cmd: 'work', name: 'q2' })
      // We don't start q2 worker to ensure that q2 job is not called through q1 worker
      // s.act({ role: 'kue-queue', cmd: 'work', name: 'q1' })
      s.act({ role: 'kue1', cmd: 'enqueue', name: 'q1', msg: task1 }, function (err, res) {
        jobToBeRemoved = res.job;
      })
      s.act({ role: 'kue2', cmd: 'enqueue', name: 'q2', msg: task2 })
    })

    it('should stop the proper queue', function (done) {
      var task1 = {q1task: 'my task', params: 42}
      var task2 = {q2task: 'my task', params: 42}
      var jobToBeRemoved = void 0;
      s.add({
        q1task: 'my task'
      }, function (args, cb) {
        done(new Error('this should never be called'))
      })

      s.add({
        q2task: 'my task'
      }, function (args, cb) {
        expect(args).to.include(task2)
        console.log('removal', args);
        s.act({ role: 'kue1', cmd: 'remove', id: jobToBeRemoved.id })
        s.act({ role: 'kue1', cmd: 'stop'})
        done()
      })

      s.act({ role: 'kue1', cmd: 'start', config: {name: 'q1'} })
      s.act({ role: 'kue2', cmd: 'start', config: {name: 'q2', prefix: 'q', redis: {}} })
      s.act({ role: 'kue2', cmd: 'work', name: 'q2' })
      s.act({ role: 'kue1', cmd: 'work', name: 'q1' })
      s.act({ role: 'kue1', cmd: 'shutdown', name: 'q1'});
      s.act({ role: 'kue1', cmd: 'enqueue', name: 'q1', msg: task1 }, function (err, res) { jobToBeRemoved = res.job;})
      s.act({ role: 'kue2', cmd: 'enqueue', name: 'q2', msg: task2 })
    })

    // it('should remove a job')
  })
})
