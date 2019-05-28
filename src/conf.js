
const GlobalConfig = {
  size: null,
  optimized: {
    animat: true,
    // 默认数据大于 500 条时自动使用纵向 Y 滚动渲染
    scrollY: {
      gt: 50,
      oSize: 10,
      rSize: 30,
      vSize: 0,
      rHeight: 0
    }
  },
  showAllOverflow: null,
  showHeaderAllOverflow: null,
  contextMenu: null,
  tooltipTheme: "dark",
  iconMap: {
    sortAsc: "vbt-sort--asc-icon",
    sortDesc: "vbt-sort--desc-icon",
    filter: "vbt-filter--icon",
    edit: "vbt-edit--icon",
    tree: "vbt-tree--node-icon"
  }
};

export default GlobalConfig;
