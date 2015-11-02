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
define( [
            'jquery',
            'ju-components/blocks/spinner/base'
        ],
        function (
            $,
            BaseSpinner
        ) {
    'use strict';

    var DEFAULT_SPINNER_CLASS = '.progress-overlay';

    /**
     * Uses an existing page spinner instead of creating a new one
     */
    var InpageSpinner = BaseSpinner.extend({
        init : function () {

            this.setOptions({
                containerClass : DEFAULT_SPINNER_CLASS
            });

            this._super.apply(this, arguments);
        },
        configureComponent : function () {
            this.$view = $(this.opts.containerClass);
            this.$view.toggle(true);
        },
        destroy : function () {
            // Do not destroy the current view since its a shared object in the page
            if (this.$view) {
                this.$view.toggle(false);
            }
        }
    });

    // Exporting module
    return InpageSpinner;

});
