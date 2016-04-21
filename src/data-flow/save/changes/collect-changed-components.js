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

/**
 * Adds a changes bag to any changes tracker
 */
define([
            'ju-components/data-flow/save/changes/bag'
        ], function(
            ChangesBag
        ) {
    'use strict';

    /**
     *
     * @use ObservableClass
     * @return {[type]} [description]
     */
    var collectChangedComponentsFn = function() {
        var self = this;

        // Changed components collector
        self.changedComponents = [];

        /**
         * Tries adding a changing component to the collector
         * @param  {object} changedComponent
         * @return {Boolean} component was added or not
         */
        self.addChangedComponent = function(changedComponent) {
            var added = false;
            if (self.changedComponents.indexOf(changedComponent) === -1) {
                // Only add self event
                log('ChangesBagTracker: component change registered');
                self.changedComponents.push(changedComponent);
                added = true;
            }
            return added;
        };

        /**
         * Returns an instance of changes bag with the modified components
         * that are children of the specified root component
         * @todo  @klam why is changes bag no define as property of the tracker?
         * @param  {[type]} rootComponent [description]
         * @return ChangesBag               [description]
         */
        self.getChangesBag = function(rootComponent) {
            var changesBag = ChangesBag.createInst(self, rootComponent, self.changedComponents);
            return changesBag;
        };

        /**
         * Removes the specified components
         * @param  {[type]} components [description]
         * @return {[type]}            [description]
         */
        self.removeFromChangedComponents = function(components) {
            $.each(components, function(index, component) {
                var componentIndex = self.changedComponents.indexOf(component);
                if (componentIndex > -1) {
                    self.changedComponents.splice(componentIndex, 1);
                }
            });
        };
    };

    // Exporting module
    return collectChangedComponentsFn;
});
