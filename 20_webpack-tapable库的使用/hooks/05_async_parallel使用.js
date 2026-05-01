const { AsyncParallelHook } = require('tapable')

class Lesson {
  constructor() {
    this.hooks = {
      hyhook: new AsyncParallelHook(['name'])
    }
  }

  register() {
    this.hooks.hyhook.tapAsync('pluginA', (name, callback) => {
        console.log('pluginA', name)
        // callback()
    })

    this.hooks.hyhook.tapAsync('pluginB', (name, callback) => {
        console.log('pluginB', name)
        // callback()
    })
  }

  run() {
    setTimeout(() => {
      this.hooks.hyhook.callAsync('mjl')
    }, 1000)
  }
}

const lesson = new Lesson()
lesson.register()
lesson.run()
