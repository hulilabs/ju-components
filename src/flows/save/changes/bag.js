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
            'require',
            'jquery',
            'ju-shared/class',
            'ju-components/base'
        ],
        function(
            require,
            $,
            Class,
            BaseComponent
        ) {
    'use strict';

    /**
     *
     */
    var ChangesBag = Class.extend({
        init : function(changesTracker) {
            this.changesTracker = changesTracker;
            /*
            Stores the changes map given the root component
            and the changed components
             */
            this.changesMap = {};
        },
        /**
         * Given a root component and the changed components
         * it builds the changes map that stores a stucture of
         *  {
         *      changedComponent : <>,
         *      childComponent : <>,
         *  }
         *
         * The children component is relative to the specified root
         * component
         * @param  {[type]} rootComponent     [description]
         * @param  {[type]} changedComponents [description]
         * @return {[type]}                   [description]
         */
        buildChangesMap : function(rootComponent, changedComponents) {
            var self = this;

            this.rootComponent = rootComponent;

            $.each(changedComponents, function(index, changedComponent) {
                var directChild = BaseComponent
                                .searchComponentInDescendants(
                                    rootComponent,
                                    changedComponent
                                );
                // Process the changed component only if its a child of
                // the specified root
                if (directChild) {
                    var childId = directChild.id,
                        mapEntry = self.changesMap[childId];

                    if (!mapEntry) {
                        mapEntry = {
                            childComponent : directChild,
                            changedComponents : [changedComponent]
                        };
                        self.changesMap[childId] = mapEntry;
                    } else {
                        mapEntry.changedComponents.push(changedComponent);
                    }
                }
            });
        },
        /**
         * Returns an array of all the child component in the changes map
         * This will be used to identify which children components relative
         * to the root were modified
         *
         * @return Array ]
         */
        getChangedChildrenInstances : function() {
            var childrenInstances = $.map(this.changesMap, function(obj /* , key */) {
                return obj.childComponent;
            });
            return childrenInstances;
        },
        /**
         * Removes all the modified components from the Changes Tracker instance
         */
        commit : function() {
            var self = this;
            $.each(this.changesMap, function(key, mapEntry) {
                self.changesTracker.removeFromChangedComponents(mapEntry.changedComponents);
            });
        }
    });

    ChangesBag.classMembers({
        createInst : function(changesTracker, rootComponent, changedComponents) {
            var changesBag = new ChangesBag(changesTracker);
            changesBag.buildChangesMap(rootComponent, changedComponents);
            return changesBag;
        }
    });

    // Exporting module
    return ChangesBag;

});
