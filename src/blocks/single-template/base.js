
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
 * Lightweight implementation directly from base component
 */
define( [
            'ju-components/base',
            'ju-components/resource/storage/template-storage'
        ],
        function (
            BaseComponent,
            TemplateStorage
        ) {

    'use strict';

    var SingleTemplateBaseComponent = BaseComponent.extend({
    	/**
    	 * @param args (array) bypass extended constructor arguments
    	 */
        init : function(args, templatePath, resourcesDef, childrenDef) {
            this._super.apply(this, args);

            this.childrenDef = childrenDef;

            this.addResources(resourcesDef);

            // Single Template
            if (templatePath) {
                // Define template
                this.addResources({
                    template : [
                        templatePath
                    ]
                });
                this.templatePath = templatePath;
            }
        },
        configureComponent : function () {
            // Single Template
            if (this.templatePath) {
                var template = TemplateStorage.getInst().get(this.templatePath);
                this.appendToView(template);
            }
        }
    });

    return SingleTemplateBaseComponent;

});
