import { red, StateOf, ActionOf } from '@betafcc/red'

export type State = StateOf<typeof app>

export type Action = ActionOf<typeof app>

export const app = red
  .withState({ input: '' })
  .handle({
    setInput(state, value: string) {
      return { input: value }
    },
  })
  .withState({
    todos: [] as { id: number; msg: string; done: boolean }[],
  })
  .handle({
    addTodo(state, id: number, msg: string) {
      return { todos: state.todos.concat({ id, msg, done: false }) }
    },
    completeTodo(state, id: number) {
      return { todos: state.todos.map((t) => (t.id === id ? { ...t, done: true } : t)) }
    },
  })

app.initial // the initial state merged
app.reducer // the generated reducer from handlers
app.actions // the action creators

app.actions.addTodo(10, 'buy milk')
