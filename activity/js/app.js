/**
 * created by dongsh on 2016-11-6
 */
$(function () {

    var $container = $('#container');
    var indexTpl = _.template( $('#indexTpl').html() );
    var listTpl = _.template( $('#wish-list').html() );

    $container.height( $(window).height() )

    .on('tap click', '.btn-send', function(event) {
        $('#wishInput').removeClass('hide');
    })

    .on('tap click', '.btn-wishes', function(event) {
        var greetText = removeHTMLTag( $(this).prev().val() );

        if ( $.trim( greetText ) == '' ) {
            $(this).prev().val('');
            return;
        }

        ajax({ 
            type: 'POST',
            url: 'http://test.skykingstars.com/jnu_activity_service/greeting/send',
            data: { greetings: greetText }
        }, function (result) {

        }, function () {

        }); 
    })

    .on('tap click', '.popbox-share', function(event) {
        $(this).addClass('hide');
    });

    // 过滤输入信息，防XSS攻击
    function removeHTMLTag (str) {
        str = str.replace(/<script.*?>.*?<\/script>/ig, '');
        str = str.replace(/<\/?[^>]*>/g, ''); // 去除HTML tag
        str = str.replace(/[ | ]*\n/g, '\n'); // 去除行尾空白
        str = str.replace(/ /ig, ''); // 去掉
        return str;
    };

    // restful
    function ajax (options, success, fail) {
        $.ajax({
            type: options.type || 'GET',
            url: options.url,
            dataType: options.dataType || 'json',
            data: options.data || {},
            timeout: 10000,
            success: function (result) {
                console.log(result);
                success && success(result);
            },
            error: function (xhr, type) {
                fail && fail();
            }
        });
    };

    // 加载首页
    ajax({ url: 'http://test.skykingstars.com/jnu_activity_service/greeting' }, function (result) {
        $container.html( indexTpl({data: result.data}) );
        animate(result.data.greetingList);
    });

    // 祝福动画定时器 --> 从左到右
    function animate (greetingList) {
        var count = 0;
        var $wishArea = $('#wish-area');
    
        $wishArea.append( listTpl({data: greetingList[count], random: Math.random() * 100}) );

        var timer = setInterval(function () {
            count += 1;
            $wishArea.append( listTpl({data: greetingList[count], random: Math.random() * 100}) );
            
            if ( count == greetingList.length - 1 ) {
                console.log('计算结束了');
                clearInterval(timer);
                return false;
            }
        }, 750);
    };

    // 动画结束元素删除，节省内存
    $container.on('animationend webkitAnimationEnd', '.slideIn', function () {
        console.log('greetings remove');
        $(this).remove();
    });
});