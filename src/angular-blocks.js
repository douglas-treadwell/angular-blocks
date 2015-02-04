/* global angular */
(function () {
    'use strict';

    function extendTemplate($templateCache, $compile, $http, $q, $log) {

        function warnMissingBlock(name, src) {
            $log.warn('Failed to find data-block=' + name + ' in ' + src);
        }

        return {
            compile: function (tElement, tAttrs) {
                var src = tAttrs.extendTemplate;
                if (!src) {
                    throw 'Template not specified in extend-template directive';
                }
                // Clone and then clear the template element to prevent expressions from being evaluated
                var $clone = tElement.clone();
                tElement.html('');

                var loadTemplate = $http.get(src, {cache: $templateCache})
                    .then(function (response) {
                        var template = response.data;
                        var $template = $(document.createElement('div')).html(template);

                        function override(method, $block, attr) {
                            var name = $block.attr(attr);
                            var $blockReplace = $block;
                          
                            if(method === 'replaceWith') {
                              $blockReplace = function() {
                                var $clonedBlock = $block.clone();
                                //copy attributes first
                                var attributes = $(this).prop("attributes");
                                angular.forEach(attributes, function(attribute) {
                                  $clonedBlock.attr(attribute.name, attribute.value);
                                });
                              };
                            }
                          
                            if ($template.find('[data-block="' + name + '"]')[method]($blockReplace).length === 0 &&
                                $template.find('[data-extend-template]').append($block).length === 0) {
                                warnMissingBlock(name, src);
                            }
                        }

                        // Replace overridden blocks
                        $clone.children('[data-block]').each(function () {
                            override('replaceWith', $(this), 'data-block');
                        });

                        // Insert prepend blocks
                        $clone.children('[data-block-prepend]').each(function () {
                            override('prepend', $(this), 'data-block-prepend');
                        });

                        // Insert append blocks
                        $clone.children('[data-block-append]').each(function () {
                            override('append', $(this), 'data-block-append');
                        });

                        // Insert before blocks
                        $clone.children('[data-block-before]').each(function () {
                            override('before', $(this), 'data-block-before');
                        });

                        // Insert after blocks
                        $clone.children('[data-block-after]').each(function () {
                            override('after', $(this), 'data-block-after');
                        });

                        return $template;
                    }, function () {
                        var msg = 'Failed to load template: ' + src;
                        $log.error(msg);
                        return $q.reject(msg);
                    });


                return function ($scope, $element) {
                    loadTemplate.then(function ($template) {
                        $element.html($template.html());
                        $compile($element.contents())($scope);
                    });
                };
            }
        };
    }

    angular.module('angular-blocks', [])
        .directive('extendTemplate', ['$templateCache', '$compile', '$http', '$q', '$log', extendTemplate]);
}());
