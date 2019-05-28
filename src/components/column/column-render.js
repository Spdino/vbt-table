import UtilTools from '../../tools/utils'
import GlobalConfig from '../../conf'

export default {
  methods: {
    /**
   * 单元格
   */
    renderHeader(h, params) {
      let { $scopedSlots } = this
      if ($scopedSlots && $scopedSlots.header) {
        return $scopedSlots.header(params)
      }
      return [UtilTools.formatText(params.column.label)]
    },

    renderCell(params) {
      let cellValue
      let { $scopedSlots } = this
      let { row, column } = params

      if ($scopedSlots && $scopedSlots.default) {
        return $scopedSlots.default(params)
      }
      cellValue = UtilTools.getCellValue(row, column.property)
      return [UtilTools.formatText(cellValue)]
    },

    renderTreeCell(params) {
      return this.renderTreeIcon(params).concat(this.renderCell(params))
    },

    /**
     * 树节点
     */
    renderTreeIcon(params) {
      const h = this.$createElement
      let { iconMap } = GlobalConfig
      let { treeConfig, treeExpandeds } = this.$table
      let { row, level } = params
      let { children, indent, trigger } = treeConfig
      let rowChildren = row[children]
      let on = {}
      if (!trigger || trigger === 'default') {
        on.click = evnt => this.$table.triggerTreeExpandEvent(evnt, params)
      }

      return [
        h('span', {
          class: 'vbt-tree--indent',
          style: {
            width: `${level * (indent || 16)}px`
          }
        }),
        h('span', {
          class: ['vbt-tree-wrapper', {
            active: treeExpandeds.indexOf(row) > -1
          }],
          on
        }, rowChildren && rowChildren.length ? [
          h('i', {
            class: iconMap.tree
          })
        ] : [])
      ]
    },
  }
}