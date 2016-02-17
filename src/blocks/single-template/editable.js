
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
            'ju-components/blocks/editable',
            'ju-components/resource/storage/template-storage',
            'ju-shared/l10n'
        ],
        function(
            EditableComponent,
            TemplateStorage,
            L10n
        ) {

    'use strict';

    var RESOURCE_MAP = {
        cssFile : [
            'css/ju-components/blocks/single-template/editable'
        ]
    };

    var SingleTemplateEditableComponent = EditableComponent.extend({
        /**
         * @param args (array) bypass extended constructor arguments
         */
        init : function(args, templatePath, resourcesDef, childrenDef) {

            // Options
            this.setOptions({
                // Define a label to show on empty data
                emptytext : null
            });

            this._super.apply(this, args);

            this.setChildrenDefinition(childrenDef);

            this.addResources(resourcesDef);
            this.addResources(RESOURCE_MAP);

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

            // L10n labels
            this.appendL10n(this.opts.emptytext);
        },
        configureComponent : function() {
            // Single Template
            if (this.templatePath) {
                var template = TemplateStorage.getInst().get(this.templatePath);
                this.appendToView(template);
            }

            // Setup empty text label
            if (this.opts.emptytext) {
                // Mark template modifier
                this.$view.addClass('updateable-with-emptytext');

                // Simulate same anchor used by jquery editable
                var $a = $('<a>', {
                    class : 'editable editable-empty editable-template-emptytext',
                    tabindex : -1
                }).text(L10n.t(this.opts.emptytext));
                this.$view.append($a);
            }
        }
    });

    return SingleTemplateEditableComponent;

});
