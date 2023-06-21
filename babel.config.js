module.exports = {
  plugins: ['@babel/plugin-transform-modules-commonjs', [
    '@babel/plugin-transform-runtime',
    {
      regenerator: true,
    },
  ]],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript'
  ]
}
