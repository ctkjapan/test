import Phaser from 'phaser';
import { random, last } from 'lodash';
import Image = Phaser.Physics.Matter.Image;
import Text = Phaser.GameObjects.Text;
import { isPc } from '../util.ts';
import Vector2 = Phaser.Math.Vector2;
import CollisionStartEvent = Phaser.Physics.Matter.Events.CollisionStartEvent;

// ゲームオーバーにする高さ
// const GAMEOVER_LINE_Y = 150;

type BallType = {
    score: number;
    size: number;
    color: number;
    key: string;
};

export default class MyScene extends Phaser.Scene {
    private version: string | string[];
    // 全部のボールいれとく
    private balls: Image[];
    // 落とす前のボール
    private ball?: Image;
    // 最後に落としたボール
    private lastBall?: Image;
    // すこあ
    private score: number;
    // スコア表示
    private scoreText?: Text;
    // 次のボール撃てるか
    private nextBallReady: boolean;
    private gameTitle: boolean;
    private gameOver: boolean;
    private ballTypes: BallType[];

    private scoreDisplay?: Text[];
    private scoreDisplayCount: number;

    // ゲームオーバーにする高さ
    private gameOverLineY: number;
    private getBallY: number;

    constructor() {
        super({ key: 'myscene' });
        this.version = '240417_1';
        this.balls = [];
        this.score = 0;
        this.nextBallReady = true;
        this.gameTitle = true;
        this.gameOver = false;
        // ボールの種類 score=消した時の点数 size=大きさ  color=色
        this.ballTypes = [
            { score: 10, size: 25, color: 0xff5733, key: '0' },
            { score: 20, size: 50, color: 0x00bfa5, key: '1' },
            { score: 30, size: 75, color: 0x6f42c1, key: '2' },
            { score: 50, size: 100, color: 0x6f42c1, key: '3' },
            { score: 70, size: 125, color: 0x2ecc71, key: '4' },
            { score: 100, size: 150, color: 0xffc107, key: '5' },
            { score: 250, size: 175, color: 0x3498db, key: '6' },
            { score: 500, size: 250, color: 0xd32f2f, key: '7' },
        ];

        this.gameOverLineY = 150;
        this.getBallY = 100;

        this.scoreDisplay = [];
        this.scoreDisplayCount = 0;
    }

    preload() {
        ['0', '1', '2', '3', '4', '5', '6', '7'].forEach((key) => {
            this.load.image(key, `./img/${key}.png?${this.version}`);
        });
    }

    create() {
        // this.cameras.main.setBackgroundColor('#3168dd');

        this.matter.world.setBounds(0, 0, this.sys.canvas.width, this.sys.canvas.height);

        // console.log([this.sys.canvas]);

        // init
        this.score = 0;
        this.gameTitle = true;
        this.gameOver = false;
        this.nextBallReady = true;
        this.balls = [];
        this.scoreText = this.add.text(this.sys.canvas.width / 2, 28, `視聴者数: ${this.score} 人`, { fontSize: '28px', color: '#fff', align: 'center' });
        this.scoreText.setOrigin(0.5);
        this.gameOverLineY = this.sys.canvas.height / 5;
        this.getBallY = this.gameOverLineY - Math.round(this.sys.canvas.height / 13);

        this.ballTypes = [
            { score: 1, size: Math.round(this.sys.canvas.height / 30), color: 0xff5733, key: '0' },
            { score: 2, size: Math.round(this.sys.canvas.height / 20), color: 0x00bfa5, key: '1' },
            { score: 3, size: Math.round(this.sys.canvas.height / 13), color: 0x6f42c1, key: '2' },
            { score: 7, size: Math.round(this.sys.canvas.height / 8), color: 0x6f42c1, key: '3' },
            { score: 15, size: Math.round(this.sys.canvas.height / 6), color: 0x2ecc71, key: '4' },
            { score: 24, size: Math.round(this.sys.canvas.height / 4), color: 0xffc107, key: '5' },
            { score: 40, size: Math.round(this.sys.canvas.height / 2.75), color: 0x3498db, key: '6' },
            { score: 100, size: Math.round(this.sys.canvas.height / 1.65), color: 0xd32f2f, key: '7' },
        ];

        // クリックした時
        // if (isPc) {
        // this.input.on('pointerdown', () => {
        //     this.onClick();
        // });
        // } else {
        this.input.on('pointerup', () => {
            this.onClick();
        });
        // }

        // 最初のボールを作成
        this.ball = this.getBall(this.sys.canvas.width / 2, this.getBallY, this.ballTypes[0], false);

        this.drawGameTitleTexts();

        // 衝突判定をセット
        this.setCollision();
    }

