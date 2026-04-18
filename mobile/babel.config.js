module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    // react-native-worklets/plugin powers Reanimated v4 worklets and MUST be last.
    plugins: ["react-native-worklets/plugin"],
  };
};
