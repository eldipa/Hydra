define([], function () {
   'use strict';

   var Observation = function (kargs) {
       this.target =  kargs.target;
       this.context = kargs.context;
   };

   return {Observation: Observation};
});

