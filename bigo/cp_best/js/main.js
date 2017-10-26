/*!
 * @project : 超课SDK活动之最佳CP人气榜
 * @version : 1.0
 * @author  : dongshaohan
 * @created : 2017-10-16 10:00
 */
function escapeHtml (str) {
    return (str+'').replace(/(<)|(>)/g, function(match, $1, $2){
        if ( $1 ) {
            return '&lt;';
        } else if ( $2 ){
            return '&gt;';
        }
    });
};

function parseTpl (data, tplStr) {
    var tpl = tplStr;
    var source = "var __t='';__t+='";
    var index = 0;
    tpl = tpl.replace(/\r|\n|\u2028|\u2029/g, '');
    tpl.replace(/<%=([\s\S]+?)%>|<%-([\s\S]+?)%>|<%([\s\S]+?)%>/g, function (match, str, escape, jsCode, offset) {
        source += tpl.slice(index, offset).replace(/'/g, '\\\'');
        index = offset + match.length;
        if (str) {
            source += "';\n__t+=" + str + ";\n__t+='";
        } else if (escape) {
            source += "';\n__t+=escapeHtml(" + escape + ");\n__t+='";
        } else if (jsCode) {
            source += "';\n" + jsCode + "\n__t+='";
        }
    });
    source += "';__t+='" + tpl.slice(index) + "';";
    source += 'return __t;';
    var func = new Function('obj', 'escapeHtml', source);
    return func.call(null, data, escapeHtml);
};

var utils = (function () {
	var doc = window.document;

	return {
		env: {
	        isIOS: /ip(hone|od|ad)/i.test(window.navigator.userAgent)
	    },
	    /*！判断版本 
	     * hello: { UA: Hello-Android/1544, Reg: /hello/i }
	     * hello sdk { UA: HelloSDK-Android/590130, Reg: /hellosdk/i }
	     * weixin { UA: MicroMessenger/6.5.4.1000 NetType/WIFI Language/zh_CN, Reg: /MicroMessenger/i }
	     * other
	     */
	    isHelloSDK: function () {
	    	return /hellosdk/i.test(window.navigator.userAgent);
	    },
	    isHello: function () {
	    	return /hello/i.test(window.navigator.userAgent);
	    },
	    setDocumentTitle: function (title) {
	        doc.title = title;
	        if (this.env.isIOS) {
	            var i = doc.createElement('iframe');
	            i.src = '/favicon.ico';
	            i.style.display = 'none';
	            i.onload = function() {
	                setTimeout(function(){
	                    i.remove();
	                    i=null;
	                }, 9)
	            };
	            doc.body.appendChild(i);
	        }
	    },
        // @param num:String
        numToChinese: function (num) {
            var china = new Array('零','一','二','三','四','五','六','七','八','九');  
            var arr = new Array();  
            var english = num.split("");

            for ( var i = 0; i < english.length; i++ ) {  
                arr[i] = china[english[i]];  
            }  
            return arr.join("");
        }
	}
})();

