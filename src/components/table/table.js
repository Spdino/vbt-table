import TableProps from "../props";
import TableHeader from "../header/header";
import TableBody from "../body/body";
import XEUtils from "xe-utils";
import GlobalConfig from "../../conf";
import UtilTools from "../../tools/utils";
import DomTools from "../../tools/dom";
import ResizeEvent from '../resize'

import layoutComputed from "./layout-computed";
import renderMethods from "./table-render";

export default {
  name: "vbtTable",

  props: TableProps,

  mixins: [layoutComputed, renderMethods],

  components: {
    TableHeader,
    TableBody
  },

  provide() {
    return {
      $table: this
    };
  },

  data() {
    return {
      id: XEUtils.uniqueId(),
      // 渲染中的数据
      tableData: [],
      // 完整所有列
      tableFullColumn: [],
      // 渲染的列
      tableColumn: [],
      // 表格宽度
      tableWidth: 0,
      // 表格高度
      tableHeight: 0,
      // 表头高度
      headerHeight: 0,
      // 当前 hover 行
      hoverRow: null,
      // 左侧固定列是否向右滚动了
      scrollLeftToRight: false,
      // 右侧固定列是否向左滚动了
      scrollRightToLeft: false,
      // 纵向滚动条的宽度
      scrollYWidth: 0,
      // 是否纵向 Y 滚动方式加载
      scrollYLoad: false,
      // 是否存在纵向滚动条
      overflowY: true,
      // 是否存在横向滚动条
      overflowX: false,
      // 已展开树节点
      treeExpandeds: [],
      // 存放纵向 Y 滚动渲染相关的信息
      scrollYStore: {
        renderSize: 0,
        visibleSize: 0,
        offsetSize: 0,
        rowHeight: 0,
        startIndex: 0,
        visibleIndex: 0,
        topSpaceHeight: 0,
        bottomSpaceHeight: 0
      },
      // 存放 tooltip 相关信息
      tooltipStore: {
        visible: false,
        row: null,
        column: null,
        content: null,
        style: null,
        arrowStyle: null,
        placement: null
      },
      // 存放列相关的信息
      columnStore: {
        leftList: [],
        centerList: [],
        rightList: [],
        resizeList: [],
        pxList: [],
        pxMinList: [],
        scaleList: [],
        scaleMinList: [],
        autoList: []
      }
    };
  },

  computed: {
    // 优化的参数
    optimizeConfig() {
      return Object.assign({}, GlobalConfig.optimized, this.optimized);
    },
    visibleColumn() {
      return this.tableFullColumn
        ? this.tableFullColumn.filter(column => column.visible)
        : [];
    }
  },

  watch: {
    tableColumn() {
      this.analyColumnWidth();
    },
    visibleColumn() {
      this.refreshColumn();
      this.$nextTick(this.recalculate);
    }
  },

  created() {
    const { scrollYStore, treeConfig, optimizeConfig, rowKey } = this;
    let { scrollY } = optimizeConfig;
    if (scrollY) {
      Object.assign(scrollYStore, {
        startIndex: 0,
        visibleIndex: 0,
        renderSize: scrollY.rSize,
        offsetSize: scrollY.oSize
      });
    }
    this.load(this.data).then(() => {
      if (treeConfig && !(rowKey || treeConfig.key)) {
        throw new Error(
          "[vbt-table] Tree table must have a unique primary key."
        );
      }
      this.refreshColumn();
      this.handleDefaultExpand();
      this.$nextTick(() => this.recalculate(true));
    });
  },

  mounted () {
    if (this.autoResize && this.autoWidth) {
      ResizeEvent.on(this, this.$el.parentNode, this.recalculate)
    }
    document.body.appendChild(this.$refs.tableWrapper)
  },
  beforeDestroy () {
    let tableWrapper = this.$refs.tableWrapper
    if (tableWrapper && tableWrapper.parentNode) {
      tableWrapper.parentNode.removeChild(tableWrapper)
    }
    ResizeEvent.off(this, this.$el.parentNode)
  },

  render() {
    const {
      id,
      tooltipStore,
      tooltipTheme,
      tableData,
      tableColumn,
      showHeader,
      border,
      stripe,
      highlightHoverRow,
      size,
      overflowX,
      overflowY,
      columnStore,
      optimizeConfig,
      loading
    } = this;
    let { leftList, rightList } = columnStore;

    return (
      <div
        class={[
          "vbt-table",
          size ? `size--${size}` : "",
          {
            "show--head": showHeader,
            "scroll--y": overflowY,
            "scroll--x": overflowX,
            "fixed--left": leftList.length,
            "fixed--right": rightList.length,
            "t--animat": optimizeConfig.animat,
            "t--stripe": stripe,
            "t--border": border,
            "t--highlight": highlightHoverRow
          }
        ]}
      >
        <div class="'vbt-table-hidden-column'" ref="hideColumn">
          {this.$slots.default}
        </div>
        {showHeader ? (
          <table-header
            ref="tableHeader"
            tableData={tableData}
            tableColumn={tableColumn}
          />
        ) : null}
        <table-body
          ref="tableBody"
          tableData={tableData}
          tableColumn={tableColumn}
        />
        {leftList && leftList.length && overflowX
          ? this.renderFixed("left")
          : null}
        {rightList && rightList.length && overflowX
          ? this.renderFixed("right")
          : null}
        <div
          class="vbt-table--loading"
          style={{ display: loading ? "block" : "none" }}
        >
          <div class="vbt-table--spinner" />
        </div>
        <div class={[`vbt-table${id}-wrapper`]} ref="tableWrapper">
          {tooltipStore.visible ? (
            <div
              class={[
                "vbt-table--tooltip-wrapper",
                `theme--${tooltipTheme}`,
                `placement--${tooltipStore.placement}`
              ]}
              style={tooltipStore.style}
              ref="tipWrapper"
            >
              <div class="vbt-table--tooltip-content">
                {UtilTools.formatText(tooltipStore.content)}
              </div>
              <div
                class="vbt-table--tooltip-arrow"
                style={tooltipStore.arrowStyle}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  },

  methods: {
    /**
     * 刷新列信息
     * 将固定的列左边、右边分别靠边
     * 如果使用了分组表头，固定列必须在左侧或者右侧
     */
    refreshColumn() {
      let leftList = [];
      let centerList = [];
      let rightList = [];
      let { tableFullColumn, columnStore } = this;

      tableFullColumn.forEach(column => {
        if (column.visible) {
          if (column.fixed === "left") {
            leftList.push(column);
          } else if (column.fixed === "right") {
            rightList.push(column);
          } else {
            centerList.push(column);
          }
        }
      });
      let visibleColumn = leftList.concat(centerList).concat(rightList);
      Object.assign(columnStore, { leftList, centerList, rightList });
      this.tableColumn = visibleColumn;
    },

    clearCurrentRow() {
      this.selectRow = null;
      this.hoverRow = null;
      return this.$nextTick();
    },

    /**
     * 行 hover 事件
     */
    triggerHoverEvent(evnt, { row }) {
      this.hoverRow = row;
    },

    /**
     * 触发 tooltip 事件
     */
    triggerTooltipEvent(evnt, { row, column }) {
      let { tooltipStore } = this;
      if (
        tooltipStore.column !== column ||
        tooltipStore.row !== row ||
        !tooltipStore.visible
      ) {
        this.showTooltip(
          evnt,
          UtilTools.getCellValue(row, column.property),
          column,
          row
        );
      }
    },

    // 显示 tooltip
    showTooltip(evnt, content, column, row) {
      let cell = evnt.currentTarget;
      let wrapperElem = cell.children[0];
      if (content && wrapperElem.scrollWidth > wrapperElem.clientWidth) {
        let { tooltipStore, $refs } = this;
        let { top, left } = DomTools.getOffsetPos(cell);
        let { scrollTop, scrollLeft, visibleWidth } = DomTools.getDomNode();
        let tipLeft = left;
        Object.assign(tooltipStore, {
          row,
          column,
          content,
          visible: true,
          placement: "top",
          arrowStyle: { left: "50%" }
        });
        return this.$nextTick()
          .then(() => {
            let tipWrapperElem = $refs.tipWrapper;
            if (tipWrapperElem) {
              console.log();
              tipLeft =
                left +
                Math.floor((cell.offsetWidth - tipWrapperElem.offsetWidth) / 2);
              tooltipStore.style = {
                width: `${tipWrapperElem.offsetWidth + 2}px`,
                top: `${top - tipWrapperElem.offsetHeight - 30}px`,
                left: `${tipLeft}px`
              };
              return this.$nextTick();
            }
          })
          .then(() => {
            let tipWrapperElem = $refs.tipWrapper;
            if (tipWrapperElem) {
              let offsetHeight = tipWrapperElem.offsetHeight;
              let offsetWidth = tipWrapperElem.offsetWidth;
              if (top - offsetHeight < scrollTop) {
                tooltipStore.placement = "bottom";
                tooltipStore.style.top = `${top + cell.offsetHeight + 6}px`;
              }
              if (tipLeft < scrollLeft + 6) {
                // 超出左边界
                tipLeft = scrollLeft + 6;
                tooltipStore.arrowStyle.left = `${
                  left > tipLeft + 16 ? left - tipLeft + 16 : 16
                }px`;
                tooltipStore.style.left = `${tipLeft}px`;
              } else if (left + offsetWidth > scrollLeft + visibleWidth) {
                // 超出右边界
                tipLeft = scrollLeft + visibleWidth - offsetWidth - 80;
                tooltipStore.arrowStyle.left = `${offsetWidth -
                  Math.max(
                    Math.floor((tipLeft + offsetWidth - left) / 2),
                    22
                  )}px`;
                tooltipStore.style.left = `${tipLeft}px`;
              }
            }
          });
      }
      return this.$nextTick();
    },

    // 关闭 tooltip
    clostTooltip() {
      Object.assign(this.tooltipStore, {
        row: null,
        column: null,
        content: null,
        style: null,
        visible: false,
        placement: null
      })
      return this.$nextTick();
    },

    handleDefaultExpand() {
      if (this.treeConfig) {
        this.handleDefaultTreeExpand();
      }
    },

    /**
     * 处理默认展开树节点
     */
    handleDefaultTreeExpand() {
      let { rowKey, treeConfig, tableFullData } = this;
      if (treeConfig) {
        let { key, expandAll, expandRowKeys } = treeConfig;
        let { children } = treeConfig;
        let property = rowKey || key;
        let treeExpandeds = [];
        if (expandAll) {
          XEUtils.filterTree(
            tableFullData,
            row => {
              let rowChildren = row[children];
              if (rowChildren && rowChildren.length) {
                treeExpandeds.push(row);
              }
            },
            treeConfig
          );
          this.treeExpandeds = treeExpandeds;
        } else if (expandRowKeys) {
          expandRowKeys.forEach(rowKey => {
            let matchObj = XEUtils.findTree(
              tableFullData,
              item => rowKey === item[property],
              treeConfig
            );
            let rowChildren = matchObj ? matchObj.item[children] : 0;
            if (rowChildren) {
              treeExpandeds.push(matchObj.item);
            }
          });
          this.treeExpandeds = treeExpandeds;
        }
      }
    },

    getTableData() {
      let { scrollYLoad, scrollYStore, tableFullData } = this;
      let fullData = tableFullData;
      return {
        fullData,
        tableData: scrollYLoad
          ? fullData.slice(
              scrollYStore.startIndex,
              scrollYStore.startIndex + scrollYStore.renderSize
            )
          : fullData.slice(0)
      };
    },

    /**
     * 列点击事件
     * 如果是单击模式，则激活为编辑状态
     * 如果是双击模式，则单击后选中状态
     */
    triggerCellClickEvent(evnt, params) {
      let { $el, highlightCurrentRow, treeConfig } = this;
      if (highlightCurrentRow) {
        if (!DomTools.getEventTargetNode(evnt, $el, "vbt-tree-wrapper").flag) {
          this.selectRow = params.row;
        }
      }
      if (
        treeConfig &&
        (treeConfig.trigger === "row" ||
          (params.column.treeNode && treeConfig.trigger === "cell"))
      ) {
        this.triggerTreeExpandEvent(evnt, params);
      }
      UtilTools.emitEvent(this, "cell-click", [params, evnt]);
    },

    /**
     * 展开行事件
     */
    triggerTreeExpandEvent(evnt, { row }) {
      return this.toggleTreeExpansion(row);
    },

    /**
     * 切换展开行
     */
    toggleTreeExpansion(row) {
      return this.setTreeExpansion(row);
    },

    /**
     * 设置展开树形节点，二个参数设置这一行展开与否
     * 支持单行
     * 支持多行
     */
    setTreeExpansion(rows, expanded) {
      let { treeExpandeds, treeConfig } = this;
      let { children } = treeConfig;
      let isToggle = arguments.length === 1;
      if (rows && !XEUtils.isArray(rows)) {
        rows = [rows];
      }
      rows.forEach(row => {
        let rowChildren = row[children];
        if (rowChildren && rowChildren.length) {
          let index = treeExpandeds.indexOf(row);
          if (index > -1) {
            if (isToggle || !expanded) {
              treeExpandeds.splice(index, 1);
            }
          } else {
            if (isToggle || expanded) {
              treeExpandeds.push(row);
            }
          }
        }
      });
      return this.$nextTick();
    },

    clearTreeExpand() {
      this.treeExpandeds = [];
      return this.$nextTick();
    },

    // 计算滚动渲染相关数据
    computeScrollLoad() {
      let { scrollYLoad, scrollYStore, optimizeConfig } = this;
      let { scrollY } = optimizeConfig;
      let tableBodyElem = this.$refs.tableBody.$el;
      let tableHeader = this.$refs.tableHeader;
      // 计算 Y 逻辑
      if (scrollYLoad) {
        if (scrollY.rHeight) {
          scrollYStore.rowHeight = scrollY.rHeight;
        } else {
          let firstTrElem = tableBodyElem.querySelector("tbody>tr");
          if (!firstTrElem && tableHeader) {
            firstTrElem = tableHeader.$el.querySelector("thead>tr");
          }
          if (firstTrElem) {
            scrollYStore.rowHeight = firstTrElem.clientHeight;
          }
        }
        scrollYStore.visibleSize =
          scrollY.vSize ||
          Math.ceil(tableBodyElem.clientHeight / scrollYStore.rowHeight);
        this.updateScrollYSpace();
      }
    },

    // 更新 Y 滚动上下剩余空间大小
    updateScrollYSpace() {
      let { scrollYStore } = this;
      let { fullData, tableData } = this.getTableData();
      this.tableData = tableData;
      scrollYStore.topSpaceHeight = Math.max(
        scrollYStore.startIndex * scrollYStore.rowHeight,
        0
      );
      scrollYStore.bottomSpaceHeight = Math.max(
        (fullData.length -
          (scrollYStore.startIndex + scrollYStore.renderSize)) *
          scrollYStore.rowHeight,
        0
      );
    },

    /**
     * 纵向 Y 滚动渲染事件处理
     */
    triggerScrollYEvent: XEUtils.debounce(
      function(evnt) {
        let { tableFullData, scrollYStore } = this;
        let {
          startIndex,
          renderSize,
          offsetSize,
          visibleSize,
          rowHeight
        } = scrollYStore;
        let scrollBodyElem = evnt.target;
        let scrollTop = scrollBodyElem.scrollTop;
        let toVisibleIndex = Math.ceil(scrollTop / rowHeight);
        if (scrollYStore.visibleIndex !== toVisibleIndex) {
          let isReload, preloadSize;
          let isTop = scrollYStore.visibleIndex > toVisibleIndex;
          if (isTop) {
            preloadSize = renderSize - offsetSize;
            isReload = toVisibleIndex - offsetSize <= startIndex;
          } else {
            preloadSize = offsetSize;
            isReload =
              toVisibleIndex + visibleSize + offsetSize >=
              startIndex + renderSize;
          }
          // 如果渲染数量不充足，直接从当前页开始渲染
          if (renderSize < visibleSize * 3) {
            preloadSize = 0;
          }
          if (isReload) {
            scrollYStore.visibleIndex = toVisibleIndex;
            scrollYStore.startIndex = Math.min(
              Math.max(toVisibleIndex - preloadSize, 0),
              tableFullData.length - renderSize
            );
            this.updateScrollYSpace();
            this.$nextTick(() => {
              scrollBodyElem.scrollTop = scrollTop;
            });
          }
        }
      },
      20,
      { leading: false, trailing: true }
    ),

    load(data, init) {
      const {
        autoWidth,
        optimizeConfig,
        recalculate,
        computeScrollLoad
      } = this;
      let { scrollY } = optimizeConfig;
      let tableFullData = data || [];
      let scrollYLoad =
        scrollY && scrollY.gt && scrollY.gt < tableFullData.length;
      // 全量数据
      this.tableFullData = tableFullData;
      this.scrollYLoad = scrollYLoad;
      this.tableData = this.getTableData().tableData;
      let rest = this.$nextTick();

      if (!init) {
        if (autoWidth) {
          rest = rest.then(() => setTimeout(recalculate));
        } else if (scrollYLoad) {
          rest = rest.then(computeScrollLoad);
        }
      }
      return rest;
    }
  }
};
