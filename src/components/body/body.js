import renderMethods from "./body-render";

let scrollProcessTimeout;
let updateLeftScrollingTimeput;

export default {
  name: "vbtTableBody",

  mixins: [renderMethods],

  props: {
    tableData: Array,
    tableColumn: Array,
    visibleColumn: Array,
    collectColumn: Array,
    fixedColumn: Array,
    fixedType: String,
    isGroup: Boolean
  },

  inject: ["$table"],

  mounted() {
    this.$el.onscroll = this.scrollEvent;
    this.$el._onscroll = this.scrollEvent;
  },

  render() {
    let style = {};
    const { fixedType, fixedColumn } = this;
    let {
      maxHeight,
      tableColumn,
      tableWidth,
      headerHeight,
      showAllOverflow,
      scrollYLoad,
      scrollYStore
    } = this.$table;
    if (maxHeight) {
      maxHeight = Number(maxHeight);
      style["max-height"] = `${maxHeight - headerHeight}px`;
    }
    // 如果是使用优化模式
    if (fixedType && showAllOverflow) {
      tableColumn = fixedColumn;
      tableWidth = tableColumn.reduce(
        (previous, column) => previous + column.renderWidth,
        0
      );
    }

    return (
      <div
        class={[
          "vbt-table--body-wrapper",
          fixedType ? `fixed--${fixedType}-wrapper` : "body--wrapper"
        ]}
        style={style}
        fixed={fixedType}
      >
        {scrollYLoad ? (
          <div
            class="vbt-body--top-space"
            style={{ height: `${scrollYStore.topSpaceHeight}px` }}
          />
        ) : null}
        {this.renderTable({ tableWidth, tableColumn })}
        {scrollYLoad ? (
          <div
            class="vbt-body--bottom-space"
            style={{ height: `${scrollYStore.bottomSpaceHeight}px` }}
          />
        ) : null}
      </div>
    );
  },

  methods: {
    /**
     * 滚动处理
     * 如果存在列固定左侧，同步更新滚动状态
     * 如果存在列固定右侧，同步更新滚动状态
     */
    scrollEvent(evnt) {
      let { fixedType } = this;
      let { $refs, scrollYLoad, triggerScrollYEvent } = this.$table;
      let { tableHeader, tableBody, leftBody, rightBody } = $refs;
      let headerElem = tableHeader ? tableHeader.$el : null;
      let bodyElem = tableBody.$el;
      let leftElem = leftBody ? leftBody.$el : null;
      let rightElem = rightBody ? rightBody.$el : null;
      if (fixedType === "left") {
        this.syncBodyScroll(leftElem.scrollTop, bodyElem, rightElem);
      } else if (fixedType === "right") {
        this.syncBodyScroll(rightElem.scrollTop, bodyElem, leftElem);
      } else {
        if (headerElem) {
          headerElem.scrollLeft = bodyElem.scrollLeft;
        }
        if (leftElem || rightElem) {
          clearTimeout(updateLeftScrollingTimeput);
          updateLeftScrollingTimeput = setTimeout(
            this.$table.checkScrolling,
            10
          );
        }
        this.syncBodyScroll(bodyElem.scrollTop, leftElem, rightElem);
      }
      if (scrollYLoad) {
        triggerScrollYEvent(evnt);
      }
    },

    syncBodyScroll(scrollTop, elem1, elem2) {
      if (elem1 || elem2) {
        if (elem1) {
          elem1.onscroll = null;
          elem1.scrollTop = scrollTop;
        }
        if (elem2) {
          elem2.onscroll = null;
          elem2.scrollTop = scrollTop;
        }
        clearTimeout(scrollProcessTimeout);
        scrollProcessTimeout = setTimeout(function() {
          if (elem1) {
            elem1.onscroll = elem1._onscroll;
          }
          if (elem2) {
            elem2.onscroll = elem2._onscroll;
          }
        }, 200);
      }
    }
  }
};
