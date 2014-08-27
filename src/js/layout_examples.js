define(['jquery', 'layout'], function ($, layout) {
   function init() {
      $('body').find('div').remove();

      var Panel = layout.Panel;
      var Tabbed = layout.Tabbed;

      /*
       * El sistema de layout esta compuesto por una serie de objetos 'Panel' que
       * se encargan de dibujar su contenido en la pantalla.
       *
       * Para comenzar, crearemos un panel que muestra un simple mensaje.
       * */
      
      var hello_msg = new Panel("hello msg");
 
      hello_msg.msg = 'hello world';
      hello_msg.render = function () {
         this._rendered_in = $(this.box);
         this._rendered_in.html(this.msg);
      };

      hello_msg.unlink = function () {
         if (this._rendered_in) {
            this._rendered_in.empty();
            this._rendered_in = null;
         }
      };

      /*
       * El metodo 'render' es el encargado de dibujar algo en la pantalla.
       * Cada panel puede renderizar cualquier cosa dentra del DIV 'box' que
       * representa 'el lienzo' donde dibujar.
       *
       * Asi como el metodo 'render' agrega elementos al DOM, el metodo 'unlink'
       * debe removerlos. Esto quiere decir sacarlos del DOM, no necesariamente 
       * borrarlos.
       * 
       * */

      /* --------- XXX Expected Result: Nada es mostrado ------------- */

      /* 
       * Aun asi, nuestro panel no se dibuja en la pantalla hasta que sea
       * insertado en el DOM de la aplicacion.
       *
       * Para esto tenemos quee attacharlo a algun objeto del DOM que exista.
       * */

      hello_msg.attach($('body'));     //XXX que ventaja da tener un Root?
      hello_msg.parent().render();

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
       *
       * */
      /*

      hello_msg.msg = hello_msg.msg + '<br />hello world!!!';
      hello_msg.refresh();
      return;
      */
      
      /* --------- XXX Expected Result: Un panel que contiene el nuevo mensaje 
       *
       *    H
       *
       * ------------- */

      /*
       * Refrescar un panel que no esta attachado no tiene efecto.
       * */
      var bye_bye_msg = new Panel("bye bye msg");
      bye_bye_msg.msg = 'Bye Bye Bye';
      bye_bye_msg.render = hello_msg.render;
      bye_bye_msg.unlink = hello_msg.unlink;

      // XXX bye_bye_msg.refresh();
      /* --------- XXX Expected Result: 
       *
       *    H
       *
       * ------------- */

      /*
       * Uno puede swappear paneles para cambiarlos de lugar
       *
       * */

      hello_msg.swap(bye_bye_msg);
      bye_bye_msg.parent().render();
      /* --------- XXX Expected Result: 
       *
       *    B
       *
       * ------------- */

      /*
       * La operacion 'swap' es simetrica, no importa quien ese el objeto al quien
       * se le envia el mensaje
       * */

      hello_msg.swap(bye_bye_msg);
      hello_msg.parent().render();
      /* --------- XXX Expected Result: 
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
      
      hello_msg.split(bye_bye_msg, 'left');
      hello_msg.parent().parent().render();

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

      var more_bye_msg = new Panel("more bye msg");
      more_bye_msg.msg = "More ... Bye!";
      more_bye_msg.render = hello_msg.render;
      more_bye_msg.unlink = hello_msg.unlink

      bye_bye_msg.split(more_bye_msg, 'bottom');
      hello_msg.parent().parent().render();

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

      var lorem_ipsum_msg = new Panel("lorem msg");
      lorem_ipsum_msg.msg = "Lorem ipsum";
      lorem_ipsum_msg.render = more_bye_msg.render;
      lorem_ipsum_msg.unlink = more_bye_msg.unlink;

      bye_bye_msg.parent().split(lorem_ipsum_msg, 'left');
      hello_msg.parent().parent().render();
      
      /* --------- XXX Expected Result: 
       *
       *      | B |
       *    L |---| H
       *      | M |
       *
       * ------------- */

      /*
       * No solo los paneles que estan attachados pueden splittearse, sino que
       * tambien los que no lo estan.
       * Por supuesto, al no estar attachados no se renderizan.
       */
      
      var foo_msg = new Panel("foo msg");
      foo_msg.msg = "foo";
      foo_msg.render = hello_msg.render;
      foo_msg.unlink = hello_msg.unlink;

      var bar_msg = new Panel("bar msg");
      bar_msg.msg = "bar";
      bar_msg.render = hello_msg.render;
      bar_msg.unlink = hello_msg.unlink;

      foo_msg.split(bar_msg, 'bottom');
      hello_msg.parent().parent().render();

      /* --------- XXX Expected Result: 
       *
       *      | B |
       *    L |---| H
       *      | M |
       *
       * ------------- */

      /* 
       * Cuidado, attachar un panel que ya tiene un padre no es posible.
       * Intentarlo deberia lanzar una exception
       * */

      /* TODO
      try {
         foo_msg.attach($('body'));
         throw new Error("TEST FAIL");
      }
      catch(e) {
         if(("" + e).indexOf("TEST FAIL") !== -1)
            throw e;
      }
      */

      /*
       * Para que nuestra nueva division Foo/Bar sea renderizada podemos attachar su padre
       * al DOM o podemos reemplazar algun panel que este en el DOM por el splitted.
       *
       * De una u otra forma, el padre de la division se linkea al DOM.
       * */

      foo_msg.parent().swap(lorem_ipsum_msg);
      hello_msg.parent().parent().render();
      
      /* --------- XXX Expected Result: 
       *
       *    F | B |
       *   ---|---| H
       *   Ba | M |
       *
       * ------------- */

      /* 
       * Ahora, el 'lorem_ipsum_msg' dejo de pertenecer al DOM.
       *
       * Podemos volver para atras aplicando la misma operacion de swappeo.
       * */

      foo_msg.parent().swap(lorem_ipsum_msg);
      hello_msg.parent().parent().render();
      
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
      lorem_ipsum_msg.parent().parent().render();
      
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

      hello_msg.split(foo_msg, 'top');
      lorem_ipsum_msg.split(bar_msg, 'right');
      lorem_ipsum_msg.parent().parent().parent().render();

      
      /* --------- XXX Expected Result: 
       *
       *    F | M |   |
       *   ---|---| L | Ba
       *    H | B |   |
       *
       * ------------- */

      var zaz_msg = new Panel("zaz msg");
      zaz_msg.msg = "zaz";
      zaz_msg.render = hello_msg.render;
      zaz_msg.unlink = hello_msg.unlink;

      foo_msg.split(zaz_msg, 'left');
      lorem_ipsum_msg.parent().parent().parent().render();

      
      /* --------- XXX Expected Result: 
       *
       *   Z|F| M |   |
       *   ---|---| L | Ba
       *    H | B |   |
       *
       * ------------- */

      /* TODO
       * Hasta ahora hemos siempre agregado nuevos paneles pero que pasa si
       * queremos agregar 2 veces el mismo panel?
       *
       * Esto hace que el panel se mueva de donde esta y se vaya a otro lugar
       * */

      //lorem_ipsum_msg.split(hello_msg, 'top');
      
      /* --------- XXX Expected Result: 
       *
       *    | | M | H |
       *   Z|F|---|---| Ba
       *    | | B | L |
       *
       * ------------- */

      //TODO
      //zaz_msg.parent().split(hello_msg, 'bottom');
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
      lorem_ipsum_msg.parent().parent().parent().render();
      
      /* --------- XXX Expected Result: 
       *
       *    F | M |   |
       *   ---|---| L | Ba
       *    H | B |   |
       *
       * ------------- */
      
      more_bye_msg.remove();
      lorem_ipsum_msg.parent().parent().parent().render();
      
      /* --------- XXX Expected Result: 
       *
       *    F |   |   |
       *   ---| B | L | Ba
       *    H |   |   |
       *
       * ------------- */

      bye_bye_msg.remove();
      lorem_ipsum_msg.parent().parent().parent().render();

      /* --------- XXX Expected Result: 
       *
       *    F |   |
       *   ---| L | Ba
       *    H |   |
       *
       * ------------- */

      hello_msg.parent().remove();
      lorem_ipsum_msg.parent().parent().render();


      /* --------- XXX Expected Result: 
       *
       *      |
       *    L | Ba
       *      |
       *
       * ------------- */

      bar_msg.remove();
      lorem_ipsum_msg.parent().render();

      /* --------- XXX Expected Result: 
       *
       *      
       *    L
       *     
       *
       * ------------- */

      //TODO implement the root's unlink
      lorem_ipsum_msg.parent().unlink = function () {};
      lorem_ipsum_msg.remove();

      /* --------- XXX Expected Result: 
       *
       *      
       *    
       *     
       *
       * ------------- */

      /*
       * Veamos otros ejemplos.
       * Al haber removido los paneles, ninguno quedo attachado asi que hay que
       * volver a repetir ese paso.
       *
       * */
      hello_msg.remove();
      hello_msg.attach($('body'));

      hello_msg.split(bye_bye_msg, 'right');
      bye_bye_msg.split(more_bye_msg, 'right');
      more_bye_msg.split(lorem_ipsum_msg, 'right');

      hello_msg.parent().parent().render();

      /* --------- XXX Expected Result: 
       *
       *    |   |   |
       *  H | B | M | L
       *    |   |   |
       *     
       *
       * ------------- */

      bye_bye_msg.remove();
      hello_msg.parent().parent().render();

      /* --------- XXX Expected Result: 
       *
       *    |   |
       *  H | M | L
       *    |   |
       *     
       *
       * ------------- */

      more_bye_msg.remove();
      lorem_ipsum_msg.remove();
      hello_msg.parent().render();



      /* --------- XXX Expected Result: 
       *
       *    
       *    H 
       *    
       *     
       *
       * ------------- */
      return;

      /*
       * En un mismo lugar pueden convivir varios paneles usando una vista basada
       * en tabs. A diferencia de un split, solo uno de los paneles es mostrado
       * y el resto esta en background.
       * */

      hello_msg.split(more_bye_msg, 'left');

      var tabs = new Tabbed();

      tabs.swap(hello_msg);
      tabs.add_child(hello_msg, 'intab');
      tabs.add_child(lorem_ipsum_msg, 'intab');

      /* --------- XXX Expected Result: 
       *
       *      
       *    [],H,L
       *     
       *
       * ------------- */

      /*
       * Por default, ninguna de la tabs muestra. Para ello, usar el metodo display
       * indicando el numero de tab a mostrar (indice zero-based, acepta negativos tambien)
       * */

      tabs.display(0);
      tabs.refresh();

      /* --------- XXX Expected Result: 
       *
       *      
       *    [H],L
       *     
       *
       * ------------- */

      tabs.add_child(bye_bye_msg, 'intab');
      
      /* --------- XXX Expected Result: 
       *
       *      
       *    [H],L,B
       *     
       *
       * ------------- */

      /*
       * Splittear un panel con tabs es igual a splittear un panel sin los tabs.
       * El contenido de un tab NO es splitteado (No hay por default un split dentro
       * de un tab)
       *
       * Esto es, splittear un panel dentro de un tab es igual a splittear al tab mismo.
       * */

      //tabs.split(more_bye_msg, 'left');
      
      /* --------- XXX Expected Result: 
       *
       *      |
       *    M | [H],L,B
       *      |
       *
       * ------------- */
      console.log("--------------------");
      //lorem_ipsum_msg.split(foo_msg, 'top');
      //lorem_ipsum_msg.refresh();
      
      /* --------- XXX Expected Result: 
       *
       *      | F
       *    M |---------- 
       *      | [H],L,B
       *
       * ------------- */

      //bye_bye_msg.split(bar_msg, 'right');
      
      /* --------- XXX Expected Result: 
       *
       *      | F
       *    M |----------------
       *      | [H],L,B  | Ba
       *
       * ------------- */

      //hello_msg.swap(more_bye_msg);
      
      /* --------- XXX Expected Result: 
       *
       *      | F
       *    H |----------------
       *      | [M],L,B  | Ba
       *
       * ------------- */

      more_bye_msg.split(foo_msg, 'top');
      //foo_msg.remove();
      console.log("------------------------");
      return;

      console.log("------------------------");
      //bar_msg.remove(); //TODO remove this
      var tabs2 = new Tabbed();

      tabs2.swap(hello_msg);
      tabs2.add_child(hello_msg, 'intab');
      tabs2.add_child(foo_msg, 'intab');

      tabs2.display(-1);
      tabs2.refresh();
      
      /* --------- XXX Expected Result: 
       *
       *          |          |
       *    H,[F] | [M],L,B  | Ba
       *          |          |
       *
       * ------------- */


      tabs.refresh();
      tabs2.refresh();
      return;
      /*setInterval(function () {
         tabs.refresh();
         tabs2.refresh();
      }, 5000);*/

      bar_msg.remove();
      more_bye_msg.refresh(); //TODO why?
      
      /* --------- XXX Expected Result: 
       *
       *          |          
       *    H,[F] | [M],L,B
       *          |     
       *
       * ------------- */

      bye_bye_msg.remove();

      /* --------- XXX Expected Result: 
       *
       *          |          
       *    H,[F] | [M],L
       *          |     
       *
       * ------------- */

      hello_msg.swap(more_bye_msg);

      /* --------- XXX Expected Result: 
       *
       *          |          
       *    M,[F] | [H],L
       *          |     
       *
       * ------------- */

      hello_msg.swap(lorem_ipsum_msg);

      /* --------- XXX Expected Result: 
       *
       *          |          
       *    M,[F] | [L],H
       *          |     
       *
       * ------------- */

      hello_msg.swap(foo_msg);

      /* --------- XXX Expected Result: 
       *
       *          |          
       *    M,[H] | [L],F
       *          |     
       *
       * ------------- */

      lorem_ipsum_msg.remove();

      /* --------- XXX Expected Result: 
       *
       *          |          
       *    M,[H] | [F]
       *          |     
       *
       * ------------- */

      foo_msg.remove();
      tabs.refresh();

      //TODO mostrar algo cuando no hay tabs
      /* --------- XXX Expected Result: 
       *
       *          |          
       *    M,[H] | []
       *          |     
       *
       * ------------- */

      tabs.add_child(lorem_ipsum_msg, 'intab');
      tabs.display(1);
      tabs.refresh();

      /* --------- XXX Expected Result: 
       *
       *          |          
       *    M,[H] | L,[]
       *          |     
       *
       * ------------- */

      tabs.display(0);
      tabs.refresh();

      /* --------- XXX Expected Result: 
       *
       *          |          
       *    M,[H] | [L]
       *          |     
       *
       * ------------- */

      tabs.add_child(foo_msg, 'intab');
      tabs.add_child(bar_msg, 'intab');
      tabs.display(2);
      tabs.refresh();

      /* --------- XXX Expected Result: 
       *
       *          |          
       *    M,[H] | L,F,[Ba]
       *          |     
       *
       * ------------- */

      bar_msg.remove();

      /* --------- XXX Expected Result: 
       *
       *          |          
       *    M,[H] | L,[F]
       *          |     
       *
       * ------------- */

      lorem_ipsum_msg.remove();

      /* --------- XXX Expected Result: 
       *
       *          |          
       *    M,[H] | [F]
       *          |     
       *
       * ------------- */

      var r = layout.as_tree([hello_msg, bye_bye_msg, more_bye_msg, lorem_ipsum_msg, foo_msg, bar_msg, zaz_msg]);
      r.toString();
      console.log("" + r.toString());
      return

   }

   return {init: init};
});
