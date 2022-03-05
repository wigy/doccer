# doccer
Toos for bundling one or more Typescript project documentation into single runable viewing service.

## Usage

Define a configuration `doccer.json` having title of the project and repositories. It should
define entry points for modules.
```json
{
  "title": "Example Doccer Project",
  "repositories": {
    "interactive-elements": {
      "git": "https://github.com/wigy/interactive-elements.git",
      "modules": ["src/*.ts", "src/*/index.ts"],
      "excludes": ["src/index.ts"]
    },
    "interactive-stateful-process": {
      "git": "https://github.com/wigy/interactive-stateful-process.git",
      "modules": ["src/*.ts", "src/*/index.ts"],
      "excludes": ["src/index.ts", "src/testing/index.ts"]
    },
    "react-interactive-stateful-process": {
      "git": "https://github.com/wigy/react-interactive-stateful-process.git",
      "modules": ["src/doccer.ts", "src/*/index.ts"]
    }
  }
}
```

Also one can create project top level index using markdown file `DOCCER-INDEX.md`.

Then running `doccer build-all` generates complete documentation for the project.

## Plugins

### Full index

In the top level index `DOCCER-INDEX.md` you can use a keyword `{fullindex}` to generate
complete index listing of all classes, types, variables and functions.
