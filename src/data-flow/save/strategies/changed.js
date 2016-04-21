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
            'ju-components/data-flow/save/strategy',
            'ju-components/data-flow/save/changes-tracker/changed'
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

        /**
         * Initializes strategy with custom data
         * @param  {Object} dataModel follows structure of a component tree the strategy is associated to
         */
        initializeWithDataModel : function(dataModel) {
            this._markComponentsAsChanges(dataModel);
        },

        /**
         * Mark components with data as changed in the changes tracker
         */
        _markComponentsAsChanges : function(dataMap) {
            var component = this.component,
                changesTracker = this.getTracker();

            if (!dataMap || !changesTracker || !component.getComponents()) {
                return;
            }

            for (var key in dataMap) {
                if (dataMap.hasOwnProperty(key)) {
                    var childComp = component.c(key);
                    if (childComp) {
                        changesTracker.modifiedHandler(childComp);
                    }
                }
            }
        },

        onSaveSuccess : function() {
            var changesBag = this.getTracker().getChangesBag(this.component);
            changesBag.commit();
        },

        getDataForSubmission : function(component) {
            var changesBag = this.getTracker().getChangesBag(component),
                changedChildren = changesBag.getChangedChildrenInstances(),
                data = component.getData(changedChildren);

            return data;
        }
    });

    // Exporting module
    return SaveChangedStrategy;

});
