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
       * Para esto tenemos quee attacharlo a algun objeto del DOM que exista.
       * */

      hello_msg.attach($('body'));

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

      /*
       * Refrescar un panel que no esta attachado no tiene efecto.
       * */
      var bye_bye_msg = new Panel("bye bye msg");
      bye_bye_msg.msg = 'Bye Bye Bye';
      bye_bye_msg.render = hello_msg.render;

      bye_bye_msg.refresh();
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

      var lorem_ipsum_msg = new Panel("lorem msg");
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
       * No solo los paneles que estan attachados pueden splittearse, sino que
       * tambien los que no lo estan.
       * Por supuesto, al no estar attachados no se renderizan.
       */
      
      var foo_msg = new Panel("foo msg");
      foo_msg.msg = "foo";
      foo_msg.render = hello_msg.render;

      var bar_msg = new Panel("bar msg");
      bar_msg.msg = "bar";
      bar_msg.render = hello_msg.render;

      foo_msg.split(bar_msg, 'bottom');

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

      try {
         foo_msg.attach($('body'));
         throw new Error("TEST FAIL");
      }
      catch(e) {
         if(("" + e).indexOf("TEST FAIL") !== -1)
            throw e;
      }

      /*
       * Para que nuestra nueva division Foo/Bar sea renderizada podemos attachar su padre
       * al DOM o podemos reemplazar algun panel que este en el DOM por el splitted.
       *
       * De una u otra forma, el padre de la division se linkea al DOM.
       * */

      foo_msg.parent().swap(lorem_ipsum_msg);
      
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

      hello_msg.split(foo_msg, 'top');
      lorem_ipsum_msg.split(bar_msg, 'right');

      
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

      foo_msg.split(zaz_msg, 'left');

      
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
      
      /* --------- XXX Expected Result: 
       *
       *    F | M |   |
       *   ---|---| L | Ba
       *    H | B |   |
       *
       * ------------- */
      
      more_bye_msg.remove();
      
      /* --------- XXX Expected Result: 
       *
       *    F |   |   |
       *   ---| B | L | Ba
       *    H |   |   |
       *
       * ------------- */

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


      /* --------- XXX Expected Result: 
       *
       *    |   |   |
       *  H | B | M | L
       *    |   |   |
       *     
       *
       * ------------- */

      bye_bye_msg.remove();

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


      /* --------- XXX Expected Result: 
       *
       *    
       *    H 
       *    
       *     
       *
       * ------------- */

      /*
       * En un mismo lugar pueden convivir varios paneles usando una vista basada
       * en tabs. A diferencia de un split, solo uno de los paneles es mostrado
       * y el resto esta en background.
       * */

      var tabs = new Tabbed();

      tabs.swap(hello_msg);
      tabs.add_child(hello_msg, 'intab');
      tabs.add_child(lorem_ipsum_msg, 'intab');

      tabs.refresh();

      //hello_msg.push(lorem_ipsum_msg);
      //hello_msg.refresh();

      /* --------- XXX Expected Result: 
       *
       *      
       *    H/(L)
       *     
       *
       * ------------- */

      tabs.add_child(bye_bye_msg, 'intab');
      tabs.refresh();

      //hello_msg.push(bye_bye_msg);
      //hello_msg.refresh();
      
      /* --------- XXX Expected Result: 
       *
       *      
       *    H/(L,B)
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

      tabs.split(more_bye_msg, 'left');
      //hello_msg.split(more_bye_msg, 'left');
      //hello_msg.refresh();
      
      /* --------- XXX Expected Result: 
       *
       *      |
       *    M | H/(L,B)
       *      |
       *
       * ------------- */

      lorem_ipsum_msg.split(foo_msg, 'top');
      lorem_ipsum_msg.refresh();
      
      /* --------- XXX Expected Result: 
       *
       *      | F
       *    M |------- 
       *      | H/(L,B)
       *
       * ------------- */

      bye_bye_msg.split(bar_msg, 'right');
      bye_bye_msg.refresh();

      
      /* --------- XXX Expected Result: 
       *
       *      | F
       *    M |----------------
       *      | H/(L,B)  | Ba
       *
       * ------------- */

      hello_msg.swap(more_bye_msg);
      more_bye_msg.refresh();

      
      /* --------- XXX Expected Result: 
       *
       *      | F
       *    H |----------------
       *      | M/(L,B)  | Ba
       *
       * ------------- */

      foo_msg.remove();

      var tabs2 = new Tabbed();

      tabs2.swap(hello_msg);
      tabs2.add_child(hello_msg, 'intab');
      tabs2.add_child(foo_msg, 'intab');

      //hello_msg.push(foo_msg);

      hello_msg.refresh();
      
      /* --------- XXX Expected Result: 
       *
       *          |          |
       *    H/(F) | M/(L,B)  | Ba
       *          |          |
       *
       * ------------- */

      bar_msg.remove();
      
      /* --------- XXX Expected Result: 
       *
       *          |          
       *    H/(F) | M/(L,B) 
       *          |     
       *
       * ------------- */
      more_bye_msg.refresh();

      return;

   }

   return {init: init};
});
