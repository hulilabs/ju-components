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
 * Save strategy : Changed
 */
define([
            'jquery',
            'ju-components/flows/save/strategy',
            'ju-components/flows/save/changes-tracker/changed'
        ],
        function(
            $,
            SaveStrategy,
            ChangedTracker
        ) {
    'use strict';

    var SaveChangedStrategy = SaveStrategy.extend({
        init : function() {
            this.setOptions({
                tracker : ChangedTracker
            });

            this._super.apply(this, arguments);
        },
        saveData : function(onSuccess) {
            // Select strategy to collect then unsaved data
            var self = this,
                component = this.component,
                changesBag = this.getTracker().getChangesBag(component),
                changedChildren = changesBag.getChangedChildrenInstances(),
                data = component.getData(changedChildren),
                savePromise = component.saveHandler.submitDataToServer(data, onSuccess);

            savePromise.then(function(response) {
                // Commits the set of changes
                changesBag.commit();
                self.onSaveSuccess(response);
                component.saveHandler.onSaveSuccess(response);
            });

            return savePromise;
        },
        /**
         * Mark components with data as changed in the changes tracker
         */
        markComponentsWithData : function(data) {
            var component = this.component,
                changesTracker = this.getTracker();

            if (!data || !changesTracker || !component.getComponents()) {
                return;
            }

            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var childComp = component.c(key);
                    if (childComp) {
                        changesTracker.modifiedHandler(childComp);
                    }
                }
            }
        }
    });

    // Exporting module
    return SaveChangedStrategy;

});
