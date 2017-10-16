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
        }else if($2){
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
	        isIOS: /ip(hone|od|ad)/i.test(navigator.userAgent)
	    },
		/*
	    * 格式化以秒为单位的时间
	    * y年，m 月份， d 天， h 小时， i 分钟， s秒
	    * 第一个为有前导零，第二个无，分钟和秒，没有无前导零形式
	    * */
	    formatTime: function (unixTime, format) {
	        let time = unixTime * 1000; 
	        time = time || 0;
	        let date = new Date;
	        date.setTime(time);
	        let Y = date.getFullYear(),
	            M = date.getMonth() + 1,
	            D = date.getDate(),
	            H = date.getHours(),
	            I = date.getMinutes(),
	            S = date.getSeconds();

	        M = M < 10 ? '0' + M : M;
	        D = D < 10 ? '0' + D : D;
	        H = H < 10 ? '0' + H : H;
	        I = I < 10 ? '0' + I : I;
	        S = S < 10 ? '0' + S : S;

	        format = format || '';

	        let formated = format.replace(/y/g, Y).replace(/m/g, M).replace(/d/g, D)
	            .replace(/h/g, H).replace(/i/g, I).replace(/s/g, S);
	        return formated;
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
	    }
	}
})();

$(function () {
	var $ = Zepto;
    var token = '';
    var store = null;
    KTVWeb.getVersion(function (version) {
    	alert(JSON.stringify(version));
    });
    alert(window.navigator.userAgent)
    return;
    function showTips (msg) {
        var $tips = $('<div class="app-tips">').text(msg);
        $tips.appendTo('body');
        setTimeout(function(){
            $tips.remove();
        }, 2000);
    };

    // 倒计时
    function countdown (time, startT) {
	    if ( !startT ) startT = Date.now();
	    var diff = time + startT - Date.now();

	    if ( diff > 0 ) {
	        var s = Math.floor( diff / 1000 % 60 );
	        var m = Math.floor( diff / 1000 / 60 % 60 );
	        var h = Math.floor( diff / 1000 / 60 / 60 % 24 );

	        h = h > 9 ? h : '0' + h;
	        m = m > 9 ? m : '0' + m;
	        s = s > 9 ? s : '0' + s;

	        var str = h + ':' + m + ':' + s;
	        console.log(str);
	    } else {
	        console.log('倒计时结束');
	    }

	    setTimeout(function() {
	        countdown(time, startT);
	    }, 100);
	};

	// countdown(1508148000000)

    function loadData () {
        $.ajax({
            url: '/helloact/couple/index',
            type: 'POST',
            dataType: 'json',
            data: { token: token },
            success: function (ret) {
                if (ret && ret.code == 1) {
                    store = ret.result || {};
                    start();
                } else {
                    showTips(ret.msg);
                }
            },
            error: function () {
                showTips('操作失败，请稍后重试');
            }
        });
    };

    function initStatus(){
        var data = {
            cp_status: store.cp_status,
            data: store.my_cp_rank,
            avatar: store.avatar
        };

        $info.html(parseTpl(data, tplInfo));
    };

    function start() {
        initStatus();
        initRank();
    };

    KTVWeb.getToken(function (data) {
        if ( data.token ) {
            token = data.token;
            // loadData();
        } else {
            showTips('No token');
        }
    });
});