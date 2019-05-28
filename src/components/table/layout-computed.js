import DomTools from "../../tools/dom";

export default {
  methods: {
        /**
     * 指定列宽的列进行拆分
     */
    analyColumnWidth() {
      let resizeList = [];
      let pxList = [];
      let pxMinList = [];
      let scaleList = [];
      let scaleMinList = [];
      let autoList = [];
      this.tableFullColumn.forEach(column => {
        if (column.visible) {
          if (column.resizeWidth) {
            resizeList.push(column);
          } else if (DomTools.isPx(column.width)) {
            pxList.push(column);
          } else if (DomTools.isScale(column.width)) {
            scaleList.push(column);
          } else if (DomTools.isPx(column.minWidth)) {
            pxMinList.push(column);
          } else if (DomTools.isScale(column.minWidth)) {
            scaleMinList.push(column);
          } else {
            autoList.push(column);
          }
        }
      });
      Object.assign(this.columnStore, {
        resizeList,
        pxList,
        pxMinList,
        scaleList,
        scaleMinList,
        autoList
      });
    },

    /**
     * 计算单元格列宽，动态分配可用剩余空间
     * 支持 width=? width=?px width=?% min-width=? min-width=?px min-width=?%
     */
    recalculate(refull) {
      let { $refs, scrollYLoad } = this;
      let tableBody = $refs.tableBody;
      let tableHeader = $refs.tableHeader;
      let bodyElem = tableBody ? tableBody.$el : null;
      let headerElem = tableHeader ? tableHeader.$el : null;

      if (bodyElem) {
        let bodyWidth = bodyElem.clientWidth;
        let tableWidth = this.autoCellWidth(headerElem, bodyElem, bodyWidth);
        if (refull === true) {
          // 初始化时需要在列计算之后再执行优化运算，达到最优显示效果
          return this.$nextTick().then(() => {
            bodyWidth = bodyElem.clientWidth;
            if (bodyWidth !== tableWidth) {
              this.autoCellWidth(headerElem, bodyElem, bodyWidth);
            }
          });
        }
      }
      if (scrollYLoad) {
        this.computeScrollLoad();
      }
      return this.$nextTick();
    },

    // 列宽计算
    autoCellWidth(headerElem, bodyElem, bodyWidth) {
      let meanWidth;
      let tableWidth = 0;
      let minCellWidth = 40; // 列宽最少限制 40px
      let remainWidth = bodyWidth;
      let { fit, columnStore } = this;
      let {
        resizeList,
        pxMinList,
        pxList,
        scaleList,
        scaleMinList,
        autoList
      } = columnStore;
      // 最小宽
      pxMinList.forEach(column => {
        let minWidth = parseInt(column.minWidth);
        tableWidth += minWidth;
        column.renderWidth = minWidth;
      });
      // 最小百分比
      meanWidth = remainWidth / 100;
      scaleMinList.forEach(column => {
        let scaleWidth = Math.floor(parseInt(column.minWidth) * meanWidth);
        tableWidth += scaleWidth;
        column.renderWidth = scaleWidth;
      });
      // 固定百分比
      scaleList.forEach(column => {
        let scaleWidth = Math.floor(parseInt(column.width) * meanWidth);
        tableWidth += scaleWidth;
        column.renderWidth = scaleWidth;
      });
      // 固定宽
      pxList.forEach(column => {
        let width = parseInt(column.width);
        tableWidth += width;
        column.renderWidth = width;
      });
      // 调整了列宽
      resizeList.forEach(column => {
        let width = parseInt(column.resizeWidth);
        tableWidth += width;
        column.renderWidth = width;
      });
      remainWidth -= tableWidth;
      meanWidth =
        remainWidth > 0
          ? Math.max(
              Math.floor(
                remainWidth /
                  (scaleMinList.length + pxMinList.length + autoList.length)
              ),
              minCellWidth
            )
          : minCellWidth;
      if (fit) {
        if (remainWidth > 0) {
          scaleMinList.concat(pxMinList).forEach(column => {
            tableWidth += meanWidth;
            column.renderWidth += meanWidth;
          });
        }
      } else {
        meanWidth = minCellWidth;
      }
      // 自适应
      autoList.forEach((column, index) => {
        column.renderWidth = meanWidth;
        tableWidth += meanWidth;
        if (fit && index === autoList.length - 1) {
          // 如果所有列足够放的情况下，修补列之间的误差
          let odiffer = bodyWidth - tableWidth;
          if (odiffer > 0) {
            column.renderWidth += odiffer;
            tableWidth = bodyWidth;
          }
        }
      });
      let tableHeight = bodyElem.offsetHeight;
      this.scrollYWidth = bodyElem.offsetWidth - bodyWidth;
      this.overflowY = this.scrollYWidth > 0;
      this.tableWidth = tableWidth;
      this.tableHeight = tableHeight;
      if (headerElem) {
        this.headerHeight = headerElem.offsetHeight;
      }
      this.scrollXHeight = Math.max(tableHeight - bodyElem.clientHeight, 0);
      this.overflowX = tableWidth > bodyWidth;
      if (this.overflowX) {
        this.checkScrolling();
      }
      return tableWidth;
    },

       /**
     * 处理固定列的显示状态
     */
    checkScrolling () {
      let { tableBody, leftBody, rightBody } = this.$refs
      let bodyElem = tableBody ? tableBody.$el : null
      if (bodyElem) {
        if (leftBody) {
          this.scrollLeftToRight = bodyElem.scrollLeft > 0
        }
        if (rightBody) {
          this.scrollRightToLeft = bodyElem.clientWidth < bodyElem.scrollWidth - bodyElem.scrollLeft
        }
      }
    },

    handleGlobalResizeEvent () {
      this.recalculate()
    },
  }
};
