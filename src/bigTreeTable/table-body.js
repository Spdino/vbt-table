import { arrayFindIndex } from 'element-ui/src/utils/util'
import { getCell, getColumnByCell, getRowIdentity } from './util'
import {
  getStyle,
  hasClass,
  removeClass,
  addClass
} from 'element-ui/src/utils/dom'
import debounce from 'throttle-debounce/debounce'
import LayoutObserver from './layout-observer'
import { mapStates } from './store/helper'
import bodyScroll from './body-scorll'

export default {
  name: 'vbtTableBody',

  mixins: [LayoutObserver, bodyScroll],

  props: {
    store: {
      required: true
    },
    layout: { required: true },
    bodyWidth: String,
    stripe: Boolean,
    context: {},
    rowClassName: [String, Function],
    rowStyle: [Object, Function],
    fixed: String,
    highlight: Boolean,
    emptyText: String
  },

  render() {
    const { data = [], scrollPosition, fixed, layout, bodyWidth } = this
    const { scrollYLoad, scrollYStore } = this.store.states
    const scrollingClass = layout.scrollX
      ? `is-scrolling-${scrollPosition}`
      : 'is-scrolling-none'

    return (
      <div
        class={scrollingClass}
        style={{ top: fixed ? layout.headerHeight + 'px' : null }}
      >
        {scrollYLoad ? (
          <div style={{ height: `${scrollYStore.topSpaceHeight}px` }} />
        ) : null}
        <table
          class='el-table__body'
          cellspacing='0'
          cellpadding='0'
          border='0'
          style={{ width: bodyWidth }}
        >
          <colgroup>
            {this.columns.map(column => (
              <col name={column.id} key={column.id} />
            ))}
          </colgroup>
          <tbody>
            {data.reduce((acc, row) => {
              return acc.concat(this.wrappedRowRender(row, acc.length))
            }, [])}
            <el-tooltip
              effect={this.table.tooltipEffect}
              placement='top'
              ref='tooltip'
              content={this.tooltipContent}
            />
          </tbody>
        </table>
        {this.renderEmpty()}
        {this.renderAppendSlot()}
        {scrollYLoad ? (
          <div style={{ height: `${scrollYStore.bottomSpaceHeight}px` }} />
        ) : null}
      </div>
    )
  },

  computed: {
    table() {
      return this.$parent
    },

    ...mapStates({
      data: 'data',
      columns: 'columns',
      treeIndent: 'indent',
      leftFixedLeafCount: 'fixedLeafColumnsLength',
      rightFixedLeafCount: 'rightFixedLeafColumnsLength',
      columnsCount: states => states.columns.length,
      leftFixedCount: states => states.fixedColumns.length,
      rightFixedCount: states => states.rightFixedColumns.length,
      hasExpandColumn: states =>
        states.columns.some(({ type }) => type === 'expand')
    }),

    firstDefaultColumnIndex() {
      return arrayFindIndex(this.columns, ({ type }) => type === 'default')
    }
  },

  watch: {
    // don't trigger getter of currentRow in getCellClass. see https://jsfiddle.net/oe2b4hqt/
    // update DOM manually. see https://github.com/ElemeFE/element/pull/13954/files#diff-9b450c00d0a9dec0ffad5a3176972e40
    'store.states.hoverRow'(newVal, oldVal) {
      if (!this.store.states.isComplex || this.$isServer) return
      let raf = window.requestAnimationFrame
      if (!raf) {
        raf = fn => setTimeout(fn, 16)
      }
      raf(() => {
        const rows = this.$el.querySelectorAll('.el-table__row')
        const oldRow = rows[oldVal]
        const newRow = rows[newVal]
        if (oldRow) {
          removeClass(oldRow, 'hover-row')
        }
        if (newRow) {
          addClass(newRow, 'hover-row')
        }
      })
    }
  },

  data() {
    return {
      tooltipContent: ''
    }
  },

  created() {
    this.activateTooltip = debounce(50, tooltip => tooltip.handleShowPopper())
  },

  methods: {
    getKeyOfRow(row, index) {
      const rowKey = this.table.rowKey
      if (rowKey) {
        return getRowIdentity(row, rowKey)
      }
      return index
    },

    isColumnHidden(index) {
      if (this.fixed === true || this.fixed === 'left') {
        return index >= this.leftFixedLeafCount
      } else if (this.fixed === 'right') {
        return index < this.columnsCount - this.rightFixedLeafCount
      } else {
        return (
          index < this.leftFixedLeafCount ||
          index >= this.columnsCount - this.rightFixedLeafCount
        )
      }
    },

    getSpan(row, column, rowIndex, columnIndex) {
      let rowspan = 1
      let colspan = 1
      const fn = this.table.spanMethod
      if (typeof fn === 'function') {
        const result = fn({
          row,
          column,
          rowIndex,
          columnIndex
        })
        if (Array.isArray(result)) {
          rowspan = result[0]
          colspan = result[1]
        } else if (typeof result === 'object') {
          rowspan = result.rowspan
          colspan = result.colspan
        }
      }
      return { rowspan, colspan }
    },

    getRowStyle(row, rowIndex) {
      const rowStyle = this.table.rowStyle
      if (typeof rowStyle === 'function') {
        return rowStyle({
          row,
          rowIndex
        })
      }
      return rowStyle || null
    },

    getRowClass(row, rowIndex) {
      const classes = ['el-table__row']
      if (
        this.table.highlightCurrentRow &&
        row === this.store.states.currentRow
      ) {
        classes.push('current-row')
      }

      if (this.stripe && rowIndex % 2 === 1) {
        classes.push('el-table__row--striped')
      }
      const rowClassName = this.table.rowClassName
      if (typeof rowClassName === 'string') {
        classes.push(rowClassName)
      } else if (typeof rowClassName === 'function') {
        classes.push(
          rowClassName({
            row,
            rowIndex
          })
        )
      }

      if (this.store.states.expandRows.indexOf(row) > -1) {
        classes.push('expanded')
      }

      return classes
    },

    getCellStyle(rowIndex, columnIndex, row, column) {
      const cellStyle = this.table.cellStyle
      if (typeof cellStyle === 'function') {
        return cellStyle({
          rowIndex,
          columnIndex,
          row,
          column
        })
      }
      return cellStyle
    },

    getCellClass(rowIndex, columnIndex, row, column) {
      const classes = [column.id, column.align, column.className]

      if (this.isColumnHidden(columnIndex)) {
        classes.push('is-hidden')
      }

      const cellClassName = this.table.cellClassName
      if (typeof cellClassName === 'string') {
        classes.push(cellClassName)
      } else if (typeof cellClassName === 'function') {
        classes.push(
          cellClassName({
            rowIndex,
            columnIndex,
            row,
            column
          })
        )
      }

      return classes.join(' ')
    },

    getColspanRealWidth(columns, colspan, index) {
      if (colspan < 1) {
        return columns[index].realWidth
      }
      const widthArr = columns
        .map(({ realWidth }) => realWidth)
        .slice(index, index + colspan)
      return widthArr.reduce((acc, width) => acc + width, -1)
    },

    handleCellMouseEnter(event, row) {
      const table = this.table
      const cell = getCell(event)

      if (cell) {
        const column = getColumnByCell(table, cell)
        const hoverState = (table.hoverState = { cell, column, row })
        table.$emit(
          'cell-mouse-enter',
          hoverState.row,
          hoverState.column,
          hoverState.cell,
          event
        )
      }

      // 判断是否text-overflow, 如果是就显示tooltip
      const cellChild = event.target.querySelector('.cell')
      if (!(hasClass(cellChild, 'el-tooltip') && cellChild.childNodes.length)) {
        return
      }
      // use range width instead of scrollWidth to determine whether the text is overflowing
      // to address a potential FireFox bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1074543#c3
      const range = document.createRange()
      range.setStart(cellChild, 0)
      range.setEnd(cellChild, cellChild.childNodes.length)
      const rangeWidth = range.getBoundingClientRect().width
      const padding =
        (parseInt(getStyle(cellChild, 'paddingLeft'), 10) || 0) +
        (parseInt(getStyle(cellChild, 'paddingRight'), 10) || 0)
      if (
        (rangeWidth + padding > cellChild.offsetWidth ||
          cellChild.scrollWidth > cellChild.offsetWidth) &&
        this.$refs.tooltip
      ) {
        const tooltip = this.$refs.tooltip
        // TODO 会引起整个 Table 的重新渲染，需要优化
        this.tooltipContent = cell.innerText || cell.textContent
        tooltip.referenceElm = cell
        tooltip.$refs.popper && (tooltip.$refs.popper.style.display = 'none')
        tooltip.doDestroy()
        tooltip.setExpectedState(true)
        this.activateTooltip(tooltip)
      }
    },

    handleCellMouseLeave(event) {
      const tooltip = this.$refs.tooltip
      if (tooltip) {
        tooltip.setExpectedState(false)
        tooltip.handleClosePopper()
      }
      const cell = getCell(event)
      if (!cell) return

      const oldHoverState = this.table.hoverState || {}
      this.table.$emit(
        'cell-mouse-leave',
        oldHoverState.row,
        oldHoverState.column,
        oldHoverState.cell,
        event
      )
    },

    handleMouseEnter: debounce(30, function(index) {
      this.store.commit('setHoverRow', index)
    }),

    handleMouseLeave: debounce(30, function() {
      this.store.commit('setHoverRow', null)
    }),

    handleContextMenu(event, row) {
      this.handleEvent(event, row, 'contextmenu')
    },

    handleDoubleClick(event, row) {
      this.handleEvent(event, row, 'dblclick')
    },

    handleClick(event, row) {
      this.store.commit('setCurrentRow', row)
      this.handleEvent(event, row, 'click')
    },

    handleEvent(event, row, name) {
      const table = this.table
      const cell = getCell(event)
      let column
      if (cell) {
        column = getColumnByCell(table, cell)
        if (column) {
          table.$emit(`cell-${name}`, row, column, cell, event)
        }
      }
      table.$emit(`row-${name}`, row, column, event)
    },

    rowRender(row, $index, treeRowData) {
      const { treeIndent, columns, firstDefaultColumnIndex } = this
      const columnsHidden = columns.map((column, index) =>
        this.isColumnHidden(index)
      )
      const rowClasses = this.getRowClass(row, $index)
      if (treeRowData) {
        rowClasses.push('el-table__row--level-' + treeRowData.level)
      }
      return (
        <tr
          style={this.getRowStyle(row, $index)}
          class={rowClasses}
          key={this.getKeyOfRow(row, $index)}
          on-dblclick={$event => this.handleDoubleClick($event, row)}
          on-click={$event => this.handleClick($event, row)}
          on-contextmenu={$event => this.handleContextMenu($event, row)}
          on-mouseenter={() => this.handleMouseEnter($index)}
          on-mouseleave={this.handleMouseLeave}
        >
          {columns.map((column, cellIndex) => {
            const { rowspan, colspan } = this.getSpan(
              row,
              column,
              $index,
              cellIndex
            )
            if (!rowspan || !colspan) {
              return null
            }
            const columnData = { ...column }
            columnData.realWidth = this.getColspanRealWidth(
              columns,
              colspan,
              cellIndex
            )
            const data = {
              store: this.store,
              _self: this.context || this.table.$vnode.context,
              column: columnData,
              row,
              $index
            }
            if (cellIndex === firstDefaultColumnIndex && treeRowData) {
              data.treeNode = treeRowData
              data.treeNode.indent = treeRowData.level * treeIndent
            }
            return (
              <td
                style={this.getCellStyle($index, cellIndex, row, column)}
                class={this.getCellClass($index, cellIndex, row, column)}
                rowspan={rowspan}
                colspan={colspan}
                on-mouseenter={$event => this.handleCellMouseEnter($event, row)}
                on-mouseleave={this.handleCellMouseLeave}
              >
                {column.renderCell.call(
                  this._renderProxy,
                  this.$createElement,
                  data,
                  columnsHidden[cellIndex]
                )}
              </td>
            )
          })}
        </tr>
      )
    },

    wrappedRowRender(row, $index) {
      const store = this.store
      const { isRowExpanded, assertRowKey } = store
      const {
        rowKey,
        childrenColumnName,
        lazyColumnIdentifier,
        treeData
      } = store.states

      if (this.hasExpandColumn && isRowExpanded(row)) {
        const renderExpanded = this.table.renderExpanded
        const tr = this.rowRender(row, $index)
        if (!renderExpanded) {
          console.error('[Element Error]renderExpanded is required.')
          return tr
        }
        // 使用二维数组，避免修改 $index
        return [
          [
            tr,
            <tr key={'expanded-row__' + tr.key}>
              <td colspan={this.columnsCount} class='el-table__expanded-cell'>
                {renderExpanded(this.$createElement, {
                  row,
                  $index,
                  store: this.store
                })}
              </td>
            </tr>
          ]
        ]
      } else if (Object.keys(treeData).length) {
        assertRowKey()
        const key = getRowIdentity(row, rowKey)
        if (key === undefined || key === null) {
          throw new Error('for nested data item, row-key is required.')
        }
        const treeRowData = treeData[key]
        if(treeRowData) {
          if (row[lazyColumnIdentifier]) {
            treeRowData.noLazyChildren = !row[lazyColumnIdentifier]
          } else {
            treeRowData.noLazyChildren = !(
              row[childrenColumnName] && row[childrenColumnName].length
            )
          }
  
          return this.rowRender(row, $index, treeRowData)
        }
       
      } else {
        return this.rowRender(row, $index)
      }
    }
  }
}
