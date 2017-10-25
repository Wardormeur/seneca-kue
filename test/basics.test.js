
var Queue = require('..')
var Seneca = require('seneca')
var expect = require('code').expect

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it

const initSeneca = function (done) {
  const seneca = Seneca({log: 'silent', debug: { undead: true }, strict: { result: false }})
    .use(Queue)
    .ready(done)
  return seneca
}

describe('seneca queue', function () {
  describe('Basics', function () {
    it('should start with a name as an arg', function (done) {
      var s = initSeneca(done)
      s.act({ role: 'kue-queue', cmd: 'start', name: 'testQ' }, function (err, out) {
        expect(err).to.equal(null)
        expect(out).to.not.equal(null)
      })
    })

    it('should start with a name in the config', function (done) {
      var s = initSeneca(done)
      s.act({ role: 'kue-queue', cmd: 'start', config: { name: 'testQ' } }, function (err, out) {
        expect(err).to.equal(null)
        expect(out).to.not.equal(null)
      })
    })

    it('should process a task', function (done) {
      var s = initSeneca(done)
      var task = {
        task: 'my task',
        param: 42
      }

      s.add({ task: 'my task' }, function (args) {
        expect(args).to.include(task)
      })

      s.act({ role: 'kue-queue', cmd: 'start' }, function (err, out) {
        expect(err).to.equal(null)
        expect(out).to.not.equal(null)

        s.act({role: 'kue-queue', cmd: 'work'}, function (err, out) {
          expect(err).to.equal(null)
          expect(out).to.not.equal(null)

          s.act({ role: 'kue-queue', cmd: 'enqueue', msg: task }, function (err, out) {
            expect(err).to.equal(null)
            expect(out).to.not.equal(null)
          })
        })
      })
    })

    it('should process a task set to remove on completion', function (done) {
      var s = initSeneca(done)
      var task = {
        task: 'my task',
        param: 42
      }

      s.add({ task: 'my task' }, function (args) {
        expect(args).to.include(task)
      })

      s.act({ role: 'kue-queue', cmd: 'start' }, function (err, out) {
        expect(err).to.equal(null)
        expect(out).to.not.equal(null)

        s.act({role: 'kue-queue', cmd: 'work'}, function (err, out) {
          expect(err).to.equal(null)
          expect(out).to.not.equal(null)

          s.act({ role: 'kue-queue', cmd: 'enqueue', msg: task, removeOnComplete: true }, function (err, out) {
            expect(err).to.equal(null)
            expect(out).to.not.equal(null)
          })
        })
      })
    })

    it('should not process a task until a worker is started', function (done) {
      var s = initSeneca(done)
      var task = {
        task: 'my task',
        param: 42
      }
      // First create a named-queue
      s.act({ role: 'kue-queue', cmd: 'start' })
      // then enqueing
      s.act({ role: 'kue-queue', cmd: 'enqueue', msg: task })

      // then we add the task handler
      s.add({ task: 'my task' }, function (args) {
        expect(args).to.include(task)
      })

      // finally we start the worker
      s.act({ role: 'kue-queue', cmd: 'work' }, function (err, out) {
        expect(err).to.equal(null)
        expect(out).to.not.equal(null)
      })
    })

    it('should stop a worker', function (done) {
      var s = initSeneca(done)
      var task = {
        task: 'my task',
        param: 43
      }

      s.add({ task: 'my task' }, function (args) {
        expect(args).to.include(task)
      })

      s.act({ role: 'kue-queue', cmd: 'start' })
      s.act({ role: 'kue-queue', cmd: 'work' })
      s.act({ role: 'kue-queue', cmd: 'stop' })
      s.act({ role: 'kue-queue', cmd: 'enqueue', msg: task }, function (err, result) {
        expect(err).to.equal(null)
        setTimeout(function () {
          s.act({ role: 'kue-queue', cmd: 'remove', id: result.job.id }, done)
        }, 1000)
      })
    })

    it('should restart a worker', function (done) {
      var s = initSeneca(done)
      var task = {
        task: 'my task',
        param: 42
      }
      var called = false
      s.add({ task: 'my task' }, function (args) {
        expect(args).to.include(task)
        called = true
      })

      s.act({ role: 'kue-queue', cmd: 'start' })
      s.act({ role: 'kue-queue', cmd: 'work' })
      s.act({ role: 'kue-queue', cmd: 'stop' })
      expect(called).to.equal(false)
      s.act({ role: 'kue-queue', cmd: 'start' })
      s.act({ role: 'kue-queue', cmd: 'enqueue', msg: task })
      s.act({ role: 'kue-queue', cmd: 'work' }, function (err, out) {
        expect(err).to.equal(null)
        expect(out).to.not.equal(null)
        expect(called).to.equal(true)
      })
    })

    it('should raise an error if no msg is passed', function (done) {
      var s = initSeneca(done)
      s.act({role: 'kue-queue', cmd: 'start'}, function (err) {
        if (err) {
          return done(err)
        }

        s.act({ role: 'kue-queue', cmd: 'enqueue' }, function (err) {
          expect(err).to.be.an.object()
        })
      })
    })
  })
})
