const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// VRMファイルをアセットとして認識
config.resolver.assetExts.push('vrm', 'glb', 'gltf');

module.exports = config;
