
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
 * Single Template
 */
define([
            'ju-components/blocks/base-ui',
            'ju-components/resource/storage/template-storage'
        ],
        function(
            BaseUIComponent,
            TemplateStorage
        ) {

    'use strict';

    var SingleTemplateComponent = BaseUIComponent.extend({
        /**
         * @param args (array) bypass extended constructor arguments
         */
        init : function(args, template, resourcesDef, childrenDef) {
            this._super.apply(this, args);

            this.setChildrenDefinition(childrenDef);

            this.addResources(resourcesDef);

            // Single Template
            if (template) {
                // template path is now actual template
                this.template = template;
            }
        },
        configureComponent : function() {
            // Single Template
            if (this.template) {
                this.appendToView(this.template);
            }
        }
    });

    return SingleTemplateComponent;

});
