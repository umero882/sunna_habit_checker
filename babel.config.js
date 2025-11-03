module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(true);

  return {
    presets: [
      'babel-preset-expo',
      ...(isTest ? ['@babel/preset-flow'] : []),
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@types': './src/types',
            '@constants': './src/constants',
            '@navigation': './src/navigation',
          },
        },
      ],
    ],
  };
};
