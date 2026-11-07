module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // zod 4 ships `export * as ns` syntax, which the React Native preset does not
    // transform. Without this Metro fails to bundle the app.
    '@babel/plugin-transform-export-namespace-from',
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '@app': './src/app',
          '@screens': './src/screens',
          '@features': './src/features',
          '@entities': './src/entities',
          '@shared': './src/shared',
        },
      },
    ],
    // Must stay last: it transforms the worklets the plugins above leave behind.
    'react-native-worklets/plugin',
  ],
};
