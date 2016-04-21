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
 * Save strategy : Immediate
 */
define([
            'jquery',
            'ju-components/data-flow/save/strategy',
            'ju-components/data-flow/save/changes-tracker',
            'ju-components/data-flow/save/changes-tracker/immediate'
        ],
        function(
            $,
            SaveStrategy,
            ChangesTracker,
            ImmediateTracker
        ) {
    'use strict';

    var SaveImmediateStrategy = SaveStrategy.extend({
        init : function() {
            this.setOptions({
                tracker : ImmediateTracker
            });

            this._super.apply(this, arguments);
        },
        setup : function() {
            this._super.apply(this, arguments);

            // Listening all changed event
            // for any event, autosave the changed data
            // no need to store data in a collector
            this.getTracker().on(ChangesTracker.EV.COMPONENT_CHANGED, $.proxy(this.saveData, this));
        },
        // saveData : function(onSuccess) {
        //     var component = this.component,
        //         data = component.getData(),
        //         savePromise = this.opts.submitDataToServer(data, onSuccess);

        //     savePromise.then($.proxy(this.onSaveSuccess, this));
        //     //     function(response) {
        //     //     self.onSaveSuccess(response);
        //     //     component.saveHandler.onSaveSuccess(response);
        //     // });

        //     return savePromise;
        // }
    });

    // Exporting module
    return SaveImmediateStrategy;
});
