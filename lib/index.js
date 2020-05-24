"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combine = exports.red = exports.Red = void 0;
class Red {
    constructor(initial, handlers) {
        this.initial = initial;
        this.handlers = handlers;
        this.reducer = (state = this.initial, action) => ({
            ...state,
            ...(this.handlers[action.type]
                ? this.handlers[action.type](state, ...action.payload)
                : {}),
        });
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
        this.handle = (handlers) => new Red(this.initial, {
            ...this.handlers,
            ...handlers,
        });
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
        this.withActions = (handlers) => this.handle(handlers);
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
        this.withState = (initial) => new Red({ ...this.initial, ...initial }, this.handlers);
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
        this.combine = (reds) => this.merge(exports.combine(reds));
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
        this.merge = (other) => this.withState(other.initial).handle(other.handlers);
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
        this.makeDispatchers = (dispatch) => Object.keys(this.actions).reduce((acc, type) => ({
            ...acc,
            [type]: (...payload) => dispatch({ type, payload }),
        }), {});
        this.useHook = (useReducer, initial = this.initial) => {
            const [state, dispatch] = useReducer(this.reducer, initial);
            return [state, this.makeDispatchers(dispatch)];
        };
        this.actions = Object.keys(handlers).reduce((acc, type) => ({
            ...acc,
            [type]: (...payload) => ({ type, payload }),
        }), {});
    }
}
exports.Red = Red;
exports.red = new Red({}, {});
exports.combine = (reds) => Object.entries(reds).reduce((acc, [key, r]) => acc.withState({ [key]: r.initial }).handle(Object.entries(r.handlers).reduce((h, [type, f]) => Object.assign(h, {
    [type]: (s, ...p) => ({
        [key]: { ...s[key], ...f(s[key], ...p) },
    }),
}), {})), new Red({}, {}));
