import { red, StateOf, ActionOf } from '../src/index'

type State = StateOf<typeof app>

type Action = ActionOf<typeof app>

const app = red

const { initial, reducer, actions } = app
