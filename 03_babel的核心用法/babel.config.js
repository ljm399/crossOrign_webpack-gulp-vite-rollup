module.exports = {
    presets: [['@babel/preset-env', {
        targets: {
        //    browsers: ['> 1%', 'last 2 versions','not dead'],
        ie: '11'
        },
        modules: 'commonjs',
        corejs:3,
        useBuiltIns:'usage'
    }], ['@babel/preset-react', { runtime: 'automatic' }],'@babel/preset-typescript']
};