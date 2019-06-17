<template>
  <div class="el-table"
       :class="[{
      'el-table--fit': fit,
      'el-table--striped': stripe,
      'el-table--border': border || isGroup,
      'el-table--hidden': isHidden,
      'el-table--group': isGroup,
      'el-table--fluid-height': maxHeight,
      'el-table--scrollable-x': layout.scrollX,
      'el-table--scrollable-y': layout.scrollY,
      'el-table--enable-row-hover': !store.states.isComplex,
      'el-table--enable-row-transition': (store.states.data || []).length !== 0 && (store.states.data || []).length < 100
    }, tableSize ? `el-table--${ tableSize }` : '']"
       @mouseleave="handleMouseLeave($event)">
    <div class="hidden-columns"
         ref="hiddenColumns">
      <slot></slot>
    </div>
    <div v-if="showHeader"
         v-mousewheel="handleHeaderFooterMousewheel"
         class="el-table__header-wrapper"
         ref="headerWrapper">
      <table-header ref="tableHeader"
                    :store="store"
                    :border="border"
                    :default-sort="defaultSort"
                    :style="{
          width: layout.bodyWidth ? layout.bodyWidth + 'px' : ''
        }">
      </table-header>
    </div>
    <table-body :context="context"
                class="el-table__body-wrapper"
                :store="store"
                :emptyText="emptyText"
                :bodyWidth="bodyWidth"
                :layout="layout"
                :stripe="stripe"
                :row-class-name="rowClassName"
                :row-style="rowStyle"
                :highlight="highlightCurrentRow"
                ref="bodyWrapper"
                :style="[bodyHeight]">
    </table-body>
    <div v-if="showSummary"
         v-show="data && data.length > 0"
         v-mousewheel="handleHeaderFooterMousewheel"
         class="el-table__footer-wrapper"
         ref="footerWrapper">
      <table-footer :store="store"
                    :border="border"
                    :sum-text="sumText || t('el.table.sumText')"
                    :summary-method="summaryMethod"
                    :default-sort="defaultSort"
                    :style="{
          width: layout.bodyWidth ? layout.bodyWidth + 'px' : ''
        }">
      </table-footer>
    </div>
    <div v-if="fixedColumns.length > 0"
         v-mousewheel="handleFixedMousewheel"
         class="el-table__fixed"
         ref="fixedWrapper"
         :style="[{
        width: layout.fixedWidth ? layout.fixedWidth + 'px' : ''
      },
      fixedHeight]">
      <div v-if="showHeader"
           class="el-table__fixed-header-wrapper"
           ref="fixedHeaderWrapper">
        <table-header ref="fixedTableHeader"
                      fixed="left"
                      :border="border"
                      :store="store"
                      :style="{
            width: bodyWidth
          }"></table-header>
      </div>
      <table-body fixed="left"
                  class="el-table__fixed-body-wrapper"
                  :layout="layout"
                  :bodyWidth="bodyWidth"
                  :store="store"
                  :stripe="stripe"
                  :highlight="highlightCurrentRow"
                  :row-class-name="rowClassName"
                  :row-style="rowStyle"
                  ref="fixedBodyWrapper"
                  :style="[fixedBodyHeight]">
      </table-body>
    </div>
    <div v-if="showSummary"
         v-show="data && data.length > 0"
         class="el-table__fixed-footer-wrapper"
         ref="fixedFooterWrapper">
      <table-footer fixed="left"
                    :border="border"
                    :sum-text="sumText || t('el.table.sumText')"
                    :summary-method="summaryMethod"
                    :store="store"
                    :style="{
            width: bodyWidth
          }"></table-footer>
    </div>
    <div v-if="rightFixedColumns.length > 0"
         v-mousewheel="handleFixedMousewheel"
         class="el-table__fixed-right"
         ref="rightFixedWrapper"
         :style="[{
        width: layout.rightFixedWidth ? layout.rightFixedWidth + 'px' : '',
        right: layout.scrollY ? (border ? layout.gutterWidth : (layout.gutterWidth || 0)) + 'px' : ''
      },
      fixedHeight]">
      <div v-if="showHeader"
           class="el-table__fixed-header-wrapper"
           ref="rightFixedHeaderWrapper">
        <table-header ref="rightFixedTableHeader"
                      fixed="right"
                      :border="border"
                      :store="store"
                      :style="{width: bodyWidth}">
        </table-header>
      </div>
      <table-body fixed="right"
                  class="el-table__fixed-body-wrapper"
                  :layout="layout"
                  :bodyWidth="bodyWidth"
                  :store="store"
                  :stripe="stripe"
                  :row-class-name="rowClassName"
                  :row-style="rowStyle"
                  :highlight="highlightCurrentRow"
                  ref="rightFixedBodyWrapper"
                  :style="[fixedBodyHeight]">
      </table-body>
      <div v-if="showSummary"
           v-show="data && data.length > 0"
           class="el-table__fixed-footer-wrapper"
           ref="rightFixedFooterWrapper">
        <table-footer fixed="right"
                      :border="border"
                      :sum-text="sumText || t('el.table.sumText')"
                      :summary-method="summaryMethod"
                      :store="store"
                      :style="{
            width: bodyWidth
          }"></table-footer>
      </div>
    </div>
    <div v-if="rightFixedColumns.length > 0"
         class="el-table__fixed-right-patch"
         ref="rightFixedPatch"
         :style="{
        width: layout.scrollY ? layout.gutterWidth + 'px' : '0',
        height: layout.headerHeight + 'px'
      }"></div>
    <div class="el-table__column-resize-proxy"
         ref="resizeProxy"
         v-show="resizeProxyVisible"></div>
  </div>

