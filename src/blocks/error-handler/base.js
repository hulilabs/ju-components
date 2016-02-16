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
            'ju-components/base',
            'ju-components/resource/css-loader',
            // Pre-load resources
            'text!ju-components/blocks/error-handler/style.css',
            'text!ju-components/blocks/error-handler/template.html'
        ],
        function(
            $,
            BaseComponent,
            CssLoader,
            // Pre-load resources
            stylesText,
            template
        ) {

    'use strict';

    var BaseErrorHandler = BaseComponent.extend({
        init : function() {
            this.S = {
                reloadPage : '.reload-page'
            };
            this._super.apply(this, arguments);
        },
        configureComponent : function() {
            this.appendToView(template);
            CssLoader.getInst().appendInlineStyles(stylesText, this.$insertionPoint);
        },
        bindEvents : function() {
            this.t.$reloadPage.on('click', function() {
                window.location.reload();
            });
        }
    });

    // Exporting module
    return BaseErrorHandler;

});
