const { SyncWaterfallHook } = require('tapable')

class Lesson {
  constructor() {
    this.hooks = {
      hyhook: new SyncWaterfallHook(['data', 'age'])
    }
  }

  register() {
    this.hooks.hyhook.tap('pluginA', (data, age) => {
      console.log('pluginA', data, age)
      return data + ' A'
    })

    this.hooks.hyhook.tap('pluginB', (data, age) => {
      console.log('pluginB', data, age)
      return data + ' B'
    })
  }

  run() {
    setTimeout(() => {
      const result = this.hooks.hyhook.call('start', '18')
      console.log('result', result)
    }, 1000)
  }
}

const lesson = new Lesson()
lesson.register()
lesson.run()
