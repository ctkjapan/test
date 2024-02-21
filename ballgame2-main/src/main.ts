import Phaser from 'phaser';
import MyScene from './scenes/MyScene';
// import {isPc} from "./util.ts";

// const width = isPc ? 800: window.innerWidth;
// const height  = isPc ? 600: window.innerHeight;
// const width = window.innerWidth > 400 ? 400 : window.innerWidth;
// const height = window.innerHeight > 800 ? 800 : window.innerWidth;
const width = window.innerWidth;
const height = window.innerHeight;

const config: Phaser.Types.Core.GameConfig = {
    parent: 'game',
    type: Phaser.AUTO,
    width,
    height,
    physics: {
        default: 'matter',
        matter: {
            // debug: true,
            gravity: { y: 1 },
            enableSleeping: true,
        },
    },
    transparent: true,
    scene: MyScene,
};
new Phaser.Game(config);
