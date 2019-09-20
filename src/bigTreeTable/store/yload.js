import { debounce } from "throttle-debounce";
import { getRowIdentity } from "../util";

export default {
  data() {
    return {
      states: {
        // 存放纵向 Y 滚动渲染相关的信息
        scrollYStore: {
          renderSize: 30,
          visibleSize: 0,
          offsetSize: 10,
          rowHeight: 0,
          startIndex: 0,
          visibleIndex: 0,
          topSpaceHeight: 0,
          bottomSpaceHeight: 0
        },
        scrollYLoad: false,
        yFulldatas: [],
        tableBodyElem: null
      }
    };
  },

  methods: {
    execYload(datas) {
      const { states, initParentTreeData, getyFulldatas, getTableData } = this;
      const { scrollYRenderConfig } = this.table;
      const { scrollYStore, isTreeTable } = states;

      states.scrollYStore = Object.assign(scrollYStore, scrollYRenderConfig);
      if (isTreeTable) {
        initParentTreeData(datas);
      }
      states.yFulldatas = getyFulldatas(datas);
      getTableData();
    },

    getyFulldatas(datas, parent) {
      const { initParentFunc, formateChildFunc, rowKey } = this.table;
      const { childrenColumnName, treeData } = this.states;
      let arr = [];

      datas.forEach(item => {
        const id = item[rowKey];
        const hasChild =
          item[childrenColumnName] && item[childrenColumnName].length > 0;

        if (hasChild) {
          if (initParentFunc) initParentFunc(item, treeData);
        } else if (parent) {
          if (formateChildFunc) formateChildFunc(item, parent, treeData);
          this.initChildTreeData(item, parent);
        }

        arr.push(item);

        if (id && treeData[id] && treeData[id].expanded && hasChild) {
          arr = arr.concat(this.getyFulldatas(item[childrenColumnName], item));
        }
      });
      return arr;
    },

    setBodyElem(bodyElem) {
      this.states.tableBodyElem = bodyElem;
    },

    // 计算滚动渲染相关数据
    computeScrollLoad() {
      const { scrollYLoad, scrollYStore, tableBodyElem } = this.states;
      if (!scrollYLoad) return;
      // 计算 Y 逻辑
      const firstTrElem = tableBodyElem.querySelector("tbody>tr");
      if (firstTrElem) {
        scrollYStore.rowHeight = firstTrElem.clientHeight;
      }
      scrollYStore.visibleSize = Math.ceil(
        tableBodyElem.clientHeight / scrollYStore.rowHeight
      );

      this.updateScrollYSpace();
    },

    /**
     * 纵向 Y 滚动渲染事件处理
     */
    triggerScrollYEvent: debounce(20, function(evnt) {
      const scrollBodyElem = evnt.target;
      const scrollTop = scrollBodyElem.scrollTop;
      const { yFulldatas: tableFullData, scrollYStore } = this.states;
      const {
        startIndex,
        renderSize,
        offsetSize,
        visibleSize,
        rowHeight
      } = scrollYStore;
      const toVisibleIndex = Math.ceil(scrollTop / rowHeight);

      if (scrollYStore.visibleIndex !== toVisibleIndex) {
        let isReload;
        let preloadSize = 0;
        const isTop = scrollYStore.visibleIndex > toVisibleIndex;
        // 如果渲染数量不充足
        const isTooLow = renderSize < visibleSize * 3;
        // 除去可视条数剩余数量
        const residueSize = renderSize - visibleSize;
        if (isTop) {
          preloadSize =
            residueSize -
            (isTooLow
              ? Math.floor(residueSize / 2)
              : Math.floor(
                  renderSize > visibleSize * 6
                    ? visibleSize * 3
                    : visibleSize * 1.5
                ));
          isReload = toVisibleIndex - offsetSize <= startIndex;
        } else {
          preloadSize = isTooLow
            ? Math.floor(residueSize / 2)
            : Math.floor(
                renderSize > visibleSize * 6
                  ? visibleSize * 3
                  : visibleSize * 1.5
              );
          isReload =
            toVisibleIndex + visibleSize + offsetSize >=
            startIndex + renderSize;
        }
        if (isReload) {
          scrollYStore.visibleIndex = toVisibleIndex;
          const computSize = tableFullData.length - renderSize;
          if (computSize > 0) {
            scrollYStore.startIndex = Math.min(
              Math.max(toVisibleIndex - preloadSize, 0),
              computSize
            );
          } else {
            scrollYStore.startIndex = 0;
          }

          this.updateScrollYSpace();
          this.getTableData();
          this.$nextTick(() => {
            scrollBodyElem.scrollTop = scrollTop;
          });
        }
      }
    }),

    // 更新 Y 滚动上下剩余空间大小
    updateScrollYSpace() {
      const { scrollYStore, yFulldatas } = this.states;

      scrollYStore.topSpaceHeight = Math.max(
        scrollYStore.startIndex * scrollYStore.rowHeight,
        0
      );
      scrollYStore.bottomSpaceHeight = Math.max(
        (yFulldatas.length -
          (scrollYStore.startIndex + scrollYStore.renderSize)) *
          scrollYStore.rowHeight,
        0
      );
    },

    getTableData() {
      const { states } = this;
      const { scrollYStore, yFulldatas } = states;

      states.data = yFulldatas.slice(
        scrollYStore.startIndex,
        scrollYStore.startIndex + scrollYStore.renderSize
      );
    },

    uptateExpand_yFulldatas({ TreeNodeMap, row, realIndex, yFulldatas }) {
      const { formateChildFunc } = this.table;
      const { treeData } = this.states;

      TreeNodeMap.forEach(item => {
        if (formateChildFunc) formateChildFunc(item, row, treeData);
        this.initChildTreeData(item, row);
        realIndex++;
        yFulldatas.splice(realIndex, 0, item);
      });
    },

    updateShrink_yFulldatas({ TreeNodeMap, realIndex, yFulldatas }) {
      const { table, states } = this;
      const { rowKey } = table;
      const { treeData } = states;
      let realTreeDodeMapLength = TreeNodeMap.length;

      const isExpanded = function(item) {
        const id = item[rowKey];
        return id && treeData[id] && treeData[id].expanded === true;
      };
      const computedRealTreeDodeMapLength = function(treeMap) {
        treeMap.forEach(item => {
          const isValid =
            Array.isArray(item.children) &&
            item.children.length > 0 &&
            isExpanded(item);

          if (isValid) {
            computedRealTreeDodeMapLength(item.children);
            realTreeDodeMapLength += item.children.length;
          }
        });
      };

      computedRealTreeDodeMapLength(TreeNodeMap, realTreeDodeMapLength);
      yFulldatas.splice(realIndex + 1, realTreeDodeMapLength);
    },

    findDataIndex(data, row, rowKey) {
      let index;

      for (let i = 0; i < data.length; i++) {
        if (data[i][rowKey] === row[rowKey]) {
          index = i;
          break;
        }
      }

      return index;
    },

    uptateYfullData(row, isExpanded) {
      const {
        states,
        uptateExpand_yFulldatas,
        updateShrink_yFulldatas,
        findDataIndex
      } = this;
      const {
        data,
        scrollYLoad,
        isTreeTable,
        childrenColumnName,
        lazyTreeNodeMap,
        scrollYStore
      } = states;
      const { rowKey } = this.table;
      const parentId = getRowIdentity(row, rowKey);
      const TreeNodeMap = lazyTreeNodeMap[parentId] || row[childrenColumnName];

      if (!TreeNodeMap) return;

      const yFulldatas = isTreeTable && !scrollYLoad ? data : states.yFulldatas;
      let realIndex =
        scrollYStore.startIndex + findDataIndex(data, row, rowKey);
      const paramets = { TreeNodeMap, row, realIndex, yFulldatas };

      isExpanded
        ? uptateExpand_yFulldatas(paramets)
        : updateShrink_yFulldatas(paramets);

      if (scrollYLoad) {
        this.getTableData();
        this.$nextTick(() => {
          this.updateScrollYSpace();
        })
      }
    }
  }
};
