import * as rx from 'rxjs'
import * as op from 'rxjs/operators'
import * as fs from 'fs'
import ts from 'typescript'
import * as prettier from 'prettier'

const createProgram = (source: string) => {
  const program = ts.createProgram([source], {
    // target: ts.ScriptTarget.ES2015,
    lib: ['dom', 'dom.iterable', 'esnext'],
    allowJs: true,
    skipLibCheck: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    strict: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noImplicitAny: false,
    noEmit: true,
    jsx: ts.JsxEmit.React,
  })

  return {
    program,
    checker: program.getTypeChecker(),
    node$: getNodes(program.getSourceFile(source)!),
  }
}

const getNodes = (source: ts.SourceFile) =>
  new rx.Observable<ts.Node>((s) => {
    ts.forEachChild(source, function recurse(node) {
      s.next(node)
      ts.forEachChild(node, recurse)
    })
    s.complete()
  })

export const getTypes = (filename: string) => {
  const { checker, node$ } = createProgram(filename)

  return node$
    .pipe(
      op.filter(
        (n) =>
          n.kind === ts.SyntaxKind.Identifier && !!checker.getSymbolAtLocation(n)?.name
      ),
      op.map((n) => {
        const name = checker.getSymbolAtLocation(n)!.name
        const type = checker.typeToString(checker.getTypeAtLocation(n), undefined, 1)
        return { name, type }
      }),
      op.reduce((acc, n) => {
        acc[n.name] = n.type
        return acc
      }, {} as Record<string, string>)
    )
    .toPromise()
}

import('./example')
  .then(() =>
    getTypes(__dirname + '/example.tsx').then((t) =>
      fs.promises.writeFile(
        __dirname + '/results.tsx',
        prettier.format(
          `
        // Typescript inspect
        type ActionType<K, P> = {type: K, payload: P}
        
        type State = ${t.State}
        
type Action = ${t.Action}
`,
          { parser: 'babel' }
        )
      )
    )
  )

  .catch(console.error)
