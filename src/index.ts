export class Red<S, A extends Action<string, any[]>> {
  actions: ActionCreators<A>

  constructor(readonly initial: S, readonly handlers: Handlers<S, A>) {
    this.actions = Object.keys(handlers).reduce(
      (acc, type) => ({
        ...acc,
        [type]: (...payload: any) => ({ type, payload }),
      }),
      {} as this['actions']
    )
  }

  reducer = (state = this.initial, action: A): S => ({
    ...state,
    ...(this.handlers[action.type as A['type']]
      ? this.handlers[action.type as A['type']](state, ...action.payload)
      : {}),
  })

  handle = <AP extends Record<string, any[]>>(handlers: HandlersFromMapping<S, AP>) =>
    new Red<S, A | ActionFromMapping<AP>>(this.initial, {
      ...this.handlers,
      ...handlers,
    })

  withActions = <B extends Action<string, any[]>>(
    handlers: {
      [K in B['type']]: (s: S, ...p: Extract<B, { type: K }>['payload']) => Partial<S>
    }
  ) => this.handle(handlers) as Red<S, A | B>

  withState = <R>(initial: R) =>
    new Red({ ...this.initial, ...initial }, this.handlers as Handlers<S & R, A>)

  combine = <R extends Record<string, Red<any, any>>>(reds: R) =>
    this.merge(combine(reds))

  merge = <R, B extends Action<string, any>>(other: Red<R, B>) =>
    this.withState(other.initial).handle(other.handlers as Handlers<S & R, B>) as Red<
      S & R,
      A | B
    >

  makeDispatchers = (dispatch: (a: A) => void) =>
    Object.keys(this.actions).reduce(
      (acc, type) => ({
        ...acc,
        [type]: (...payload: A['payload']) => dispatch({ type, payload } as A),
      }),
      {} as Dispatchers<A>
    )

  useHook = (
    useReducer: (r: this['reducer'], i: S) => [any, (a: A) => void],
    initial = this.initial
  ) => {
    const [state, dispatch] = useReducer(this.reducer, initial)
    return [state as S, this.makeDispatchers(dispatch)] as const
  }
}

export const red = new Red<{}, never>({}, {})

export const combine = <R extends Record<string, Red<any, any>>>(reds: R) =>
  Object.entries(reds).reduce(
    (acc, [key, r]) =>
      (acc as any).withState({ [key]: r.initial }).handle(
        Object.entries(r.handlers).reduce(
          (h, [type, f]) =>
            Object.assign(h, {
              [type]: (s: any, ...p: any) => ({
                [key]: { ...s[key], ...f(s[key], ...p) },
              }),
            }),
          {}
        )
      ),
    new Red<{ [K in keyof R]: StateOf<R[K]> }, ActionOf<R[keyof R]>>({} as any, {} as any)
  )

export type Action<K, A> = { type: K; payload: A }

export type ActionOf<R> = R extends { reducer: (s: any, a: infer A) => any } ? A : never

export type StateOf<R> = R extends { initial: infer S } ? S : never

// {a: [t]; b: [u, k]} -> {type: 'a'; payload: [t]} | {type: 'b'; payload: [u, k]}
export type ActionFromMapping<AP extends Record<string, any[]>> = {
  [K in Extract<keyof AP, string>]: Action<K, AP[K]>
}[Extract<keyof AP, string>]

export type HandlersFromMapping<S, AP extends Record<string, any[]>> = {
  [K in keyof AP]: (s: S, ...p: AP[K]) => Partial<S>
}

export type Handlers<S, A extends Action<any, any>> = {
  [K in A['type']]: (s: S, ...p: Extract<A, { type: K }>['payload']) => Partial<S>
}

export type ActionCreators<A extends Action<string, any>> = {
  [K in A['type']]: (...p: Extract<A, { type: K }>['payload']) => Extract<A, { type: K }>
}

export type Dispatchers<A extends Action<string, any>> = {
  [K in A['type']]: (...p: Extract<A, { type: K }>['payload']) => void
}
