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
 * Spiner test
 */
define([
            'jquery',
            'ju-components/blocks/base-ui'
        ],
        function(
            $,
            BaseUI
        ) {

    'use strict';

    var BaseSpinner = BaseUI.extend({

    });

    BaseSpinner.classMembers({
        createStandaloneInstance : function(SpinnerClass, $insertionPoint) {
            var spinnerInst = new SpinnerClass({
                visible : false
            });
            spinnerInst.isRootComponent = true;
            var promise = spinnerInst.load($insertionPoint).then(function() {
                return spinnerInst;
            });

            return promise;
        }
    });

    // Exporting module
    return BaseSpinner;

});
