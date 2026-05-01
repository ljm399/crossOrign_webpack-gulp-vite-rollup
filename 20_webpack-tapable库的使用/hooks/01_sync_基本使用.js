const { SyncHook } = require('tapable')

class Lesson {
  constructor() {
    this.hooks = {
      hyhook: new SyncHook(['name', 'age'])
    }
  }

  register() {
    this.hooks.hyhook.tap('pluginA', (name, age) => {
      console.log('pluginA hyhook', name, age)
    })

    this.hooks.hyhook.tap('pluginB', (name, age) => {
      console.log('pluginB hyhook', name, age)
    })
  }

  run() {
    setTimeout(() => {
      this.hooks.hyhook.call('mjl', 18)
    }, 3000)
  }
}

const lesson = new Lesson()
lesson.register()
lesson.run()
