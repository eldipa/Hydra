define(['d3'], function (d3) {
   var ProcessTable = (function () {
      function ProcessTable() {
      };

      ProcessTable.prototype.enable = function (container_to_attach) {
         if (this.table) {
            this.disable();
         }

         this.table = container_to_attach.append('table')
            .attr('class', 'table table-bordered');
         
         var header = this.table.append('thead').append('tr');
         header.selectAll('th').data(['Pid', 'Cmd', 'Status']).enter()
            .append('th')
            .text(function (d) { return d; });

         this.table.append('tbody');
      };

      ProcessTable.prototype.disable = function () {
         if (this.table) {
            this.table.remove();
            this.table = null;
         }
      };

      ProcessTable.prototype.update_table = function (processes, relations) {
         var rows = this.table.select('tbody').selectAll('tr')
            .data(processes, function (p) { return p.pid; });

         rows.enter()
            .append('tr');

         rows.exit()
            .remove();

         var cells = rows.selectAll('td').data(function (p) { return [p.pid, p.name, p.status]; });

         cells.enter()
            .append('td')
            .text(function (attr) { return attr; });

      };

      ProcessTable.prototype.update = function (processes, relations) {
         this.update_table(processes, relations);
      };

      return ProcessTable;

   })();

   return {ProcessTable: ProcessTable};
});
