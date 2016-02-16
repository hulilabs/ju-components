/**                   _
 *  _             _ _| |_
 * | |           | |_   _|
 * | |___  _   _ | | |_|
 * | '_  \| | | || | | |
 * | | | || |_| || | | |
 * |_| |_|\___,_||_| |_|
 *
 * (c) Huli Inc
 */

define([
        ],
        function(
        ) {
    'use strict';

    // Searches for all the children components that have the alwaysEditable property
    // and set them to true, this method will stop when he founds a node that
    // the property. It will be responsability of that node to propagate the property
    // to its children
    var markChildrenAsAlwaysEditableFn = function() {
        var self = this,
            opts = {
                callLocally : function(comp) {
                    log('callLocally...', comp, comp.opts.alwaysEditable);
                    // We will call the setOption only if the current component defines the alwaysEditable property
                    return comp.opts.alwaysEditable !== undefined;
                },
                callOnChildren : function(comp) {
                    log('callOnChildren...', comp, comp.opts.alwaysEditable);
                    // We will call on children only if this is the originating component
                    // or this component does not have the alwaysEditable.
                    // We stop when the alwaysEditable is defined because that component
                    return comp == self || comp.opts.alwaysEditable === undefined;
                }
            };
        self.callRecursively(opts, 'setOption', 'alwaysEditable', true);
    };

    // Exporting module
    return markChildrenAsAlwaysEditableFn;

});
