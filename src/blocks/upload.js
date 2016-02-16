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
 * Uploading area (droppable)
 * @plugin: http://www.dropzonejs.com/ - AWS-friendly
 *
 * @note: This class does not handle the instantion of the
 *        plugin, so custom implementations must be done
 */
define([
            'ju-components/blocks/single-template/base',
            'ju-components/resource/storage/context-storage',
            // Unmapped imports
            'dropzone'
        ],
        function(
            SingleTemplateComponent
        ) {

    'use strict';

    var RESOURCE_MAP = {
        l10n : [
            'dropzone_default_message',
            'dropzone_fallback_message',
            'dropzone_invalid_file_type',
            'dropzone_file_too_big',
            'dropzone_response_error',
            'dropzone_no_file_error',
            'dropzone_cancel_upload',
            'dropzone_cancel_upload_title',
            'dropzone_cancel_upload_confirmation',
            'dropzone_remove_file',
            'dropzone_remove_file_title',
            'dropzone_remove_file_confirmation',
            'dropzone_max_files_exceeded',
            'dropzone_cancel_upload_btn_yes',
            'dropzone_cancel_upload_btn_no'
        ],
        cssFile : [
            'css/vendor/dropzone/basic'
        ]
    };

    var UploadAreaComponent = SingleTemplateComponent.extend({
        init : function(args, templatePath, resourcesDef, childrenDef) {

            // Default optins
            this.setOptions({
                dropzoneID : null,
            });

            this._super.call(this, args, templatePath, resourcesDef, childrenDef);

            this.addResources(RESOURCE_MAP);

            // Selectors
            this.S = {
                dropzoneForm : 'form'
            };

            // Dropzone setup
            this.setupDropzoneDefaults();
            this.dropzone = null;

            // Empty model
            this.model = {};
        },
        /**
         * Retrieve dropzone object
         * @warn dropzone might be DOM object if browser does not provide support
         */
        getDropzone : function() {
            return (this.dropzone instanceof HTMLElement) ? null : this.dropzone;
        },
        /**
         * Standard way to retrieve the dropzone form
         */
        getDropzoneForm : function() {
            var $form = this.$view.find(this.S.dropzoneForm) || this.t.$dropzoneForm;

            if (!$form.length) {
                Logger.error('UploadAreaComponent: no dropzone form was found');
            }

            return $form;
        },
        /**
         * Dropzone defaults
         * @warn avoid use on pages with multiple dropzone instances
         */
        setupDropzoneDefaults : function() {
            // nothing
        },
        /**
         * Meant to be overwritten for a custom implementation of the dropzone setup
         * @abstract
         */
        setupDropzone : function() {
            // Set id for dropzone autodiscover
            this.getDropzoneForm().attr('id', this.opts.dropzoneID);

            // Sample dropzone instantiation
            // this.dropzone = new Dropzone('#' + this.opts.dropzoneID, {
            //     // MESSAGES
            //     dictDefaultMessage : L10n.t('dropzone_default_message'),
            //     dictFallbackMessage : L10n.t('dropzone_fallback_message'),
            //     dictFallbackText : L10n.t('dropzone_fallback_message'),
            //     dictInvalidFileType : L10n.t('dropzone_invalid_file_type'),
            //     dictFileTooBig : L10n.t('dropzone_file_too_big'),
            //     dictResponseError : L10n.t('dropzone_response_error'),
            //     dictCancelUpload : L10n.t('dropzone_cancel_upload'),
            //     dictCancelUploadConfirmation : L10n.t('dropzone_cancel_upload_confirmation'),
            //     dictRemoveFile : L10n.t('dropzone_remove_file'),
            //     dictRemoveFileConfirmation : L10n.t('dropzone_remove_file_confirmation'),
            //     dictMaxFilesExceeded : L10n.t('dropzone_max_files_exceeded')
            // });
        },
        getData : function() {
            return;
        },
        getDataForParent : function() {
            return this.model;
        }
    });

    UploadAreaComponent.classMembers({
        EV : {
            FILE_ADDED : 'fileAdded'
        }
    });

    return UploadAreaComponent;

});
