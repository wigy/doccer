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

function dump(reflection, prefix='') {
  console.log(prefix, `${nameOfKind(reflection.kind)}:`, reflection.name, '[', Object.keys(reflection).join(' '), ']');
  if (reflection.comment) {
    Object.keys(reflection.comment).forEach(k => {
      console.log(prefix, '|', k, reflection.comment[k]);
    })
  }
  if (reflection.children) {
    for (const child of reflection.children) {
      dump(child, prefix + '  ')
    }
  }
}

function html() {

  return `
  <section class="tsd-panel tsd-index-panel">
  <div class="tsd-index-content">
  <section class="tsd-index-section "><h3>Full Index</h3><ul class="tsd-index-list">
  <li class="tsd-kind-type-alias tsd-parent-kind-module"><a href="interactive_elements_src_api_types.html#GetAllProcessesApiResponse" class="tsd-kind-icon">Get<wbr>All<wbr>Processes<wbr>Api<wbr>Response</a></li>
  <li class="tsd-kind-type-alias tsd-parent-kind-module"><a href="interactive_elements_src_api_types.html#GetOneProcessResponse" class="tsd-kind-icon">Get<wbr>One<wbr>Process<wbr>Response</a></li>
  <li class="tsd-kind-type-alias tsd-parent-kind-module"><a href="interactive_elements_src_api_types.html#GetOneStepResponse" class="tsd-kind-icon">Get<wbr>One<wbr>Step<wbr>Response</a></li>
  <li class="tsd-kind-type-alias tsd-parent-kind-module"><a href="interactive_elements_src_api_types.html#ID" class="tsd-kind-icon">ID</a></li>
  <li class="tsd-kind-type-alias tsd-parent-kind-module"><a href="interactive_elements_src_api_types.html#RealID" class="tsd-kind-icon">RealID</a></li>
  <li class="tsd-kind-type-alias tsd-parent-kind-module"><a href="interactive_elements_src_api_types.html#GetAllProcessesApiResponse" class="tsd-kind-icon">Get<wbr>All<wbr>Processes<wbr>Api<wbr>Response</a></li>
  <li class="tsd-kind-type-alias tsd-parent-kind-module"><a href="interactive_elements_src_api_types.html#GetOneProcessResponse" class="tsd-kind-icon">Get<wbr>One<wbr>Process<wbr>Response</a></li>
  <li class="tsd-kind-type-alias tsd-parent-kind-module"><a href="interactive_elements_src_api_types.html#GetOneStepResponse" class="tsd-kind-icon">Get<wbr>One<wbr>Step<wbr>Response</a></li>
  <li class="tsd-kind-type-alias tsd-parent-kind-module"><a href="interactive_elements_src_api_types.html#ID" class="tsd-kind-icon">ID</a></li>
  <li class="tsd-kind-type-alias tsd-parent-kind-module"><a href="interactive_elements_src_api_types.html#RealID" class="tsd-kind-icon">RealID</a></li>
  </ul></section>
  </div>
  </section>
  `

}


class IndexPlugin {
  constructor(app) {
    app.converter.on(Converter.EVENT_RESOLVE_BEGIN, (context) => {
      this.onConverterResolveBegin(context)
    })
  }

  onConverterResolveBegin(context) {
    dump(context.project);
    // Go through all reflections.
    for (const reflection of context.project.getReflectionsByKind(ReflectionKind.All)) {
      const { comment } = reflection
      if (comment) {
        for (const tag of comment.tags) {
          // Scan for tags.
          if (tag.tagName === 'fullindex') {
            comment.text += html(context.project) + tag.text
            comment.tags = []
            break
          }
        }
      }
    }
  }
}

module.exports = {
  load: (app) => new IndexPlugin(app)
}
