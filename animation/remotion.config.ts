import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// le logo est un aplat vectoriel : un bitrate genereux evite tout ringing sur les bords
Config.setCrf(16);
