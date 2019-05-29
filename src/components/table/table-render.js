export default {
  methods:{
    renderFixed(fixedType) {
      let {
        tableData,
        tableColumn,
        visibleColumn,
        headerHeight,
        showHeader,
        tableHeight,
        scrollYWidth,
        scrollXHeight,
        scrollRightToLeft,
        scrollLeftToRight,
        columnStore
      } = this;
      let isRightFixed = fixedType === "right";
      let fixedColumn = columnStore[`${fixedType}List`];
      let style = {
        height: `${tableHeight +headerHeight -scrollXHeight }px`,
        width: `${fixedColumn.reduce(
          (previous, column) => previous + column.renderWidth,
          isRightFixed ? scrollYWidth : 0
        )}px`
      };
      
      return (
        <div
          class={[`vbt-table--fixed-${fixedType}-wrapper`,{
              "scrolling--middle": isRightFixed
                ? scrollRightToLeft
                : scrollLeftToRight
            }]}
          style={style}
          ref="fixedTable"
        >
          {showHeader ? (
            <table-header
              {...{
                props: {
                  fixedType,
                  tableData,
                  tableColumn,
                  visibleColumn,
                  fixedColumn
                }
              }}
              ref={`${fixedType}Body`}
            />
          ) : null}
          <table-body
            {...{
              props: {
                fixedType,
                tableData,
                tableColumn,
                visibleColumn,
                fixedColumn
              }
            }}
            style={{
              top: `${headerHeight}px`
            }}
            ref={`${fixedType}Body`}
          />
        </div>
      );
    }
  }
}