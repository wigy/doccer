const { ReflectionKind, Converter } = require("typedoc")

class IndexPlugin {
  constructor(app) {
    app.converter.on(Converter.EVENT_RESOLVE_BEGIN, (context) => {
      this.onConverterResolveBegin(context)
    })
  }

  onConverterResolveBegin(context) {
    // Go through all reflections.
    for (const reflection of context.project.getReflectionsByKind(ReflectionKind.All)) {
      const { comment } = reflection
      if (comment) {
        for (const tag of comment.tags) {
          // Scan for tags.
        }
      }
    }
  }
}

module.exports = {
  load: (app) => new IndexPlugin(app)
}
