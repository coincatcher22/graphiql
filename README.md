# GraphQL Language Service

_This is currently in technical preview. We welcome your feedback and suggestions._

GraphQL Language Service provides an interface for building GraphQL language service for IDEs.

A subset of supported features of GraphQL language service and GraphQL language server implementation are both specification-compliant to [Microsoft's Language Server Protocol](https://github.com/Microsoft/language-server-protocol), and will be developed to fully support the specification in the future.

Currently supported features include:
- Diagnostics (GraphQL syntax linting/validations) (**spec-compliant**)
- Autocomplete suggestions (**spec-compliant**)
- Hyperlink to fragment definitions
- Outline view support for queries


## Installation and Usage

### Dependencies

GraphQL Language Service depends on [Watchman](https://facebook.github.io/watchman/) running on your machine. Follow [this installation guide](https://facebook.github.io/watchman/docs/install.html) to install the Watchman.

### Installation

```
git clone git@github.com:graphql/graphql-language-service.git
cd {path/to/your/repo}
npm install ../graphql-language-service
```

After pulling the latest changes from this repo, be sure to run `npm run build` to transform the `src/` directory and generate the `dist/` directory.

The library includes a node executable file which you can find in `./node_modules/.bin/graphql.js` after installation.

### GraphQL configuration file (`.graphqlrc`)

GraphQL Language Service, to provide its full feature set, will need to know some information about your GraphQL development environment. `.graphqlrc` is a GraphQL configuration file that contains this information.
```
{
  "build-configs": {
    "product-name": {
      "input-dirs": [
        "/dir/paths/to/your/graphql/files"
      ],
      "exclude-dirs": [
        "/dir/paths/to/ignore/"
      ],
      "schema-path": "/path/to/the/schema/" // supports `.graphql` IDL or `.json` file
    }
  }
}
```
`.graphqlrc` can define mutliple configurations for each GraphQL environment, should you have more than one.

The GraphQL configurations will be used to perform two things in a nutshell:

1. Using `input-dirs` and `exclude-dirs`, cache all fragment definitions per each product. This information will be used to compute dependencies between GraphQL queries and fragments.
2. Using `schema-path`, build and cache `GraphQLSchema`s (per product). The schema will be used to perform query validations, autocomplete suggestions etc.

Also, if GraphQL Language Service receives an RPC message that contains the path of the file being operated on, `input-dirs` and `exclude-dirs` are used to determine which product configuration the file is associated with. Refer to [GraphQLConfig class](https://github.com/graphql/graphql-language-service/blob/master/src/config/GraphQLConfig.js#L80) for more information.

### Using the command-line interface

The node executable contains several commands: `server` and a command-line language service methods (`lint`, `autocomplete`, `outline`).

Improving this list is a work-in-progress.

```
GraphQL Language Service Command-Line Interface.
Usage: bin/graphql.js <command> <file>
    [-h | --help]
    [-c | --configDir] {configDir}
    [-t | --text] {textBuffer}
    [-f | --file] {filePath}
    [-s | --schema] {schemaPath}


Options:
  -h, --help        Show help                                          [boolean]
  -t, --text        Text buffer to perform GraphQL diagnostics on.
                    Will defer to --file option if omitted.
                    This option is always honored over --file option.
                                                                        [string]
  -f, --file        File path to perform GraphQL diagnostics on.
                    Will be ignored if --text option is supplied.
                                                                        [string]
  --row             A row number from the cursor location for GraphQL
                    autocomplete suggestions.
                    If omitted, the last row number will be used.
                                                                        [number]
  --column          A column number from the cursor location for GraphQL
                    autocomplete suggestions.
                    If omitted, the last column number will be used.
                                                                        [number]
  -c, --configDir   A directory path where .graphqlrc configuration object is
                    Walks up the directory tree from the provided config
                    directory, or the current working directory, until
                    .graphqlrc is found or the root directory is found.
                                                                        [string]
  -s, --schemaPath  a path to schema DSL file
                                                                        [string]

At least one command is required.
Commands: "server, validate, autocomplete, outline"
```

## Architectural Overview

GraphQL Language Service currently communicates via Stream transport with the IDE server. GraphQL server will receive/send RPC messages to perform language service features, while caching the necessary GraphQL artifacts such as fragment definitions, GraphQL schemas etc. More about the server interface and RPC message format below.

The IDE server should launch a separate GraphQL server with its own child process for each `.graphqlrc` file the IDE finds (using the nearest ancestor directory relative to the file currently being edited):
```
./application

  ./productA
    .graphqlrc
    ProductAQuery.graphql
    ProductASchema.graphql

  ./productB
    .graphqlrc
    ProductBQuery.graphql
    ProductBSchema.graphql
```
A separate GraphQL server should be instantiated for `ProductA` and `ProductB`, each with its own `.graphqlrc` file, as illustrated in the directory structure above.

The IDE server should manage the lifecycle of the GraphQL server. Ideally, the IDE server should spawn a child process for each of the GraphQL Language Service processes necessary, and gracefully exit the processes as the IDE closes. In case of errors or a sudden halt the GraphQL Language Service will close as the stream from the IDE closes.

### Server Interface

GraphQL Language Server uses [JSON-RPC](http://www.jsonrpc.org/specification) to communicate with the IDE servers to perform language service features. The language server currently supports two communication transports: Stream (stdio) and IPC. For IPC transport, the reference guide to be used for development is [the language server protocol](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md) documentation.

For each transports, there is a slight difference between both JSON message format, especially in how the methods to be invoked are defined - below are the currently supported methods for each transports (will be updated as progresses are made):

|                     | Stream                       | IPC                               |
| -------------------:|------------------------------|-----------------------------------|
| Diagnostics         | `getDiagnostics`             | `textDocument/publishDiagnostics` |
| Autocompletion      | `getAutocompleteSuggestions` | `textDocument/completion`         |
| Outline             | `getOutline`                 | Not supported yet                 |
| Go-to definition    | `getDefinition`              | Not supported yet                 |
| File Events         | Not supported yet            | `didOpen/didClose/didSave/didChange` events |
