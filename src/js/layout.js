define(['layout/panel', 'layout/tabbed', 'layout/root', 'layout/splitted', 'layout/stacked'], function (panel, tabbed, root, splitted, stacked) {
   return {
      NullParent: panel.NullParent,
      Panel: panel.Panel,
      Tabbed: tabbed.Tabbed,
      as_tree: panel.as_tree,
      Stacked: stacked.Stacked
   };
});
