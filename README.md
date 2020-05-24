![](example/red-hat.png)

# Red

Type-safe, composable, boilerplateless reducers

## By example

```typescript
import React, { useReducer } from 'react'
import { render } from 'react-dom'
import { red } from '@betafcc/red'

const inputApp = red
  .withState({ input: '' })
  .handle({ setInput: (state, input: string) => ({ input }) })

const todoApp = inputApp
  .withState({ todos: [] as Array<{ msg: string; done: boolean }> })
  .handle({
    add: (state, msg: string) => ({ input: '', todos: [...s.todos, { msg, done: false }] }),
    complete: (state, id: number) => ({ todos: state.todos.map((e, i) => i !== id ? e : { ...e, done: true }) }),
  })

export const TodoApp = () => {
  const [{ input, todos }, { setInput, add, complete }] = todoApp.useHook(useReducer)
  return <>
    <input value={input} onChange={e => setInput(e.target.value)} />
    <button onClick={_ => add(input)}>add</button>
    {todos.map((e, id) => <li key={id} style={e.done ? { textDecoration: 'line-through' } : {}}>
      {e.msg}<button onClick={_ => complete(id)}>done</button>
    </li>)}
  </>
}

render(<TodoApp />, document.getElementById('root'))
```

## The idea

If every action has this shape:

```typescript
type ActionType<K extends string, P extends Array<unknown>> = {
  type: K
  payload: P
}
```

We can automatically provide action creators and strong-typed reducer from simple handlers definitions:

```typescript
const app = red
  .withState({
    input: '',
    todo: [] as Array<{msg: string, id: number, done: boolean}>
  })
  .handle({
    setInput(state, input: string) {
      return { input }
    },

    addTodo(state, msg: string, id: number) {
      return { todo: [...state.todo, {msg, id, done: false}] }
    },

    completeTodo(state, id: number) {
      return { todo: todo.map(t => t.id !== id ? t : {...t, done: true}) }
    }
  })

const {
  intial, // the initial state
  reducer, // the reducer made by combining the handlers
  actions, // the action creators
} = red
```

The arguments in the handlers define the payload, and their keys define the 'type', the revealed signature is:

```typescript
import { StateOf, ActionOf } from '@betafcc/red'

type State = StateOf<typeof red>
// { input: string, todo: Array<{msg: string, id: number, done: boolean}> }

type Action = ActionOf<typeof red>
// { type: 'setInput', payload: [string] } | { type: 'addTodo', payload: [string, number] } | { type: 'completeTodo', payload: [number] }

```

And you also have action creators that matches the signature:

```typescript
const { addTodo, completeTodo } = app.actions

addTodo('buy milk', 0) // { type: 'addTodo', payload: ['buy milk', 0] }
completeTodo(0) // { type: 'completeTodo', payload: [number] }
```

If your prefer to define the actions yourself, you can use `ActionType` helper and `withActions` method:

```typescript
import { ActionType } from '@betafcc/red'

type Action =
  | ActionType<'setInput', [string]>
  | ActionType<'addTodo', [string, number]>
  | ActionType<'completeTodo', [number]>

const app = red
  .withState({ input: '', todo: [] as Array<{msg: string, id: number, done: boolean}>})
  .withActions<Action>({ // annotate here
    setInput(state, input) { // so arguments will have infered type, no need to annotate here
      return {input}
    },

    addTodo(state, msg, id) {
      return {todo: [...state.todo, {msg, id, done: false}]}
    },

    completeTodo(state, id) {
      return {todo: todo.map(t => t.id !== id ? t : {...t, done: true})}
    }
  })
```

## Use it

The simplest way to use is to extract the generated `reducer`, `initial` and the `actions` creators:

```typescript
const {reducer, initial, actions} = app

const App = () => {
  const [state, dispatch] = React.useReducer(reducer, initial)

  return <>
    {state.count}
    <button onClick={_ => dispatch(actions.increment())}>+</button>
  </>
}
```

But you can use `red.useHook` for some extra magic:

```typescript
const App = () => {
  // the action creators will become dispatchers
  const [state, {increment}] = app.useHook(React.useReducer)

  return <>
    {state.count}
    <button onClick={_ => increment()}>+</button>
  </>
}
```

## Merge

You can use `red.merge` to combine apps together:

```typescript
const inputApp = red
  .withState({input: ''})
  .handle({setInput: (s, value: string) => ({input: value})})

const todoApp = red
  .withState({todos: [] as Array<{id: number, done: boolean, msg: string}>})
  .handle({add: (s, msg: string, id: number) => ({todos: [...s.todos, {id, msg, done: false}]}) })

const app = red.merge(inputApp).merge(todoApp)
// same as
const app = inputApp.merge(todoApp)
// same as
const app = red
  .withState({input: ''})
  .handle({setInput: (s, value: string) => ({input: value})})
  .withState({todos: [] as Array<{id: number, done: boolean, msg: string}>})
  .handle({add: (s, msg: string, id: number) => ({todos: [...s.todos, {id, msg, done: false}]}) })
```

## Combine

Or you can combine them by namespacing with `red.combine`, similar to redux's `combineReducers`:

```typescript
const inputApp = red.withState({input: ''}).handle({setInput: (s, input: string) => ({input})})
const counterApp = red.withState({count: 0}).handle({increment: s => ({count: s.count + 1})})

const app = red.combine({
  ui: inputApp,
  counter: counterApp
})

// equivalent to:
const app = red.withState({
  ui: {input: ''},
  counter: {count: 0}
}).handle({
  // note that you have to manually namespace the state
  setInput: (s, input: string) => ({...s, ui: {input}}),
  increment: s => ({...s, counter: {count: s.counter.count + 1}})
})
```
