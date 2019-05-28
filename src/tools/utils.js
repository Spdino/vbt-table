import XEUtils from 'xe-utils'

var columnId = 0

const UtilTools = {
  // 触发事件
  emitEvent (_vm, type, args) {
    if (_vm.$listeners[type]) {
      _vm.$emit.apply(_vm, [type].concat(args))
    }
  },
  // 获取所有的列，排除分组
  getColumnList (columns) {
    let result = []
    columns.forEach(column => {
      if (column.children && column.children.length) {
        result.push.apply(result, UtilTools.getColumnList(column.children))
      } else {
        result.push(column)
      }
    })
    return result
  },
  formatText (value) {
    return '' + (value === null || value === void 0 ? '' : value)
  },
  getCellValue (row, prop) {
    return XEUtils.get(row, prop)
  },
  setCellValue (row, prop, value) {
    return XEUtils.set(row, prop, value)
  },
  getColumnConfig (_vm, { renderHeader, renderCell, renderData } = {}) {
    return {
      // 基本属性
      id: `col--${_vm.$table.id}_${++columnId}`,
      type: _vm.type,
      property: _vm.prop,
      label: _vm.label,
      width: _vm.width,
      minWidth: _vm.minWidth,
      fixed: _vm.fixed,
      align: _vm.align,
      headerAlign: _vm.headerAlign,
      showOverflow: _vm.showOverflow,
      showHeaderOverflow: _vm.showHeaderOverflow,
      indexMethod: _vm.indexMethod,
      formatter: _vm.formatter,
      sortable: _vm.sortable,
      sortBy: _vm.sortBy,
      filters: (_vm.filters || []).map(({ label, value }) => ({ label, value, checked: false })),
      filterMultiple: _vm.filterMultiple,
      filterMethod: _vm.filterMethod,
      treeNode: _vm.treeNode,
      columnKey: _vm.columnKey,
      editRender: _vm.editRender,
      // 渲染属性
      visible: true,
      level: 1,
      rowSpan: 1,
      colSpan: 1,
      order: null,
      renderWidth: 0,
      renderHeight: 0,
      resizeWidth: 0,
      renderLeft: 0,
      renderHeader: renderHeader || _vm.renderHeader,
      renderCell: renderCell || _vm.renderCell,
      renderData: renderData
    }
  },
  // 组装列配置
  assemColumn (_vm) {
    let { $table } = _vm
    const index = [].indexOf.call($table.$refs.hideColumn.children, _vm.$el)
    $table.tableFullColumn.splice(index, 0, _vm.columnConfig)
  },
  // 销毁列
  destroyColumn (_vm) {
    let { $table, columnConfig } = _vm
    let matchObj = XEUtils.findTree($table.collectColumn, column => column === columnConfig)
    if (matchObj) {
      matchObj.items.splice(matchObj.index, 1)
    }
  },
  hasChildrenList (item) {
    return item && item.children && item.children.length > 0
  }
}

export default UtilTools
