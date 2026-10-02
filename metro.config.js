// Výchozí Expo konfigurace; jen vynechá samostatný Remotion projekt `video/` (vlastní node_modules a React).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const videoDir = path.resolve(__dirname, 'video');
config.resolver.blockList = [new RegExp(`^${escape(videoDir)}[\\\\/].*`)];
module.exports = config;