$(function () {
	var $ = Zepto;
    var token = '';
    var store = null, historyCur = null, historyAll = null, hisData = {};
    var listTpl = $('#listTpl').html(), $list = $('#listWrap');
    var historyTpl = $('#historyTpl').html();

    function showTips (msg) {
        var $tips = $('<div class="app-tips">').text(msg);
        $tips.appendTo('body');
        setTimeout(function(){
            $tips.remove();
        }, 2000);
    };
    // 1: 下载;2：提示
    function confirmTips (opt) {
        $('#wrap').removeClass('scroll-active');
        $('body').append( parseTpl(opt, $('#dialogTpl').html()) )

        .find('.q-dialog').on('click', '.q-btn', function () {
            opt.sureCB && opt.sureCB();
            $('#wrap').addClass('scroll-active');
            $(this).parents('.q-dialog').remove();
        });
    };

    // rule弹窗
    function ruleShow () {
        $('#wrap').removeClass('scroll-active');
        $('body').append( parseTpl(null, $('#ruleTpl').html()) )

        .find('.q-dialog').on('click', '.q-dialog-close', function () {
            $('#wrap').addClass('scroll-active');
            $(this).parents('.q-dialog').remove();
        });
    };

    // share弹窗
    function shareShow () {
        $('#wrap').removeClass('scroll-active');
        $('body').append( parseTpl(null, $('#shareTpl').html()) )

        .find('.q-dialog').on('click', '.q-dialog-close', function () {
            $('#wrap').addClass('scroll-active');
            $(this).parents('.q-dialog').remove();
        })
        .on('click', '.q-dialog-li', function () {
            var index = $('body > .q-dialog').find('.q-dialog-li').index( $(this) ) * 1 + 1;
            share(index);
        });
    };

    // 分享
    function share (channel) {
        var opt = {
            "title": "Hello语音48小时最佳CP人气榜快来帮我投一票！",
            "webpageUrl": location.href,
            "imgUrl": location.origin + "/act/cp_best/img/share-icon.jpg",
            "channel": channel,
            "type": 1,
            "description": "Hello语音48小时最佳CP人气榜，快来支持你喜欢的CP吧！"
        };
        KTVWeb.share(opt, function (res) {
            console.log("分享后回调数据", res);
            if ( res.code == 0 ) {
               
            } else {
                confirmTips({
                    title: res.msg,
                    type: 2
                });
            }
        });
    };

    function loadData () {
        var isType = utils.isHello() ? 1 : 2; // 1 hello app 2 分享页
        $.ajax({
            url: '/helloact/cktp/index',
            type: 'POST',
            dataType: 'json',
            data: { token: token, isShare: isType },
            success: function (ret) {
                if (ret && ret.code == 0) {
                    store = ret.data || {};
                    initIndex();
                } else {
                    confirmTips({
                        title: ret.msg,
                        type: 2
                    });
                }
            },
            error: function () {
                confirmTips({
                    title: '操作失败，请稍后重试',
                    type: 2
                });
            }
        });
        if ( isType == 1 ) {
            getHistory();
        }
    };

    // index
    function initIndex () {
        // 判断是否过期
        $('#above').append( parseTpl({status: store.status, all: store.all}, $('#headTpl').html()) );
        // 非过期
        if ( store.status != 0 ) {
            // 今日还剩X次机会
            $('#chance').text( store.chance );

            // 倒计时
            new countDown({
                unit: {
                    day: false,
                    hour: true,
                    minute: true,
                    second: true
                },
                fixServer: 60 * 1000,
                fixServerDate: true,
                now: store.currentTime * 1000,
                endTime: store.endTime * 1000,
                render: function (outstring) {
                    console.log (outstring);
                    $('#hour').text( outstring.hour );
                    $('#minute').text( outstring.minute );
                    $('#second').text( outstring.second );
                },
                end: function () {
                    window.location.reload();
                    console.log('the end!');
                }
            });
        } 

        // 月总榜 
        if ( store.all ) {
            utils.setDocumentTitle('最佳CP人气榜 月总榜');
            $('#below').find('.rank-now').addClass('all');
        } else {
            // 当前第几期
            $('#current').addClass('no' + store.maxType);
            utils.setDocumentTitle('最佳CP人气榜 第' + store.maxType + '周');
        }

        // 如不在hello打开 样式需做兼容调整
        if ( !utils.isHello() ) {
            $('#below').css('margin-top', '-2.5rem');
        }
        showList();
    };
    // history 
    function initHistory (ret) {
        hisData[ret.data.type] = ret.data.history;
        if ( $('#historyRank').length == 0 ) {
            $('#below').find('.rank').after('<div class="rank" id="historyRank"><div class="rank-history"></div><ul class="rank-ul" id="historyWrap"></ul></div>');
        }
        // 历史排行榜当前第几期 实时
        historyCur = +ret.data.type;

        // 历史排行榜当前第几期 总
        if ( !historyAll ) {
            historyAll = +ret.data.type;
        }
        showHistory();
    };

    function showList (showMore) {
        var list = store.current;
        if ( !showMore ) {
            list = list.slice(0, 4);
        }
        $list.html( parseTpl({list: list, status: store.status, all: store.all}, listTpl) );
    };

    function showHistory (showMore) {
        var history = hisData[historyCur];
        if ( !showMore ) {
            history = history.slice(0, 3);
        }
        $('#historyWrap').html( parseTpl({data: history, type: historyCur, all: historyAll}, historyTpl) );
    };

    // 获取历史排行榜接口
    function getHistory (type) {
        $.ajax({
            url: '/helloact/cktp/history',
            type: 'POST',
            dataType: 'json',
            data: { token: token, type: type || '' },
            success: function (ret) {
                if ( ret.code == 0 ) {
                    initHistory(ret);
                // 无历史排行榜情况
                } else if ( ret.code == -2 ) {

                } else if ( ret.code == 1 ) {
                    confirmTips({
                        title: ret.msg,
                        type: 2
                    });
                }
            },
            error: function () {
                confirmTips({
                    title: '操作失败，请稍后重试',
                    type: 2
                });
            }
        });
    };
    
    // 投票成功后重新排序
    function voteRank (index) {
        store.current[index].vote = +store.current[index].vote + 1;
        store.current[index].votestatus = 1;
        store.current.sort(function (a, b) {
            return b.vote - a.vote;
        });

        var chances = $('#chance').text() * 1;
        if ( chances > 0 ) {
            $('#chance').text( chances - 1 );
        }
        if ( $('#listWrap').find('.rank-btn').length == 0 ) {
            showList();
            return;
        }
        if ( $('#listWrap').find('.rank-btn').hasClass('opened') ) {
            showList(true);
        } else {
            showList();
        }
    };

    // 初始化
    (function init () {
        // 非hello 不出现分享与规则按钮
        if ( utils.isHello() ) {
            KTVWeb.getToken(function (data) {
                if ( data.token ) {
                    token = data.token;
                    loadData();
                } else {
                    // 如版本太低导致无法获取token 给予提示
                    confirmTips({
                        title: '<p>当前版本无法投票，</p><p>请下载最新版的Hello语音</p>',
                        type: 3
                    });
                }
            });
        } else {
            loadData();
        }
        FastClick.attach(document.body);
    })();

    // 监听事件
    // 规则
    $('#wrap').on('click', '.rule', ruleShow)
    // 分享
    .on('click', '.share', function () {
        if ( utils.isHelloSDK() ) {
            confirmTips({
                title: '<p>如需分享，</p><p>请下载完整版Hello语音哦~</p>',
                type: 1
            });
            return false;
        }
        shareShow();
    })
    // 历史排行榜下拉
    .on('click', function (e) {
        var $tar = $('#rank-select-ul');

        if ( e.target.className.indexOf('rank-select-btn') != -1 ) {
            if ( $tar.hasClass('none') ) {
                $tar.removeClass('none');
            } else {
                $tar.addClass('none');
            }
        } else {
            if ( !$tar.hasClass('none') ) {
                $tar.addClass('none');
            }
        }
    })
    // 历史排行榜下拉 选择期数
    .on('click', '.rank-select-li', function () {
        var index = $('#wrap').find('.rank-select-li').index( $(this) ) * 1 + 1;
        $(this).parent().addClass('none');

        if ( index == historyCur ) return false;
        if ( !hisData[index] ) {
            getHistory(index);
        } else {
            historyCur = index;
            showHistory();
        }
    })
    // 实时列表 点击查看更多
    .on('click', '.list-btn', function () {
        var showMore = false;
        if ( !$(this).hasClass('opened') ) {
            showMore = true;
        }
        showList(showMore);
    })
    // 历史列表 点击查看更多
    .on('click', '.history-btn', function () {
        var showMore = false;
        if ( !$(this).hasClass('opened') ) {
            showMore = true;
        }
        showHistory(showMore);
    })
    // 投票
    .on('click', '.rank-vote', function () {
        var self = $(this);

        if ( self.hasClass('voted') ) return false;
        if ( self.hasClass('disabled') ) return false;

        if ( !utils.isHello() ) {
            confirmTips({
                title: '<p>想向他们投票，</p><p>请下载Hello语音哦</p>',
                type: 1
            });
            return false;
        }
        if ( $('#chance').text() == 0 ) {
            confirmTips({
                title: '<p>您已投过3票了哦</p><p>明天可继续投票</p>',
                type: 2
            });
            return false;
        }

        var index = $('#listWrap').find('.rank-vote').index( $(this) );
        self.addClass('disabled');

        $.ajax({
            url: '/helloact/cktp/vote',
            type: 'POST',
            dataType: 'json',
            data: { cphelloid: self.parent().parent().data('id'), token: token },
            success: function (ret) {
                self.removeClass('disabled');
                if ( ret && ret.code == 0 ) {
                    voteRank(index);

                    confirmTips({
                        title: '投票成功',
                        type: 2
                    });
                } else {
                    confirmTips({
                        title: ret.msg,
                        type: 2
                    });
                }
            },
            error: function () {
                self.removeClass('disabled');
                confirmTips({
                    title: '操作失败，请稍后重试',
                    type: 2
                });
            }
        });
    });
});
(function(a,b){typeof exports==="object"&&typeof module!=="undefined"?module.exports=b():typeof define==="function"&&define.amd?define(b):a.countDown=b()})(this,function(){function g(h){this._queue=[];this.stop=false;this._createTimer(h)}g.prototype={constructor:g,_createTimer:function(i){var h=this;var j=true;(function(){var l=new Date();for(var k=0;k<h._queue.length;k++){h._queue[k]()}if(!h.stop){var m=new Date()-l;i=j?i:((m>i)?m-i:i);setTimeout(arguments.callee,i)}})();j=false},add:function(h){this._queue.push(h);this.stop=false;return this._queue.length-1},remove:function(h){this._queue.splice(h,1);if(!this._queue.length){this.stop=true}}};function a(){this._pool={}}a.prototype={constructor:a,getTimer:function(i){var h=this._pool[i];return h?h:(this._pool[i]=new g(i))},removeTimer:function(h){if(this._pool[h]){delete this._pool[h]}}};var f=1000;var d=new a().getTimer(f);function b(k){var h={unit:{day:true,hour:true,minute:true,second:true},fixServer:3*1000,fixServerDate:false,fixNox:20*1000,fixNowDate:false,now:new Date().valueOf(),clientTime:new Date().getTime(),render:function(i){console.log(i)},end:function(){console.log("the end!")},endTime:new Date().valueOf()+5*1000*60};for(var j in h){if(h.hasOwnProperty(j)){this[j]=k[j]||h[j]}}this.init()}b.prototype={constructor:b,init:function(){var i=this;if(this.fixServerDate){var h=new g(this.fixServer);h.add(function(){i.getServerTime(function(k){i.now=k})})}else{if(this.fixNowDate){var h=new g(this.fixNox);h.add(function(){i.now=i.getNowTime()})}}var j=d.add(function(){i.now+=f;if(i.now>=i.endTime){d.remove(j);i.end()}else{i.render(i.getOutString())}})},getOutString:function(){return e(this.endTime,this.now,this.unit)},getServerTime:function(h){var i=new XMLHttpRequest();i.open("get","/",true);i.onreadystatechange=function(){if(i.readyState===3){var j=i.getResponseHeader("Date");h(new Date(j).valueOf())}};i.send(null)},getNowTimer:function(){return this.now+(new Date().getTime()-this.clientTime)}};function c(h){var i=parseInt(h,10);return i<10?"0"+i:i}function e(l,k,j){var i={};var h={day:24*60*60*1000,hour:60*60*1000,minute:60*1000,second:1000};var m=0;if(j.day){i.day=c(Math.floor((l-k-m)/h.day));m+=i.day*h.day}if(j.hour){i.hour=c(Math.floor((l-k-m)/h.hour));m+=i.hour*h.hour}if(j.minute){i.minute=c(Math.floor((l-k-m)/h.minute));m+=i.minute*h.minute}if(j.second){i.second=c(Math.floor((l-k-m)/h.second));m+=i.second*h.second}return i}return b});
function FastClick(f,c){var g;c=c||{};this.trackingClick=false;this.trackingClickStart=0;this.targetElement=null;this.touchStartX=0;this.touchStartY=0;this.lastTouchIdentifier=0;this.touchBoundary=c.touchBoundary||10;this.layer=f;this.tapDelay=c.tapDelay||200;if(FastClick.notNeeded(f)){return}function h(j,i){return function(){return j.apply(i,arguments)}}var b=["onMouse","onClick","onTouchStart","onTouchMove","onTouchEnd","onTouchCancel"];var e=this;for(var d=0,a=b.length;d<a;d++){e[b[d]]=h(e[b[d]],e)}if(deviceIsAndroid){f.addEventListener("mouseover",this.onMouse,true);f.addEventListener("mousedown",this.onMouse,true);f.addEventListener("mouseup",this.onMouse,true)}f.addEventListener("click",this.onClick,true);f.addEventListener("touchstart",this.onTouchStart,false);f.addEventListener("touchmove",this.onTouchMove,false);f.addEventListener("touchend",this.onTouchEnd,false);f.addEventListener("touchcancel",this.onTouchCancel,false);if(!Event.prototype.stopImmediatePropagation){f.removeEventListener=function(j,l,i){var k=Node.prototype.removeEventListener;if(j==="click"){k.call(f,j,l.hijacked||l,i)}else{k.call(f,j,l,i)}};f.addEventListener=function(k,l,j){var i=Node.prototype.addEventListener;if(k==="click"){i.call(f,k,l.hijacked||(l.hijacked=function(m){if(!m.propagationStopped){l(m)}}),j)}else{i.call(f,k,l,j)}}}if(typeof f.onclick==="function"){g=f.onclick;f.addEventListener("click",function(i){g(i)},false);f.onclick=null}}var deviceIsAndroid=navigator.userAgent.indexOf("Android")>0;var deviceIsIOS=/iP(ad|hone|od)/.test(navigator.userAgent);var deviceIsIOS4=deviceIsIOS&&(/OS 4_\d(_\d)?/).test(navigator.userAgent);var deviceIsIOSWithBadTarget=deviceIsIOS&&(/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);var deviceIsBlackBerry10=navigator.userAgent.indexOf("BB10")>0;FastClick.prototype.needsClick=function(a){switch(a.nodeName.toLowerCase()){case"button":case"select":case"textarea":if(a.disabled){return true}break;case"input":if((deviceIsIOS&&a.type==="file")||a.disabled){return true}break;case"label":case"video":return true}return(/\bneedsclick\b/).test(a.className)};FastClick.prototype.needsFocus=function(a){switch(a.nodeName.toLowerCase()){case"textarea":return true;case"select":return !deviceIsAndroid;case"input":switch(a.type){case"button":case"checkbox":case"file":case"image":case"radio":case"submit":return false}return !a.disabled&&!a.readOnly;default:return(/\bneedsfocus\b/).test(a.className)}};FastClick.prototype.sendClick=function(b,c){var a,d;if(document.activeElement&&document.activeElement!==b){document.activeElement.blur()}d=c.changedTouches[0];a=document.createEvent("MouseEvents");a.initMouseEvent(this.determineEventType(b),true,true,window,1,d.screenX,d.screenY,d.clientX,d.clientY,false,false,false,false,0,null);a.forwardedTouchEvent=true;b.dispatchEvent(a)};FastClick.prototype.determineEventType=function(a){if(deviceIsAndroid&&a.tagName.toLowerCase()==="select"){return"mousedown"}return"click"};FastClick.prototype.focus=function(a){var b;if(deviceIsIOS&&a.setSelectionRange&&a.type.indexOf("date")!==0&&a.type!=="time"){b=a.value.length;a.setSelectionRange(b,b)}else{a.focus()}};FastClick.prototype.updateScrollParent=function(b){var c,a;c=b.fastClickScrollParent;if(!c||!c.contains(b)){a=b;do{if(a.scrollHeight>a.offsetHeight){c=a;b.fastClickScrollParent=a;break}a=a.parentElement}while(a)}if(c){c.fastClickLastScrollTop=c.scrollTop}};FastClick.prototype.getTargetElementFromEventTarget=function(a){if(a.nodeType===Node.TEXT_NODE){return a.parentNode}return a};FastClick.prototype.onTouchStart=function(c){var a,d,b;if(c.targetTouches.length>1){return true}a=this.getTargetElementFromEventTarget(c.target);d=c.targetTouches[0];if(deviceIsIOS){b=window.getSelection();if(b.rangeCount&&!b.isCollapsed){return true}if(!deviceIsIOS4){if(d.identifier===this.lastTouchIdentifier){c.preventDefault();return false}this.lastTouchIdentifier=d.identifier;this.updateScrollParent(a)}}this.trackingClick=true;this.trackingClickStart=c.timeStamp;this.targetElement=a;this.touchStartX=d.pageX;this.touchStartY=d.pageY;if((c.timeStamp-this.lastClickTime)<this.tapDelay){c.preventDefault()}return true};FastClick.prototype.touchHasMoved=function(a){var c=a.changedTouches[0],b=this.touchBoundary;if(Math.abs(c.pageX-this.touchStartX)>b||Math.abs(c.pageY-this.touchStartY)>b){return true}return false};FastClick.prototype.onTouchMove=function(a){if(!this.trackingClick){return true}if(this.targetElement!==this.getTargetElementFromEventTarget(a.target)||this.touchHasMoved(a)){this.trackingClick=false;this.targetElement=null}return true};FastClick.prototype.findControl=function(a){if(a.control!==undefined){return a.control}if(a.htmlFor){return document.getElementById(a.htmlFor)}return a.querySelector("button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea")};FastClick.prototype.onTouchEnd=function(c){var e,d,b,g,f,a=this.targetElement;if(!this.trackingClick){return true}if((c.timeStamp-this.lastClickTime)<this.tapDelay){this.cancelNextClick=true;
return true}this.cancelNextClick=false;this.lastClickTime=c.timeStamp;d=this.trackingClickStart;this.trackingClick=false;this.trackingClickStart=0;if(deviceIsIOSWithBadTarget){f=c.changedTouches[0];a=document.elementFromPoint(f.pageX-window.pageXOffset,f.pageY-window.pageYOffset)||a;a.fastClickScrollParent=this.targetElement.fastClickScrollParent}b=a.tagName.toLowerCase();if(b==="label"){e=this.findControl(a);if(e){this.focus(a);if(deviceIsAndroid){return false}a=e}}else{if(this.needsFocus(a)){if((c.timeStamp-d)>100||(deviceIsIOS&&window.top!==window&&b==="input")){this.targetElement=null;return false}this.focus(a);this.sendClick(a,c);if(!deviceIsIOS||b!=="select"){this.targetElement=null;c.preventDefault()}return false}}if(deviceIsIOS&&!deviceIsIOS4){g=a.fastClickScrollParent;if(g&&g.fastClickLastScrollTop!==g.scrollTop){return true}}if(!this.needsClick(a)){c.preventDefault();this.sendClick(a,c)}return false};FastClick.prototype.onTouchCancel=function(){this.trackingClick=false;this.targetElement=null};FastClick.prototype.onMouse=function(a){if(!this.targetElement){return true}if(a.forwardedTouchEvent){return true}if(!a.cancelable){return true}if(!this.needsClick(this.targetElement)||this.cancelNextClick){if(a.stopImmediatePropagation){a.stopImmediatePropagation()}else{a.propagationStopped=true}a.stopPropagation();a.preventDefault();return false}return true};FastClick.prototype.onClick=function(a){var b;if(this.trackingClick){this.targetElement=null;this.trackingClick=false;return true}if(a.target.type==="submit"&&a.detail===0){return true}b=this.onMouse(a);if(!b){this.targetElement=null}return b};FastClick.prototype.destroy=function(){var a=this.layer;if(deviceIsAndroid){a.removeEventListener("mouseover",this.onMouse,true);a.removeEventListener("mousedown",this.onMouse,true);a.removeEventListener("mouseup",this.onMouse,true)}a.removeEventListener("click",this.onClick,true);a.removeEventListener("touchstart",this.onTouchStart,false);a.removeEventListener("touchmove",this.onTouchMove,false);a.removeEventListener("touchend",this.onTouchEnd,false);a.removeEventListener("touchcancel",this.onTouchCancel,false)};FastClick.notNeeded=function(b){var a;var d;var c;if(typeof window.ontouchstart==="undefined"){return true}d=+(/Chrome\/([0-9]+)/.exec(navigator.userAgent)||[,0])[1];if(d){if(deviceIsAndroid){a=document.querySelector("meta[name=viewport]");if(a){if(a.content.indexOf("user-scalable=no")!==-1){return true}if(d>31&&document.documentElement.scrollWidth<=window.outerWidth){return true}}}else{return true}}if(deviceIsBlackBerry10){c=navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);if(c[1]>=10&&c[2]>=3){a=document.querySelector("meta[name=viewport]");if(a){if(a.content.indexOf("user-scalable=no")!==-1){return true}if(document.documentElement.scrollWidth<=window.outerWidth){return true}}}}if(b.style.msTouchAction==="none"){return true}return false};FastClick.attach=function(b,a){return new FastClick(b,a)};if(typeof define=="function"&&typeof define.amd=="object"&&define.amd){define(function(){return FastClick})}else{if(typeof module!=="undefined"&&module.exports){module.exports=FastClick.attach;module.exports.FastClick=FastClick}else{window.FastClick=FastClick}};
