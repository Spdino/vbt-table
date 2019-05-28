import XEUtils from 'xe-utils'

export default {
  methods: {
    renderTable({ tableWidth, tableColumn }) {
      return (
        <table
          class="vxe-table--body"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style={{
            width: tableWidth === null ? tableWidth : `${tableWidth}px`
          }}
        >
          {this.renderColGroup(tableColumn)}
          <tbody>{this.renderRows(tableColumn)}</tbody>
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
          <div class="vxe-table--empty-block">
            <span classNmae="vxe-table--empty-text">
              {this.$table.$slots.empty || "暂无数据"}
            </span>
          </div>
        );
      }
    },

    renderColGroup(tableColumn) {
      return (
        <colgroup>
          {tableColumn.map((column, columnIndex) => (
            <col
              name={column.id}
              width={column.renderWidth}
              key={columnIndex}
            />
          ))}
        </colgroup>
      );
    },

    renderRows(tableColumn) {
      const { tableData, id } = this.$table;

      return this._l(tableData, (row, rowIndex) => (
        <tr class={["vxe-body--row", `row--${id}_${rowIndex}`]} key={rowIndex}>
          {this.renderColumns(tableColumn,row, rowIndex)}
        </tr>
      ));
    },

    renderColumns(tableColumn,row, rowIndex) {
      const { tableData } = this;
      const { showAllOverflow,border } = this.$table;

      return this._l(tableColumn, (column, columnIndex) => {
        const { columnKey, showOverflow,renderWidth } = column;
        let showEllipsis = (showOverflow || showAllOverflow) === "ellipsis";
        let showTitle = (showOverflow || showAllOverflow) === "title";
        let showTooltip =
          showOverflow === true ||
          showOverflow === "tooltip" ||
          showAllOverflow === true ||
          showAllOverflow === "tooltip";
          let hasEllipsis = showTitle || showTooltip || showEllipsis

        return (
          <th
            class={["vxe-body--column", column.id]}
            key={columnKey || columnIndex}
          >
            <div
              class={[
                "vxe-cell",
                {
                  "c--title": showTitle,
                  "c--tooltip": showTooltip,
                  "c--ellipsis": showEllipsis
                }
              ]}
              attrs={{
                title: showTitle ? XEUtils.get(row, column.property) : null
              }}
              style={ {
                width: hasEllipsis ? `${border ? renderWidth - 1 : renderWidth}px` : null
              }}
            >
              {column.renderCell({
                row: tableData[rowIndex],
                rowIndex,
                column,
                columnIndex
              })}
            </div>
          </th>
        );
      });
    }
  }
};
