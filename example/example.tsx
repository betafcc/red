import { red, StateOf, ActionOf } from '@betafcc/red'

export type State = StateOf<typeof app>

export type Action = ActionOf<typeof app>

const app = red

const { initial, reducer, actions } = app
