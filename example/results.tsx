// Typescript inspect

type State = { input: string } & {
  todos: { id: number, msg: string, done: boolean }[],
};

type Action =
  | ActionType<"setInput", [string]>
  | ActionType<"addTodo", [number, string]>
  | ActionType<"completeTodo", [number]>;

type ActionType<K, P> = { type: K, payload: P };
