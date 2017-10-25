var Queue = require('..')
var Seneca = require('seneca')
var expect = require('code').expect

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it

const initSeneca = function (done) {
  const seneca = Seneca({log: 'test', debug: { undead: true }, strict: { result: false }})
    .use(Queue)
    .ready(done)
  return seneca
}

describe('seneca-kue', function () {
  it('should expose Q', function (done) {
    var s = initSeneca(done)
    s.add({cmd: 'test'}, function (args, done) {
      done()
    })
    s.act({role: 'kue-queue', cmd: 'start'}, function (err, q) {
      expect(err).to.equal(null)
      expect(q).to.exists
    })
  })

  it('should retrieve a job', function (done) {
    var s = initSeneca(done)
    s.add({cmd: 'test'}, function (args, done) {
      done()
    })
    s.act({role: 'kue-queue', cmd: 'start'}, function (err, q) {
      expect(err).to.equal(null)
      s.act({role: 'kue-queue', cmd: 'enqueue', msg: {cmd: 'test'}}, function (err, out) {
        expect(err).to.equal(null)
        s.act({role: 'kue-queue', cmd: 'load', id: out.job.id}, function (err, loadedJob) {
          expect(err).to.equal(null)
          expect(loadedJob).to.not.equal(null)
        })
      })
    })
  })

  it('should remove a job', function (done) {
    var s = initSeneca(done)
    s.add({cmd: 'test'}, function (args, done) {
      done()
    })
    s.act({role: 'kue-queue', cmd: 'start'}, function (err) {
      expect(err).to.equal(null)
      s.act({role: 'kue-queue', cmd: 'enqueue', msg: {cmd: 'test'}}, function (err, out) {
        expect(err).to.equal(null)
        expect(out).to.not.equal(null)
        expect(out.job).to.not.equal(null)
        s.act({role: 'kue-queue', cmd: 'remove', id: out.job.id}, function (err) {
          expect(err).to.equal(null)
          s.act({role: 'kue-queue', cmd: 'load', id: out.job.id}, function (err, job) {
            expect(err).to.not.equal(null)
            expect(job).to.not.exists
          })
        })
      })
    })
  })
})
