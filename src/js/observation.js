define([], function () {
   'use strict';

   var Observation = function (kargs) {
       this.target =  kargs.target;
       this.context = kargs.context;

       if (this.target === undefined || this.target === null) {
           throw new Error("Invalid undefined/null target");
       }
   };

   return {Observation: Observation};
});

