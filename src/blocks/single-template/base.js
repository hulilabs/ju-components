
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
define( [
            'ju-components/blocks/base-ui',
            'ju-components/resource/storage/template-storage'
        ],
        function (
            BaseUIComponent,
            TemplateStorage
        ) {

    'use strict';

    var SingleTemplateComponent = BaseUIComponent.extend({
    	/**
    	 * @param args (array) bypass extended constructor arguments
    	 */
        init : function(args, templatePath, resourcesDef, childrenDef) {
            this._super.apply(this, args);

            this.childrenDef = childrenDef;

            this.addResources(resourcesDef);

            this.addResources({
                template : [
                    templatePath
                ]
            });

            this.templatePath = templatePath;
        },
        configureComponent : function () {
            var template = TemplateStorage.getInst().get(this.templatePath);
            this.appendToView(template);
        }
    });

    return SingleTemplateComponent;

});