    getBall(x: number, y: number, type: BallType, isRandomRotation = false) {
        const ball = this.matter.add.image(x, y, type.key, undefined, { shape: { type: 'circle' }, ignorePointer: true });
        ball.setDisplaySize(type.size, type.size);
        // ball.setCircle(type.size / 2);
        ball.setCircle(type.size / 2.5);
        ball.setBounce(0.2);
        ball.depth = 1;
        if (isRandomRotation) {
            ball.setRotation(random(360));
        }
        // 作成時は静的に
        ball.setSensor(true);
        ball.setStatic(true);
        // なぜか実際の判定より大きく書かれるのでだめだった
        // ball.preFX?.addCircle(1, type.color, 0, 1, 0)
        return ball;
    }

    update() {
        // 発射前のボールはマウスに追従させる
        if (this.ball!.isStatic()) {
            if (isPc) {
                this.ball!.x = this.input.mousePointer.x;
            } else {
                this.ball!.x = this.input.activePointer.x;
            }
        }
    }

    setCollision() {
        this.matter.world.on('collisionstart', (e: CollisionStartEvent) => {
            if (this.gameTitle || this.gameOver) {
                return;
            }
            e.pairs.forEach((pair) => {
                const o1 = pair.bodyA;
                const o2 = pair.bodyB;
                const ball1 = o1.gameObject;
                const ball2 = o2.gameObject;
                if ((this.ball !== ball1 && this.ball !== ball2 && ball1 === this.lastBall) || ball2 === this.lastBall) {
                    // setTimeout(() => {
                    this.nextBallReady = true;
                    // }, 400);
                }
                if (o1.label !== 'Circle Body' || o2.label !== 'Circle Body') {
                    return;
                }
                if (!ball1 || !ball2) {
                    return;
                }
                const width1 = Math.round(ball1.displayWidth);
                const width2 = Math.round(ball2.displayWidth);
                if (ball1.isStatic() || ball2.isStatic()) {
                    return;
                }

                // 大きさが同じボールのみ消す
                if (width1 !== width2) {
                    // ゲームオーバー判定  最後のボールがラインを超えたか？
                    if ((ball1 === this.lastBall || ball2 === this.lastBall) && this.lastBall!.y < this.gameOverLineY) {
                        this.gameOver = true;
                        this.drawGameOverTexts();
                    }
                    return;
                }
                // setTimeout(() => {
                this.nextBallReady = true;
                // }, 400);

                // スコア加算
                const currentType = this.ballTypes.find((type) => type.size === width1);
                if (currentType) {
                    this.score += currentType.score;
                    this.scoreText!.setText(`視聴者数: ${this.score} 人`);
                }
                ball1.destroy();
                ball2.destroy();

                const pos = getMiddlePoint(o1, o2);

                // 点表示
                if (currentType) {
                    this.scoreDisplayCount++;
                    if (this.scoreDisplay) {
                        this.scoreDisplay[this.scoreDisplayCount] = this.add.text(pos.x, pos.y, currentType.score.toString(), { fontSize: Math.round(currentType.size * 0.75) + 'px', color: '#fff', align: 'center' });
                        this.scoreDisplay[this.scoreDisplayCount].setOrigin(0.5);
                        this.scoreDisplay[this.scoreDisplayCount].setStroke('#ea5198', 2);
                        this.scoreDisplay[this.scoreDisplayCount].depth = 10;
                        this.scoreDisplay[this.scoreDisplayCount].alpha = 0.8;
                    }

                    setTimeout(
                        (count: number) => {
                            if (this.scoreDisplay) {
                                this.scoreDisplay[count].destroy();
                            }
                        },
                        400 + currentType.size * 5,
                        this.scoreDisplayCount
                    );
                }

                // ボールが消えたときに空中に残ることがあるので、生きているボールに下方向の力を加える
                setTimeout(() => {
                    this.balls
                        .filter((b) => b.active)
                        .forEach((b) => {
                            if (b === this.lastBall) {
                                return;
                            }
                            b.applyForce(new Vector2(0, 0.01));
                        });
                }, 20);

                // 一番でけぇボールなら消すだけ
                if (width1 === last(this.ballTypes)!.size) {
                    return;
                }
                // そうじゃないなら2つのボールの中心点に次の大きさのボール作る
                // const pos = getMiddlePoint(o1, o2);
                this.makeNewBall(pos.x, pos.y, width1);
            });
        });
    }

