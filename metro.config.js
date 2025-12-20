const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// VRM/3Dファイルと画像をアセットとして認識
config.resolver.assetExts.push('vrm', 'glb', 'gltf', 'bin');

// ソース拡張子
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'];

module.exports = config;
