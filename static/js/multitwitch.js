var chat_hidden = false;
var current_streams_count = 0;

function optimize_size(n) {
    if (n === -1) {
        n = current_streams_count;
    } else {
        current_streams_count = n;
    }

    if (n === 0) {
        $("#helpbox").show();
        $("#wrapper").hide();
        chat_hidden = true;
        $("#chatbox").hide();
        return;
    } else {
        $("#helpbox").hide();
        $("#wrapper").show();
        
        if (sessionStorage.getItem('chatClosed') === 'true') {
            chat_hidden = true;
            $("#chatbox").hide();
        } else {
            chat_hidden = false;
            $("#chatbox").show();
        }
    }

    var height = $(window).innerHeight() - 16;
    var width = $("#wrapper").width();

    if (!chat_hidden) {
        var chat_width = 304;
        width = width - chat_width - 5;
        var chat_height = height - $("#tablist").height() - 24;
        $("#streams").width(width);
        $("#chatbox").width(chat_width);
        $(".stream_chat").height(chat_height);
    } else {
        $("#streams").width(width);
    }

    var best_height = 0;
    var best_width = 0;
    for (var per_row = 1; per_row <= n; per_row++) {
        var num_rows = Math.ceil(n / per_row);
        var max_width = Math.floor(width / per_row) - 4;
        var max_height = Math.floor(height / num_rows) - 4;
        if (max_width * 9/16 < max_height) {
            max_height = max_width * 9/16;
        } else {
            max_width = (max_height) * 16/9;
        }
        if (max_width > best_width) {
            best_width = max_width;
            best_height = max_height;
        }
    }
    
    $(".stream").height(Math.floor(best_height));
    $(".stream").width(Math.floor(best_width));

    $("#streams").css({
        "display": "flex",
        "flex-wrap": "wrap",
        "align-items": "center",
        "justify-content": "center",
        "align-content": "center",
        "height": height + "px",
        "padding-top": "0" 
    });
}

function toggle_chat() {
    if (chat_hidden) { 
        sessionStorage.setItem('chatClosed', 'false');
    } else { 
        sessionStorage.setItem('chatClosed', 'true');
    }
    optimize_size(-1);
}

function parse_stream_name(raw_name) {
    var clean_name = raw_name.trim();
    var parts = clean_name.split(':');
    if (parts.length > 1) {
        return { platform: parts[0].toLowerCase(), channel: parts[1].trim() };
    }
    return { platform: 'twitch', channel: clean_name }; 
}

function make_safe_id(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
}

function stream_object(raw_name) {
    var streamInfo = parse_stream_name(raw_name);
    var platform = streamInfo.platform;
    var name = streamInfo.channel;
    var parentDomain = window.location.hostname || "muixun.github.io"; 
    var iframe_src = "";

    if (platform === "twitch") {
        iframe_src = 'https://player.twitch.tv/?muted=true&channel=' + name + '&parent=' + parentDomain;
    } else if (platform === "yt" || platform === "youtube") {
        iframe_src = 'https://www.youtube.com/embed/' + name + '?autoplay=1&mute=1';
    } else if (platform === "kick") {
        iframe_src = 'https://player.kick.com/' + name;
    } else if (platform === "rumble") {
        iframe_src = 'https://rumble.com/embed/' + name + '/';
    } else if (platform === "tvod" || platform === "twitchvod") {
        var vod_id = /^\d+$/.test(name) ? 'v' + name : name;
        iframe_src = 'https://player.twitch.tv/?muted=true&video=' + vod_id + '&parent=' + parentDomain;
    } else {
        iframe_src = 'https://player.twitch.tv/?muted=true&channel=' + name + '&parent=' + parentDomain;
    }

    var safe_id = make_safe_id(raw_name);
    return $('<iframe id="embed_' + safe_id + '" data-streamid="' + raw_name + '" src="' + iframe_src + '" class="stream" allowfullscreen="true"></iframe>');
}

