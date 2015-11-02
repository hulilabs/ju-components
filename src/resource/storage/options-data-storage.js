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
 * Application config client-side module
 * This layer provides access to server side application settings
 */
define( [
            'jquery',
            'ju-shared/client-vars-manager'
        ],
        function (
            $,
            ClientVarsManager
        ) {
    'use strict';

    /**
     * App config manager in the client side
     * Contains application settings coming from the server side
     */
    var OptionsDataStorage = ClientVarsManager.extend({

    });

    // Keys comming from the server side
    var keys = {
        APP_LANGUAGES : 'app_languages',
        APPOINTMENT_STATUSES : 'appointment_statuses',
        BLOOD_TYPES : 'blood_types',
        PAYMENT_METHOD : 'payment_method',
        COUNTRIES : 'countries',
        ID_TYPES : 'id_types',
        MARITAL_STATUSES : 'marital_statuses',
        DRUG_FREQUENCIES : 'drug_frequencies',
        DRUG_CONSUMPTION_TIMES : 'drug_consumption_times',
        DRUG_SUSPENSION_TIMES : 'drug_suspension_times',
        HULI_PLANS : 'huli_plans',
        LANGUAGES: 'app_languages',
        MEDICATION_DOSES : 'drug_frequencies',
        MEDICATION_ROUTES : 'medication_routes',
        PHONE_TYPE : 'phone_type',
        PERSONAL_RELATIONSHIPS : 'personal_relationships',
        PATHOLOGIES_CLASSIFICATIONS : 'ehr_pathologies_classifications',
        USES_AGENDA_STATUS : 'uses_agenda',
        CLINIC_COLORS : 'clinic_colors',
        DOCTOR_COLORS : 'doctor_colors',
        DOCUMENTS_SORT_OPTIONS : 'documents_sort_options',
        PREGNANCY_OUTCOMES : 'pregnancy_outcomes',
        DELIVERY_TYPES : 'patient_delivery_types',
        TERM_CLAS : 'term_clas',
        WEIGHT_CLAS : 'weight_clas'
    };

    OptionsDataStorage.classMembers({
        k : keys
    });

    // Exports
    return OptionsDataStorage;

});
