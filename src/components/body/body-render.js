import XEUtils from "xe-utils";

export default {
  methods: {
    renderTable({ tableWidth, tableColumn }) {
      const { tableData } = this.$table;

      return (
        <table
          class="vbt-table--body"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style={{
            width: tableWidth === null ? tableWidth : `${tableWidth}px`
          }}
        >
          <colgroup>
            {tableColumn.map((column, columnIndex) => (
              <col
                name={column.id}
                width={column.renderWidth}
                key={columnIndex}
              />
            ))}
          </colgroup>
          <tbody>
            {this.renderRows({ rowLevel: 0, tableData, tableColumn })}
          </tbody>
          {this.renderEmpty()}
        </table>
      );
    },

    renderEmpty() {
      const { tableData, loading } = this;

      if (!loading && tableData.length > 0) {
        return null;
      } else {
        return (
          <div class="vbt-table--empty-block">
            <span classNmae="vbt-table--empty-text">
              {this.$table.$slots.empty || "暂无数据"}
            </span>
          </div>
        );
      }
    },

    renderRows({ rowLevel, tableData, tableColumn }) {
      const {
        highlightHoverRow,
        columnStore,
        treeConfig,
        treeExpandeds,
        selectRow,
        hoverRow,
        rowKey,
        id,
        overflowX
      } = this.$table;
      let { leftList, rightList } = columnStore;
      let rows = [];
      const self = this;

      tableData.forEach((row, rowIndex) => {
        // 优化事件绑定
        let on = null;
        if (
          highlightHoverRow &&
          (leftList.length || rightList.length) &&
          overflowX
        ) {
          on = {
            mouseover(evnt) {
              if (row !== hoverRow) {
                self.$table.triggerHoverEvent(evnt, { row, rowIndex });
              }
            }
          };
        }
        rows.push(
          <tr
            class={[
              "vbt-body--row",
              `row--${id}_${rowIndex}`,
              {
                [`row--level-${rowLevel}`]: treeConfig,
                "row--selected": row === selectRow,
                "row--hover": row === hoverRow
              }
            ]}
            key={
              rowKey || treeConfig
                ? XEUtils.get(row, rowKey || treeConfig.key)
                : rowIndex
            }
            on={on}
          >
            {this.renderColumns({ tableColumn, row, rowIndex })}
          </tr>
        );
        if (treeConfig && treeExpandeds.length) {
          // 如果是树形表格
          if (treeExpandeds.indexOf(row) > -1) {
            rows.push.apply(
              rows,
              this.renderRows({
                rowLevel: rowLevel + 1,
                tableData: row[treeConfig.children],
                tableColumn
              })
            );
          }
        }
      });

      return rows;
    },

    renderColumns({ tableColumn, rowLevel, row, rowIndex }) {
      const {
        showAllOverflow,
        border,
        scrollYLoad,
        highlightCurrentRow,
        treeConfig,
        fixedType
      } = this.$table;

      return this._l(tableColumn, (column, columnIndex) => {
        const { columnKey, showOverflow, renderWidth } = column;
        let showEllipsis = (showOverflow || showAllOverflow) === "ellipsis";
        let showTitle = (showOverflow || showAllOverflow) === "title";
        let showTooltip =
          showOverflow === true ||
          showOverflow === "tooltip" ||
          showAllOverflow === true ||
          showAllOverflow === "tooltip";
        let hasEllipsis = showTitle || showTooltip || showEllipsis;
        let tdOns = {};
        let fixedHiddenColumn = fixedType
          ? column.fixed !== fixedType
          : column.fixed;

        // 滚动的渲染不支持动态行高
        if (scrollYLoad && !hasEllipsis) {
          showEllipsis = hasEllipsis = true;
        }
        // 优化事件绑定
        if (showTooltip) {
          tdOns.mouseover = evnt => {
            this.$table.triggerTooltipEvent(evnt, { row, column });
          };
          tdOns.mouseout = this.$table.clostTooltip;
        }
        if (
          highlightCurrentRow ||
          (treeConfig &&
            (treeConfig.trigger === "row" ||
              (column.treeNode && treeConfig.trigger === "cell")))
        ) {
          tdOns.click = evnt => {
            this.$table.triggerCellClickEvent(evnt, {
              row,
              rowIndex,
              column,
              columnIndex,
              fixed: fixedType,
              level: rowLevel,
              cell: evnt.currentTarget
            });
          };
        }

        return (
          <td
            class={["vbt-body--column", column.id]}
            key={columnKey || columnIndex}
            on={tdOns}
            style={{height:'41px'}}
          >
            <div
              class={[
                "vbt-cell",
                {
                  "c--title": showTitle,
                  "c--tooltip": showTooltip,
                  "c--ellipsis": showEllipsis
                }
              ]}
              attrs={{
                title: showTitle ? XEUtils.get(row, column.property) : null
              }}
              style={{
                width: hasEllipsis
                  ? `${border ? renderWidth - 1 : renderWidth}px`
                  : null
              }}
            >
              {column.renderCell({
                row,
                rowIndex,
                column,
                columnIndex,
                fixed: fixedType,
                level: rowLevel,
                isHidden: fixedHiddenColumn
              })}
            </div>
          </td>
        );
      });
    }
  }
};
