

require([
            'require',
            'jquery',
            'ju-shared/logger'
        ],
        function(
                    require,
                    $,
                    Logger
                )
{
    'use strict';

    require(['/js/require-config.js'], function () {

        /**
         * Dashboard initialization function
         */
        var init = function()
        {

            $.ajax({
                url: 'https://api.twitter.com/1.1/search/tweets.json?q=from%3ACmdr_Hadfield%20%23nasa&result_type=popular',
                success: function () {
                    log('Here is the data');
                },
                xhrFields: {
                    withCredentials: true
                }
            });
            log('Playground - Components main init');

            var $insertionPoint = $('.component-container');

            require([ 'onboarding/login/component' ], function (PhoneEditor) {

                log('got the component...');
                var compInst = new PhoneEditor();
                compInst.isRootComponent = true;

                compInst.load($insertionPoint);

            });

        };

        // Application bootstrap
        $(init);


    });



});
