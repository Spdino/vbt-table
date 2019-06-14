import { getRowIdentity } from '../util'

export default {
  data() {
    return {
      states: {
        // defaultExpandAll 存在于 expand.js 中，这里不重复添加
        // TODO: 拆分为独立的 TreeTale，在 expand 中，展开行的记录是放在 expandRows 中，统一用法
        indent: 16,
        lazy: false,
        treeData: {},
        lazyTreeNodeMap:{},
        lazyColumnIdentifier: 'hasChildren',
        childrenColumnName: 'children'
      }
    }
  },

  methods: {
    initParent(data) {
      const { initParentFunc, rowKey } = this.table
      const res = {}

      data.forEach(item => {
        res[item[rowKey]] = {
          expanded: false,
          level: 0
        }

        if (initParentFunc) initParentFunc(item)
      })

      this.states.treeData = res
      return data
    },

    toggleTreeExpansion(row, expanded) {
      this.assertRowKey()

      const { rowKey, treeData } = this.states
      const id = getRowIdentity(row, rowKey)
      const data = id && treeData[id]
      const oldExpanded = treeData[id].expanded
      if (id && data && ('expanded' in data)) {
        expanded = typeof expanded === 'undefined' ? !data.expanded : expanded
        treeData[id].expanded = expanded
        if (oldExpanded !== expanded) {
          this.table.$emit('expand-change', row, expanded)
        }
      }

      this.uptateYfullData(row, expanded)
    },

    loadOrToggle(row) {
      this.assertRowKey()
      const { lazy, lazyColumnIdentifier } = this.states
      const { rowKey, treeData } = this.states
      const id = getRowIdentity(row, rowKey)
      const data = id && treeData[id]
      if (lazy && row[lazyColumnIdentifier] && !data['loaded']) {
        this.loadData(row)
      } else {
        this.toggleTreeExpansion(row)
      }
      this.$nextTick(this.updateTableScrollY)
    },

    loadData(row) {
      const { load } = this.table
      const { rowKey, treeData } = this.states
      const id = getRowIdentity(row, rowKey)
      const dataObj = id && treeData[id]

      if (load) {
        this.$set(dataObj,'loading',true)
        load(row, (data) => {
          if (!Array.isArray(data)) {
            throw new Error('[ElTable] data must be an array')
          }
          this.$set(dataObj,'loading',false)
          this.$set(dataObj,'loaded',true)
          dataObj.expanded = true

          if (data.length) {
            this.states.lazyTreeNodeMap[id] = data
            this.uptateYfullData(row, true)
          }

          this.table.$emit('expand-change', row, true)
        })
      }
    }
  }
}