function chat_object(raw_name) {
    var streamInfo = parse_stream_name(raw_name);
    var platform = streamInfo.platform;
    var name = streamInfo.channel;
    var parentDomain = window.location.hostname || "muixun.github.io";
    var iframe_src = "";

    if (platform === "tvod" || platform === "twitchvod") {
        var safe_id = make_safe_id(raw_name);
        return $('<div id="chat-' + safe_id + '" data-streamid="' + raw_name + '" class="stream_chat" style="color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">VOD Chat replay is not supported by Twitch.</div>');
    }

    if (platform === "twitch") {
        iframe_src = 'https://twitch.tv/embed/' + name + '/chat?parent=' + parentDomain;
    } else if (platform === "yt" || platform === "youtube") {
        iframe_src = 'https://www.youtube.com/live_chat?v=' + name + '&embed_domain=' + parentDomain + '&dark_theme=1';
    } else if (platform === "kick") {
        iframe_src = 'https://kick.com/popout/' + name + '/chat';
    } else if (platform === "rumble") {
        iframe_src = 'https://rumble.com/chat/popup/' + name;
    } else {
        iframe_src = 'https://twitch.tv/embed/' + name + '/chat?parent=' + parentDomain;
    }

    var safe_id = make_safe_id(raw_name);
    return $('<div id="chat-' + safe_id + '" data-streamid="' + raw_name + '" class="stream_chat"><iframe frameborder="0" scrolling="no" id="chat-' + safe_id + '-embed" src="' + iframe_src + '" height="100%" width="100%"></iframe></div>');
}

/* Her legger vi på plattform-navnet som en ekstra CSS-klasse for farging */
function chat_tab_object(raw_name) {
    var streamInfo = parse_stream_name(raw_name);
    var safe_id = make_safe_id(raw_name);
    var platformClass = 'tab-' + streamInfo.platform; 
    return $('<li data-streamid="' + raw_name + '" class="' + platformClass + '"><a href="#chat-' + safe_id + '">' + streamInfo.channel + '</a></li>');
}

$(document).ready(function() {
    load_streams_from_hash();

    $(window).on('hashchange', function() {
        load_streams_from_hash();
    });
});

$(window).on('resize', function() {
    optimize_size(-1);
});

$(window).on('load', function() {
    setTimeout(function() {
        optimize_size(-1);
    }, 500);
});

function load_streams_from_hash() {
    var rawHash = window.location.hash.substring(1); 
    var hash = decodeURIComponent(rawHash);
    var streams = hash ? hash.split('/').map(s => s.trim()).filter(s => s !== "") : [];
    
    if (streams.length === 0) {
        $("#streams").empty();
        $("#tablist").empty();
        $(".stream_chat").remove();
        optimize_size(0);
        return;
    }

    $("#streams .stream").each(function() {
        var id = $(this).attr("data-streamid");
        if (!streams.includes(id)) {
            $(this).remove();
        }
    });

    $("#tablist li").each(function() {
        var id = $(this).attr("data-streamid");
        if (!streams.includes(id)) {
            $(this).remove();
        }
    });

    $(".stream_chat").each(function() {
        var id = $(this).attr("data-streamid");
        if (!streams.includes(id)) {
            $(this).remove();
        }
    });

    for (var i = 0; i < streams.length; i++) {
        var stream = streams[i];
        
        var exists = false;
        $("#streams .stream").each(function() {
            if ($(this).attr("data-streamid") === stream) {
                exists = true;
            }
        });

        if (!exists) {
            $("#streams").append(stream_object(stream));
            $("#tablist").append(chat_tab_object(stream));
            $("#chatbox").append(chat_object(stream));
        }
    }
    
    try {
        if ($("#chatbox").hasClass("ui-tabs")) {
            $("#chatbox").tabs("refresh");
        } else {
            $("#chatbox").tabs();
        }
    } catch(e) {
        console.log("Ignorerer feil i tabs: ", e);
    }
    
    optimize_size(streams.length);
}