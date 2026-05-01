module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['> 0.01%', 'last 2 versions', 'not dead']
        }
      }
    ]
  ]
};