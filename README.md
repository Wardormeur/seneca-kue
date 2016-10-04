![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js][] job queue plugin

# seneca-kue

A plugin that allows you to create and use queues.

If you're using this module, and need help, you can:
- Post a [github issue][],

If you are new to Seneca in general, please take a look at [senecajs.org][]. We have everything from
tutorials to sample apps to help get you up and running quickly.

This is not an official plugin maintained by the seneca team, use at your own risks :)

## Install
To install, simply use npm. Remember you will need to install [Seneca.js][] if you haven't already.

```
npm install seneca
npm install seneca-kue
```

## Usage in the same process

```js
var s = require('seneca')()
var assert = require('assert')

var task = {
  task: 'my task',
  param: 42
}

s.use('kue-queue')

s.add({
  task: 'my task'
}, function(args, cb) {
  assert.equal(args.param, 42)
  cb()
  s.act({ role: 'queue', cmd: 'stop' })
})

s.act({ role: 'queue', cmd: 'start' })
s.act({ role: 'queue', cmd: 'enqueue', msg: task })
```

## Options

It is possible to pass additional options when registering the queue plugin, as shown below

```js
var s = require('seneca')()
var assert = require('assert')

s.use('queue', {
  role: 'queue'
})
```

- role, default: 'queue'. This is the role to be used for start, stop and enqueue commands, you can change it in case of a conflict with other action patterns or if you want to register two different queues.

It is possible to pass additional options when creating a job or when running the worker, refer to the examples for more :)


## License
Copyright Matteo Collina and Senecajs.org contributors, 2015-2016, Licensed under [MIT][].


[MIT]: ./LICENSE
[Senecajs org]: https://github.com/senecajs/
[senecajs.org]: http://senecajs.org/
[Seneca.js]: https://www.npmjs.com/package/seneca
[github issue]: https://github.com/senecajs/seneca-queue/issues
[@senecajs]: http://twitter.com/senecajs
