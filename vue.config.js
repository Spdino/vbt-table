module.exports = {
  chainWebpack (config) {
    config.output
      .set('libraryExport', 'default')
      .set('library', 'vbtTable')
  }
}