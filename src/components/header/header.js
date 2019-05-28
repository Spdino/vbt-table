import renderMethods from "./header-render";

export default {
  name: "vbtTableHeader",

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

  render() {
    const { fixedType } = this;

    return (
      <div
        class={[
          [
            "vxe-table--header-wrapper",
            fixedType ? `fixed--${fixedType}-wrapper` : "body--wrapper"
          ]
        ]}
      >
        {this.renderTable()}
        {this.renderRepair()}
      </div>
    );
  }
};
