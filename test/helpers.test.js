var Queue = require('..')
var Seneca = require('seneca')
var expect = require('code').expect

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var beforeEach = lab.beforeEach

describe('seneca-kue', function () {
  var q, job

  lab.before(function (done) {
    s = Seneca({log: 'silent', debug: { undead: true }})
      .use(Queue)

    s.add({cmd: 'test'}, function (args, done) {
      console.log('Stacking up Bananases');
      done()
    })
    s.act({role: 'kue-queue', cmd: 'start'}, function (err, qq) {
      q = qq
      s.act({role: 'kue-queue', cmd: 'enqueue', msg: {cmd: 'test'}}, function (err, jobby) {
        job = jobby
        done()
      })
    })
  });
  lab.after(function (done) {
    s.close()
  })

  it('should expose Q', function (done) {
    expect(q).to.exists
    done()
  })

  it('should retrieve a job', function (done) {
    s.act({role: 'kue-queue', cmd: 'load', id: job.id}, function (err, job) {
      expect(job).to.exists
      done()
    })
  })

  it('should remove a job', function (done) {
    s.act({role: 'kue-queue', cmd: 'remove', id: job.id}, function (err) {
      s.act({role: 'kue-enqueue', cmd: 'load', id: job.id}, function (err, job) {
        expect(job).to.not.exists
        done()
      })
    })
  })

})
