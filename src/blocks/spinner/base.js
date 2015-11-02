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
            'ju-components/blocks/base-ui'
        ],
        function (
            $,
            BaseUI
        ) {

    'use strict';

    var BaseSpinner = BaseUI.extend({

    });

    // Exporting module
    return BaseSpinner;

});
