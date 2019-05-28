import UtilTools from '../../tools/utils'
import renderMethods from './column-render'

export default {
  name:'vbtTableColumn',

  mixins: [renderMethods],

  props: {
    // 渲染类型 index,radio,selection
    type: String,
    // 列属性
    prop: String,
    // 列标题
    label: String,
    // 列宽度
    width: [Number, String],
    // 列最小宽度，把剩余宽度按比例分配
    minWidth: [Number, String],
    // 将列固定在左侧或者右侧
    fixed: String,
    // 列对其方式
    align: String,
    // 表头对齐方式
    headerAlign: String,
    // 当内容过长时显示为省略号
    showOverflow: [Boolean, String],
    // 当表头内容过长时显示为省略号
    showHeaderOverflow: [Boolean, String],
    // 格式化显示内容
    formatter: Function,
    // 自定义索引方法
    indexMethod: Function,
    // 是否允许排序
    sortable: [Boolean, String],
    // 自定义排序的属性
    sortBy: [String, Array],
    // 配置筛选条件数组
    filters: Array,
    // 筛选是否允许多选
    filterMultiple: { type: Boolean, default: true },
    // 自定义筛选方法，如果是服务端排序需要设置为custom
    filterMethod: [String, Function],
    // 指定为树节点
    treeNode: Boolean,
    // 列的 key
    columnKey: [String, Number],
    // 列编辑配置项
    editRender: Object
  },

  inject: [
    '$table'
  ],

  data () {
    return {
      columnConfig: {}
    }
  },

  created() {
    let { treeConfig } = this.$table
    let isTreeNode = treeConfig && this.treeNode
    let opts = {
      renderCell:  isTreeNode ? this.renderTreeCell : this.renderCell
    }
    this.columnConfig = UtilTools.getColumnConfig(this, opts)
  },

  mounted () {
    UtilTools.assemColumn(this)
  },

  destroyed () {
    UtilTools.destroyColumn(this)
  },

  render (h) {
    return h('div', this.$slots.default)
  }
}