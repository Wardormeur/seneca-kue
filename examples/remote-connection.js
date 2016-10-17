var s = require('seneca')()
          .use(require('..'))
var assert = require('assert')
var _ = require('lodash')

var task = {
  task: 'my task',
  param: 3
}

var task2 = _.clone(task);
task2.param --;
var task3 = _.clone(task);
task3.param -= 2;
require('./process')(s)

console.log('worked if you see 3 OK ; 3-1-2')
// Config is optional but allows you to specify specific params for connection
// https://github.com/Automattic/kue#redis-connection-settings
s.act({ role: 'kue-queue', cmd: 'start', config: {
  redis: {
    port: 6379,
    host: '192.168.0.101'
  }
}})
s.act({ role: 'kue-queue', cmd: 'work', name: 'myQQ'});
s.act({ role: 'kue-queue', cmd: 'enqueue', name: 'myQQ', msg: task }, function(err, jobId){
  // s.log.debug('postJobCreation', kue.Job.get(jobId))
})
s.act({ role: 'kue-queue', cmd: 'enqueue', name: 'myQQ', msg: task2,
  params: {
    // attempts: 3,
    // backoff: {delay: 60*1000, type:'fixed'},
    // ttl: 42,
    delay: 60000,
    // concurrency: 0
  }
});
s.act({ role: 'kue-queue', cmd: 'enqueue', name: 'myQQ', msg: task3 })
