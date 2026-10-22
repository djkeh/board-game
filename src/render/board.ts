import { Container, Graphics } from 'pixi.js'
import { HEX, hexToPixel } from '../game/hexgrid'
import { selectable } from '../game/rules'
import type { GameState } from '../game/types'

/** 논리 해상도. main.ts가 뷰포트에 맞춰 스케일한다 */
export const BOARD_SIZE = 1080
const COLORS = { white: 0xf2f7ff, blue: 0x5fc4e6, edge: 0x9fb8d8, hilite: 0xffd54a, frame: 0x1e4fb5, penguin: 0x1d1d1d }

export class BoardView {
  readonly root = new Container()
  private blocks = new Map<number, Graphics>()
  private penguin = new Graphics()

  constructor(private onPick: (id: number) => void) {
    this.root.addChild(new Graphics().regularPoly(0, 0, BOARD_SIZE / 2, 6).fill(COLORS.frame))
    this.penguin
      .circle(0, 0, HEX * 0.42).fill(COLORS.penguin)
      .ellipse(0, HEX * 0.08, HEX * 0.24, HEX * 0.3).fill(0xffffff)
      .poly([-8, -HEX * 0.1, 8, -HEX * 0.1, 0, HEX * 0.05]).fill(0xff9f1c)
  }

  update(s: GameState): void {
    const pick = new Set(selectable(s.blocks, s.phase === 'pick' ? s.spin : null).map((b) => b.id))
    for (const b of s.blocks) {
      let g = this.blocks.get(b.id)
      if (!g) {
        g = new Graphics()
        g.position.copyFrom(hexToPixel(b, HEX))
        g.cursor = 'pointer'
        g.on('pointertap', () => this.onPick(b.id))
        this.blocks.set(b.id, g)
        this.root.addChild(g)
      }
      const hot = pick.has(b.id)
      g.visible = b.alive
      g.eventMode = hot ? 'static' : 'none'
      g.clear().regularPoly(0, 0, HEX * 0.92, 6).fill(COLORS[b.color]).stroke({ width: hot ? 8 : 3, color: hot ? COLORS.hilite : COLORS.edge })
    }
    const pb = s.blocks.find((b) => b.id === s.penguinBlock)!
    this.penguin.visible = pb.alive
    this.penguin.position.copyFrom(hexToPixel(pb, HEX))
    this.root.addChild(this.penguin) // 항상 블록 위에
  }
}
