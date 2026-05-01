const { SyncLoopHook } = require('tapable')

class Lesson {
  constructor() {
    this.hooks = {
      hyhook: new SyncLoopHook(['name'])
    }
    this.countA = 0
  }

  register() {
    this.hooks.hyhook.tap('pluginA', (name) => {
      this.countA++
      console.log('pluginA', this.countA, name)
      if (this.countA < 3) return true
      return undefined
    })

    this.hooks.hyhook.tap('pluginB', (name) => {
      console.log('pluginB', name)
      return undefined
    })
  }

  run() {
    setTimeout(() => {
      this.hooks.hyhook.call('mjl')
    }, 1000)
  }
}

const lesson = new Lesson()
lesson.register()
lesson.run()
