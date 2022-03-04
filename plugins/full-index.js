const { ReflectionKind, Converter } = require("typedoc")

function nameOfKind(id) {
  // From https://github.com/TypeStrong/typedoc/blob/master/src/lib/models/reflections/kind.ts
  return {
    0x1: 'Project',
    0x2: 'Module',
    0x4: 'Namespace',
    0x8: 'Enum',
    0x10: 'EnumMember',
    0x20: 'Variable',
    0x40: 'Function',
    0x80: 'Class',
    0x100: 'Interface',
    0x200: 'Constructor',
    0x400: 'Property',
    0x800: 'Method',
    0x1000: 'CallSignature',
    0x2000: 'IndexSignature',
    0x4000: 'ConstructorSignature',
    0x8000: 'Parameter',
    0x10000: 'TypeLiteral',
    0x20000: 'TypeParameter',
    0x40000: 'Accessor',
    0x80000: 'GetSignature',
    0x100000: 'SetSignature',
    0x200000: 'ObjectLiteral',
    0x400000: 'TypeAlias',
    0x800000: 'Event',
    0x1000000: 'Reference',
  }[id] || 'UNKNOWN'
}

function classOfKindName(name) {
  return {
    'Project': 'tsd-kind-project',
    'Module': 'tsd-kind-module',
    'Namespace': 'tsd-kind-namespace',
    'Enum': 'tsd-kind-enum',
    'EnumMember': 'tsd-kind-enum-member',
    'Variable': 'tsd-kind-variable',
    'Function': 'tsd-kind-function',
    'Class': 'tsd-kind-class',
    'Interface': 'tsd-kind-interface',
    'Constructor': 'tsd-kind-constructor',
    'Property': 'tsd-kind-property',
    'Method': 'tsd-kind-method',
    'CallSignature': 'tsd-kind-call-signature',
    'IndexSignature': 'tsd-kind-index-signature',
    'ConstructorSignature': 'tsd-kind-constructors-ignature',
    'Parameter': 'tsd-kind-parameter',
    'TypeLiteral': 'tsd-kind-type-literal',
    'TypeParameter': 'tsd-kind-type-parameter',
    'Accessor': 'tsd-kind-accessor',
    'GetSignature': 'tsd-kind-get-signature',
    'SetSignature': 'tsd-kind-set-signature',
    'ObjectLiteral': 'tsd-kind-object-literal',
    'TypeAlias': 'tsd-kind-type-alias',
    'Event': 'tsd-kind-event',
    'Reference': 'tsd-kind-reference',
  }[name] || 'UNKNOWN'
}

const DEBUG = false
const DEBUG_COMMENT = false
const DEBUG_KEYS = false
const DEBUG_TYPES = false

/**
 * Helper to study reflection data.
 * @param reflection
 * @param prefix
 */
function dump(reflection, prefix = '') {
  if (!DEBUG) return

  const keys = DEBUG_KEYS ? '[' + Object.keys(reflection).join(' ') + ']' : ''
  console.log(prefix, `${nameOfKind(reflection.kind)}:`, reflection.name, keys);
  if (DEBUG_COMMENT && reflection.comment) {
    Object.keys(reflection.comment).forEach(k => {
      console.log(prefix, '|', k, reflection.comment[k]);
    })
  }
  if (reflection.children) {
    for (const child of reflection.children) {
      dump(child, prefix + '  ')
    }
  }
  if (reflection.type) {
    // More details https://github.com/TypeStrong/typedoc/blob/master/src/lib/models/types.ts
    const { type, name } = reflection.type
    console.log(prefix, '  ', type, name || '');
  }
}

class IndexPlugin {
  constructor(app) {
    app.converter.on(Converter.EVENT_RESOLVE_BEGIN, (context) => {
      this.onConverterResolveBegin(context)
    })
  }

  /**
   * Generate full index.
   */
  onConverterResolveBegin(context) {

    dump(context.project);

    // Go through all reflections and look for @fullindex.
    // TODO: Maybe simply do it in readme?
    for (const reflection of context.project.getReflectionsByKind(ReflectionKind.All)) {
      const { comment } = reflection
      if (comment) {
        for (const tag of comment.tags) {
          // Scan for tags.
          if (tag.tagName === 'fullindex') {
            comment.text += this.html(context.project) + tag.text
            comment.tags = []
            break
          }
        }
      }
    }
  }

  /**
   * Create index.
   * @param project
   */
  html(project) {
    let html = `<section class="tsd-panel tsd-index-panel">
      <div class="tsd-index-content">
      <section class="tsd-index-section "><h3>Full Index</h3><ul class="tsd-index-list">`

    this.index(project).forEach(item => {
      const { name, kind, parent } = item
      const parts = name.split(/([a-z])([A-Z])/)
      for (let i = 1; i < parts.length; i += 3) {
        parts[i] += '<wbr/>'
      }
      const wbrName = parts.join('')
      const kindClass = classOfKindName(kind)
      if (kind === 'UNKNOWN') {
        throw new Error(`Cannot determine HTML class for kind '${kind}'.`)
      }
      // TODO: Some types has still broken links.
      const url = ['TypeAlias', 'Enum'].includes(kind) ?
        `${parent.replace(/[^\w]/g, '_')}.${name}.html` :
        `${parent.replace(/[^\w]/g, '_')}.html#${name}`

      html += `<li class="${kindClass} tsd-parent-kind-module">
      <a href="${url}" class="tsd-kind-icon">${wbrName}</a>
      </li>`
    })

    html += `</ul></section>
      </div>
      </section>`

    return html
  }

  /**
   * Construct a flat list of all refelections suitable for index.
   */
  index(project) {
    const collect = (ref) => {
      let ret = []
      const kind = nameOfKind(ref.kind)
      if (kind === 'UNKNOWN') {
        throw new Error(`Canont recognize kind code ${ref.kind}.`)
      }
      switch (kind) {
        case 'Enum':
        case 'TypeAlias':
        case 'Interface':
        case 'Function':
        case 'Variable':
        case 'Class':
        case 'Namespace':
          ret.push({
            name: ref.name,
            kind,
            parent: ref.parent.name
          })
          break
        // TODO: Once sure we got all useful, these can be deleted.
        case 'Accessor':
        case 'EnumMember':
        case 'Method':
        case 'Property':
        case 'Project':
        case 'Module':
        case 'Constructor':
          break
        default:
          throw new Error(`No handler for fill index for reflection '${ref.name}' of kind ${kind}.`)
      }
      if (ref.children) {
        for (const c of ref.children) {
          ret = ret.concat(collect(c))
        }
      }
      return ret
    }

    const index = collect(project).sort((a, b) => {
      a = a.name.toUpperCase()
      b = b.name.toUpperCase()
      return a === b ? 0 : (a < b ? -1 : 1)
    })

    return index
  }
}

module.exports = {
  load: (app) => new IndexPlugin(app)
}
