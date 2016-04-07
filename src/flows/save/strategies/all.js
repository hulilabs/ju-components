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
 * Save strategy : All
 */
define([
            'jquery',
            'ju-components/flows/save/strategy'
        ],
        function(
            $,
            SaveStrategy
        ) {
    'use strict';

    /**
     * Always save the whole data structure from a root component
     *
     * ALL strategy uses a base changes tracker
     * (no custom modified handler, neither requires a bag, etc)
     */
    var SaveAllStrategy = SaveStrategy.extend({
        saveData : function(onSuccess) {
            var self = this,
                component = this.component,
                data = component.getData(),
                savePromise = component.saveHandler.submitDataToServer(data, onSuccess);

            savePromise.then(function(response) {
                self.onSaveSuccess(response);
                component.saveHandler.onSaveSuccess(response);
            });

            return savePromise;
        }
    });

    // Exporting module
    return SaveAllStrategy;

});
