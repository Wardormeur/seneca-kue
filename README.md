# seneca-queue

A job queue for Seneca

## Usage

var s = require('seneca')()
var assert = require('assert')

var task = {
  task: 'my task',
  param: 42
}

s.use('queue')

s.add({
  task: 'my task'
}, function(args, cb) {
  assert.equal(args.param, 42)
  cb()
  s.act({ role: 'queue', cmd: 'stop' })
})

s.act({ role: 'queue', cmd: 'start' })
s.act({ role: 'queue', cmd: 'enqueue', task: task })

## License

MIT