    // クリックしたとき
    onClick() {
        if (!this.nextBallReady || this.gameTitle || this.gameOver) {
            return;
        }
        this.nextBallReady = false;

        // 物理エンジンを適用して落下さす
        const ball = this.ball!;
        this.applyPhysicsToBall(ball);
        this.lastBall = ball;

        // 次のボール作る
        const ballType = this.ballTypes[random(0, 3)];
        // this.ball = this.getBall(400, 100, ballType);
        this.ball = this.getBall(this.sys.canvas.width / 2, this.getBallY, ballType);
    }

    // 次の大きさのボールつくる
    makeNewBall(x: number, y: number, size: number) {
        const nextType = this.ballTypes[this.ballTypes.findIndex((type) => type.size === size) + 1];
        const ball = this.getBall(x, y, nextType, true);
        this.applyPhysicsToBall(ball, true);
    }

    // ボールに物理エンジンを適用
    applyPhysicsToBall(ball: Image, isNew = false) {
        ball.setSensor(false);
        ball.setStatic(false);
        ball.setBounce(0.5);
        ball.applyForce(new Vector2(0, isNew ? -0.1 : 0.01));
        this.balls.push(ball);
    }

    // SPとPCで描画場所変える
    // 本当はPCでも割合計算すればマジックナンバー不要かも
    // y座標は対応さぼった
    drawGameOverTexts() {
        if (this.scoreText) {
            this.scoreText.destroy();
        }

        // const x = isPc ? 400 : window.innerWidth / 2;
        const x = this.sys.canvas.width / 2;
        const y = this.sys.canvas.height / 2 - 100;
        const scoreText = isPc ? `なんやねんこれもう 視聴者数: ${this.score} 人` : `なんやねんこれもう\n視聴者数: ${this.score} 人`;
        const title = this.add.text(x, y, scoreText, { fontSize: '40px', color: '#fff', backgroundColor: '#ea5198', align: 'center' });
        title.setOrigin(0.5);
        title.setPadding(10, 10);
        title.depth = 100;

        // const buttonX = isPc ? 400 : window.innerWidth / 2;
        const buttonX = this.sys.canvas.width / 2;
        const buttonY = this.sys.canvas.height / 2 + 100;
        const button = this.add.text(buttonX, buttonY, 'RETRY', { fontSize: '32px', color: '#fff', backgroundColor: '#ea5198', align: 'center' });
        button.setOrigin(0.5);
        button.setPadding(10, 10);
        button.depth = 100;
        button.on('pointerup', () => {
            this.scene.restart();
        });
        button.setInteractive();
    }

    drawGameTitleTexts() {
        // const x = isPc ? 400 : window.innerWidth / 2;
        const x = this.sys.canvas.width / 2;
        const y = this.sys.canvas.height / 2 - 100;
        const scoreText = `ねおちゃんねるゲーム`;
        const title = this.add.text(x, y, scoreText, { fontSize: '38px', color: '#fff', align: 'center' });
        title.setOrigin(0.5);
        title.setShadow(5, 5, '#ea5198', 5);
        title.depth = 100;

        const versionX = this.sys.canvas.width / 2;
        const versionY = this.sys.canvas.height - 10;
        const versionText = this.version;
        const version = this.add.text(versionX, versionY, versionText, { fontSize: '10px', color: '#fff', align: 'center' });
        version.setOrigin(0.5);
        version.depth = 100;

        // const buttonX = isPc ? 400 : window.innerWidth / 2;
        const buttonX = this.sys.canvas.width / 2;
        const buttonY = this.sys.canvas.height / 2 + 100;
        const button = this.add.text(buttonX, buttonY, 'START', { fontSize: '32px', color: '#fff', backgroundColor: '#ea5198', align: 'center' });
        button.setOrigin(0.5);
        button.setPadding(10, 10);
        button.depth = 100;
        button.on('pointerup', () => {
            this.gameTitle = false;
            title.destroy();
            version.destroy();
            button.destroy();

            // ゲームオーバーの線
            // this.add.line(0, GAMEOVER_LINE_Y, 1600, 0, 0, 0, 0xffffff);
            const gameoverLine = this.add.line(0, this.gameOverLineY, 0, 0, this.sys.canvas.width * 2, 0, 0xea5198);
            gameoverLine.setLineWidth(3);
        });
        button.setInteractive();
    }
}

// 真ん中ミツケル
function getMiddlePoint(ball1: any, ball2: any) {
    const middleX = (ball1.position.x + ball2.position.x) / 2;
    const middleY = (ball1.position.y + ball2.position.y) / 2;
    return { x: middleX, y: middleY };
}
