define(['layout/panel', 'layout/tabbed', 'layout/root', 'layout/splitted'], function (panel, tabbed, root, splitted) {
   return {
      Panel: panel.Panel,
      Tabbed: tabbed.Tabbed,
      as_tree: panel.as_tree
   };
});