</template>

<script type="text/babel">
import { debounce } from 'throttle-debounce'
import { addResizeListener, removeResizeListener } from 'element-ui/src/utils/resize-event'
import Mousewheel from 'element-ui/src/directives/mousewheel'
import Locale from 'element-ui/src/mixins/locale'
import Migrating from 'element-ui/src/mixins/migrating'
import { createStore, mapStates } from './store/helper'
import TableLayout from './table-layout'
import TableBody from './table-body'
import TableHeader from './table-header'
import TableFooter from './table-footer'
import { parseHeight } from './util'
import deepmerge from 'deepmerge'

let tableIdSeed = 1

export default {
  name: 'vbtTable',

  mixins: [Locale, Migrating],

  directives: {
    Mousewheel
  },

  props: {
    data: {
      type: Array,
      default: function() {
        return []
      }
    },

    initParentFunc: Function,

    formateChildFunc: Function,

    size: String,

    width: [String, Number],

    height: [String, Number],

    maxHeight: [String, Number],

    fit: {
      type: Boolean,
      default: true
    },

    stripe: Boolean,

    border: Boolean,

    rowKey: [String, Function],

    context: {},

    showHeader: {
      type: Boolean,
      default: true
    },

    showSummary: Boolean,

    sumText: String,

    summaryMethod: Function,

    rowClassName: [String, Function],

    rowStyle: [Object, Function],

    cellClassName: [String, Function],

    cellStyle: [Object, Function],

    headerRowClassName: [String, Function],

    headerRowStyle: [Object, Function],

    headerCellClassName: [String, Function],

    headerCellStyle: [Object, Function],

    highlightCurrentRow: Boolean,

    currentRowKey: [String, Number],

    emptyText: String,

    expandRowKeys: Array,

    defaultExpandAll: Boolean,

    defaultSort: Object,

    tooltipEffect: String,

    spanMethod: Function,

    selectOnIndeterminate: {
      type: Boolean,
      default: true
    },

    indent: {
      type: Number,
      default: 16
    },

    treeProps: {
      type: Object,
      default() {
        return {
          hasChildren: 'hasChildren',
          children: 'children'
        }
      }
    },

    lazy: Boolean,

    load: Function,

    isTreeTable:Boolean,

    isBigData:Boolean
  },

  components: {
    TableHeader,
    TableFooter,
    TableBody
  },

  methods: {
    getMigratingConfig() {
      return {
        events: {
          expand: 'expand is renamed to expand-change'
        }
      }
    },

    setCurrentRow(row) {
      this.store.commit('setCurrentRow', row)
    },

    toggleRowSelection(row, selected) {
      this.store.toggleRowSelection(row, selected)
      this.store.updateAllSelected()
    },

    toggleRowExpansion(row, expanded) {
      this.store.toggleRowExpansionAdapter(row, expanded)
    },

    clearSelection() {
      this.store.clearSelection()
    },

    clearFilter(columnKeys) {
      this.store.clearFilter(columnKeys)
    },

    clearSort() {
      this.store.clearSort()
    },

    handleMouseLeave() {
      this.store.commit('setHoverRow', null)
      if (this.hoverState) this.hoverState = null
    },

    updateScrollY() {
      this.layout.updateScrollY()
      this.layout.updateColumnsWidth()
    },

    handleFixedMousewheel(event, data) {
      const bodyWrapper = this.bodyWrapper
      if (Math.abs(data.spinY) > 0) {
        const currentScrollTop = bodyWrapper.scrollTop
        if (data.pixelY < 0 && currentScrollTop !== 0) {
          event.preventDefault()
        }
        if (data.pixelY > 0 && bodyWrapper.scrollHeight - bodyWrapper.clientHeight > currentScrollTop) {
          event.preventDefault()
        }
        bodyWrapper.scrollTop += Math.ceil(data.pixelY / 5)
      } else {
        bodyWrapper.scrollLeft += Math.ceil(data.pixelX / 5)
      }
    },

    handleHeaderFooterMousewheel(event, data) {
      const { pixelX, pixelY } = data
      if (Math.abs(pixelX) >= Math.abs(pixelY)) {
        this.bodyWrapper.scrollLeft += data.pixelX / 5
      }
    },

    bindEvents() {
      if (this.fit) {
        addResizeListener(this.$el, this.resizeListener)
      }
    },

    unbindEvents() {
      if (this.fit) {
        removeResizeListener(this.$el, this.resizeListener)
      }
    },

    resizeListener() {
      if (!this.$ready) return
      let shouldUpdateLayout = false
      const el = this.$el
      const { width: oldWidth, height: oldHeight } = this.resizeState

      const width = el.offsetWidth
      if (oldWidth !== width) {
        shouldUpdateLayout = true
      }

      const height = el.offsetHeight
      if ((this.height || this.shouldUpdateHeight) && oldHeight !== height) {
        shouldUpdateLayout = true
      }

      if (shouldUpdateLayout) {
        this.resizeState.width = width
        this.resizeState.height = height
        this.doLayout()
      }
    },

    doLayout() {
      this.layout.updateColumnsWidth()
      if (this.shouldUpdateHeight) {
        this.layout.updateElsHeight()
      }
    },

    sort(prop, order) {
      this.store.commit('sort', { prop, order })
    },

    toggleAllSelection() {
      this.store.commit('toggleAllSelection')
    }

  },

  computed: {
    tableSize() {
      return this.size || (this.$ELEMENT || {}).size
    },

    bodyWrapper() {
      return this.$refs.bodyWrapper && this.$refs.bodyWrapper.$el
    },

    shouldUpdateHeight() {
      return this.height ||
        this.maxHeight ||
        this.fixedColumns.length > 0 ||
        this.rightFixedColumns.length > 0
    },

    bodyWidth() {
      const { bodyWidth, scrollY, gutterWidth } = this.layout
      return bodyWidth ? bodyWidth - (scrollY ? gutterWidth : 0) + 'px' : ''
    },

    fixedHeight() {
      if (this.maxHeight) {
        if (this.showSummary) {
          return {
            bottom: 0
          }
        }
        return {
          bottom: (this.layout.scrollX && this.data.length) ? this.layout.gutterWidth + 'px' : ''
        }
      } else {
        if (this.showSummary) {
          return {
            height: this.layout.tableHeight ? this.layout.tableHeight + 'px' : ''
          }
        }
        return {
          height: this.layout.viewportHeight ? this.layout.viewportHeight + 'px' : ''
        }
      }
    },

    bodyHeight() {
      const { headerHeight = 0, bodyHeight, footerHeight = 0 } = this.layout
      if (this.height) {
        return {
          height: bodyHeight ? bodyHeight + 'px' : ''
        }
      } else if (this.maxHeight) {
        const maxHeight = parseHeight(this.maxHeight)
        if (maxHeight) {
          return {
            'max-height': (maxHeight - footerHeight - (this.showHeader ? headerHeight : 0)) + 'px'
          }
        }
      }
      return {}
    },

    fixedBodyHeight() {
      if (this.height) {
        return {
          height: this.layout.fixedBodyHeight ? this.layout.fixedBodyHeight + 'px' : ''
        }
      } else if (this.maxHeight) {
        let maxHeight = parseHeight(this.maxHeight)
        if (maxHeight) {
          maxHeight = this.layout.scrollX ? maxHeight - this.layout.gutterWidth : maxHeight
          if (this.showHeader) {
            maxHeight -= this.layout.headerHeight
          }
          maxHeight -= this.layout.footerHeight
          return {
            'max-height': maxHeight + 'px'
          }
        }
      }
      return {}
    },

    ...mapStates({
      selection: 'selection',
      columns: 'columns',
      tableData: 'data',
      fixedColumns: 'fixedColumns',
      rightFixedColumns: 'rightFixedColumns'
    })
  },

  watch: {
    height: {
      immediate: true,
      handler(value) {
        this.layout.setHeight(value)
      }
    },

    maxHeight: {
      immediate: true,
      handler(value) {
        this.layout.setMaxHeight(value)
      }
    },

    currentRowKey(newVal) {
      this.store.setCurrentRowKey(newVal)
    },

    data: {
      immediate: true,
      handler(value) {
        this.store.commit('setData', deepmerge([], value))
        if (this.$ready) {
          this.$nextTick(() => {
            this.doLayout()
          })
        }
      }
    },

    expandRowKeys: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.store.setExpandRowKeysAdapter(newVal)
        }
      }
    }
  },

  created() {
    this.tableId = 'el-table_' + tableIdSeed++
    this.debouncedUpdateLayout = debounce(50, () => this.doLayout())
  },

  mounted() {
    this.bindEvents()
    this.store.updateColumns()
    this.doLayout()

    this.resizeState = {
      width: this.$el.offsetWidth,
      height: this.$el.offsetHeight
    }

    // init filters
    this.store.states.columns.forEach(column => {
      if (column.filteredValue && column.filteredValue.length) {
        this.store.commit('filterChange', {
          column,
          values: column.filteredValue,
          silent: true
        })
      }
    })

    this.store.setBodyElem(this.bodyWrapper)
    this.$ready = true
  },

  destroyed() {
    this.unbindEvents()
  },

  data() {
    const { hasChildren = 'hasChildren', children = 'children' } = this.treeProps
    this.store = createStore(this, {
      rowKey: this.rowKey,
      defaultExpandAll: this.defaultExpandAll,
      selectOnIndeterminate: this.selectOnIndeterminate,
      // TreeTable 的相关配置
      indent: this.indent,
      lazy: this.lazy,
      lazyColumnIdentifier: hasChildren,
      childrenColumnName: children,
      scrollYLoad:this.isBigData
    })
    const layout = new TableLayout({
      store: this.store,
      table: this,
      fit: this.fit,
      showHeader: this.showHeader
    })
    return {
      layout,
      isHidden: false,
      renderExpanded: null,
      resizeProxyVisible: false,
      resizeState: {
        width: null,
        height: null
      },
      // 是否拥有多级表头
      isGroup: false
    }
  }
}
</script>
