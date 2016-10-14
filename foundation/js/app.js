/**
 * created by dongsh on 2016-10-11
 */
$(function () {
    function fastClick () {
        var supportTouch = function () {
            try {
                document.createEvent("TouchEvent");
                return true;
            } catch (e) {
                return false;
            }
        }();
        var _old$On = $.fn.on;

        $.fn.on = function () {
            // 只扩展支持touch的当前元素的click事件
            if ( /click/.test(arguments[0]) && typeof arguments[1] == 'function' && supportTouch ) { 
                var touchStartY, callback = arguments[1];
                _old$On.apply(this, ['touchstart', function (e) {
                    touchStartY = e.changedTouches[0].clientY;
                }]);
                _old$On.apply(this, ['touchend', function (e) {
                    if (Math.abs(e.changedTouches[0].clientY - touchStartY) > 10) return;

                    e.preventDefault();
                    callback.apply(this, [e]);
                }]);
            } else {
                _old$On.apply(this, arguments);
            }
            return this;
        };
    };

    function androidInputBugFix () {
        // .container 设置了 overflow 属性, 导致 Android 手机下输入框获取焦点时, 输入法挡住输入框的 bug
        // 相关 issue: https://github.com/weui/weui/issues/15
        // 解决方法:
        // 0. .container 去掉 overflow 属性, 但此 demo 下会引发别的问题
        // 1. 参考 http://stackoverflow.com/questions/23757345/android-does-not-correctly-scroll-on-input-focus-if-not-body-element
        //    Android 手机下, input 或 textarea 元素聚焦时, 主动滚一把
        if ( /Android/gi.test(navigator.userAgent) ) {
            window.addEventListener('resize', function () {
                if (document.activeElement.tagName == 'INPUT' || document.activeElement.tagName == 'TEXTAREA') {
                    window.setTimeout(function () {
                        document.activeElement.scrollIntoViewIfNeeded();
                    }, 0);
                }
            })
        }
    };

    function setJSAPI () {
        // wx.config({
        //     beta: true,
        //     debug: false,
        //     appId: res.appid,
        //     timestamp: res.timestamp,
        //     nonceStr: res.nonceStr,
        //     signature: res.signature,
        //     jsApiList: [
        //         'onMenuShareTimeline',
        //         'onMenuShareAppMessage',
        //         'onMenuShareQQ',
        //         'onMenuShareWeibo',
        //         'onMenuShareQZone',
        //         // 'setNavigationBarColor',
        //         'setBounceBackground'
        //     ]
        // });
        wx.ready(function () {
            
        });
    };

    function setPageManager () {
        pageManager.init()
    };

    function init () {
        fastClick();
        androidInputBugFix();
        setJSAPI();
        setPageManager();
    };

    // 域名配置
    var Conf = {
        domain: 'http://test.skykingstars.com/foundation/'
    };

    // 选择器
    var jQ = {
        $container: $('#container'),
        Tplbase: $('#tpl_base').html()
    };

    // 本地数据缓存
    var DB = {};

    // 页面导航功能
    var pageManager = {
        _configs: [],
        _currentPage: '#home',
        _pageIndex: 1,
        init: function () {
            var self = this;

            $(window).on('hashchange', function () {
                var state = history.state || {};
                var url = location.hash.indexOf('#') === 0 ? location.hash : '#home';
        
                if ( state._pageIndex <= self._pageIndex ) { 
                    self._back(url);
                } else {
                    self._go(url);
                }
            });

            if ( history.state && history.state._pageIndex ) {
                this._pageIndex = history.state._pageIndex;
            }

            history.replaceState && history.replaceState({_pageIndex: this._pageIndex}, '', location.href);

            return this;
        },
        push: function (config) {
            this._configs.push(config);
            return this;
        },
        go: function (url) {
            window.location.hash = '#' + url;
            return this;
        },
        _go: function (url) {
            var self = this;
            this._pageIndex ++;

            history.replaceState && history.replaceState({_pageIndex: this._pageIndex}, '', location.href);

            switch( url.substr(1, 4) ) {
                case 'list':
                    List.init(url);
                    break;
                case 'user':
                    
                    break;
            }

            return this;
        },
        back: function () {
            history.back();
        },
        _back: function (url) {
            var self = this;
            this._pageIndex --;
            
            $(this._currentPage).addClass('slideOut')
            .on('animationend webkitAnimationEnd', function () {
                $(url).addClass('js_show').removeClass('js_normal');
                $(this).addClass('js_normal').removeClass('slideOut js_show').off('animationend webkitAnimationEnd');
                switch( self._currentPage.substr(1, 4) ) {
                    case 'list':
                        List.remove();
                        break;
                    case 'user':
                        
                        break;
                }
                self._currentPage = url;
            });

            return this;
        },
        _find: function (key, value) {
            var page = null;
            for (var i = 0, len = this._configs.length; i < len; i++) {
                if (this._configs[i][key] === value) {
                    page = this._configs[i];
                    break;
                }
            }
            return page;
        }
    };

    // 搜索事件公用
    function searchEvent ($el) {
        $el.on('click', '.searchText', function () {
            $el.find('.searchBar').addClass('weui-search-bar_focusing');
            $el.find('.searchInput').focus();
        })
        .on('blur', '.searchInput', function () {
            if ( !this.value.length ) {
                $el.find('.searchInput').val('');
                $el.find('.searchBar').removeClass('weui-search-bar_focusing');
                $el.find('.searchText').show();
            }
        })
        .on('click', '.searchClear', function () {
            $el.find('.searchInput').val('').focus();
        })
        .on('click', '.searchCancel', function () {
            $el.find('.searchInput').val('').blur();
            $el.find('.searchBar').removeClass('weui-search-bar_focusing');
            $el.find('.searchText').show();
        });
    };

    // 联系人列表类
    var List = {
        tpl: _.template( $('#tpl_list').html() ),
        get: function (url) {
            var self = this;
            
            if ( DB[url] ) {
                self.$el.html( self.tpl({data: DB[url]}) );
                return this;
            }   
                     
            $.ajax({
                type: 'POST',
                url: Conf.domain + 'dept/' + url.substr(5),
                data: {},
                dataType: 'json',
                timeout: 2000,
                success: function (result) {
                    console.log(result.data);
                    var d = _.groupBy(result.data, 'pinyin');
                    DB[url] = d;
                    setTimeout(function () {
                        self.$el.html( self.tpl({data: d}) );
                    }, 200);
                },
                error: function (xhr, type) {
                    self.$el.find('.error').removeClass('f-hide')
                    .prev().remove();
                }
            });

            return this;
        },
        init: function (url) {
            var self = this;

            $(jQ.Tplbase).addClass('slideIn js_show').attr('id', url.substr(1))
            .appendTo(jQ.$container)
            .on('animationend webkitAnimationEnd', function () {
                $(pageManager._currentPage).removeClass('js_show').addClass('js_normal');
                $(this).removeClass('slideIn').off('animationend webkitAnimationEnd');
                pageManager._currentPage = url;
            });

            this.$el = $(url);
            this.get(url).initEvent();
        },
        _bind: function (type, selector, callback) {
            this.$el.on(type, selector, callback);
            return this;
        },
        initEvent: function () {
            searchEvent(this.$el);
            return this;
        },
        nameNav: function () {

        },
        remove: function () {
            this.$el.remove();
            return this;
        }
    };

    // 主页类
    var Home = {
        tpl: _.template( $('#tpl_home').html() ),
        get: function () {
            var self = this;

            $.ajax({
                type: 'GET',
                url: Conf.domain + 'dept',
                dataType: 'json',
                timeout: 2000,
                success: function (result) {
                    self.$el.html( self.tpl({data: result.data}) ); 
                    init();
                },
                error: function (xhr, type) {
                    self.$el.find('.error').removeClass('f-hide')
                    .prev().remove();
                }
            });

            return this;
        },
        init: function () {
            jQ.$container.append( $(jQ.Tplbase).addClass('js_normal').attr('id', 'home') );
            this.$el = $('#home');
            this.get().initEvent();
        },
        _bind: function (type, selector, callback) {
            this.$el.on(type, selector, callback);
            return this;
        },
        initEvent: function () {
            var self = this;

            this._bind('click', '.weui-cell', function () {
                var $next = $(this).next();

                if ( $next.length == 0 ) return false;
                
                if ( $next.hasClass('f-hide') ) {
                    $next.removeClass('f-hide');
                    $(this).find('i').addClass('icon-arrow').removeClass('icon');
                } else {
                    $next.addClass('f-hide');
                    $(this).find('i').addClass('icon').removeClass('icon-arrow');
                }
            })
            ._bind('click', '.weui-cell__bd', function () {
                if ( $(this).find('i').hasClass('icon-arrow-no') ) {
                    var id = $(this).data('id');
                    pageManager.go('list' + id);
                }
            });

            searchEvent(this.$el);

            return this;
        }
    };
    Home.init();
});