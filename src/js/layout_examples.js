define(['jquery', 'layout', 'underscore', 'widgets/switch_theme', 'code_view', 'process_graph', 'observation'], function ($, layout, _, switch_theme_widget, code_view, pgraph, observation) {
   var init_short_examples = function () {
      var self = this;
      var $body = $('body');

      // Load the examples
      var current_example_number = 0;
      var examples = [];
      for (var name in  _examples) {
         var e = _examples[name];
         examples.push({name: name, example: e});
      }

      // Run the first example
      var current_example = examples[current_example_number].example;
      var current_root_panel = current_example();
      console.info("Example: " + examples[current_example_number].name);
      
      // Load a context menu to control what example show.
      var test_driver = {
          get_display_controller: function () {
              return [
              {
                  text: 'Next example',
                  action: function (e) {
                      e.preventDefault();

                      current_root_panel.remove(); // clean up

                      // run the next example
                      current_example_number = (current_example_number + 1) % examples.length;
                      current_example = examples[current_example_number].example;
                      current_root_panel = current_example();
                      console.info("Example: " + examples[current_example_number].name);
                  }
              },
              {
                  text: 'Previous example',
                  action: function (e) {
                      e.preventDefault();

                      current_root_panel.remove(); // clean up

                      // run the previous example
                      current_example_number = (current_example_number - 1) % examples.length;
                      if (current_example_number < 0) {
                          current_example_number = examples.length - 1;
                      }
                      current_example = examples[current_example_number].example;
                      current_root_panel = current_example();
                      console.info("Example: " + examples[current_example_number].name);
                  }
              }
              ];
          }
      };

      var Observation = observation.Observation;
      $('body').data('do_observation', function () { return new Observation({target: test_driver, context: test_driver}); });
   };
   
   /* 
    * How to create a Panel, attach it to the DOM and render the screen.
    */
   var one_panel_example = function () {
      var square = Rectangle('green', 'green-square', 120);

      var root = square.attach($('body'));

      root.render();
      return root;
   }; 
   
   /* 
    * How to create a Panel, attach it to the DOM and render the screen where the DOM element
    * is floating over the rest of the page.
    * We use two roots
    */
   var one_panel_overlay_example = function () {
      var square = Rectangle('green', 'green-square', 120);
      var root = square.attach($('body'));

      var $floating_el = $('<div style="position: absolute; top: 10px; left: 30px;"></div>');
      $('body').append($floating_el);

      var floaing_square = Rectangle('blue', 'blue-square', 60);
      var floating_root = root.add_child(floaing_square, 'overlay');

      root.render();
      return root;
   }; 

   /*
    * How to create two Panels and split the space of one to put the other using
    * a Splitted object internally.
    */ 
   var two_text_panels_splitted_example = function () {
      var on_left = Text('green', 'green-left-text', 0);
      var on_right = Text('green', 'green-right-text', 100);

      var root = on_left.attach($('body'));
      on_left.split(on_right, 'right');

      root.render();
      return root;
   };
   
   var two_text_panels_splitted_overlay_example = function () {
      var square = Rectangle('green', 'green-square', 120);
      var root = square.attach($('body'));
      root.render();

      var on_left = Text('green', 'green-left-text', 0);
      var on_right = Text('green', 'green-right-text', 100);

      var floating_root = root.add_child(on_left, 'overlay');
      on_left.split(on_right, 'right');

      root.render();
      return root;
   };

   /*
    * Nested splitting, not much more.
    */
   var three_text_panels_splitted_nested_horizontally_example = function () {
      var on_left = Text('red', 'left-text', 0);
      var on_middle = Text('green', 'middle-text', 52);
      var on_right = Text('blue', 'right-text', 100);

      var root = on_left.attach($('body'));
      on_left.split(on_middle, 'right');
      on_middle.split(on_right, 'right');

      root.render();
      return root;
   };
   
   /*
    * Nested splitting (top-bottom)
    */
   var four_text_panels_splitted_nested_vertically_example = function () {
      var on_top = Text('red', 'top-text', 0);
      var on_middle1 = Text('green', 'middle-text', 12);
      var on_middle2 = Text('green', 'middle-text', 12);
      var on_bottom = Text('blue', 'bottom-text', 100);

      var root = on_top.attach($('body'));
      on_top.split(on_middle2, 'bottom');
      on_middle2.split(on_bottom, 'bottom');
      on_top.split(on_middle1, 'bottom');

      root.render();
      return root;
   };
   
   /*
    * How to split a parent. Also, how to set the percentage of the available size
    * of a panel splitted.
    */
   var top_left_center_panels_example = function () {
      var on_top = Text('red', 'top-text', 150);
      var on_left = Text('green', 'left-text', 100);
      var on_center = Text('blue', 'center-text', 0);

      //     1) ------------> 2) ------------------------------------> 3)
      //
      // +-----------+     +-----------+ \                        +--+--------+
      // |           |     |    top    | |                        |l |  top   |
      // |  center   |     +-----------+ | center's parent        |e +--------+
      // |           |     |   center  | |                        |f | center |
      // |           |     |           | |                        |t |        |
      // +-----------+     +-----------+ /                        +--+--------+

      var root = on_center.attach($('body'));     // 1)
      on_center.split(on_top, "top");             // 2)
      on_center.parent().split(on_left, "left");  // 3)

      root.render();
      on_center.parent().parent().set_percentage(15); // 15 for on_left, 85 for on_center
      on_center.parent().set_percentage(7); // 7 for on_top, 93 for [on_center & on_left]

      root.render();
      return root;
   };

   var top_left_center_panels_overlay_example = function () {
      var square = Rectangle('green', 'green-square', 60);
      var root = square.attach($('body'));

      var on_top = Text('red', 'top-text', 150);
      var on_left = Text('green', 'left-text', 100);
      var on_center = Text('blue', 'center-text', 0);

      root.add_child(on_center, 'overlay');
      on_center.split(on_top, "top");  
      on_center.parent().split(on_left, "left"); 

      root.render();
      on_center.parent().parent().set_percentage(15); // 15 for on_left, 85 for on_center
      on_center.parent().set_percentage(7); // 7 for on_top, 93 for [on_center & on_left]

      root.render();
      return root;
   };

   /*
    * How to swap
    */ 
   var two_panels_swapping_example = function () {
      var on_right = Text('red',  'right-text', 0);
      var on_left = Text('green', 'left-text', 100);
      
      var root = on_left.attach($('body'));
      on_left.split(on_right, "right");
      root.render();
      on_right.parent().set_percentage(50);
      root.render();
      
      var ticket = setInterval(function () {
         if (root.is_empty()) { // check if the root was cleaned
            clearInterval(ticket);  // remove this callback: this example is over
            return;
         }

         on_right.swap(on_left);
         root.render();
      }, 2000);
      return root;
   };

   /*
    * How to swap
    */
   var top_left_center_panels_swapping_example = function () {
      var on_top = Text('red', 'top-text', 150);
      var on_left = Text('green', 'left-text', 100);
      var on_center = Text('blue', 'center-text', 0);

      on_left.render_header = function (header_box) {
          header_box.text("=Header=");
      };

      var root = on_center.attach($('body'));
      on_center.split(on_top, "top");
      on_center.parent().split(on_left, "left");

      root.render();
      on_center.parent().parent().set_percentage(15); // 15 for on_left, 85 for on_center
      on_center.parent().set_percentage(7); // 7 for on_top, 93 for [on_center & on_left]

      root.render();

      var panels = [on_top, on_left, on_center];
      var iteration_number = 0;
      var ticket = setInterval(function () {
         if (root.is_empty()) { // check if the root was cleaned
            clearInterval(ticket);  // remove this callback: this example is over
            return;
         }

         panels[iteration_number % panels.length].swap(panels[(iteration_number + 1) % panels.length]);
         root.render();
         iteration_number += 1;
      }, 2000);
      return root;
   };
   
   /*
    * How to remove
    */ 
   var adding_removing_two_panels_example = function () {
      var on_right = Text('red',  'right-text', 0);
      var on_left = Text('green', 'left-text', 100);
      
      var root = on_left.attach($('body'));
      
      var iteration_number = 0;
      var ticket = setInterval(function () {
         if (root.is_empty()) { // check if the root was cleaned
            clearInterval(ticket);  // remove this callback: this example is over
            return;
         }

         if (iteration_number % 2 === 0) {
            on_left.split(on_right, "right");
            root.render();
            on_right.parent().set_percentage(50);
            root.render();
         }
         else {
            on_right.remove();
            root.render();
         }
         iteration_number += 1;
      }, 2000);
      return root;
   };

   /*
    * How to swap and remove
    */
   var splitting_and_removing_example = function () {
      var principal_square = Rectangle('white', 'principal', 200);
      var squares = [
         Rectangle('red',   'square1', 150),
         Rectangle('green', 'square2', 100),
         Rectangle('blue',  'square3', 50),
         Rectangle('cyan',  'square4', 25),
      ];
      var directions = ["left", "top", "right", "bottom"];

      var root = principal_square.attach($('body'));
      root.render();

      var next = squares[0];
      var last = null;

      var direction = directions[0];
      var last_direction_number = 0;
      var adding = false;
      var stack = [principal_square];

      var iteration_number = 0;
      var ticket = setInterval(function () {
         if (root.is_empty()) { // check if the root was cleaned
            clearInterval(ticket);  // remove this callback: this example is over
            return;
         }

         if (iteration_number % squares.length === 0) {
            iteration_number = 0;
            adding = !adding;

            if (adding) {
               direction = directions[last_direction_number % directions.length];
               last_direction_number += 1;
            }
         }

         if(adding) {
            stack.push(squares[iteration_number]);
            stack[stack.length-2].split(stack[stack.length-1], direction);
         }
         else {
            stack[stack.length-1].remove();
            stack.pop();
         }
         
         root.render();
         iteration_number += 1;
      }, 2000);
      return root;
   };

   /*
    * How to create a Tabbed, adding and removing tabs
    */
   var adding_removing_tabs_example = function () {
      var tabbed = new layout.Tabbed();
      var root = tabbed.attach($('body'));
      
      var panels = [
         Text('red',  'Text Red', 0),
         Text('green', 'Text Green', 100),
         Text('blue', 'Text Blue', 150),
      ];

      var iteration_number = 0;
      var remove_mode = true;
      var ticket = setInterval(function () {
         if (root.is_empty()) { // check if the root was cleaned
            clearInterval(ticket);  // remove this callback: this example is over
            return;
         }

         if (iteration_number % 3 === 0) {
            remove_mode = !remove_mode;
         }

         if (!remove_mode) {
            tabbed.add_child(panels[iteration_number % 3], "intab");
            root.render();
         }
         else {
            panels[iteration_number % 3].remove();
            root.render();
         }
         iteration_number += 1;
      }, 2000);
      return root;
   };
   
   var tab_overlay_example = function () {
      var tabbed = new layout.Tabbed();
      var root = tabbed.attach($('body'));
      
      tabbed.add_child(Text('red',  'Text Red', 0), "intab");
      tabbed.add_child(Text('green', 'Text Green', 100), "intab");
      tabbed.add_child(Text('blue', 'Text Blue', 150), "intab");

      var overlay_tabbed = new layout.Tabbed();
      overlay_tabbed.add_child(Text('red',  'Text Red', 0), "intab");
      overlay_tabbed.add_child(Text('green', 'Text Green', 100), "intab");
      overlay_tabbed.add_child(Text('blue', 'Text Blue', 150), "intab");
      
      root.add_child(overlay_tabbed, 'overlay');

      root.render();
      return root;
   };
      
   /*
    * How to display a tab
    */
   var display_tabs_example = function () {
      var tabbed = new layout.Tabbed();
      var root = tabbed.attach($('body'));
      
      tabbed.add_child(Text('red',  'Text Red', 0), "intab");
      tabbed.add_child(Text('green', 'Text Green', 100), "intab");
      tabbed.add_child(Text('blue', 'Text Blue', 150), "intab");
            
      root.render();

      var iteration_number = 0;
      var ticket = setInterval(function () {
         if (root.is_empty()) { // check if the root was cleaned
            clearInterval(ticket);  // remove this callback: this example is over
            return;
         }
         tabbed.display(iteration_number % 3);
         root.render();
         iteration_number += 1;
      }, 2000);
      return root;
   };

   /*
    * How to split a tab...
    * Important: splitting a panel which it is inside of a Tabbed will split the Tabbed, not the panel.
    */
   var two_tabbed_splitted_example = function () {
      var tabbed_left = new layout.Tabbed();
      var tabbed_right = new layout.Tabbed();
      
      var root = tabbed_left.attach($('body'));
      tabbed_left.split(tabbed_right, 'right');
      
      tabbed_left.add_child(Text('red',  'Text Red', 0), "intab");
      tabbed_left.add_child(Text('green', 'Text Green', 100), "intab");
      tabbed_right.add_child(Text('blue', 'Text Blue', 150), "intab");
      tabbed_right.add_child(Rectangle('magenta', 'Square Magenta', 150), "intab");
      tabbed_right.add_child(Rectangle('white', 'Rectangle White', 150, 50), "intab");
      tabbed_right.add_child(Rectangle('cyan', 'Rectangle Cyan', 50, 150), "intab");

      root.render();
      return root;
   };
   
   var two_tabbed_splitted_overlay_example = function () {
      var square = Rectangle('green', 'green-square', 300);
      var root = square.attach($('body'));

      var tabbed_left = new layout.Tabbed();
      var tabbed_right = new layout.Tabbed();
      
      tabbed_left.split(tabbed_right, 'right');
      
      tabbed_left.add_child(Text('red',  'Text Red', 0), "intab");
      tabbed_left.add_child(Text('green', 'Text Green', 100), "intab");
      tabbed_right.add_child(Text('blue', 'Text Blue', 150), "intab");
      tabbed_right.add_child(Rectangle('magenta', 'Square Magenta', 150), "intab");
      tabbed_right.add_child(Rectangle('white', 'Rectangle White', 150, 50), "intab");
      tabbed_right.add_child(Rectangle('cyan', 'Rectangle Cyan', 50, 150), "intab");

      root.add_child(tabbed_left.parent(), 'overlay');
      root.render();

      return root;
   };

   /*
    * How to stack: because the Texts will occupy all the free space available,
    * there will not be any free space.
    */
   var stack_horizontally_with_no_free_space_example = function () {
      var stack = new layout.Stacked('horizontally');
      
      stack.add_child(Text('red',  'Text Red', 0), 
         {position: "right", grow: 0, shrink: 1});
      stack.add_child(Text('green', 'Text Green', 100), 
         {position: "right", grow: 0, shrink: 1});
      stack.add_child(Text('blue', 'Text Blue', 150), 
         {position: "right", grow: 0, shrink: 1});

      var root = stack.attach($('body'));
      root.render();
      return root;
   };
   
   var stack_horizontally_overlay_example = function () {
      var square = Rectangle('green', 'green-square', 300);
      var root = square.attach($('body'));

      var stack = new layout.Stacked('horizontally');
      
      stack.add_child(Text('red',  'Text Red', 0), 
         {position: "right", grow: 0, shrink: 1});
      stack.add_child(Text('green', 'Text Green', 100), 
         {position: "right", grow: 0, shrink: 1});
      stack.add_child(Text('blue', 'Text Blue', 150), 
         {position: "right", grow: 0, shrink: 1});

      root.add_child(stack, 'overlay');
      root.render();

      return root;
   };
   /*
    * How to stack: because the Rectangles have fixed space, there will be free space.
    */
   var stack_horizontally_with_free_space_example = function () {
      var stack = new layout.Stacked('horizontally');
      
      /*
       *             available space
       *  /-----------------------------------------\
       * /                                           \
       * +-------+--------+-------+
       * |       |        |       |
       * |       |        |       |
       * |       |        |       |
       * +-------+--------+-------+
       */
      stack.add_child(Rectangle('red',  'Red', 100), 
         {position: "right", grow: 0, shrink: 1});
      stack.add_child(Rectangle('green', 'Green', 100), 
         {position: "right", grow: 0, shrink: 1});
      stack.add_child(Rectangle('blue', 'Blue', 100), 
         {position: "right", grow: 0, shrink: 1});

      var root = stack.attach($('body'));
      root.render();
      return root;
   };
   
   /*
    * How to stack: Expand one element to fill the available free space.
    */
   var stack_horizontally_growing_expanding_one_to_occupy_free_space_example = function () {
      var stack = new layout.Stacked('horizontally');
      
      /*
       *             available space
       *  /-----------------------------------------\
       * /        /--- --- --- --- --- --- ---\      \
       * +-------+--------+                   +-------+
       * |       |        |                   |       |
       * |       |        |                   |       |
       * |       |        |                   |       |
       * +-------+--------+                   +-------+
       */
      stack.add_child(Rectangle('red',  'Red', 100), 
         {position: "right", grow: 0, shrink: 1});
      stack.add_child(Rectangle('green', 'Green', 100), 
         {position: "right", grow: 1, shrink: 1});       // grow 1
      stack.add_child(Rectangle('blue', 'Blue', 100), 
         {position: "right", grow: 0, shrink: 1});

      var root = stack.attach($('body'));
      root.render();
      return root;
   };

   /*
    * How to stack: Expand tow elements to fill the available free space.
    */
   var stack_horizontally_growing_expanding_two_to_occupy_free_space_example = function () {
      var stack = new layout.Stacked('horizontally');
      
      /*
       *             available space
       *  /-----------------------------------------\
       * /        /--- --- --- -----\/--- --- --- ---\
       * +-------+--------+         +-------+
       * |       |        |         |       |
       * |       |        |         |       |
       * |       |        |         |       |
       * +-------+--------+         +-------+
       */
      stack.add_child(Rectangle('red',  'Red', 100), 
         {position: "right", grow: 0, shrink: 1});
      stack.add_child(Rectangle('green', 'Green', 100), 
         {position: "right", grow: 1, shrink: 1});       // grow 1
      stack.add_child(Rectangle('blue', 'Blue', 100), 
         {position: "right", grow: 1, shrink: 1});       // grow 1

      var root = stack.attach($('body'));
      root.render();
      return root;
   };

   /*
    * How to split and stack
    */
   var stack_horizontally_growing_expanding_two_to_occupy_free_space_in_a_splitted_example = function () {
      var stack = new layout.Stacked('horizontally');
      
      /*
       *             available space
       *  /-----------------------------------------\  ||
       * /        /--- --- --- ----\/--- --- --- ----\ ||
       * +-------+--------+         +-------+          ||
       * |       |        |         |       |          ||   Right Panel here
       * |       |        |         |       |          ||
       * |       |        |         |       |          ||
       * +-------+--------+         +-------+          ||
       */
      stack.add_child(Rectangle('red',  'Red', 100), 
         {position: "right", grow: 0, shrink: 1});
      stack.add_child(Rectangle('green', 'Green', 100), 
         {position: "right", grow: 1, shrink: 1});       // grow 1
      stack.add_child(Rectangle('blue', 'Blue', 100), 
         {position: "right", grow: 1, shrink: 1});       // grow 1

      var root = stack.attach($('body'));
      stack.split(Text("brown", "Text", 0), 'right');

      root.render();
      return root;
   };

   function init_tests() {
      var Panel = layout.Panel;
      var Tabbed = layout.Tabbed;

      var self = this;
      var $body = $('body');
      
      var current_test_number = 0;
      var test_driver = {
          get_display_controller: function () {
              return [
                    {
                       text: 'Next step',
                       action: function (e) {
                          e.preventDefault();
                          
                          // run the next test
                          current_test_number = (current_test_number + 1);
                          if (current_test_number >= tests.length) {
                             console.info("No more tests to run.");
                             return;
                          }
                    
                          tests[current_test_number]();
                          console.info("Test " + current_test_number);
                       }
                    }
              ];
          }
      };
      var Observation = observation.Observation;
      $('body').data('do_observation', function () { return new Observation({target: test_driver, context: test_driver}); });

      var hello_msg;
      var bye_bye_msg;
      var more_bye_msg;
      var lorem_ipsum_msg;
      var foo_msg;
      var bar_msg;
      var zaz_msg;
      var tabs;
      var tabs2;
      var theme_switch;
      var tabs3;
      var _switch;
      var root;
      var cv_panel;
      var pg_panel;
      var pg_data;
      var S1;

      var tests = [
         function () { 
            /*
             * El sistema de layout esta compuesto por una serie de objetos 'Panel' que
             * se encargan de dibujar su contenido en la pantalla.
             *
             * Para comenzar, crearemos un panel que muestra un simple mensaje.
             * */

            hello_msg = new Panel("hello msg");
            hello_msg.msg = 'hello world';

            hello_msg.$container = $('<div></div>');
            hello_msg.$out_of_dom = hello_msg.$container;

            hello_msg.render = function () {
               if (this.$out_of_dom) {
                  this.$out_of_dom.appendTo(this.box);
                  this.$out_of_dom = null;
               }

               this.$container.html(this.msg);
            };

            hello_msg.unlink = function () {
               if (!this.$out_of_dom) {
                  this.$out_of_dom = this.$container.detach();
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

            console.info("Expected Result: Nada es mostrado");
         },

         function () {
            /* 
             * Aun asi, nuestro panel no se dibuja en la pantalla hasta que sea
             * insertado en el DOM de la aplicacion.
             *
             * Para esto tenemos quee attacharlo a algun objeto del DOM que exista.
             * */

            hello_msg.attach($('body'));     //XXX que ventaja da tener un Root?
            hello_msg.parent().render();

            console.info((
            " Expected Result: \n"+
            "                 \n"+
            "    H            \n"+
            "                 \n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            /* Listo.
             *
             * Si queremos, podemos cambiar la funcion render para cambiar el mensaje
             * (podriamos cambiar una property u otra cosa para cambiar el mensaje, 
             * no es necesario cambiar todo el render).
             *
             * Para que el cambio surja efecto, debemos refrescar el panel.
             *
             * */

            hello_msg.msg = hello_msg.msg + '!!!';
            hello_msg.parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "                \n"+
             "    H           \n"+
             "                \n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },


         function () {
            /*
             * Refrescar (re-renderizar) un panel que no esta attachado NO DEBERIA tener efecto.
             * */
            bye_bye_msg = new Panel("bye bye msg");
            bye_bye_msg.msg = 'Bye Bye Bye';

            bye_bye_msg.$container = $('<div></div>');
            bye_bye_msg.$out_of_dom = bye_bye_msg.$container;
            bye_bye_msg.render = hello_msg.render;
            bye_bye_msg.unlink = hello_msg.unlink;


            bye_bye_msg.render();
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "    H\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },


         function () {
            /*
             * Uno puede swappear paneles para cambiarlos de lugar
             *
             * */

            hello_msg.swap(bye_bye_msg);
            bye_bye_msg.parent().render();
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "    B\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            /*
             * La operacion 'swap' es simetrica, no importa quien ese el objeto al quien
             * se le envia el mensaje
             * */

            hello_msg.swap(bye_bye_msg);
            hello_msg.parent().render();
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "    H\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },


         function () {
            /* Con solo un panel, no hay mucha diferencia entre esto y simplemente
             * renderizar en el DOM.
             *
             * Todo panel puede dividirse en 2, ya sea horizontal o verticalmente
             * agregando otro panel mas a la escena.
             * */
            
            hello_msg.split(bye_bye_msg, 'left');
            hello_msg.parent().parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "    B | H\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            /* No hay limite en la cantidad de divisiones que se pueden hacer.
             * Cambiemos los mensajes de los panels actuales y creemos otro panel
             * para verlo.
             * 
             * */

            bye_bye_msg.msg = bye_bye_msg.msg + '<br />Bye Bye';

            more_bye_msg = new Panel("more bye msg");
            more_bye_msg.msg = "More ... Bye!";
            more_bye_msg.$container = $('<div></div>');
            more_bye_msg.$out_of_dom = more_bye_msg.$container;
            more_bye_msg.render = hello_msg.render;
            more_bye_msg.unlink = hello_msg.unlink;

            bye_bye_msg.split(more_bye_msg, 'bottom');
            hello_msg.parent().parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "    B |\n"+
             "  ----| H\n"+
             "    M |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         
         function () {
            /*
             * Si quisieramos agregar un panel a la izquierda de 'ambos' paneles que
             * tienen el mensaje 'bye', no podemos hacer un split a solo uno de ellos.
             * Lo que hay que dividir es a su padre.
             * */

            if(bye_bye_msg.parent() !== more_bye_msg.parent())
               throw new Error("Fail!");

            lorem_ipsum_msg = new Panel("lorem msg");
            lorem_ipsum_msg.msg = "Lorem ipsum";
            lorem_ipsum_msg.$container = $('<div></div>');
            lorem_ipsum_msg.$out_of_dom = lorem_ipsum_msg.$container;
            lorem_ipsum_msg.render = hello_msg.render;
            lorem_ipsum_msg.unlink = hello_msg.unlink;

            bye_bye_msg.parent().split(lorem_ipsum_msg, 'left');
            hello_msg.parent().parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "      | B |\n"+
             "    L |---| H\n"+
             "      | M |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },


         function () {
            /*
             * No solo los paneles que estan attachados pueden splittearse, sino que
             * tambien los que no lo estan.
             * Por supuesto, al no estar attachados no se renderizan.
             */
            
            foo_msg = new Panel("foo msg");
            foo_msg.msg = "foo";
            foo_msg.$container = $('<div></div>');
            foo_msg.$out_of_dom = foo_msg.$container;
            foo_msg.render = hello_msg.render;
            foo_msg.unlink = hello_msg.unlink;

            bar_msg = new Panel("bar msg");
            bar_msg.msg = "bar";
            bar_msg.$container = $('<div></div>');
            bar_msg.$out_of_dom = bar_msg.$container;
            bar_msg.render = hello_msg.render;
            bar_msg.unlink = hello_msg.unlink;

            foo_msg.split(bar_msg, 'bottom');
            hello_msg.parent().parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "      | B |\n"+
             "    L |---| H\n"+
             "      | M |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },


         function () {
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
         },

         function () {
            /*
             * Para que nuestra nueva division Foo/Bar sea renderizada podemos attachar su padre
             * al DOM o podemos reemplazar algun panel que este en el DOM por el splitted.
             *
             * De una u otra forma, el padre de la division se linkea al DOM.
             * */

            foo_msg.parent().swap(lorem_ipsum_msg);
            hello_msg.parent().parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "    F | B |\n"+
             "   ---|---| H\n"+
             "   Ba | M |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            /* 
             * Ahora, el 'lorem_ipsum_msg' dejo de pertenecer al DOM.
             *
             * Podemos volver para atras aplicando la misma operacion de swappeo, 
             * swappeando 'lorem_ipsum_msg' por el split (de foo y bar)
             * */

            foo_msg.parent().swap(lorem_ipsum_msg);
            hello_msg.parent().parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "      | B |\n"+
             "    L |---| H\n"+
             "      | M |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },


         function () {
            /* 
             * Todos los paneles pueden moverse de un lugar a otro, intercambiando 
             * lugares.
             * */

            lorem_ipsum_msg.swap(hello_msg);
            bye_bye_msg.swap(more_bye_msg);
            lorem_ipsum_msg.parent().parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "      | M |\n"+
             "    H |---| L\n"+
             "      | B |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },


         function () {
            /*
             * Dado que un swappeo cambia varias relaciones padre-hijo, veamos que
             * sucede si ahora seguimos spliteando a los paneles.
             * */

            hello_msg.split(foo_msg, 'top');
            lorem_ipsum_msg.split(bar_msg, 'right');
            lorem_ipsum_msg.parent().parent().parent().render();

            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "    F | M |   |\n"+
             "   ---|---| L | Ba\n"+
             "    H | B |   |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            zaz_msg = new Panel("zaz msg");
            zaz_msg.msg = "zaz";
            zaz_msg.$container = $('<div></div>');
            zaz_msg.$out_of_dom = zaz_msg.$container;
            zaz_msg.render = hello_msg.render;
            zaz_msg.unlink = hello_msg.unlink;

            foo_msg.split(zaz_msg, 'left');
            lorem_ipsum_msg.parent().parent().parent().render();

            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "   Z|F| M |   |\n"+
             "   ---|---| L | Ba\n"+
             "    H | B |   |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         /* 
          * Hasta ahora hemos siempre agregado nuevos paneles pero que pasa si
          * queremos agregar 2 veces el mismo panel?
          *
          * El resultado es indefinido.
          * */


         function () {
            /*
             * Asi como podemos agregar paneles podemos removerlos.
             * Esto no quiere decir que el panel removido es destruido, sino 
             * que tan solo es quitado del DOM. 
             * Si se tiene una referencia al panel, este seguira vivo.
             * Sino, sera removido por la VM de Javascript (garbage).
             * */

            zaz_msg.remove();
            lorem_ipsum_msg.parent().parent().parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "    F | M |   |\n"+
             "   ---|---| L | Ba\n"+
             "    H | B |   |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },
         
         function () {
            more_bye_msg.remove();
            lorem_ipsum_msg.parent().parent().parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "    F |   |   |\n"+
             "   ---| B | L | Ba\n"+
             "    H |   |   |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            bye_bye_msg.remove();
            lorem_ipsum_msg.parent().parent().parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "    F |   |\n"+
             "   ---| L | Ba\n"+
             "    H |   |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },


         function () {
            hello_msg.parent().remove();
            lorem_ipsum_msg.parent().parent().render();


            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "      |\n"+
             "    L | Ba\n"+
             "      |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },


         function () {
            bar_msg.remove();
            lorem_ipsum_msg.parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "     \n"+ 
             "    L\n"+
             "     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));

         },
         
         function () {
            lorem_ipsum_msg.remove();
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "     \n"+ 
             "    \n"+
             "     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            /*
             * Veamos otros ejemplos.
             * Al haber removido los paneles, ninguno quedo attachado asi que hay que
             * volver a repetir ese paso.
             *
             * */
            hello_msg.remove(); //si quedo unido a otro panel, lo sacamos de ahi.
            hello_msg.attach($('body'));

            hello_msg.split(bye_bye_msg, 'right');
            bye_bye_msg.split(more_bye_msg, 'right');
            more_bye_msg.split(lorem_ipsum_msg, 'right');

            hello_msg.parent().parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "    |   |   |\n"+
             "  H | B | M | L\n"+
             "    |   |   |\n"+
             "     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            bye_bye_msg.remove();
            hello_msg.parent().parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "    |   |\n"+
             "  H | M | L\n"+
             "    |   |\n"+
             "     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            more_bye_msg.remove();
            lorem_ipsum_msg.remove();
            hello_msg.parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "    \n"+
             "    H \n"+
             "    \n"+
             "     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },


         function () {
            /*
             * En un mismo lugar pueden convivir varios paneles usando una vista basada
             * en tabs. A diferencia de un split, solo uno de los paneles es mostrado
             * y el resto esta en background.
             * */

            tabs = new Tabbed();

            tabs.swap(hello_msg);
            tabs.add_child(hello_msg, 'intab');
            tabs.add_child(lorem_ipsum_msg, 'intab');
            tabs.parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "      \n"+
             "    [],H,L\n"+
             "     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            /*
             * Por default, ninguna de la tabs muestra. Para ello, usar el metodo display
             * indicando el numero de tab a mostrar (indice zero-based, acepta negativos tambien)
             * */

            tabs.display(0);
            tabs.parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "     \n"+ 
             "    [H],L\n"+
             "     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            tabs.add_child(bye_bye_msg, 'intab');
            tabs.parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "     \n"+ 
             "    [H],L,B\n"+
             "     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            /*
             * Splittear un panel con tabs es igual a splittear un panel sin los tabs.
             * El contenido de un tab NO es splitteado (No hay por default un split dentro
             * de un tab)
             *
             * Esto es, splittear un panel dentro de un tab es igual a splittear al tab mismo.
             * */

            tabs.split(more_bye_msg, 'left');
            tabs.parent().parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "      |\n"+
             "    M | [H],L,B\n"+
             "      |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            lorem_ipsum_msg.split(foo_msg, 'top');
            tabs.parent().parent().parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "      | F\n"+
             "    M |---------- \n"+
             "      | [H],L,B\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            bye_bye_msg.split(bar_msg, 'right');
            tabs.parent().parent().parent().parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "      | F\n"+
             "    M |----------------\n"+
             "      | [H],L,B  | Ba\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            hello_msg.swap(more_bye_msg);
            tabs.parent().parent().parent().parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "      | F\n"+
             "    H |----------------\n"+
             "      | [M],L,B  | Ba\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },


         function () {
            foo_msg.remove();

            tabs2 = new Tabbed();

            tabs2.swap(hello_msg);
            tabs2.add_child(hello_msg, 'intab');
            tabs2.add_child(foo_msg, 'intab');

            tabs.parent().parent().parent().render();
            tabs2.display(-1); //TODO el display "anda" solo si ese tab (ese panel) fue renderizado al menos una vez
            tabs.parent().parent().parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "          |          |\n"+
             "    H,[F] | [M],L,B  | Ba\n"+
             "          |          |\n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            bar_msg.remove();
            tabs.parent().parent().render();
            
            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "          |     \n"+     
             "    H,[F] | [M],L,B\n"+
             "          |     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            bye_bye_msg.remove();
            tabs.parent().parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "          |       \n"+   
             "    H,[F] | [M],L\n"+
             "          |     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            hello_msg.swap(more_bye_msg);
            tabs.parent().parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "          |    \n"+      
             "    M,[F] | [H],L\n"+
             "          |     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            hello_msg.swap(lorem_ipsum_msg);
            hello_msg.swap(foo_msg);
            tabs.parent().parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "          |    \n"+      
             "    M,[H] | [L],F\n"+
             "          |     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            lorem_ipsum_msg.remove();
            tabs.parent().parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "          |     \n"+     
             "    M,[H] | [F]\n"+
             "          |     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            /*
             * A diferencia de un Splitted, si un Tabbed se queda sin tabs, este no desaparece.
             * Esto permite que otros paneles sean movidos al el por el usuario (drag & drop)
             * */

            foo_msg.remove();
            tabs.parent().parent().render(); //TODO mostrar algo cuando no hay tabs (?)

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "          |    \n"+      
             "    M,[H] | []\n"+
             "          |     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            tabs.add_child(lorem_ipsum_msg, 'intab');
            tabs.display(1);
            tabs.parent().parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "          |      \n"+    
             "    M,[H] | L,[]\n"+
             "          |     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         function () {
            tabs.add_child(foo_msg, 'intab');
            tabs.add_child(bar_msg, 'intab');
            tabs.parent().parent().render();
            tabs.display(2);
            tabs.parent().parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "          |   \n"+       
             "    M,[H] | L,F,[Ba]\n"+
             "          |     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         
         function () {
            bar_msg.remove();
            tabs.parent().parent().render();

            console.info((
             " --------- XXX Expected Result: \n"+
             "\n"+
             "          |      \n"+    
             "    M,[H] | L,[F]\n"+
             "          |     \n"+
             "\n"+
            " ------------- */\n").replace(/ /g, '\u00a0'));
         },

         /*
         function () {
            //
            // Solo por diversion, creamos otro tab y ademas creamos un panel
            // que tiene un switch para cambiar el estilo de la UI (theme)
            //
            tabs3 = new Tabbed();
            tabs3.add_child(bye_bye_msg, 'intab');

            lorem_ipsum_msg.split(tabs3, 'bottom');

            theme_switch = new Panel("theme_switch");
            _switch = switch_theme_widget.theme_switch;

            theme_switch.render = function () {
               this._rendered_in = $(this.box);
               _switch.box = this._rendered_in;
               _switch.render();
            };

            theme_switch.unlink = function () {
               if (this._rendered_in) {
                  _switch.unlink();
                  //this._rendered_in.empty();
                  this._rendered_in = null;
               }
            }

            hello_msg.swap(theme_switch);
            tabs.parent().parent().parent().render();

            // --------- XXX Expected Result: 
            //
            //          | L,[F]    
            //    M,[T] |-------
            //          | [],B
            //
            // ------------- 
         },


         function () {
            root = tabs.parent().parent().parent();
            cv_panel = new code_view.CodeView();
            
            cv_panel.swap(foo_msg);
            cv_panel.load_file('/home/joedoe/Hydra//src/cppTestCode/simplified_unix_tools/echo.c');

            cv_panel.parent().parent().parent().set_percentage(50);

            tabs3.swap(hello_msg);
            
            pg_data = { processes: [
                  {
                     pid: 1, 
                     name: 'A',
                     status: 'running'
                  },
                  {
                     pid: 2, 
                     name: 'B',
                     status: 'running'
                  },
                  {
                     pid: 3, 
                     name: 'C',
                     status: 'running'
                  }
                  ],

                  relations: [
                  [0, 1],
                  [0, 2]
                     ]};

            pg_panel  = new pgraph.ProcessGraph();
            pg_panel.update(pg_data.processes, pg_data.relations);
            
            more_bye_msg.swap(pg_panel);
            root.render();

            bye_bye_msg.remove();
            more_bye_msg.remove();
            cv_panel.remove();
            lorem_ipsum_msg.remove();
            
            S1 = new layout.Stacked("horizontally");
            S1.add_child(more_bye_msg, {position: "left", grow: 0, shrink: 1});
            S1.add_child(lorem_ipsum_msg, {position: "right", grow: 1, shrink: 1});
            S1.add_child(bye_bye_msg, {position: "right", grow: 1, shrink: 1});
            S1.add_child(cv_panel, {position: "right", grow: 1, shrink: 1});

            S1.remove_child(cv_panel);
            S1.replace_child(bye_bye_msg, cv_panel);
            S1.remove_child(lorem_ipsum_msg);

            hello_msg.swap(S1);
            root.render();
         }*/
      ];

      // Run the first test
      tests[current_test_number]();
      console.info("Test " + current_test_number);

      return root;
   }

   var Rectangle = function (color, name, height, width) {
      var Panel = layout.Panel;
      var rectangle = new Panel(name);

      var width = width || height;
      
      rectangle.$container = $('<div style="background: '+color+'; height: '+height+'px; width: '+width+'px;"></div>');
      rectangle.$out_of_dom = rectangle.$container;

      rectangle.render = function () {
         if (this.$out_of_dom) {
            this.$out_of_dom.appendTo(this.box);
            this.$out_of_dom = null;
         }
      };

      rectangle.unlink = function () {
         if (!this.$out_of_dom) {
            this.$out_of_dom = this.$container.detach();
         }
      };

      return rectangle;
   };
   
   var Text = function (color, name, lorem_ipsum_start, min_height, min_width) {
      var LoremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

      var Panel = layout.Panel;
      var text_rectangle = new Panel(name);

      var min_height_style = "";
      var min_width_style = "";

      if (min_height) {
         min_height_style = "min-height: "+min_height+"px;";
      }

      if (min_width) {
         min_width_style = "min-width: "+min_width+"px;";
      }

      var lorem_ipsum_start = (lorem_ipsum_start || 0) % (LoremIpsum.length-1);
      var text = LoremIpsum[lorem_ipsum_start].toUpperCase() + LoremIpsum.substring(lorem_ipsum_start+1);

      text_rectangle.$container = $('<div style="background: '+color+'; '+min_height_style+' '+min_width_style+' ">'+text+'</div>');
      text_rectangle.$out_of_dom = text_rectangle.$container;

      text_rectangle.render = function () {
         if (this.$out_of_dom) {
            this.$out_of_dom.appendTo(this.box);
            this.$out_of_dom = null;
         }
      };

      text_rectangle.unlink = function () {
         if (!this.$out_of_dom) {
            this.$out_of_dom = this.$container.detach();
         }
      };

      return text_rectangle;
   };
   
   var Hello = function (hello_message) {
      var Panel = layout.Panel;
      var text_rectangle = new Panel(hello_message);
      var text = hello_message;

      text_rectangle.$container = $('<div>'+text+'</div>');
      text_rectangle.$out_of_dom = text_rectangle.$container;

      text_rectangle.render = function () {
         if (this.$out_of_dom) {
            this.$out_of_dom.appendTo(this.box);
            this.$out_of_dom = null;
         }
      };

      text_rectangle.unlink = function () {
         if (!this.$out_of_dom) {
            this.$out_of_dom = this.$container.detach();
         }
      };

      return text_rectangle;
   };
   
   var _examples = {
      one_panel_example: one_panel_example,
      one_panel_overlay_example: one_panel_overlay_example,
      two_text_panels_splitted_example: two_text_panels_splitted_example,
      two_text_panels_splitted_overlay_example: two_text_panels_splitted_overlay_example,
      three_text_panels_splitted_nested_horizontally_example: three_text_panels_splitted_nested_horizontally_example,
      four_text_panels_splitted_nested_vertically_example: four_text_panels_splitted_nested_vertically_example,
      top_left_center_panels_example: top_left_center_panels_example,
      top_left_center_panels_overlay_example: top_left_center_panels_overlay_example,
      two_panels_swapping_example: two_panels_swapping_example,
      top_left_center_panels_swapping_example: top_left_center_panels_swapping_example,
      adding_removing_two_panels_example: adding_removing_two_panels_example,
      splitting_and_removing_example: splitting_and_removing_example,
      adding_removing_tabs_example: adding_removing_tabs_example,
      tab_overlay_example: tab_overlay_example,
      display_tabs_example: display_tabs_example,
      two_tabbed_splitted_example: two_tabbed_splitted_example,
      two_tabbed_splitted_overlay_example: two_tabbed_splitted_overlay_example,
      stack_horizontally_with_no_free_space_example: stack_horizontally_with_no_free_space_example,
      stack_horizontally_overlay_example: stack_horizontally_overlay_example,
      stack_horizontally_with_free_space_example: stack_horizontally_with_free_space_example,
      stack_horizontally_growing_expanding_one_to_occupy_free_space_example: stack_horizontally_growing_expanding_one_to_occupy_free_space_example,
      stack_horizontally_growing_expanding_two_to_occupy_free_space_example: stack_horizontally_growing_expanding_two_to_occupy_free_space_example,
      stack_horizontally_growing_expanding_two_to_occupy_free_space_in_a_splitted_example: stack_horizontally_growing_expanding_two_to_occupy_free_space_in_a_splitted_example,
   };

   var export_this = _.clone(_examples);
   export_this.init_short_examples = init_short_examples;
   export_this.init_tests = init_tests;
   return export_this;
});
