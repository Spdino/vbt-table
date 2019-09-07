
module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/vbt-table/' : '/',
  productionSourceMap: false,
  configureWebpack: {
    performance: {
      hints: false
    }
  },
  chainWebpack(config) {
    config.output
      .set("library", "vbtTable")
      .set("libraryTarget", "umd")
      .set("libraryExport", "default")
  }
};
