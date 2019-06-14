/**
 * 同步滚动条
 * scroll 方式：可以使固定列与内容保持一致的滚动效果，处理相对麻烦
 * mousewheel 方式：对于同步滚动效果就略差了，左右滚动，内容跟随即可
 */
let scrollProcessTimeout
let updateLeftScrollingTimeput
function syncBodyScroll(scrollTop, elem1, elem2) {
  if (elem1 || elem2) {
    if (elem1) {
      elem1.onscroll = null
      elem1.scrollTop = scrollTop
    }
    if (elem2) {
      elem2.onscroll = null
      elem2.scrollTop = scrollTop
    }
    clearTimeout(scrollProcessTimeout)
    scrollProcessTimeout = setTimeout(function() {
      if (elem1) {
        elem1.onscroll = elem1._onscroll
      }
      if (elem2) {
        elem2.onscroll = elem2._onscroll
      }
    }, 100)
  }
}

export default {
  data() {
    return {
      scrollPosition: 'left'
    }
  },

  mounted() {
    this.$el.onscroll = this.scrollEvent
    this.$el._onscroll = this.scrollEvent
  },

  methods: {
    renderEmpty() {
      const { data = [], fixed, bodyWidth, emptyText } = this
      if (!fixed && (!data || data.length === 0)) {
        return (
          <div
            class='el-table__empty-block'
            ref='emptyBlock'
            style={{
              width: bodyWidth
            }}>
            <span class='el-table__empty-text'>
              { emptyText || this.table.t('el.table.emptyText') }
            </span>
          </div>
        )
      }
    },

    renderAppendSlot() {
      const { fixed, layout } = this
      if (this.$slots.append) {
        if (fixed && fixed === 'left') {
          return (
            <div class='el-table__append-gutter'
              style={{
                height: layout.appendHeight + 'px'
              }}></div>
          )
        } else {
          return (
            <div class='el-table__append-wrapper'
              ref='appendWrapper'>
              {this.$scopedSlots.append}
            </div>
          )
        }
      }
    },

    updateScrollPosition() {
      const { $parent: $table } = this
      const { bodyWrapper } = $table.$refs
      const { scrollLeft, offsetWidth, scrollWidth } = bodyWrapper.$el
      const maxScrollLeftPosition = scrollWidth - offsetWidth - 1

      if (scrollLeft >= maxScrollLeftPosition) {
        this.scrollPosition = 'right'
      } else if (scrollLeft === 0) {
        this.scrollPosition = 'left'
      } else {
        this.scrollPosition = 'middle'
      }
    },

    /**
     * 滚动处理
     * 如果存在列固定左侧，同步更新滚动状态
     * 如果存在列固定右侧，同步更新滚动状态
     */
    scrollEvent(evnt) {
      const { $parent: $table, fixed } = this
      const { headerWrapper, bodyWrapper, fixedBodyWrapper, rightFixedBodyWrapper } = $table.$refs
      const bodyElem = bodyWrapper.$el
      const leftElem = fixedBodyWrapper ? fixedBodyWrapper.$el : null
      const rightElem = rightFixedBodyWrapper ? rightFixedBodyWrapper.$el : null
      let scrollTop = bodyElem.scrollTop

      if (leftElem && fixed === 'left') {
        scrollTop = leftElem.scrollTop
        syncBodyScroll(scrollTop, bodyElem, rightElem)
      } else if (rightElem && fixed === 'right') {
        scrollTop = rightElem.scrollTop
        syncBodyScroll(scrollTop, bodyElem, leftElem)
      } else {
        if (headerWrapper) {
          headerWrapper.scrollLeft = bodyElem.scrollLeft
        }
        if (leftElem || rightElem) {
          clearTimeout(updateLeftScrollingTimeput)
          updateLeftScrollingTimeput = setTimeout(this.updateScrollPosition, 20)
          syncBodyScroll(scrollTop, leftElem, rightElem)
        }
      }
      if (this.store.states.scrollYLoad) {
        this.store.triggerScrollYEvent(evnt)
      }
    }
  }
}

