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
 * Base component specific for UI components
 */
define( [
            'jquery',
            'ju-components/base',
            'ju-components/util'
        ],
        function (
            $,
            BaseComponent,
            ComponentUtil
        ) {

    'use strict';

    // DOM properties and classes to manipulate
    var READONLY_CLASS_PREFIX = 'read-only';

    var BaseUIComponent = BaseComponent.extend({
        init : function () {

            this.setOptions({
                readOnly : false,
                visible : true,
                visibleOnEmptyData : true
            });

            this._super.apply(this, arguments);

            this.k = {
                dataEmpty : 'data-empty'
            };
        },
        setup : function () {
            if (this.opts.readOnly) {
               this.setOption('readOnly', true, true);
            }
            this._super.apply(this, arguments);

            this.toggleReadOnlyMode(this.$view);
            this.toggleVisibility();
        },
        /**
         * Transform value based on visibility
         */
        getData : function() {
            var value = this._super.apply(this, arguments);

            return  (this.opts.visible) ? value : undefined;
        },
        /**
         * Set initial state based on visibility
         */
        setData : function() {
            var data = (this.opts.visible) ? arguments : [null];
            this.processVisibleEmptyData(data);

            return this._super.apply(this, data);
        },
        /**
         * Options manager
         */
        setOption : function (option, value, recursive) {
            switch (option) {
                case 'readOnly':
                    this.onReadOnly(value);
                    break;
            }
            this._super.call(this, option, value, recursive);
        },
        /**
         * Read only
         */
        onReadOnly : function (readOnly) {
            this.opts.readOnly = readOnly || false;

            // Add read only to editable element
            if (this.t.$editableWrapper) {
                this.toggleReadOnlyMode(this.t.$editableWrapper);
            }

            // Add read only to component container
            if (this.$view !== null) {
                this.toggleReadOnlyMode(this.$view);
            }
        },
        toggleReadOnlyMode : function (view) {
            if (view && this.opts.readOnly) {
                view.toggleClass(READONLY_CLASS_PREFIX, this.opts.readOnly);
            }
        },
        /**
         * Visibility
         */
        onVisibility : function(visible) {
            // Store visibility for logics
            this.opts.visible = visible;

            // Change visibility
            this.$view.toggleClass(BaseUIComponent.HIDDEN, !visible);
        },
        toggleVisibility : function(show) {
            show = (typeof show !== 'undefined') ? show : this.opts.visible;
            this.onVisibility(show);
        },
        /**
         * Visible when data is empty
         */
        isEmptyData : function(data) {
            return ComponentUtil.isEmptyObject(data);
        },
        /**
         * Process visual changes on data emptyness checks (optimized for inheritance)
         * @param {object}  dataOrVisible    object: complex data for emptyness check of
         * @param {boolean} dataOrVisible    boolean: visibility change
         * @param {boolean} emptynessChecked avoid emptyness check if it was already done
         * @return {boolean} showHide visibility action taken
         */
        processVisibleEmptyData : function(dataOrVisible, emptynessChecked) {
            var showHide = dataOrVisible;

            // Check emptyness if not checked before
            if (!emptynessChecked) {
                showHide = (!this.opts.visible || this.isEmptyData(dataOrVisible));
            }

            // Visible on empty data
            if (!this.opts.visibleOnEmptyData) {
                this.$view.toggleClass(this.k.dataEmpty, showHide);
            }

             // transform to boolean
            return !!showHide;
        }
    });

    BaseUIComponent.classMembers({
        HIDDEN : 'hidden'
    });

    return BaseUIComponent;
});
