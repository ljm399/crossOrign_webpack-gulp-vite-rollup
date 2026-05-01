const { SyncBailHook } = require('tapable')

class Lesson {
  constructor() {
    this.hooks = {
      hyhook: new SyncBailHook(['name'])
    }
  }

  register() {
    this.hooks.hyhook.tap('pluginA', (name) => {
      console.log('pluginA', name)
      return 'stop'
    })

    this.hooks.hyhook.tap('pluginB', (name) => {
      console.log('pluginB', name)
    })
  }

  run() {
    setTimeout(() => {
      const result = this.hooks.hyhook.call('mjl')
      console.log('result', result)
    }, 1000)
  }
}

const lesson = new Lesson()
lesson.register()
lesson.run()
