define(["d3"], (d3) ->
   class ProcessTable
      enable: (container_to_attach) ->
         if @table?
            @disable()

         @table = container_to_attach.append('table')
            .attr('class', 'table table-bordered')

         header = @table.append('thead').append('tr')
         header.selectAll('th').data(['Pid', 'Cmd', 'Status']).enter()
            .append('th')
            .text((d) -> d)


         @table.append('tbody')

      disable: () ->
         if @table?
            @table.remove()
            @table = null


      update_table: (processes, relations) ->
         rows = @table.select('tbody').selectAll('tr').data(processes, (p) -> p.pid)

         rows.enter()
            .append('tr')

         rows.exit()
            .remove()
         
         cells = rows.selectAll('td').data((p) -> [p.pid, p.name, p.status])

         cells.enter()
            .append('td')
            .text((attr) -> attr)

      update: (processes, relations) ->
         @update_table(processes, relations)

   return {'ProcessTable': ProcessTable}
)


