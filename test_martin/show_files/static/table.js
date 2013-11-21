function table(table_id, matrix_payload) {
   body = d3.select(table_id).attr('class', 'table table-bordered').select('tbody')
   rows = body.selectAll('tr').data(matrix_payload, function (d) { return d; });
   
   rows.attr('class', '');
   rows.enter().append('tr').attr('class', 'success');
   rows.exit().remove();
   
   cells = rows.selectAll('td').data(function (d) { return d; });
   cells.enter().append('td');

   cells.html(function (d) { return d; });
   cells.exit().remove();
}
