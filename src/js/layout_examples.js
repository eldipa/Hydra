define(['jquery', 'layout'], function ($, layout) {
   function init() {
      $('body').find('div').remove();

      var Root = layout.Root;
      var Panel = layout.Panel;

      /*
       * El sistema de layout esta compuesto por una serie de objetos 'Panel' que
       * se encargan de dibujar su contenido en la pantalla.
       *
       * Para comenzar, crearemos un panel que muestra un simple mensaje.
       * */
      
      var hello_msg = new Panel();
 
      hello_msg.msg = 'hello world';     
      hello_msg.render = function () {
         $(this.box).html(this.msg);
      };

      /* --------- XXX Expected Result: Nada es mostrado ------------- */

      /* 
       * Como se puede ver, el unico requerimiento es que el panel defina un
       * metodo llamado 'render' para que renderize en el DOM.
       * 
       * La property 'box' contiene un objeto que representa un objeto DIV
       * en el DOM donde se puede renderizar.
       *
       * Aun asi, nuestro panel no se dibuja en la pantalla hasta que sea
       * insertado en el DOM de la aplicacion.
       *
       * Para esto crearemos un objeto Root que se attachara al 'body' del DOM.
       * */

      var root = new Root($('body'));

      /* Ahora solo nos falta insertar nuestro panel en el root. */

      root.push(hello_msg);

      /* --------- XXX Expected Result: Un panel que contiene el mensaje
       *
       *    H
       *
       * ------------- */

      /* Listo.
       *
       * Si queremos, podemos cambiar la funcion render para cambiar el mensaje
       * (podriamos cambiar una property u otra cosa para cambiar el mensaje, 
       * no es necesario cambiar todo el render).
       *
       * Para que el cambio surja efecto, debemos refrescar el panel.
       *
       * */

      hello_msg.msg = hello_msg.msg + '<br />hello world!!!';
      hello_msg.refresh();
      
      /* --------- XXX Expected Result: Un panel que contiene el nuevo mensaje 
       *
       *    H
       *
       * ------------- */

      /* Con solo un panel, no hay mucha diferencia entre esto y simplemente
       * renderizar en el DOM.
       *
       * Todo panel puede dividirse en 2, ya sea horizontal o verticalmente
       * agregando otro panel mas a la escena.
       * */

      var bye_bye_msg = new Panel();
      bye_bye_msg.msg = 'Bye Bye Bye';
      bye_bye_msg.render = hello_msg.render;

      hello_msg.split(bye_bye_msg, 'left');

      /* --------- XXX Expected Result: Un panel que contiene 2 subpanels,
       * el de la izquierda (left) tiene el mensaje bye-bye mientras
       * que el de la derecha tiene el mensaje 'hello world'. 
       *
       *    B | H
       *
       * ------------- */

      /* No hay limite en la cantidad de divisiones que se pueden hacer.
       * Cambiemos los mensajes de los panels actuales y creemos otro panel
       * para verlo.
       * 
       * */

      bye_bye_msg.msg = bye_bye_msg.msg + '<br />Bye Bye';
      hello_msg.msg = hello_msg.msg + '<br />!!!';

      var more_bye_msg = new Panel();
      more_bye_msg.msg = "More ... Bye!";
      more_bye_msg.render = hello_msg.render;

      bye_bye_msg.split(more_bye_msg, 'bottom');

      /* --------- XXX Expected Result: Un panel que contiene 2 subpanels,
       * el de la izquierda (left) tiene a su vez 2 subpanels, el de arriba
       * dice tiene el mensaje actualizado de 'bye-bye' mientras que el de
       * abajo tiene el nuevo mensaje 'bye!'.  
       *
       *
       *    B |
       *  ----| H
       *    M |
       *
       * ------------- */

      /*
       * Si quisieramos agregar un panel a la izquierda de 'ambos' paneles que
       * tienen el mensaje 'bye', no podemos hacer un split a solo uno de ellos.
       * Lo que hay que dividir es a su padre.
       * */

      if(bye_bye_msg.parent() !== more_bye_msg.parent())
         throw new Error("Fail!");

      var lorem_ipsum_msg = new Panel();
      lorem_ipsum_msg.msg = "Lorem ipsum";
      lorem_ipsum_msg.render = more_bye_msg.render;

      bye_bye_msg.parent().split(lorem_ipsum_msg, 'left');
      
      /* --------- XXX Expected Result: 
       *
       *      | B |
       *    L |---| H
       *      | M |
       *
       * ------------- */

      /* 
       * Todos los paneles pueden moverse de un lugar a otro, intercambiando 
       * lugares.
       * */

      lorem_ipsum_msg.swap(hello_msg);
      bye_bye_msg.swap(more_bye_msg);
      
      /* --------- XXX Expected Result: 
       *
       *      | M |
       *    H |---| L
       *      | B |
       *
       * ------------- */

      /*
       * Dado que un swappeo cambia varias relaciones padre-hijo, veamos que
       * sucede si ahora seguimos spliteando a los paneles.
       * */

      var foo_msg = new Panel();
      foo_msg.msg = "foo";
      foo_msg.render = hello_msg.render;

      var bar_msg = new Panel();
      bar_msg.msg = "bar";
      bar_msg.render = hello_msg.render;

      hello_msg.split(foo_msg, 'top');
      lorem_ipsum_msg.split(bar_msg, 'right');

      
      /* --------- XXX Expected Result: 
       *
       *    F | M |   |
       *   ---|---| L | Ba
       *    H | B |   |
       *
       * ------------- */

      var zaz_msg = new Panel();
      zaz_msg.msg = "zaz";
      zaz_msg.render = hello_msg.render;

      foo_msg.split(zaz_msg, 'left');

      
      /* --------- XXX Expected Result: 
       *
       *   Z|F| M |   |
       *   ---|---| L | Ba
       *    H | B |   |
       *
       * ------------- */

      /*
       * Hasta ahora hemos siempre agregado nuevos paneles pero que pasa si
       * queremos agregar 2 veces el mismo panel?
       *
       * Esto hace que el panel se mueva de donde esta y se vaya a otro lugar
       * */

      lorem_ipsum_msg.split(hello_msg, 'top');
      
      /* --------- XXX Expected Result: 
       *
       *    | | M | H |
       *   Z|F|---|---| Ba
       *    | | B | L |
       *
       * ------------- */

      zaz_msg.parent().split(hello_msg, 'bottom');
      /* --------- XXX Expected Result: 
       *
       *   Z|F| M |   |
       *   ---|---| L | Ba
       *    H | B |   |
       *
       * ------------- */


      /*
       * Asi como podemos agregar paneles podemos removerlos.
       * Esto no quiere decir que el panel removido es destruido, sino 
       * que tan solo es quitado del DOM. 
       * Si se tiene una referencia al panel, este seguira vivo.
       * Sino, sera removido por la VM de Javascript (garbage).
       * */

      zaz_msg.remove();
      more_bye_msg.remove();
      bye_bye_msg.remove();

      /* --------- XXX Expected Result: 
       *
       *    F |   |
       *   ---| L | Ba
       *    H |   |
       *
       * ------------- */

      hello_msg.parent().remove();


      /* --------- XXX Expected Result: 
       *
       *      |
       *    L | Ba
       *      |
       *
       * ------------- */

      bar_msg.remove();

      /* --------- XXX Expected Result: 
       *
       *      
       *    L
       *     
       *
       * ------------- */

      lorem_ipsum_msg.remove();
      root.push(hello_msg);

      /* --------- XXX Expected Result: 
       *
       *      
       *    H
       *     
       *
       * ------------- */

      return;
   }

   return {init: function () {}}; //init};
});
