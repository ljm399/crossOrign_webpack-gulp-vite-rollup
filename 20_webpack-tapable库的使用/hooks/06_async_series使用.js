const { AsyncSeriesHook } = require('tapable')

class Lesson {
  constructor() {
    this.hooks = {
      hyhook: new AsyncSeriesHook(['name'])
    }
  }

  register() {
    this.hooks.hyhook.tapAsync('pluginA', (name, callback) => {
      setTimeout(() => {
        console.log('pluginA', name)
        callback()
      }, 1000)
    })

    this.hooks.hyhook.tapAsync('pluginB', (name, callback) => {
      setTimeout(() => {
        console.log('pluginB', name)
        callback()
      }, 500)
    })
  }

  run() {
    setTimeout(() => {
      this.hooks.hyhook.callAsync('mjl', () => {
        console.log('done')
      })
    }, 1000)
  }
}

const lesson = new Lesson()
lesson.register()
lesson.run()
