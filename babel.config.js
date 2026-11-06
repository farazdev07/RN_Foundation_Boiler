module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
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
