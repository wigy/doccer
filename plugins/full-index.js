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
          if (tag.tagName === 'mytag') {
            comment.text += '<br>Now got <i>Italic</i> and <b>Bold</b>.<br>' + tag.text
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
