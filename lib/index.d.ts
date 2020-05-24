export declare class Red<S, A extends ActionType<string, any[]>> {
    readonly initial: S;
    readonly handlers: Handlers<S, A>;
    actions: ActionCreators<A>;
    constructor(initial: S, handlers: Handlers<S, A>);
    reducer: (state: S | undefined, action: A) => S;
    /**
     * Adds handlers to the reducer.
     * The name of the handler will be 'type' of the action,
     * the arguments will be the payload.
     *
     * The return value of a handler must be the partial of State.
     * @example
     * const app = red
     *   .withState({ count: 0, input: '' })
     *   .handle({
     *     // will infer action of shape: { type: 'setInput', payload: [string] }
     *     setInput(state, msg: string) { return { input: msg } },
     *     // will infer action of shape: { type: 'increment', payload: [] }
     *     increment(state) { return { count: state.count + 1 } },
     *   })
     */
    handle: <AP extends Record<string, any[]>>(handlers: HandlersFromMapping<S, AP>) => Red<S, A | { [K in Extract<keyof AP, string>]: ActionType<K, AP[K]>; }[Extract<keyof AP, string>]>;
    /**
     * Same as `red.handle`, but instead of type inference on the handlers,
     * the action types must be explicitly defined and will be enforced in the implementation:
     *
     * @example
     * type Action =
     *   | ActionType<'setInput', [{msg: string}]>
     *   | ActionType<'increment'>
     *
     * const app = red
     *   .withState({ count: 0, input: '' })
     *   .withActions<Action>({ // if some key is missing, will point
     *     setInput
     *   })
     */
    withActions: <B extends ActionType<string, any[]>>(handlers: { [K in B["type"]]: (s: S, ...p: Extract<B, {
        type: K;
    }>["payload"]) => Partial<S>; }) => Red<S, A | B>;
    /**
     * Defines the type and initial state
     * @example
     * const app = red.withState({ count: 0, input: '' })
     * // app: Red<{count: number, input: string}, never>
     *
     * // or with state type defined explicitly
     * type State = { count: number, input: string }
     * const app = red.withState<State>({count: 0, input: ''})
     */
    withState: <R>(initial: R) => Red<S & R, A>;
    /**
     * Similar to redux's `combineReducers` but for reds.
     * Namespaces the state of each red under a key, and combine it's actions.
     * It's easier to define independent sections of the app separetly, and combine then with namespaced state:
     * @example
     * const inputApp = red.withState({input: ''}).handle({setInput: (s, input: string) => ({input})})
     * const counterApp = red.withState({count: 0}).handle({increment: s => ({count: s.count + 1})})
     *
     * const app = red.combine({
     *   ui: inputApp,
     *   counter: counterApp
     * })
     *
     * // equivalent to:
     * const app = red.withState({
     *   ui: {input: ''},
     *   counter: {count: 0}
     * }).handle({
     *   // note that you have to manually namespace the state
     *   setInput: (s, input: string) => ({...s, ui: {input}}),
     *   counter: s => ({...s, counter: {count: s.counter.count + 1}})
     * })
     */
    combine: <R extends Record<string, Red<any, any>>>(reds: R) => Red<S & { [K in keyof R]: StateOf<R[K]>; }, A | ActionOf<R[keyof R]>>;
    /**
     * Merges two reds together, it's the same as defining state and actions in sequence:
     * @example
     * const inputApp = red
     *   .withState({input: ''})
     *   .handle({setInput: (s, value: string) => ({input: value})})
     *
     * const todoApp = red
     *   .withState({todos: [] as Array<{id: number, done: boolean, msg: string}>})
     *   .handle({add: (s, msg: string, id: number) => ({todos: [...s.todos, {id, msg, done: false}]}) })
     *
     * const app = inputApp.merge(todoApp)
     * // same as
     * const app = red
     *   .withState({input: ''})
     *   .handle({setInput: (s, value: string) => ({input: value})})
     *   .withState({todos: [] as Array<{id: number, done: boolean, msg: string}>})
     *   .handle({add: (s, msg: string, id: number) => ({todos: [...s.todos, {id, msg, done: false}]}) })
     */
    merge: <R, B extends ActionType<string, any>>(other: Red<R, B>) => Red<S & R, A | B>;
    /**
     * Wraps 'dispatch' function for each action creator
     * @example
     * const app = red.withState({count: 0}).handle({
     *   increment: s => ({count: s.count + 1}),
     *   decrement: s => ({count: s.count - 1})
     * })
     *
     * const App = () => {
     *   const [state, dispatch] = useReducer(app.reducer, app.initial)
     *   const {increment, decrement} = makeDispatchers(dispatch)
     *
     *   return <>
     *     {state.count}
     *     <button onClick={increment}>+</button>
     *     <button onClick={decrement}>-</button>
     *   <>
     * }
     */
    makeDispatchers: (dispatch: (a: A) => void) => Dispatchers<A>;
    useHook: (useReducer: (r: this['reducer'], i: S) => [any, (a: A) => void], initial?: S) => readonly [S, Dispatchers<A>];
}
export declare const red: Red<{}, never>;
export declare const combine: <R extends Record<string, Red<any, any>>>(reds: R) => Red<{ [K in keyof R]: StateOf<R[K]>; }, ActionOf<R[keyof R]>>;
export declare type ActionType<K extends string, A extends Array<unknown> = []> = {
    type: K;
    payload: A;
};
export declare type ActionOf<R> = R extends {
    reducer: (s: any, a: infer A) => any;
} ? A : never;
export declare type StateOf<R> = R extends {
    initial: infer S;
} ? S : never;
export declare type ActionFromMapping<AP extends Record<string, any[]>> = {
    [K in Extract<keyof AP, string>]: ActionType<K, AP[K]>;
}[Extract<keyof AP, string>];
export declare type HandlersFromMapping<S, AP extends Record<string, any[]>> = {
    [K in keyof AP]: (s: S, ...p: AP[K]) => Partial<S>;
};
export declare type Handlers<S, A extends ActionType<any, any>> = {
    [K in A['type']]: (s: S, ...p: Extract<A, {
        type: K;
    }>['payload']) => Partial<S>;
};
export declare type ActionCreators<A extends ActionType<string, any>> = {
    [K in A['type']]: (...p: Extract<A, {
        type: K;
    }>['payload']) => Extract<A, {
        type: K;
    }>;
};
export declare type Dispatchers<A extends ActionType<string, any>> = {
    [K in A['type']]: (...p: Extract<A, {
        type: K;
    }>['payload']) => void;
};
