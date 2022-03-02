const { ParameterType, Converter } = require("typedoc")

function load(app) {
  app.converter.on(Converter.EVENT_RESOLVE, (context) => {

  })
}

module.exports = {
  load
}