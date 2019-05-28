import TableProps from "../props";
import TableHeader from "../header/header";
import TableBody from "../body/body";
import XEUtils from "xe-utils";
import GlobalConfig from "../../conf";
import UtilTools from "../../tools/utils";
import DomTools from '../../tools/utils'

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
          "[vxe-table] Tree table must have a unique primary key."
        );
      }
      this.refreshColumn();
      this.handleDefaultExpand();
      this.$nextTick(() => this.recalculate(true));
    });
  },

  render() {
    const {
      id,
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
      tooltipStore,
      tooltipTheme,
      loading
    } = this;
    let { leftList, rightList } = columnStore;

    return (
      <div
        class={[
          "vxe-table",
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
        <div class="'vxe-table-hidden-column'" ref="hideColumn">
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
          class="vxe-table--loading"
          style={{ display: loading ? "block" : "none" }}
        >
          <div class="vxe-table--spinner" />
        </div>
        <div class={[`vxe-table${id}-wrapper`]} ref="tableWrapper">
          {tooltipStore.visible ? (
            <div
              class={[
                "vxe-table--tooltip-wrapper",
                `theme--${tooltipTheme}`,
                `placement--${tooltipStore.placement}`
              ]}
              style={tooltipStore.style}
              ref="tipWrapper"
            >
              <div class="vxe-table--tooltip-content">
                {UtilTools.formatText(tooltipStore.content)}
              </div>
              <div
                class="vxe-table--tooltip-arrow"
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
    triggerCellClickEvent (evnt, params) {
      let { $el, highlightCurrentRow, editStore, treeConfig, editConfig } = this
      let { actived } = editStore
      if (highlightCurrentRow) {
        if (!DomTools.getEventTargetNode(evnt, $el, 'vxe-tree-wrapper').flag) {
          this.selectRow = params.row
        }
      }
      if (treeConfig && (treeConfig.trigger === 'row' || (params.column.treeNode && treeConfig.trigger === 'cell'))) {
        this.triggerTreeExpandEvent(evnt, params)
      }
      if (editConfig) {
        if (editConfig.trigger === 'click') {
          if (!actived.args || evnt.currentTarget !== actived.args.cell) {
            this.triggerValidate().then(() => {
              this.handleActived(params, evnt)
            }).catch(e => e)
          }
        }
      }
      UtilTools.emitEvent(this, 'cell-click', [params, evnt])
    },

     /**
     * 展开行事件
     */
    triggerTreeExpandEvent (evnt, { row }) {
      return this.toggleTreeExpansion(row)
    },

     /**
     * 切换展开行
     */
    toggleTreeExpansion (row) {
      return this.setTreeExpansion(row)
    },

     /**
     * 设置展开树形节点，二个参数设置这一行展开与否
     * 支持单行
     * 支持多行
     */
    setTreeExpansion (rows, expanded) {
      let { treeExpandeds, treeConfig } = this
      let { children } = treeConfig
      let isToggle = arguments.length === 1
      if (rows && !XEUtils.isArray(rows)) {
        rows = [rows]
      }
      rows.forEach(row => {
        let rowChildren = row[children]
        if (rowChildren && rowChildren.length) {
          let index = treeExpandeds.indexOf(row)
          if (index > -1) {
            if (isToggle || !expanded) {
              treeExpandeds.splice(index, 1)
            }
          } else {
            if (isToggle || expanded) {
              treeExpandeds.push(row)
            }
          }
        }
      })
      return this.$nextTick()
    },

    clearTreeExpand () {
      this.treeExpandeds = []
      return this.$nextTick()
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
