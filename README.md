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

Redux apps takes too much boilerplate even for the simplest examples. With type-safety, it's even worse. If we standardize the actions shape, we can make the type-system fill the boilerplate.

If every action has this shape:

```typescript
type ActionType<K extends string, P extends Array<unknown>> = {
  type: K
  payload: P
}
```

That is, just an object with a 'type' string and the payload as an array, we can automatically provide action creators, reducer type-signature and make the handlers definition way nicer and composable:

```typescript
const app = red
  .withState({ input: '', todo: [] as Array<{msg: string, id: number, done: boolean}>})
  .handle({
    addTodo(state, msg: string, id: number) {
      return {todo: [...state.todo, {msg, id, done: false}]}
    },
    completeTodo(state, id: number) {
      return {todo: todo.map(t => t.id !== id ? t : {...t, done: true})}
    }
  })
```

The arguments in the handlers define the payload, and their keys define the 'type', the revealed Action types is:

```typescript
import { StateOf, ActionOf } from '@betafcc/red'

type State = StateOf<typeof red>
// { input: string, todo: Array<{msg: string, id: number, done: boolean}> }

type Action = ActionOf<typeof red>
// { type: 'addTodo', payload: [string, number] } | { type: 'completeTodo', payload: [number] }

```

And you also have action creators that matches the signature:

```typescript
const {addTodo, completeTodo} = app.actions

// addTodo(msg: string, id: number) => { type: 'addTodo', payload: [string, number] }
// completeTodo(id: number) => { type: 'completeTodo', payload: [number] }
```

And the reducer that combines the handlers:

```typescript
const {reducer, initial} = app

// initial = { input: '', todo: [] }

// reducer(
//   state: {input: string, todo: Array<{msg: string, id: number, done: boolean}>},
//   action: { type: 'addTodo', payload: [string, number] } | { type: 'completeTodo', payload: [number] },
// ) => {input: string, todo: Array<{msg: string, id: number, done: boolean}>}

```

If your prefer to define the actions yourself, you can use `ActionType` helper and `withActions` method:

```typescript
import { ActionType } from '@betafcc/red'

type Action =
  | ActionType<'addTodo', [string, number]>
  | ActionType<'completeTodo', [number]>

const app = red
  .withState({ input: '', todo: [] as Array<{msg: string, id: number, done: boolean}>})
  .withActions<Action>({ // annotate here
    addTodo(state, msg, id) { // so arguments will have infered type
      return {todo: [...state.todo, {msg, id, done: false}]}
    },
    completeTodo(state, id) {
      return {todo: todo.map(t => t.id !== id ? t : {...t, done: true})}
    }
  })
```
