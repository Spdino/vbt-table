import { debounce } from 'throttle-debounce'
import { getRowIdentity } from '../util'

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
        scrollYLoad: true,
        yFulldatas: [],
        tableBodyElem: null
      }
    }
  },

  methods: {
    execYload(datas) {
      this.states.yFulldatas = datas

      this.getTableData(true)
    },

    setBodyElem(bodyElem) {
      this.states.tableBodyElem = bodyElem
    },

    // 计算滚动渲染相关数据
    computeScrollLoad() {
      const { scrollYLoad, scrollYStore, tableBodyElem } = this.states

      // 计算 Y 逻辑
      if (scrollYLoad) {
        if (scrollYStore.rowHeight) return

        const firstTrElem = tableBodyElem.querySelector('tbody>tr')
        if (firstTrElem) {
          scrollYStore.rowHeight = firstTrElem.clientHeight
        }
        scrollYStore.visibleSize =
          Math.ceil(tableBodyElem.clientHeight / scrollYStore.rowHeight)

          this.updateScrollYSpace()
      }
    },

    /**
     * 纵向 Y 滚动渲染事件处理
     */
    triggerScrollYEvent: debounce(20, function(evnt) {
      const { yFulldatas: tableFullData, scrollYStore } = this.states
      const { startIndex, renderSize, offsetSize, visibleSize, rowHeight } = scrollYStore
      const scrollBodyElem = evnt.target
      const scrollTop = scrollBodyElem.scrollTop
      const toVisibleIndex = Math.ceil(scrollTop / rowHeight)

      if (scrollYStore.visibleIndex !== toVisibleIndex) {
        let isReload
        let preloadSize = 0
        const isTop = scrollYStore.visibleIndex > toVisibleIndex
        // 如果渲染数量不充足
        const isTooLow = renderSize < visibleSize * 3
        // 除去可视条数剩余数量
        const residueSize = renderSize - visibleSize
        if (isTop) {
          preloadSize = residueSize - (isTooLow ? Math.floor(residueSize / 2) : Math.floor(renderSize > visibleSize * 6 ? visibleSize * 3 : visibleSize * 1.5))
          isReload = toVisibleIndex - offsetSize <= startIndex
        } else {
          preloadSize = isTooLow ? Math.floor(residueSize / 2) : Math.floor(renderSize > visibleSize * 6 ? visibleSize * 3 : visibleSize * 1.5)
          isReload = toVisibleIndex + visibleSize + offsetSize >= startIndex + renderSize
        }
        if (isReload) {
          scrollYStore.visibleIndex = toVisibleIndex
          const computSize = tableFullData.length - renderSize
          if (computSize > 0) {
            scrollYStore.startIndex = Math.min(Math.max(toVisibleIndex - preloadSize, 0), computSize)
          } else {
            scrollYStore.startIndex = 0
          }

          this.updateScrollYSpace()
          this.getTableData()
          this.$nextTick(() => {
            scrollBodyElem.scrollTop = scrollTop
          })
        }
      }
    }),

    // 更新 Y 滚动上下剩余空间大小
    updateScrollYSpace() {
      const { scrollYStore, yFulldatas: fullData } = this.states

      scrollYStore.topSpaceHeight = Math.max(
        scrollYStore.startIndex * scrollYStore.rowHeight,
        0
      )
      scrollYStore.bottomSpaceHeight = Math.max(
        (fullData.length -
            (scrollYStore.startIndex + scrollYStore.renderSize)) *
            scrollYStore.rowHeight,
        0
      )
    },

    getTableData(isUpdate) {
      const { scrollYStore } = this.states
      let yFulldatas = this.states.yFulldatas
      const scrollYLoad = yFulldatas.length > scrollYStore.renderSize

      let datas
      
      if (scrollYLoad) {
        this.updateScrollYSpace()
        this.states.scrollYLoad = scrollYLoad
        if (isUpdate) {
          yFulldatas = this.initParent(yFulldatas)
        }
        datas = yFulldatas.slice(
          scrollYStore.startIndex,
          scrollYStore.startIndex + scrollYStore.renderSize
        )
      } else {
        datas = yFulldatas
      }

      

      this.states.data = datas
    },

    uptateYfullData(row, isExpanded) {
      const { data, yFulldatas, childrenColumnName,lazyTreeNodeMap, scrollYStore, treeData } = this.states
      const { formateChildFunc, rowKey } = this.table
      const parentId = getRowIdentity(row, rowKey)
      const TreeNodeMap = lazyTreeNodeMap[parentId] || row[childrenColumnName]
      let index

      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        if (item[rowKey] === row[rowKey]) {
          index = i
          break
        }
      }
      if (TreeNodeMap) {
        let realIndex = scrollYStore.startIndex + index
        if (isExpanded) {
          TreeNodeMap.forEach(item => {
            const id = item[rowKey]
            treeData[id] = {
              parent: row,
              level: treeData[parentId].level + 1,
              expanded: false
            }
            if (formateChildFunc) formateChildFunc(item, row)

            realIndex++
            yFulldatas.splice(realIndex, 0, item)
          })
        } else {
          yFulldatas.splice(realIndex + 1, TreeNodeMap.length)
        }

        this.getTableData()
      }
    }
  }
}

