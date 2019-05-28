export default {
  methods: {
    renderRepair() {
      const { tableWidth } = this.$table;

      return (
        <div
          class="vxe-table--repair"
          style={{
            width: tableWidth === null ? tableWidth : `${tableWidth}px`
          }}
        />
      );
    },

    renderTable() {
      const { tableWidth, scrollYWidth } = this.$table;

      return (
        <table
          cellspacing="0"
          cellpadding="0"
          border="0"
          style={{
            width:
              tableWidth === null
                ? tableWidth
                : `${tableWidth + scrollYWidth}px`
          }}
        >
          {this.renderColGroup()}
          {this.renderThead()}
        </table>
      );
    },

    renderColGroup() {
      const { tableColumn } = this;
      const { scrollYWidth } = this.$table;

      return (
        <colgroup>
          {tableColumn
            .map((column, columnIndex) => (
              <col
                name={column.id}
                width={column.renderWidth}
                key={columnIndex}
              />
            ))
            .concat(<col width={scrollYWidth} />)}
        </colgroup>
      );
    },

    renderThead() {
      return (
        <thead>
          <tr class="vxe-header--row">{this.renderThs()}</tr>
        </thead>
      );
    },

    renderThs() {
      const { tableColumn, fixedType } = this;
      const { border, scrollYWidth } = this.$table;

      {
        return tableColumn
          .map((column, columnIndex) => {
            let {
              columnKey,
              showHeaderOverflow,
              headerAlign,
              renderWidth
            } = column;
            let fixedHiddenColumn = fixedType && column.fixed !== fixedType;
            let showTitle = showHeaderOverflow === "title";
            // let showTooltip = showHeaderOverflow === true || showHeaderOverflow === 'tooltip' || showHeaderAllOverflow === true || showHeaderAllOverflow === 'tooltip'

            return (
              <th
                class={[
                  "vxe-header--column",
                  column.id,
                  {
                    [`col--${headerAlign}`]: headerAlign,
                    "fixed--hidden": fixedHiddenColumn,
                    "filter--active": column.filters.some(item => item.checked)
                  }
                ]}
                key={columnKey || columnIndex}
              >
                <div
                  class="vxe-cell"
                  title={showTitle ? column.label : null}
                  style={{
                    width: showTitle
                      ? `${border ? renderWidth - 1 : renderWidth}px`
                      : null
                  }}
                >
                  {column.label}
                </div>
              </th>
            );
          })
          .concat(
            scrollYWidth ? (
              <th class="col--gutter" style={{ width: `${scrollYWidth}px` }} />
            ) : (
              []
            )
          );
      }
    }
  }
};
