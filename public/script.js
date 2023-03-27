import { humanizedDateTime } from "./scripts/RossAscends-mods.js";
import { encode, decode } from "../scripts/gpt-2-3-tokenizer/mod.js";

import {
    kai_settings,
    loadKoboldSettings,
} from "./scripts/kai-settings.js";

import {
    world_info_budget,
    world_info_data,
    world_info_depth,
    world_info,
    checkWorldInfo,
    selectImportedWorldInfo,
    setWorldInfoSettings,
    deleteWorldInfo,
} from "./scripts/world-info.js";

import {
    groups,
    selected_group,
    saveGroupChat,
    getGroups,
    generateGroupWrapper,
    deleteGroup,
    is_group_generating,
    printGroups,
    resetSelectedGroup,
    select_group_chats,
    regenerateGroup,
} from "./scripts/group-chats.js";

import {
    force_pygmalion_formatting,
    collapse_newlines,
    pin_examples,
    collapseNewlines,
    disable_description_formatting,
    disable_personality_formatting,
    disable_scenario_formatting,
} from "./scripts/power-user.js";

import { debounce, delay } from "./scripts/utils.js";

//exporting functions and vars for mods
export {
    Generate,
    getSettings,
    saveSettings,
    saveSettingsDebounced,
    printMessages,
    clearChat,
    getChat,
    getCharacters,
    callPopup,
    substituteParams,
    sendSystemMessage,
    addOneMessage,
    deleteLastMessage,
    resetChatState,
    select_rm_info,
    setCharacterId,
    setCharacterName,
    setEditedMessageId,
    setSendButtonState,
    selectRightMenuWithAnimation,
    setRightTabSelectedClass,
    chat,
    this_chid,
    settings,
    characters,
    online_status,
    main_api,
    api_server,
    api_key_novel,
    token,
    is_send_press,
    default_avatar,
    system_message_types,
    talkativeness_default,
    default_ch_mes,
}

// API OBJECT FOR EXTERNAL WIRING
window["TavernAI"] = {};

const VERSION = "1.1.0";
let converter = new showdown.Converter({ emoji: "true" });
let bg_menu_toggle = false;
const systemUserName = "TavernAI";
let default_user_name = "You";
let name1 = default_user_name;
let name2 = "TavernAI";
let chat = [];
let safetychat = [
    {
        name: systemUserName,
        is_user: false,
        is_name: true,
        create_date: 0,
        mes: "\n*You deleted a character/chat and arrived back here for safety reasons! Pick another character!*\n\n",
    },
];
let chat_create_date = 0;

let prev_selected_char = null;
const default_ch_mes = "Hello";
let count_view_mes = 0;
let mesStr = "";
let generatedPromtCache = "";
let characters = [];
let this_chid;
let active_character;
let backgrounds = [];
const default_avatar = "img/fluffy.png";
const system_avatar = "img/five.png";
let is_colab = false;
let is_checked_colab = false;
let is_mes_reload_avatar = false;

const durationSaveEdit = 200;
const saveSettingsDebounced = debounce(() => saveSettings(), durationSaveEdit);
const saveCharacterDebounced = debounce(() => $("#create_button").click(), durationSaveEdit);

const system_message_types = {
    HELP: "help",
    WELCOME: "welcome",
    GROUP: "group",
    EMPTY: "empty",
    GENERIC: "generic",
};

const system_messages = {
    help: {
        name: systemUserName,
        force_avatar: system_avatar,
        is_user: false,
        is_system: true,
        is_name: true,
        mes: [
            'Hi there! The following chat formatting commands are supported:',
            '<ol>',
            '<li><tt>*text*</tt> – format the actions that your character does</li>',
            '<li><tt>{*text*}</tt> – set the behavioral bias for your character</li>',
            '</ol>',
            'Need more help? Visit our wiki – <a href=\"https://github.com/TavernAI/TavernAI/wiki\">TavernAI Wiki</a>!'
        ].join('')
    },
    welcome:
    {
        name: systemUserName,
        force_avatar: system_avatar,
        is_user: false,
        is_name: true,
        mes: [
            'Welcome to TavernAI! In order to begin chatting:',
            '<ul>',
            '<li>Connect to one of the supported generation APIs</li>',
            '<li>Create or pick a character from the list</li>',
            '</ul>',
            'Still have questions left?\n',
            'Check out built-in help by typing <tt>/?</tt> in any chat or visit our ',
            '<a target="_blank" href="https://github.com/TavernAI/TavernAI/wiki">TavernAI Wiki</a>!'
        ].join('')
    },
    group: {
        name: systemUserName,
        force_avatar: system_avatar,
        is_user: false,
        is_system: true,
        is_name: true,
        is_group: true,
        mes: "Group chat created. Say 'Hi' to lovely people!",
    },
    empty: {
        name: systemUserName,
        force_avatar: system_avatar,
        is_user: false,
        is_system: true,
        is_name: true,
        mes: "No one hears you. **Hint:** add more members to the group!",
    },
    generic: {
        name: systemUserName,
        force_avatar: system_avatar,
        is_user: false,
        is_system: true,
        is_name: true,
        mes: "Generic system message. User `text` parameter to override the contents",
    },
};

const talkativeness_default = 0.5;

var is_advanced_char_open = false;

var menu_type = ""; //what is selected in the menu
var selected_button = ""; //which button pressed
//create pole save
var create_save_name = "";
var create_save_description = "";
var create_save_personality = "";
var create_save_first_message = "";
var create_save_avatar = "";
var create_save_scenario = "";
var create_save_mes_example = "";
var create_save_talkativeness = talkativeness_default;

//animation right menu
var animation_rm_duration = 500;
var animation_rm_easing = "";

var popup_type = "";
var bg_file_for_del = "";
var online_status = "no_connection";

var api_server = "";
var api_server_textgenerationwebui = "";
//var interval_timer = setInterval(getStatus, 2000);
var interval_timer_novel = setInterval(getStatusNovel, 3000);
var is_get_status = false;
var is_get_status_novel = false;
var is_api_button_press = false;
var is_api_button_press_novel = false;

var is_send_press = false; //Send generation
var add_mes_without_animation = false;

var this_del_mes = 0;

//message editing and chat scroll posistion persistence
var this_edit_mes_text = "";
var this_edit_mes_chname = "";
var this_edit_mes_id;
var scroll_holder = 0;
var is_use_scroll_holder = false;

//settings
var settings;
var koboldai_settings;
var koboldai_setting_names;
var preset_settings = "gui";
var user_avatar = "you.png";
var amount_gen = 80; //default max length of AI generated responses
var max_context = 2048;

var textgenerationwebui_settings = {
    temp: 0.5,
    top_p: 0.9,
    top_k: 0,
    typical_p: 1,
    rep_pen: 1.1,
    rep_pen_size: 0,
    penalty_alpha: 0,
};

var is_pygmalion = false;
var tokens_already_generated = 0;
var message_already_generated = "";
var if_typing_text = false;
const tokens_cycle_count = 30;
var cycle_count_generation = 0;

var swipes = false;

var anchor_order = 0;
var style_anchor = true;
var character_anchor = true;
let extension_prompts = {};

var main_api = "kobold";
//novel settings
var temp_novel = 0.5;
var rep_pen_novel = 1;
var rep_pen_size_novel = 100;

var api_key_novel = "";
var novel_tier;
var model_novel = "euterpe-v2";
var novelai_settings;
var novelai_setting_names;
var preset_settings_novel = "Classic-Krake";

//css
var bg1_toggle = true; // inits the BG as BG1
var css_mes_bg = $('<div class="mes"></div>').css("background");
var css_send_form_display = $("<div id=send_form></div>").css("display");

var colab_ini_step = 1;

var token;

//////////// Is this needed?
setInterval(function () {
    switch (colab_ini_step) {
        case 0:
            $("#colab_popup_text").html("<h3>Initialization</h3>");
            colab_ini_step = 1;
            break;
        case 1:
            $("#colab_popup_text").html("<h3>Initialization.</h3>");
            colab_ini_step = 2;
            break;
        case 2:
            $("#colab_popup_text").html("<h3>Initialization..</h3>");
            colab_ini_step = 3;
            break;
        case 3:
            $("#colab_popup_text").html("<h3>Initialization...</h3>");
            colab_ini_step = 0;
            break;
    }
}, 500);
/////////////

$.ajaxPrefilter((options, originalOptions, xhr) => {
    xhr.setRequestHeader("X-CSRF-Token", token);
});

///// initialization protocol ////////
$.get("/csrf-token").then((data) => {
    token = data.token;
    getCharacters();
    getSettings("def");
    getLastVersion();
    sendSystemMessage(system_message_types.WELCOME);
    getBackgrounds();
    getUserAvatars();
});

///////////// UNUSED FUNCTIONS MOVED TO TOP ///////////////

function newMesPattern(name) {
    //Patern which denotes a new message
    name = name + ":";
    return name;
}

//////////////////////////////////////////

function checkOnlineStatus() {
    ///////// REMOVED LINES THAT DUPLICATE RA_CHeckOnlineStatus FEATURES 

    if (online_status == "no_connection") {
        $("#online_status_indicator2").css("background-color", "red");  //Kobold
        $("#online_status_text2").html("No connection...");
        $("#online_status_indicator3").css("background-color", "red");  //Novel
        $("#online_status_text3").html("No connection...");
        is_get_status = false;
        is_get_status_novel = false;
    } else {
        $("#online_status_indicator2").css("background-color", "green"); //kobold
        $("#online_status_text2").html(online_status);
        $("#online_status_indicator3").css("background-color", "green"); //novel
        $("#online_status_text3").html(online_status);
        $("#online_status_indicator4").css("background-color", "green"); //extensions api
        $("#online_status_text4").html(online_status);
    }
}

///// DO WE STILL NEED THIS?
async function getLastVersion() {
    jQuery.ajax({
        type: "POST", //
        url: "/getlastversion", //
        data: JSON.stringify({
            "": "",
        }),
        beforeSend: function () { },
        cache: false,
        dataType: "json",
        contentType: "application/json",
        //processData: false,
        success: function (data) {
            var getVersion = data.version;
            if (getVersion !== "error" && getVersion != undefined) {
                if (compareVersions(getVersion, VERSION) === 1) {
                    $("#verson").append(" <span>(v." + getVersion + ")</span>");
                }
            }
        },
        error: function (jqXHR, exception) {
            console.log(exception);
            console.log(jqXHR);
        },
    });
}

async function getStatus() {
    if (is_get_status) {
        jQuery.ajax({
            type: "POST", //
            url: "/getstatus", //
            data: JSON.stringify({
                api_server:
                    main_api == "kobold" ? api_server : api_server_textgenerationwebui,
                main_api: main_api,
            }),
            beforeSend: function () {
                if (is_api_button_press) {
                    //$("#api_loading").css("display", 'inline-block');
                    //$("#api_button").css("display", 'none');
                }
                //$('#create_button').attr('value','Creating...'); //
            },
            cache: false,
            dataType: "json",
            crossDomain: true,
            contentType: "application/json",
            //processData: false,
            success: function (data) {
                online_status = data.result;
                if (online_status == undefined) {
                    online_status = "no_connection";
                }
                if (online_status.toLowerCase().indexOf("pygmalion") != -1 || (online_status !== "no_connection" && force_pygmalion_formatting)) {
                    is_pygmalion = true;
                    online_status += " (Pyg. formatting on)";
                } else {
                    is_pygmalion = false;
                }

                //console.log(online_status);
                resultCheckStatus();
                if (online_status !== "no_connection") {
                    var checkStatusNow = setTimeout(getStatus, 3000); //getStatus();
                }
            },
            error: function (jqXHR, exception) {
                console.log(exception);
                console.log(jqXHR);
                online_status = "no_connection";

                resultCheckStatus();
            },
        });
    } else {
        if (is_get_status_novel != true) {
            online_status = "no_connection";
        }
    }
}

function resultCheckStatus() {
    is_api_button_press = false;
    checkOnlineStatus();
    $("#api_loading").css("display", "none");
    $("#api_button").css("display", "inline-block");
    $("#api_loading_textgenerationwebui").css("display", "none");
    $("#api_button_textgenerationwebui").css("display", "inline-block");
}

async function getSoftPromptsList() {
    if (!api_server) {
        return;
    }

    const response = await fetch("/getsoftprompts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token,
        },
        body: JSON.stringify({ api_server: api_server }),
    });

    if (response.ok) {
        const data = await response.json();
        updateSoftPromptsList(data.soft_prompts);
    }
}

function clearSoftPromptsList() {
    $('#softprompt option[value!=""]').each(function () {
        $(this).remove();
    });
}

function updateSoftPromptsList(soft_prompts) {
    // Delete SPs removed from Kobold
    $("#softprompt option").each(function () {
        const value = $(this).attr("value");

        if (value == "") {
            return;
        }

        const prompt = soft_prompts.find((x) => x.name === value);
        if (!prompt) {
            $(this).remove();
        }
    });

    // Add SPs added to Kobold
    soft_prompts.forEach((prompt) => {
        if ($(`#softprompt option[value="${prompt.name}"]`).length === 0) {
            $("#softprompt").append(
                `<option value="${prompt.name}">${prompt.name}</option>`
            );

            if (prompt.selected) {
                $("#softprompt").val(prompt.name);
            }
        }
    });

    // No SP selected or no SPs
    if (soft_prompts.length === 0 || !soft_prompts.some((x) => x.selected)) {
        $("#softprompt").val("");
    }
}

function printCharacters() {
    //console.log('printCharacters() entered');

    $("#rm_print_characters_block").empty();
    //console.log('printCharacters() -- sees '+characters.length+' characters.');
    characters.forEach(function (item, i, arr) {
        var this_avatar = default_avatar;
        if (item.avatar != "none") {
            this_avatar = "characters/" + item.avatar + "?" + Date.now();
        } //RossAscends: changed 'prepend' to 'append' to make alphabetical sorting display correctly.
        $("#rm_print_characters_block").append(

            `<div class=character_select chid=${i} id="CharID${i}">
                <div class=avatar><img src="${this_avatar}"></div>
                <div class=ch_name>${item.name}</div>
            </div>`
        );
        //console.log('printcharacters() -- printing -- ChID '+i+' ('+item.name+')');
    });
    printGroups();
}

async function getCharacters() {
    await getGroups();

    //console.log('getCharacters() -- entered');
    //console.log(characters);
    var response = await fetch("/getcharacters", {
        //RossAscends: changed from const
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token,
        },
        body: JSON.stringify({
            "": "",
        }),
    });
    if (response.ok === true) {
        var getData = ""; //RossAscends: reset to force array to update to account for deleted character.
        var getData = await response.json(); //RossAscends: changed from const
        //console.log(getData);

        //var aa = JSON.parse(getData[0]);

        var load_ch_count = Object.getOwnPropertyNames(getData); //RossAscends: change from const to create dynamic character load amounts.
        var charCount = load_ch_count.length;
        //console.log('/getcharacters -- expecting to load '+charCount+' characters.')
        for (var i = 0; i < load_ch_count.length; i++) {
            characters[i] = [];
            characters[i] = getData[i];
            characters[i]['name'] = DOMPurify.sanitize(characters[i]['name']);
            //console.log('/getcharacters -- loaded character #'+(i+1)+' ('+characters[i].name+')');
        }
        //RossAscends: updated character sorting to be alphabetical
        characters.sort(function (a, b) {
            //console.log('sorting characters: '+a.name+' vs '+b.name);
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        });
        //console.log(characters);

        //characters.reverse();
        //console.log('/getcharacters -- this_chid -- '+this_chid);
        if (this_chid != undefined && this_chid != "invalid-safety-id") {
            $("#avatar_url_pole").val(characters[this_chid].avatar);
        }

        //console.log('/getcharacters -- sending '+i+' characters to /printcharacters');
        printCharacters();
        //console.log(propOwn.length);
        //return JSON.parse(getData[0]);
        //const getData = await response.json();
        //var getMessage = getData.results[0].text;
    }
}

async function getBackgrounds() {
    const response = await fetch("/getbackgrounds", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token,
        },
        body: JSON.stringify({
            "": "",
        }),
    });
    if (response.ok === true) {
        const getData = await response.json();
        //background = getData;
        //console.log(getData.length);
        for (var i = 0; i < getData.length; i++) {
            //console.log(1);
            $("#bg_menu_content").append(
                "<div class=bg_example><img bgfile='" +
                getData[i] +
                "' class=bg_example_img src='backgrounds/" +
                getData[i] +
                "'><img bgfile='" +
                getData[i] +
                "' class=bg_example_cross src=img/cross.png></div>"
            );
        }
        //var aa = JSON.parse(getData[0]);
        //const load_ch_coint = Object.getOwnPropertyNames(getData);
    }
}
async function isColab() {
    is_checked_colab = true;
    const response = await fetch("/iscolab", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token,
        },
        body: JSON.stringify({
            "": "",
        }),
    });
    if (response.ok === true) {
        const getData = await response.json();
        if (getData.colaburl != false) {
            $("#colab_shadow_popup").css("display", "none");
            is_colab = true;
            let url = String(getData.colaburl).split("flare.com")[0] + "flare.com";
            url = String(url).split("loca.lt")[0] + "loca.lt";
            $("#api_url_text").val(url);
            setTimeout(function () {
                $("#api_button").click();
            }, 2000);
        }
    }
}

async function setBackground(bg) {
    /*
              const response = await fetch("/setbackground", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                          "bg": bg
                      })
      
              });
              if (response.ok === true) {
                  //const getData = await response.json();
                  //background = getData;
      
                  //var aa = JSON.parse(getData[0]);
                  //const load_ch_coint = Object.getOwnPropertyNames(getData);
              }*/
    //console.log(bg);
    jQuery.ajax({
        type: "POST", //
        url: "/setbackground", //
        data: JSON.stringify({
            bg: bg,
        }),
        beforeSend: function () {
            //$('#create_button').attr('value','Creating...'); //
        },
        cache: false,
        dataType: "json",
        contentType: "application/json",
        //processData: false,
        success: function (html) {
            //setBackground(html);
            //$('body').css('background-image', 'linear-gradient(rgba(19,21,44,0.75), rgba(19,21,44,0.75)), url('+e.target.result+')');
            //$("#form_bg_download").after("<div class=bg_example><img bgfile='"+html+"' class=bg_example_img src='backgrounds/"+html+"'><img bgfile='"+html+"' class=bg_example_cross src=img/cross.png></div>");
        },
        error: function (jqXHR, exception) {
            console.log(exception);
            console.log(jqXHR);
        },
    });
}

async function delBackground(bg) {
    const response = await fetch("/delbackground", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token,
        },
        body: JSON.stringify({
            bg: bg,
        }),
    });
    if (response.ok === true) {
        //const getData = await response.json();
        //background = getData;
        //var aa = JSON.parse(getData[0]);
        //const load_ch_coint = Object.getOwnPropertyNames(getData);
    }
}

function printMessages() {
    //console.log(chat);
    //console.log('printMessages() -- printing messages for -- '+this_chid+' '+active_character+' '+characters[this_chid]);
    chat.forEach(function (item, i, arr) {
        //console.log('print message calling addOneMessage');
        addOneMessage(item);
    });
}

function clearChat() {
    count_view_mes = 0;
    extension_prompts = {};
    $("#chat").html("");
}

function deleteLastMessage() {
    count_view_mes--;
    chat.length = chat.length - 1;
    $('#chat').children('.mes').last().remove();
}

function messageFormating(mes, ch_name, isSystem, forceAvatar) {
    if (this_chid != undefined && !isSystem)
        mes = mes.replaceAll("<", "&lt;").replaceAll(">", "&gt;"); //for welcome message
    if (this_chid === undefined) {
        mes = mes
            .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
            .replace(/\*(.+?)\*/g, "<i>$1</i>")
            .replace(/\n/g, "<br/>");
    } else if (!isSystem) {
        mes = converter.makeHtml(mes);
        mes = mes.replace(/{([^}]+)}/g, "");
        mes = mes.replace(/\n/g, "<br/>");
        mes = mes.trim();
    }

    if (forceAvatar) {
        mes = mes.replaceAll(ch_name + ":", "");
    }

    if (ch_name !== name1) {
        mes = mes.replaceAll(name2 + ":", "");
    }
    return mes;
}

function getMessageFromTemplate(mesId, characterName, isUser, avatarImg, bias) {
    const mes = $('#message_template .mes').clone();
    mes.attr({ 'mesid': mesId, 'ch_name': characterName, 'is_user': isUser });
    mes.find('.avatar img').attr('src', avatarImg);
    mes.find('.ch_name .name_text').text(characterName);
    mes.find('.mes_bias').html(bias);
    return mes;
}

function appendImageToMessage(mes, messageElement) {
    if (mes.extra?.image) {
        const image = document.createElement("img");
        image.src = mes.extra?.image;
        image.classList.add("img_extra");
        messageElement.find(".mes_text").prepend(image);
    }
}

function addOneMessage(mes, type = "normal") {

    var messageText = mes["mes"];
    var characterName = name1;
    var avatarImg = "User Avatars/" + user_avatar;
    const isSystem = mes.is_system;
    generatedPromtCache = "";
    if (!mes["is_user"]) {
        if (mes.force_avatar) {
            avatarImg = mes.force_avatar;
        } else if (this_chid == undefined || this_chid == "invalid-safety-id") {
            avatarImg = system_avatar;
        } else {
            if (characters[this_chid].avatar != "none") {
                avatarImg = "characters/" + characters[this_chid].avatar;
                if (is_mes_reload_avatar !== false) {
                    avatarImg += "?" + is_mes_reload_avatar;
                }
            } else {
                avatarImg = default_avatar;
            }
        }

        characterName = mes.is_system || mes.force_avatar ? mes.name : name2;
    }

    if (count_view_mes == 0) {
        messageText = substituteParams(messageText);
    }
    messageText = messageFormating(
        messageText,
        characterName,
        isSystem,
        mes.force_avatar
    );
    const bias = messageFormating(mes.extra?.bias ?? "");

    var HTMLForEachMes = getMessageFromTemplate(count_view_mes, characterName, mes.is_user, avatarImg, bias);

    if (type !== 'swipe') {
        $("#chat").append(HTMLForEachMes);
    }

    const newMessage = $(`#chat [mesid="${count_view_mes}"]`);
    newMessage.data("isSystem", isSystem);

    appendImageToMessage(mes, newMessage);

    if (isSystem) {
        newMessage.find(".mes_edit").hide();
    }

    newMessage.find('.avatar img').on('error', function () {
        $(this).attr("src", "/img/user-slash-solid.svg");
    });
    if (type === 'swipe') {
        $("#chat").children().filter('[mesid="' + (count_view_mes - 1) + '"]').children('.mes_block').children('.mes_text').html('');
        $("#chat").children().filter('[mesid="' + (count_view_mes - 1) + '"]').children('.mes_block').children('.mes_text').append(messageText);

        //console.log(mes);
    } else {
        $("#chat").children().filter('[mesid="' + count_view_mes + '"]').children('.mes_block').children('.mes_text').append(messageText);
        hideSwipeButtons();
        count_view_mes++;

    }
    $('#chat .mes').last().addClass('last_mes');
    $('#chat .mes').eq(-2).removeClass('last_mes');
    //$textchat.scrollTop(($textchat[0].scrollHeight));


    //console.log(chat[chat.length - 1].["swipes"]);
    //console.log(mes);
    /*     if (mes["swipes"] !== undefined) {
            if (mes["swipes"].length - 1 == mes["swipe_id"]) {           //this works to detect when next right swipe would generate
                $(".swipe_right").css('opacity', '0.7')          // but we need it to happen on load, not only when swiping happens.
            } else {
                $(".swipe_right").css('opacity', '0.3')
            };
        } */
    hideSwipeButtons();
    //console.log('addonemessage calling showSwipeBtns');
    showSwipeButtons();

    // TODO: figure out smooth scrolling that wouldn't hit performance much.
    var $textchat = $("#chat");
    $textchat.scrollTop(($textchat[0].scrollHeight));
    //$('#chat .mes').last().get(0).scrollIntoView({ behavior: "smooth" });
}

function substituteParams(content) {
    content = content.replace(/{{user}}/gi, name1);
    content = content.replace(/{{char}}/gi, name2);
    content = content.replace(/<USER>/gi, name1);
    content = content.replace(/<BOT>/gi, name2);
    return content;
}

function getSlashCommand(message, type) {
    if (type == "regenerate" || type == "swipe") {
        return null;
    }

    const commandMap = {
        "/?": system_message_types.HELP,
        "/help": system_message_types.HELP
    };

    const activationText = message.trim().toLowerCase();

    if (Object.keys(commandMap).includes(activationText)) {
        return commandMap[activationText];
    }

    return null;
}

function sendSystemMessage(type, text) {
    const systemMessage = system_messages[type];

    if (!systemMessage) {
        return;
    }

    const newMessage = { ...systemMessage, send_date: humanizedDateTime() };

    if (text) {
        newMessage.mes = text;
    }

    chat.push(newMessage);
    //console.log('sendSystemMessage calls addOneMessage');
    addOneMessage(newMessage);
    is_send_press = false;
}

function extractMessageBias(message) {
    if (!message) {
        return null;
    }

    const found = [];
    const rxp = /{([^}]+)}/g;
    let curMatch;

    while ((curMatch = rxp.exec(message))) {
        found.push(curMatch[1].trim());
    }

    if (!found.length) {
        return "";
    }

    return ` ${found.join(" ")} `;
}

function cleanGroupMessage(getMessage) {
    const group = groups.find((x) => x.id == selected_group);

    if (group && Array.isArray(group.members) && group.members) {
        for (let member of group.members) {
            // Skip current speaker.
            if (member === name2) {
                continue;
            }

            const indexOfMember = getMessage.indexOf(member + ":");
            if (indexOfMember != -1) {
                getMessage = getMessage.substr(0, indexOfMember);
            }
        }
    }
    return getMessage;
}

function getExtensionPrompt() {
    let extension_prompt = Object.keys(extension_prompts)
        .sort()
        .map((x) => extension_prompts[x])
        .filter(x => x)
        .join("\n");
    if (extension_prompt.length && !extension_prompt.endsWith("\n")) {
        extension_prompt += "\n";
    }
    return extension_prompt;
}

function getWorldInfoPrompt(chat2) {
    let worldInfoString = "", worldInfoBefore = "", worldInfoAfter = "";

    if (world_info && world_info_data) {
        const activatedWorldInfo = checkWorldInfo(chat2);
        worldInfoBefore = activatedWorldInfo.worldInfoBefore;
        worldInfoAfter = activatedWorldInfo.worldInfoAfter;
        worldInfoString = worldInfoBefore + worldInfoAfter;
    }
    return { worldInfoString, worldInfoBefore, worldInfoAfter };
}

function baseChatReplace(value, name1, name2) {
    if (value !== undefined && value.length > 0) {
        if (is_pygmalion) {
            value = value.replace(/{{user}}:/gi, "You:");
            value = value.replace(/<USER>:/gi, "You:");
        }
        value = value.replace(/{{user}}/gi, name1);
        value = value.replace(/{{char}}/gi, name2);
        value = value.replace(/<USER>/gi, name1);
        value = value.replace(/<BOT>/gi, name2);

        if (collapse_newlines) {
            value = collapseNewlines(value);
        }
    }
    return value;
}

function appendToStoryString(value, prefix) {
    if (value !== undefined && value.length > 0) {
        return prefix + value + '\n';
    }
    return '';
}

async function Generate(type, automatic_trigger, force_name2) {//encode("dsfs").length
    console.log('Generate entered');
    tokens_already_generated = 0;
    message_already_generated = name2 + ': ';

    const slashCommand = getSlashCommand($("#send_textarea").val(), type);

    if (slashCommand == system_message_types.HELP) {
        sendSystemMessage(system_message_types.HELP);
        $("#send_textarea").val('').trigger('input');
        return;
    }

    if (selected_group && !is_group_generating) {
        generateGroupWrapper(false, type = type);
        return;
    }

    if (online_status != 'no_connection' && this_chid != undefined && this_chid !== 'invalid-safety-id') {
        if (type !== 'regenerate' && type !== "swipe") {
            is_send_press = true;
            var textareaText = $("#send_textarea").val();
            //console.log('Not a Regenerate call, so posting normall with input of: ' +textareaText);
            $("#send_textarea").val('').trigger('input');

        } else {
            //console.log('Regenerate call detected')
            var textareaText = "";
            if (chat[chat.length - 1]['is_user']) {//If last message from You

            }
            else if (type !== "swipe") {
                chat.length = chat.length - 1;
                count_view_mes -= 1;
                $('#chat').children().last().hide(500, function () {
                    $(this).remove();
                });
            }
        }

        $("#send_but").css("display", "none");
        $("#loading_mes").css("display", "inline-block");

        let promptBias = null;
        let messageBias = extractMessageBias(textareaText);

        // gets bias of the latest message where it was applied
        for (let mes of chat) {
            if (mes && mes.is_user && mes.extra && mes.extra.bias) {
                promptBias = mes.extra.bias;
            }
        }

        // bias from the latest message is top priority//

        promptBias = messageBias ?? promptBias ?? '';

        var storyString = "";
        var userSendString = "";
        var finalPromt = "";
        var postAnchorChar = "talks a lot with descriptions";//'Talk a lot with description what is going on around';// in asterisks
        var postAnchorStyle = "Writing style: very long messages";//"[Genre: roleplay chat][Tone: very long messages with descriptions]";
        var anchorTop = '';
        var anchorBottom = '';
        var topAnchorDepth = 8;

        if (character_anchor && !is_pygmalion) {
            console.log('saw not pyg');
            if (anchor_order === 0) {
                anchorTop = name2 + " " + postAnchorChar;
            } else {
                console.log('saw pyg, adding anchors')
                anchorBottom = "[" + name2 + " " + postAnchorChar + "]";
            }
        }
        if (style_anchor && !is_pygmalion) {
            if (anchor_order === 1) {
                anchorTop = postAnchorStyle;
            } else {
                anchorBottom = "[" + postAnchorStyle + "]";
            }
        }

        //*********************************
        //PRE FORMATING STRING
        //*********************************
        if (textareaText != "" && !automatic_trigger) {
            chat[chat.length] = {};
            chat[chat.length - 1]['name'] = name1;
            chat[chat.length - 1]['is_user'] = true;
            chat[chat.length - 1]['is_name'] = true;
            chat[chat.length - 1]['send_date'] = humanizedDateTime();
            chat[chat.length - 1]['mes'] = textareaText;
            chat[chat.length - 1]['extra'] = {};

            if (messageBias) {
                console.log('checking bias');
                chat[chat.length - 1]['extra']['bias'] = messageBias;
            }
            //console.log('Generate calls addOneMessage');
            addOneMessage(chat[chat.length - 1]);
        }
        ////////////////////////////////////
        let chatString = '';
        let arrMes = [];
        let mesSend = [];
        let charDescription = baseChatReplace($.trim(characters[this_chid].description), name1, name2);
        let charPersonality = baseChatReplace($.trim(characters[this_chid].personality), name1, name2);
        let Scenario = baseChatReplace($.trim(characters[this_chid].scenario), name1, name2);
        let mesExamples = baseChatReplace($.trim(characters[this_chid].mes_example), name1, name2);

        if (!mesExamples.startsWith('<START>')) {
            mesExamples = '<START>\n' + mesExamples.trim();
        }

        if (mesExamples.replace(/<START>/gi, '').trim().length === 0) {
            mesExamples = '';
        }

        let mesExamplesArray = mesExamples.split(/<START>/gi).slice(1).map(block => `<START>\n${block.trim()}\n`);

        if (is_pygmalion) {
            storyString += appendToStoryString(charDescription, disable_description_formatting ? '' : name2 + "'s Persona: ");
            storyString += appendToStoryString(charPersonality, disable_personality_formatting ? '' : 'Personality: ');
            storyString += appendToStoryString(Scenario, disable_scenario_formatting ? '' : 'Scenario: ');
        } else {
            if (charDescription !== undefined) {
                if (charPersonality.length > 0 && !disable_personality_formatting) {
                    charPersonality = name2 + "'s personality: " + charPersonality;
                }
            }

            storyString += appendToStoryString(charDescription, '');

            if (storyString.endsWith('\n')) {
                storyString = storyString.slice(0, -1);
            }

            if (count_view_mes < topAnchorDepth) {
                storyString += '\n' + appendToStoryString(charPersonality, '');
            }
        }

        if (pin_examples) {
            for (let example of mesExamplesArray) {
                if (!is_pygmalion) {
                    if (!storyString.endsWith('\n')) {
                        storyString += '\n';
                    }
                    example = example.replace(/<START>/i, 'This is how ' + name2 + ' should talk');//An example of how '+name2+' responds
                }
                storyString += appendToStoryString(example, '');
            }
        }
        //////////////////////////////////

        var count_exm_add = 0;
        console.log('emptying chat2');
        var chat2 = [];
        var j = 0;
        console.log('pre-replace chat.length = ' + chat.length);
        for (var i = chat.length - 1; i >= 0; i--) {

            if (j == 0) {
                chat[j]['mes'] = chat[j]['mes'].replace(/{{user}}/gi, name1);
                chat[j]['mes'] = chat[j]['mes'].replace(/{{char}}/gi, name2);
                chat[j]['mes'] = chat[j]['mes'].replace(/<USER>/gi, name1);
                chat[j]['mes'] = chat[j]['mes'].replace(/<BOT>/gi, name2);
            }
            let this_mes_ch_name = '';
            if (chat[j]['is_user']) {
                this_mes_ch_name = name1;
            } else {
                this_mes_ch_name = name2;
            }
            if (chat[j]['is_name']) {
                chat2[i] = this_mes_ch_name + ': ' + chat[j]['mes'] + '\n';
            } else {
                chat2[i] = chat[j]['mes'] + '\n';
            }
            // system messages produce no text
            if (chat[j]['is_system']) {
                chat2[i] = '';
            }

            // replace bias markup
            chat2[i] = (chat2[i] ?? '').replace(/{([^}]+)}/g, '');
            //console.log('replacing chat2 {}s');
            j++;
        }
        console.log('post replace chat.length = ' + chat.length);
        //chat2 = chat2.reverse();
        var this_max_context = 1487;
        if (main_api == 'kobold') this_max_context = max_context;
        if (main_api == 'novel') {
            if (novel_tier === 1) {
                this_max_context = 1024;
            } else {
                this_max_context = 2048 - 60;//fix for fat tokens 
                if (model_novel == 'krake-v2') {
                    this_max_context -= 160;
                }
            }
        }

        let { worldInfoString, worldInfoBefore, worldInfoAfter } = getWorldInfoPrompt(chat2);
        let extension_prompt = getExtensionPrompt();

        /////////////////////// swipecode
        if (type == 'swipe') {

            console.log('pre swipe shift: ' + chat2.length);
            console.log('shifting swipe chat2');
            chat2.shift();

        }
        console.log('post swipe shift:' + chat2.length);
        var i = 0;

        for (var item of chat2) {//console.log(encode("dsfs").length);
            chatString = item + chatString;
            if (encode(JSON.stringify(
                worldInfoString + storyString + chatString +
                anchorTop + anchorBottom +
                charPersonality + promptBias + extension_prompt
            )).length + 120 < this_max_context) { //(The number of tokens in the entire promt) need fix, it must count correctly (added +120, so that the description of the character does not hide)
                //if (is_pygmalion && i == chat2.length-1) item='<START>\n'+item;
                arrMes[arrMes.length] = item;
            } else {
                console.log('reducing chat.length by 1');
                i = chat2.length - 1;
            }

            await delay(1); //For disable slow down (encode gpt-2 need fix)
            // console.log(i+' '+chat.length);

            count_exm_add = 0;

            if (i === chat2.length - 1) {
                if (!pin_examples) {
                    let mesExmString = '';
                    for (let iii = 0; iii < mesExamplesArray.length; iii++) {
                        mesExmString += mesExamplesArray[iii];
                        const prompt = worldInfoString + storyString + mesExmString + chatString + anchorTop + anchorBottom + charPersonality + promptBias + extension_prompt;
                        if (encode(JSON.stringify(prompt)).length + 120 < this_max_context) {
                            if (!is_pygmalion) {
                                mesExamplesArray[iii] = mesExamplesArray[iii].replace(/<START>/i, `This is how ${name2} should talk`);
                            }
                            count_exm_add++;
                            await delay(1);
                        } else {
                            iii = mesExamplesArray.length;
                        }
                    }
                }
                if (!is_pygmalion && Scenario && Scenario.length > 0) {
                    if (!storyString.endsWith('\n')) {
                        storyString += '\n';
                    }
                    storyString += !disable_scenario_formatting ? `Circumstances and context of the dialogue: ${Scenario}\n` : `${Scenario}\n`;
                }
                console.log('calling runGenerate');
                runGenerate();
                return;
            }
            i++;
        }

        function runGenerate(cycleGenerationPromt = '') {
            $(".swipe_right").css("display", "none");
            is_send_press = true;

            generatedPromtCache += cycleGenerationPromt;
            if (generatedPromtCache.length == 0) {
                console.log('generating prompt');
                chatString = "";
                arrMes = arrMes.reverse();
                var is_add_personality = false;
                arrMes.forEach(function (item, i, arr) {//For added anchors and others

                    if (i >= arrMes.length - 1 && $.trim(item).substr(0, (name1 + ":").length) != name1 + ":") {
                        if (textareaText == "") {
                            item = item.substr(0, item.length - 1);
                        }
                    }
                    if (i === arrMes.length - topAnchorDepth && count_view_mes >= topAnchorDepth && !is_add_personality) {

                        is_add_personality = true;
                        //chatString = chatString.substr(0,chatString.length-1);
                        //anchorAndPersonality = "[Genre: roleplay chat][Tone: very long messages with descriptions]";
                        if ((anchorTop != "" || charPersonality != "") && !is_pygmalion) {
                            if (anchorTop != "") charPersonality += ' ';
                            item += "[" + charPersonality + anchorTop + ']\n';
                        }
                    }
                    if (i >= arrMes.length - 1 && count_view_mes > 8 && $.trim(item).substr(0, (name1 + ":").length) == name1 + ":" && !is_pygmalion) {//For add anchor in end
                        item = item.substr(0, item.length - 1);
                        //chatString+=postAnchor+"\n";//"[Writing style: very long messages]\n";
                        item = item + anchorBottom + "\n";
                    }
                    if (is_pygmalion) {
                        if (i >= arrMes.length - 1 && $.trim(item).substr(0, (name1 + ":").length) == name1 + ":") {//for add name2 when user sent
                            item = item + name2 + ":";
                        }
                        if (i >= arrMes.length - 1 && $.trim(item).substr(0, (name1 + ":").length) != name1 + ":") {//for add name2 when continue
                            if (textareaText == "") {
                                item = item + '\n' + name2 + ":";
                            }
                        }
                        if ($.trim(item).indexOf(name1) === 0) {
                            item = item.replace(name1 + ':', 'You:');
                        }
                    }
                    mesSend[mesSend.length] = item;
                    //chatString = chatString+item;
                });
            }
            //finalPromt +=chatString;
            //console.log(storyString);

            //console.log(encode(characters[this_chid].description+chatString).length);
            //console.log(encode(JSON.stringify(characters[this_chid].description+chatString)).length);
            //console.log(JSON.stringify(storyString));
            //Send story string
            var mesSendString = '';
            var mesExmString = '';

            function setPromtString() {
                mesSendString = '';
                mesExmString = '';
                for (let j = 0; j < count_exm_add; j++) {
                    mesExmString += mesExamplesArray[j];
                }
                for (let j = 0; j < mesSend.length; j++) {
                    mesSendString += mesSend[j];
                    if (force_name2 && j === mesSend.length - 1 && tokens_already_generated === 0) {
                        mesSendString += name2 + ':';
                    }
                }
            }

            function checkPromtSize() {
                //console.log('checking prompt size');
                setPromtString();
                let thisPromtContextSize = encode(JSON.stringify(worldInfoString + storyString + mesExmString + mesSendString + anchorTop + anchorBottom + charPersonality + generatedPromtCache + promptBias + extension_prompt)).length + 120;

                if (thisPromtContextSize > this_max_context) {		//if the prepared prompt is larger than the max context size...

                    if (count_exm_add > 0) {							// ..and we have example mesages..
                        //console.log('Context size: '+thisPromtContextSize+' -- too big, removing example message');
                        //mesExamplesArray.length = mesExamplesArray.length-1;
                        count_exm_add--;							// remove the example messages...
                        checkPromtSize();							// and try agin...
                    } else if (mesSend.length > 0) {					// if the chat history is longer than 0
                        //console.log('Context size: '+thisPromtContextSize+' -- too big, removing oldest chat message');
                        mesSend.shift();							// remove the first (oldest) chat entry..
                        checkPromtSize();							// and check size again..
                    } else {
                        //end
                    }
                }
            }



            if (generatedPromtCache.length > 0) {
                //console.log('Generated Prompt Cache length: '+generatedPromtCache.length);
                checkPromtSize();
            } else {
                console.log('calling setPromtString')
                setPromtString();
            }

            if (!is_pygmalion) {
                mesSendString = '\nThen the roleplay chat between ' + name1 + ' and ' + name2 + ' begins.\n' + mesSendString;
            } else {
                mesSendString = '<START>\n' + mesSendString;
                //mesSendString = mesSendString; //This edit simply removes the first "<START>" that is prepended to all context prompts
            }
            finalPromt = worldInfoBefore + storyString + worldInfoAfter + extension_prompt + mesExmString + mesSendString + generatedPromtCache + promptBias;
            finalPromt = finalPromt.replace(/\r/gm, '');

            if (collapse_newlines) {
                finalPromt = collapseNewlines(finalPromt);
            }

            //console.log('final prompt decided');

            //if we aren't using the kobold GUI settings...
            if (main_api == 'textgenerationwebui' || main_api == 'kobold' && preset_settings != 'gui') {
                var this_settings = koboldai_settings[koboldai_setting_names[preset_settings]];

                var this_amount_gen = parseInt(amount_gen); // how many tokens the AI will be requested to generate
                if (is_pygmalion) { // if we are using a pygmalion model...
                    if (tokens_already_generated === 0) { // if nothing has been generated yet..
                        if (parseInt(amount_gen) >= 50) { // if the max gen setting is > 50...(
                            this_amount_gen = 50; // then only try to make 50 this cycle..
                        }
                        else {
                            this_amount_gen = parseInt(amount_gen); // otherwise, make as much as the max amount request.
                        }
                    }
                    else { // if we already recieved some generated text...
                        if (parseInt(amount_gen) - tokens_already_generated < tokens_cycle_count) { // if the remaining tokens to be made is less than next potential cycle count
                            this_amount_gen = parseInt(amount_gen) - tokens_already_generated; // subtract already generated amount from the desired max gen amount
                        }
                        else {
                            this_amount_gen = tokens_cycle_count; // otherwise make the standard cycle amont (frist 50, and 30 after that)
                        }
                    }
                }
            }

            var generate_data;
            if (main_api == 'kobold') {
                var generate_data = {
                    prompt: finalPromt,
                    gui_settings: true,
                    max_length: amount_gen,
                    temperature: kai_settings.temp,
                    max_context_length: max_context,
                    singleline: kai_settings.single_line,
                };
                if (preset_settings != 'gui') {

                    generate_data = {
                        prompt: finalPromt,
                        gui_settings: false,
                        sampler_order: this_settings.sampler_order,
                        max_context_length: parseInt(max_context),//this_settings.max_length,
                        max_length: this_amount_gen,//parseInt(amount_gen),
                        rep_pen: parseFloat(kai_settings.rep_pen),
                        rep_pen_range: parseInt(kai_settings.rep_pen_range),
                        rep_pen_slope: kai_settings.rep_pen_slope,
                        temperature: parseFloat(kai_settings.temp),
                        tfs: kai_settings.tfs,
                        top_a: kai_settings.top_a,
                        top_k: kai_settings.top_k,
                        top_p: kai_settings.top_p,
                        typical: kai_settings.typical,
                        s1: this_settings.sampler_order[0],
                        s2: this_settings.sampler_order[1],
                        s3: this_settings.sampler_order[2],
                        s4: this_settings.sampler_order[3],
                        s5: this_settings.sampler_order[4],
                        s6: this_settings.sampler_order[5],
                        s7: this_settings.sampler_order[6],
                        use_world_info: false,
                        singleline: kai_settings.single_line,
                    };
                }
            }

            if (main_api == 'textgenerationwebui') {
                const doSample = textgenerationwebui_settings.penalty_alpha == 0;
                var generate_data = {
                    data: [
                        finalPromt,
                        this_amount_gen, // min_length
                        doSample, // do_sample
                        textgenerationwebui_settings.temp, // temperature
                        textgenerationwebui_settings.top_p, // top_p
                        textgenerationwebui_settings.typical_p, // typical_p
                        textgenerationwebui_settings.rep_pen, // repetition_penalty
                        1.0, // encoder rep pen
                        textgenerationwebui_settings.top_k, // top_k
                        0, // min_length
                        textgenerationwebui_settings.rep_pen_size, // no_repeat_ngram_size
                        1, // num_beams
                        textgenerationwebui_settings.penalty_alpha, // penalty_alpha
                        1, // length_penalty
                        false, // early_stopping
                        -1, // seed
                        name1, // name1
                        name2, // name2
                        "",  // Context
                        true, // stop at newline
                        max_context, // Maximum prompt size in tokens
                        1, // num attempts
                    ]
                };
            }

            if (main_api == 'novel') {
                var this_settings = novelai_settings[novelai_setting_names[preset_settings_novel]];
                generate_data = {
                    "input": finalPromt,
                    "model": model_novel,
                    "use_string": true,
                    "temperature": parseFloat(temp_novel),
                    "max_length": this_settings.max_length,
                    "min_length": this_settings.min_length,
                    "tail_free_sampling": this_settings.tail_free_sampling,
                    "repetition_penalty": parseFloat(rep_pen_novel),
                    "repetition_penalty_range": parseInt(rep_pen_size_novel),
                    "repetition_penalty_frequency": this_settings.repetition_penalty_frequency,
                    "repetition_penalty_presence": this_settings.repetition_penalty_presence,
                    //"stop_sequences": {{187}},
                    //bad_words_ids = {{50256}, {0}, {1}};
                    //generate_until_sentence = true;
                    "use_cache": false,
                    //use_string = true;
                    "return_full_text": false,
                    "prefix": "vanilla",
                    "order": this_settings.order
                };
            }
            var generate_url = '';
            if (main_api == 'kobold') {
                generate_url = '/generate';
            } else if (main_api == 'textgenerationwebui') {
                generate_url = '/generate_textgenerationwebui';
            } else if (main_api == 'novel') {
                generate_url = '/generate_novelai';
            }
            console.log('rungenerate calling API');
            jQuery.ajax({
                type: 'POST', // 
                url: generate_url, // 
                data: JSON.stringify(generate_data),
                beforeSend: function () {
                    //$('#create_button').attr('value','Creating...'); 
                },
                cache: false,
                dataType: "json",
                contentType: "application/json",
                success: function (data) {
                    //console.log('generation success');
                    tokens_already_generated += this_amount_gen;			// add new gen amt to any prev gen counter..


                    //console.log('Tokens requested in total: '+tokens_already_generated);
                    //$("#send_textarea").focus();
                    //$("#send_textarea").removeAttr('disabled');
                    is_send_press = false;
                    if (!data.error) {
                        //const getData = await response.json();
                        var getMessage = "";
                        if (main_api == 'kobold') {
                            getMessage = data.results[0].text;
                        } else if (main_api == 'textgenerationwebui') {
                            getMessage = data.data[0];
                            if (getMessage == null || data.error) {
                                popup_type = 'default';
                                callPopup('<h3>Got empty response from Text generation web UI. Try restarting the API with recommended options.</h3>');
                                return;
                            }
                            getMessage = getMessage.substring(finalPromt.length);
                        } else if (main_api == 'novel') {
                            getMessage = data.output;
                        }

                        if (collapse_newlines) {
                            getMessage = collapseNewlines(getMessage);
                        }

                        //Pygmalion run again													// to make it continue generating so long as it's under max_amount and hasn't signaled
                        // an end to the character's response via typing "You:" or adding "<endoftext>"
                        if (is_pygmalion) {
                            if_typing_text = false;
                            message_already_generated += getMessage;
                            promptBias = '';
                            //console.log('AI Response so far: '+message_already_generated);
                            if (message_already_generated.indexOf('You:') === -1 && 			//if there is no 'You:' in the response msg
                                message_already_generated.indexOf('<|endoftext|>') === -1 && 	//if there is no <endoftext> stamp in the response msg
                                tokens_already_generated < parseInt(amount_gen) && 				//if the gen'd msg is less than the max response length..
                                getMessage.length > 0) {											//if we actually have gen'd text at all... 
                                runGenerate(getMessage);
                                console.log('returning to make pyg generate again');									//generate again with the 'GetMessage' argument..
                                return;
                            }

                            getMessage = message_already_generated;

                        }
                        //Formating
                        getMessage = $.trim(getMessage);
                        if (is_pygmalion) {
                            getMessage = getMessage.replace(new RegExp('<USER>', "g"), name1);
                            getMessage = getMessage.replace(new RegExp('<BOT>', "g"), name2);
                            getMessage = getMessage.replace(new RegExp('You:', "g"), name1 + ':');
                        }
                        if (getMessage.indexOf(name1 + ":") != -1) {
                            getMessage = getMessage.substr(0, getMessage.indexOf(name1 + ":"));

                        }
                        if (getMessage.indexOf('<|endoftext|>') != -1) {
                            getMessage = getMessage.substr(0, getMessage.indexOf('<|endoftext|>'));

                        }
                        // clean-up group message from excessive generations
                        if (selected_group) {
                            getMessage = cleanGroupMessage(getMessage);
                        }
                        let this_mes_is_name = true;
                        if (getMessage.indexOf(name2 + ":") === 0) {
                            getMessage = getMessage.replace(name2 + ':', '');
                            getMessage = getMessage.trimStart();
                        } else {
                            this_mes_is_name = false;
                        }
                        if (force_name2) this_mes_is_name = true;
                        //getMessage = getMessage.replace(/^\s+/g, '');
                        if (getMessage.length > 0) {
                            if (chat[chat.length - 1]['swipe_id'] === undefined ||
                                chat[chat.length - 1]['is_user']) { type = 'normal'; }
                            if (type === 'swipe') {

                                chat[chat.length - 1]['swipes'][chat[chat.length - 1]['swipes'].length] = getMessage;
                                if (chat[chat.length - 1]['swipe_id'] === chat[chat.length - 1]['swipes'].length - 1) {
                                    //console.log(getMessage);
                                    chat[chat.length - 1]['mes'] = getMessage;
                                    // console.log('runGenerate calls addOneMessage for swipe');
                                    addOneMessage(chat[chat.length - 1], 'swipe');
                                } else {
                                    chat[chat.length - 1]['mes'] = getMessage;
                                }
                                is_send_press = false;
                            } else {
                                console.log('entering chat update routine for non-swipe post');
                                is_send_press = false;
                                chat[chat.length] = {};
                                chat[chat.length - 1]['name'] = name2;
                                chat[chat.length - 1]['is_user'] = false;
                                chat[chat.length - 1]['is_name'] = this_mes_is_name;
                                chat[chat.length - 1]['send_date'] = humanizedDateTime();
                                getMessage = $.trim(getMessage);
                                chat[chat.length - 1]['mes'] = getMessage;

                                if (selected_group) {
                                    console.log('entering chat update for groups');
                                    let avatarImg = 'img/fluffy.png';
                                    if (characters[this_chid].avatar != 'none') {
                                        avatarImg = `characters/${characters[this_chid].avatar}?${Date.now()}`;
                                    }
                                    chat[chat.length - 1]['is_name'] = true;
                                    chat[chat.length - 1]['force_avatar'] = avatarImg;
                                }
                                //console.log('runGenerate calls addOneMessage');
                                addOneMessage(chat[chat.length - 1]);

                                $("#send_but").css("display", "inline");
                                $("#loading_mes").css("display", "none");
                            }


                        } else {
                            // regenerate with character speech reenforced
                            // to make sure we leave on swipe type while also adding the name2 appendage
                            const newType = type == "swipe" ? "swipe" : "force_name2";
                            Generate(newType, automatic_trigger=false, force_name2=true);
                        }
                    } else {

                        $("#send_but").css("display", "inline");
                        $("#loading_mes").css("display", "none");
                        //console.log('runGenerate calling showSwipeBtns');
                        showSwipeButtons();
                    }
                    console.log('/savechat called by /Generate');

                    if (selected_group) {
                        saveGroupChat(selected_group);
                    } else {
                        saveChat();
                    }
                    //let final_message_length = encode(JSON.stringify(getMessage)).length;
                    //console.log('AI Response: +'+getMessage+ '('+final_message_length+' tokens)');

                    $("#send_but").css("display", "inline");
                    //console.log('runGenerate calling showSwipeBtns pt. 2');
                    showSwipeButtons();

                    $("#loading_mes").css("display", "none");

                },
                error: function (jqXHR, exception) {


                    $("#send_textarea").removeAttr('disabled');
                    is_send_press = false;
                    $("#send_but").css("display", "inline");
                    $("#loading_mes").css("display", "none");
                    console.log(exception);
                    console.log(jqXHR);

                }

            }); //end of "if not data error"
        } //rungenerate ends

    } else {    //generate's primary loop ends, after this is error handling for no-connection or safety-id

        if (this_chid == undefined || this_chid == 'invalid-safety-id') {
            //send ch sel
            popup_type = 'char_not_selected';
            callPopup('<h3>Сharacter is not selected</h3>');
        }
        is_send_press = false;
    }
    console.log('generate ending');
} //generate ends

function resetChatState() {
    active_character = "invalid-safety-id"; //unsets the chid in settings (this prevents AutoLoadChat from trying to load the wrong ChID
    this_chid = "invalid-safety-id"; //unsets expected chid before reloading (related to getCharacters/printCharacters from using old arrays)
    name2 = systemUserName; // replaces deleted charcter name with system user since it will be displayed next.
    chat = [...safetychat]; // sets up system user to tell user about having deleted a character
    characters.length = 0; // resets the characters array, forcing getcharacters to reset
}

function setCharacterId(value) {
    this_chid = value;
}

function setCharacterName(value) {
    name2 = value;
}

function setEditedMessageId(value) {
    this_edit_mes_id = value;
}

function setSendButtonState(value) {
    is_send_press = value;
}

function resultCheckStatusNovel() {
    is_api_button_press_novel = false;
    checkOnlineStatus();
    $("#api_loading_novel").css("display", "none");
    $("#api_button_novel").css("display", "inline-block");
}

async function saveChat() {
    chat.forEach(function (item, i) {
        if (item["is_group"]) {
            alert('Trying to save group chat with regular saveChat function. Aborting to prevent corruption.');
            throw new Error('Group chat saved from saveChat');
        }
        if (item.is_user) {
            var str = item.mes.replace(`${name1}:`, `${default_user_name}:`);
            chat[i].mes = str;
            chat[i].name = default_user_name;
        } else if (i !== chat.length - 1 && chat[i].swipe_id !== undefined) {
            delete chat[i].swipes;
            delete chat[i].swipe_id;
        }
    });
    var save_chat = [
        {
            user_name: default_user_name,
            character_name: name2,
            create_date: chat_create_date,
        },
        ...chat,
    ];
    jQuery.ajax({
        type: "POST",
        url: "/savechat",
        data: JSON.stringify({
            ch_name: characters[this_chid].name,
            file_name: characters[this_chid].chat,
            chat: save_chat,
            avatar_url: characters[this_chid].avatar,
        }),
        beforeSend: function () {
            //$('#create_button').attr('value','Creating...');
        },
        cache: false,
        dataType: "json",
        contentType: "application/json",
        success: function (data) { },
        error: function (jqXHR, exception) {
            console.log(exception);
            console.log(jqXHR);
        },
    });
}

function read_avatar_load(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        if (selected_button == "create") {
            create_save_avatar = input.files;
        }
        reader.onload = function (e) {
            if (selected_button == "character_edit") {
                saveCharacterDebounced();
            }
            $("#avatar_load_preview").attr("src", e.target.result);
            //.width(103)
            //.height(83);
            //console.log(e.target.result.name);
        };

        reader.readAsDataURL(input.files[0]);
    }
}

async function getChat() {
    console.log('/getchat -- entered for -- ' + characters[this_chid].name);
    try {
        const response = await $.ajax({
            type: 'POST',
            url: '/getchat',
            data: JSON.stringify({
                ch_name: characters[this_chid].name,
                file_name: characters[this_chid].chat,
                avatar_url: characters[this_chid].avatar
            }),
            dataType: 'json',
            contentType: 'application/json',
        });
        if (response[0] !== undefined) {
            chat.push(...response);
            chat_create_date = chat[0]['create_date'];
            chat.shift();
        } else {
            chat_create_date = humanizedDateTime();
        }
        getChatResult();
        saveChat();
    } catch (error) {
        getChatResult();
        console.log(error);
    }
}

function getChatResult() {
    name2 = characters[this_chid].name;
    if (chat.length > 1) {
        for (let i = 0; i < chat.length; i++) {
            const item = chat[i];
            if (item["is_user"]) {
                item['mes'] = item['mes'].replace(default_user_name + ':', name1 + ':');
                item['name'] = name1;
            }
        }
    } else {
        const firstMes = characters[this_chid].first_mes || default_ch_mes;
        chat[0] = {
            name: name2,
            is_user: false,
            is_name: true,
            send_date: humanizedDateTime(),
            mes: firstMes
        };
    }
    printMessages();
    select_selected_character(this_chid);
}

function openNavToggle() {
    if (!$("#nav-toggle").prop("checked")) {
        $("#nav-toggle").trigger("click");
    }
}

////////// OPTIMZED MAIN API CHANGE FUNCTION ////////////

function changeMainAPI() {
    const selectedVal = $("#main_api").val();
    console.log(selectedVal);
    const apiElements = {
        "kobold": {
            apiElem: $("#kobold_api"),
            maxContextElem: $("#max_context_block"),
            amountGenElem: $("#amount_gen_block"),
            softPromptElem: $("#softprompt_block")
        },
        "textgenerationwebui": {
            apiElem: $("#textgenerationwebui_api"),
            maxContextElem: $("#max_context_block"),
            amountGenElem: $("#amount_gen_block"),
            softPromptElem: $("#softprompt_block")
        },
        "novel": {
            apiElem: $("#novel_api"),
            maxContextElem: $("#max_context_block"),
            amountGenElem: $("#amount_gen_block"),
            softPromptElem: $("#softprompt_block")
        }
    };

    for (const apiName in apiElements) {
        const apiObj = apiElements[apiName];
        const isCurrentApi = selectedVal === apiName;
        console.log(isCurrentApi);
        console.log(selectedVal);
        apiObj.apiElem.css("display", isCurrentApi ? "block" : "none");

        if (isCurrentApi && apiName === "kobold") {
            $("#softprompt_block").css("display", "block");
        }

        if (isCurrentApi && apiName === "textgenerationwebui") {
            apiObj.amountGenElem.children().prop("disabled", false);
            apiObj.amountGenElem.css("opacity", 1.0);
        }
    }

    main_api = selectedVal;
}

////////////////////////////////////////////////////

async function getUserAvatars() {
    $("#user_avatar_block").html(""); //RossAscends: necessary to avoid doubling avatars each QuickRefresh.
    $("#user_avatar_block").append('<div class="avatar_upload">+</div>');
    const response = await fetch("/getuseravatars", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token,
        },
        body: JSON.stringify({
            "": "",
        }),
    });
    if (response.ok === true) {
        const getData = await response.json();
        //background = getData;
        //console.log(getData.length);

        for (var i = 0; i < getData.length; i++) {
            //console.log(1);
            appendUserAvatar(getData[i]);
        }
        //var aa = JSON.parse(getData[0]);
        //const load_ch_coint = Object.getOwnPropertyNames(getData);
    }
}

function highlightSelectedAvatar() {
    $("#user_avatar_block").find(".avatar").removeClass("selected");
    $("#user_avatar_block")
        .find(`.avatar[imgfile='${user_avatar}']`)
        .addClass("selected");
}

function appendUserAvatar(name) {
    const block = $("#user_avatar_block").append(
        '<div imgfile="' +
        name +
        '" class="avatar"><img src="User Avatars/' +
        name +
        '"</div>'
    );
    highlightSelectedAvatar();
}
//***************SETTINGS****************//
///////////////////////////////////////////
async function getSettings(type) {
    //timer

    //console.log('getSettings() pinging server for settings request');
    jQuery.ajax({
        type: "POST",
        url: "/getsettings",
        data: JSON.stringify({}),
        beforeSend: function () { },
        cache: false,
        dataType: "json",
        contentType: "application/json",
        //processData: false,
        success: function (data) {
            if (data.result != "file not find" && data.settings) {
                settings = JSON.parse(data.settings);
                if (settings.username !== undefined) {
                    if (settings.username !== "") {
                        name1 = settings.username;
                        $("#your_name").val(name1);
                    }
                }

                //Load which API we are using
                if (settings.main_api != undefined) {
                    main_api = settings.main_api;
                    $("#main_api option[value=" + main_api + "]").attr(
                        "selected",
                        "true"
                    );
                    changeMainAPI();
                }
                //load Novel API KEY is exists
                if (settings.api_key_novel != undefined) {
                    api_key_novel = settings.api_key_novel;
                    $("#api_key_novel").val(api_key_novel);
                }
                //load the rest of the Novel settings without any checks
                model_novel = settings.model_novel;
                $("#model_novel_select option[value=" + model_novel + "]").attr(
                    "selected",
                    "true"
                );

                novelai_setting_names = data.novelai_setting_names;
                novelai_settings = data.novelai_settings;
                novelai_settings.forEach(function (item, i, arr) {
                    novelai_settings[i] = JSON.parse(item);
                });
                var arr_holder = {};

                $("#settings_perset_novel").empty();

                novelai_setting_names.forEach(function (item, i, arr) {
                    arr_holder[item] = i;
                    $("#settings_perset_novel").append(
                        "<option value=" + i + ">" + item + "</option>"
                    );
                });
                novelai_setting_names = {};
                novelai_setting_names = arr_holder;

                preset_settings_novel = settings.preset_settings_novel;
                $(
                    "#settings_perset_novel option[value=" +
                    novelai_setting_names[preset_settings_novel] +
                    "]"
                ).attr("selected", "true");

                //Load KoboldAI settings
                koboldai_setting_names = data.koboldai_setting_names;
                koboldai_settings = data.koboldai_settings;
                koboldai_settings.forEach(function (item, i, arr) {
                    koboldai_settings[i] = JSON.parse(item);
                });
                var arr_holder = {};

                $("#settings_perset").empty(); //RossAscends: uncommented this to prevent settings selector from doubling preset list on QuickRefresh
                $("#settings_perset").append(
                    '<option value="gui">GUI KoboldAI Settings</option>'
                ); //adding in the GUI settings, since it is not loaded dynamically

                koboldai_setting_names.forEach(function (item, i, arr) {
                    arr_holder[item] = i;
                    $("#settings_perset").append(
                        "<option value=" + i + ">" + item + "</option>"
                    );
                    //console.log('loading preset #'+i+' -- '+item);
                });
                koboldai_setting_names = {};
                koboldai_setting_names = arr_holder;
                preset_settings = settings.preset_settings;

                //Load AI model config settings (temp, context length, anchors, and anchor order)

                textgenerationwebui_settings =
                    settings.textgenerationwebui_settings || textgenerationwebui_settings;

                amount_gen = settings.amount_gen;
                if (settings.max_context !== undefined)
                    max_context = parseInt(settings.max_context);
                if (settings.anchor_order !== undefined)
                    anchor_order = parseInt(settings.anchor_order);
                if (settings.style_anchor !== undefined)
                    style_anchor = !!settings.style_anchor;
                if (settings.character_anchor !== undefined)
                    character_anchor = !!settings.character_anchor;

                $("#style_anchor").prop("checked", style_anchor);
                $("#character_anchor").prop("checked", character_anchor);
                $("#anchor_order option[value=" + anchor_order + "]").attr(
                    "selected",
                    "true"
                );

                $("#max_context").val(max_context);
                $("#max_context_counter").html(max_context + " Tokens");

                $("#amount_gen").val(amount_gen);
                $("#amount_gen_counter").html(amount_gen + " Tokens");

                swipes = !!settings.swipes;  //// swipecode
                $('#swipes-checkbox').prop('checked', swipes); /// swipecode
                console.log('getSettings -- swipes = ' + swipes + '. toggling box');
                hideSwipeButtons();
                //console.log('getsettings calling showswipebtns');
                showSwipeButtons();

                loadKoboldSettings(settings);

                //Novel
                temp_novel = settings.temp_novel;
                rep_pen_novel = settings.rep_pen_novel;
                rep_pen_size_novel = settings.rep_pen_size_novel;

                let addZeros = "";
                if (isInt(temp_novel)) addZeros = ".00";
                $("#temp_novel").val(temp_novel);
                $("#temp_counter_novel").html(temp_novel + addZeros);

                addZeros = "";
                if (isInt(rep_pen_novel)) addZeros = ".00";
                $("#rep_pen_novel").val(rep_pen_novel);
                $("#rep_pen_counter_novel").html(rep_pen_novel + addZeros);

                $("#rep_pen_size_novel").val(rep_pen_size_novel);
                $("#rep_pen_size_counter_novel").html(rep_pen_size_novel + " Tokens");

                //Enable GUI deference settings if GUI is selected for Kobold
                if (preset_settings == "gui") {
                    $("#settings_perset option[value=gui]")
                        .attr("selected", "true")
                        .trigger("change");
                    $("#range_block").children().prop("disabled", true);
                    $("#range_block").css("opacity", 0.5);

                    $("#amount_gen_block").children().prop("disabled", true);
                    $("#amount_gen_block").css("opacity", 0.45);
                } else {
                    if (typeof koboldai_setting_names[preset_settings] !== "undefined") {
                        $(`#settings_perset option[value=${koboldai_setting_names[preset_settings]}]`)
                            .attr("selected", "true");
                    } else {
                        $("#range_block").children().prop("disabled", true);
                        $("#range_block").css("opacity", 0.5);
                        $("#amount_gen_block").children().prop("disabled", true);
                        $("#amount_gen_block").css("opacity", 0.45);

                        preset_settings = "gui";
                        $("#settings_perset option[value=gui]")
                            .attr("selected", "true")
                            .trigger("change");
                    }
                }

                //Load User's Name and Avatar

                user_avatar = settings.user_avatar;
                $(".mes").each(function () {
                    if ($(this).attr("ch_name") == name1) {
                        $(this)
                            .children(".avatar")
                            .children("img")
                            .attr("src", "User Avatars/" + user_avatar);
                    }
                });

                //Load the API server URL from settings
                api_server = settings.api_server;
                $("#api_url_text").val(api_server);

                setWorldInfoSettings(settings, data);

                if (data.enable_extensions) {
                    const src = "scripts/extensions.js";
                    if ($(`script[src="${src}"]`).length === 0) {
                        const script = document.createElement("script");
                        script.type = "module";
                        script.src = src;
                        $("body").append(script);
                    }
                }

                //get the character to auto-load
                if (settings.active_character !== undefined) {
                    if (settings.active_character !== "") {
                        active_character = settings.active_character;
                    }
                }

                api_server_textgenerationwebui =
                    settings.api_server_textgenerationwebui;
                $("#textgenerationwebui_api_url_text").val(
                    api_server_textgenerationwebui
                );

                for (var i of [
                    "temp",
                    "rep_pen",
                    "rep_pen_size",
                    "top_k",
                    "top_p",
                    "typical_p",
                    "penalty_alpha",
                ]) {
                    $("#" + i + "_textgenerationwebui").val(
                        textgenerationwebui_settings[i]
                    );
                    $("#" + i + "_counter_textgenerationwebui").html(
                        textgenerationwebui_settings[i]
                    );
                }

                selected_button = settings.selected_button;

            }

            if (!is_checked_colab) isColab();
        },
        error: function (jqXHR, exception) {
            console.log(exception);
            console.log(jqXHR);
        },
    });
}

async function saveSettings(type) {
    //console.log('Entering settings with name1 = '+name1);
    jQuery.ajax({
        type: "POST",
        url: "/savesettings",
        data: JSON.stringify({
            username: name1,
            api_server: api_server,
            api_server_textgenerationwebui: api_server_textgenerationwebui,
            preset_settings: preset_settings,
            preset_settings_novel: preset_settings_novel,
            user_avatar: user_avatar,
            amount_gen: amount_gen,
            max_context: max_context,
            anchor_order: anchor_order,
            style_anchor: style_anchor,
            character_anchor: character_anchor,
            main_api: main_api,
            api_key_novel: api_key_novel,
            model_novel: model_novel,
            temp_novel: temp_novel,
            rep_pen_novel: rep_pen_novel,
            rep_pen_size_novel: rep_pen_size_novel,
            world_info: world_info,
            world_info_depth: world_info_depth,
            world_info_budget: world_info_budget,
            active_character: active_character,
            textgenerationwebui_settings: textgenerationwebui_settings,
            swipes: swipes,
            ...kai_settings,
        }),
        beforeSend: function () {
            //console.log('saveSettings() -- active_character -- '+active_character);
            if (type == "change_name") {
                name1 = $("#your_name").val();
                //     console.log('beforeSend name1 = '+name1);
            }
        },
        cache: false,
        dataType: "json",
        contentType: "application/json",
        //processData: false,
        success: function (data) {
            //online_status = data.result;
            if (type == "change_name") {
                //console.log('got name change');
                //console.log('success: reading from settings = ' + settings.username);
                //name1 = settings.username;

                clearChat();
                printMessages();
            }
        },
        error: function (jqXHR, exception) {
            console.log(exception);
            console.log(jqXHR);
        },
    });
}

function isInt(value) {
    return (
        !isNaN(value) &&
        parseInt(Number(value)) == value &&
        !isNaN(parseInt(value, 10))
    );
}

function messageEditDone(div) {
    var text = div
        .parent()
        .parent()
        .children(".mes_text")
        .children(".edit_textarea")
        .val();
    //var text = chat[this_edit_mes_id];
    text = text.trim();
    const bias = extractMessageBias(text);
    chat[this_edit_mes_id]["mes"] = text;

    // editing old messages
    if (!chat[this_edit_mes_id]["extra"]) {
        chat[this_edit_mes_id]["extra"] = {};
    }

    chat[this_edit_mes_id]["extra"]["bias"] = bias ?? null;

    div.parent().parent().children(".mes_text").empty();
    div.css("display", "none");
    div.parent().children(".mes_edit_cancel").css("display", "none");
    div.parent().children(".mes_edit").css("display", "inline-block");
    div
        .parent()
        .parent()
        .children(".mes_text")
        .append(messageFormating(text, this_edit_mes_chname));
    div.parent().parent().children(".mes_bias").empty();
    div.parent().parent().children(".mes_bias").append(messageFormating(bias));
    appendImageToMessage(chat[this_edit_mes_id], div.closest(".mes"));
    this_edit_mes_id = undefined;
    if (selected_group) {
        saveGroupChat(selected_group);
    } else {
        saveChat();
    }
}

async function getAllCharaChats() {
    //console.log('getAllCharaChats() pinging server for character chat history.');
    $("#select_chat_div").html("");
    //console.log(characters[this_chid].chat);
    jQuery.ajax({
        type: "POST",
        url: "/getallchatsofcharacter",
        data: JSON.stringify({ avatar_url: characters[this_chid].avatar }),
        beforeSend: function () {
            //$('#create_button').attr('value','Creating...');
        },
        cache: false,
        dataType: "json",
        contentType: "application/json",
        success: function (data) {
            $("#load_select_chat_div").css("display", "none");
            let dataArr = Object.values(data);
            data = dataArr.sort((a, b) =>
                a["file_name"].localeCompare(b["file_name"])
            );
            data = data.reverse();

            for (const key in data) {
                let strlen = 300;
                let mes = data[key]["mes"];
                if (mes !== undefined) {
                    if (mes.length > strlen) {
                        mes = "..." + mes.substring(mes.length - strlen);
                    }
                    $("#select_chat_div").append(
                        '<div class="select_chat_block" file_name="' +
                        data[key]["file_name"] +
                        '"><div class=avatar><img src="characters/' +
                        characters[this_chid]["avatar"] +
                        '""></div><div class="select_chat_block_filename">' +
                        data[key]["file_name"] +
                        '</div><div class="select_chat_block_mes">' +
                        mes +
                        "</div></div>"
                    );
                    if (
                        characters[this_chid]["chat"] ==
                        data[key]["file_name"].replace(".jsonl", "")
                    ) {
                        //children().last()
                        $("#select_chat_div")
                            .children(":nth-last-child(1)")
                            .attr("highlight", true);
                    }
                }
            }
            //<div id="select_chat_div">

            //<div id="load_select_chat_div">
            //console.log(data);
            //chat.length = 0;

            //chat =  data;
            //getChatResult();
            //saveChat();
            //console.log('getAllCharaChats() -- Finished successfully');
        },
        error: function (jqXHR, exception) {
            //getChatResult();
            //console.log('getAllCharaChats() -- Failed');
            console.log(exception);
            console.log(jqXHR);
        },
    });
}

//************************************************************
//************************Novel.AI****************************
//************************************************************
async function getStatusNovel() {
    if (is_get_status_novel) {
        var data = { key: api_key_novel };

        jQuery.ajax({
            type: "POST", //
            url: "/getstatus_novelai", //
            data: JSON.stringify(data),
            beforeSend: function () {
                //$('#create_button').attr('value','Creating...');
            },
            cache: false,
            dataType: "json",
            contentType: "application/json",
            success: function (data) {
                if (data.error != true) {
                    //var settings2 = JSON.parse(data);
                    //const getData = await response.json();
                    novel_tier = data.tier;
                    if (novel_tier == undefined) {
                        online_status = "no_connection";
                    }
                    if (novel_tier === 0) {
                        online_status = "Paper";
                    }
                    if (novel_tier === 1) {
                        online_status = "Tablet";
                    }
                    if (novel_tier === 2) {
                        online_status = "Scroll";
                    }
                    if (novel_tier === 3) {
                        online_status = "Opus";
                    }
                }
                resultCheckStatusNovel();
            },
            error: function (jqXHR, exception) {
                online_status = "no_connection";
                console.log(exception);
                console.log(jqXHR);
                resultCheckStatusNovel();
            },
        });
    } else {
        if (is_get_status != true) {
            online_status = "no_connection";
        }
    }
}

function compareVersions(v1, v2) {
    const v1parts = v1.split(".");
    const v2parts = v2.split(".");

    for (let i = 0; i < v1parts.length; ++i) {
        if (v2parts.length === i) {
            return 1;
        }

        if (v1parts[i] === v2parts[i]) {
            continue;
        }
        if (v1parts[i] > v2parts[i]) {
            return 1;
        } else {
            return -1;
        }
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
}

function selectRightMenuWithAnimation(selectedMenuId) {
    const displayModes = {
        'rm_info_block': 'flex',
        'rm_group_chats_block': 'flex',
        'rm_api_block': 'grid',
        'rm_characters_block': 'flex',
    };
    document.querySelectorAll('#right-nav-panel .right_menu').forEach((menu) => {
        $(menu).css('display', 'none');

        if (selectedMenuId && selectedMenuId.replace('#', '') === menu.id) {
            const mode = displayModes[menu.id] ?? 'block';
            $(menu).css('display', mode);
            $(menu).css("opacity", 0.0);
            $(menu).transition({
                opacity: 1.0,
                duration: animation_rm_duration,
                easing: animation_rm_easing,
                complete: function () { },
            });
        }
    })
}

function setRightTabSelectedClass(selectedButtonId) {
    document.querySelectorAll('#right-nav-panel-tabs .right_menu_button').forEach((button) => {
        button.classList.remove('selected-right-tab');

        if (selectedButtonId && selectedButtonId.replace('#', '') === button.id) {
            button.classList.add('selected-right-tab');
        }
    });
}

function select_rm_info(text, charId = null) {

    $("#rm_info_text").html("<h3>" + text + "</h3>");

    selectRightMenuWithAnimation('rm_info_block');
    setRightTabSelectedClass();

    prev_selected_char = charId;
}

function select_selected_character(chid) {
    //character select
    //console.log('select_selected_character() -- starting with input of -- '+chid+' (name:'+characters[chid].name+')');
    select_rm_create();
    menu_type = "character_edit";
    $("#delete_button").css("display", "block");
    $("#export_button").css("display", "block");
    setRightTabSelectedClass('rm_button_selected_ch');
    var display_name = characters[chid].name;

    //create text poles
    $("#rm_button_back").css("display", "none");
    //$("#character_import_button").css("display", "none");
    $("#create_button").attr("value", "Save");              // what is the use case for this?
    $("#create_button_label").css("display", "none");

    $("#rm_button_selected_ch").children("h2").text(display_name);
    $("#add_avatar_button").val("");

    $("#character_popup_text_h3").text(characters[chid].name);
    $("#character_name_pole").val(characters[chid].name);
    $("#description_textarea").val(characters[chid].description);
    $("#personality_textarea").val(characters[chid].personality);
    $("#firstmessage_textarea").val(characters[chid].first_mes);
    $("#scenario_pole").val(characters[chid].scenario);
    $("#talkativeness_slider").val(
        characters[chid].talkativeness ?? talkativeness_default
    );
    $("#mes_example_textarea").val(characters[chid].mes_example);
    $("#selected_chat_pole").val(characters[chid].chat);
    $("#create_date_pole").val(characters[chid].create_date);
    $("#avatar_url_pole").val(characters[chid].avatar);
    $("#chat_import_avatar_url").val(characters[chid].avatar);
    $("#chat_import_character_name").val(characters[chid].name);
    //$("#avatar_div").css("display", "none");
    var this_avatar = default_avatar;
    if (characters[chid].avatar != "none") {
        this_avatar = "characters/" + characters[chid].avatar;
    }
    $("#avatar_load_preview").attr("src", this_avatar + "?" + Date.now());
    $("#name_div").css("display", "none");

    $("#form_create").attr("actiontype", "editcharacter");
    active_character = chid;
    //console.log('select_selected_character() -- active_character -- '+chid+'(ChID of '+display_name+')');
    saveSettingsDebounced();
    //console.log('select_selected_character() -- called saveSettings() to save -- active_character -- '+active_character+'(ChID of '+display_name+')');
}

function select_rm_create() {
    menu_type = "create";

    //console.log('select_rm_Create() -- selected button: '+selected_button);
    if (selected_button == "create") {
        if (create_save_avatar != "") {
            $("#add_avatar_button").get(0).files = create_save_avatar;
            read_avatar_load($("#add_avatar_button").get(0));
        }
    }

    selectRightMenuWithAnimation('rm_ch_create_block');
    setRightTabSelectedClass();

    $("#delete_button_div").css("display", "none");
    $("#delete_button").css("display", "none");
    $("#export_button").css("display", "none");
    $("#create_button_label").css("display", "block");
    $("#create_button").attr("value", "Create");
    //RossAscends: commented this out as part of the auto-loading token counter
    //$('#result_info').html('&nbsp;');

    //create text poles
    $("#rm_button_back").css("display", "inline-block");
    $("#character_import_button").css("display", "inline-block");
    $("#character_popup_text_h3").text("Create character");
    $("#character_name_pole").val(create_save_name);
    $("#description_textarea").val(create_save_description);
    $("#personality_textarea").val(create_save_personality);
    $("#firstmessage_textarea").val(create_save_first_message);
    $("#talkativeness_slider").val(create_save_talkativeness);
    $("#scenario_pole").val(create_save_scenario);
    if ($.trim(create_save_mes_example).length == 0) {
        $("#mes_example_textarea").val("<START>");
    } else {
        $("#mes_example_textarea").val(create_save_mes_example);
    }
    $("#avatar_div").css("display", "flex");
    $("#avatar_load_preview").attr("src", default_avatar);
    $("#name_div").css("display", "block");

    $("#form_create").attr("actiontype", "createcharacter");
}

function select_rm_characters() {
    if (prev_selected_char) {
        let newChId = characters.findIndex((x) => x.name == prev_selected_char);
        $(`.character_select[chid="${newChId}"]`).trigger("click");
        prev_selected_char = null;
    }

    menu_type = "characters";
    selectRightMenuWithAnimation('rm_characters_block');
    setRightTabSelectedClass('rm_button_characters');
}

function setExtensionPrompt(key, value) {
    extension_prompts[key] = value;
}

function callPopup(text, type) {
    if (type) {
        popup_type = type;
    }

    $("#dialogue_popup_cancel").css("display", "inline-block");
    switch (popup_type) {
        case "text":
        case "char_not_selected":
            $("#dialogue_popup_ok").text("Ok");
            $("#dialogue_popup_cancel").css("display", "none");
            break;

        case "world_imported":
        case "new_chat":
            $("#dialogue_popup_ok").text("Yes");
            break;
        case "del_world":
        case "del_group":
        default:
            $("#dialogue_popup_ok").text("Delete");
    }
    $("#dialogue_popup_text").html(text);
    $("#shadow_popup").css("display", "block");
    $("#shadow_popup").transition({
        opacity: 1.0,
        duration: animation_rm_duration,
        easing: animation_rm_easing,
    });
}

function read_bg_load(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $("#bg_load_preview")
                .attr("src", e.target.result)
                .width(103)
                .height(83);

            var formData = new FormData($("#form_bg_download").get(0));

            //console.log(formData);
            jQuery.ajax({
                type: "POST",
                url: "/downloadbackground",
                data: formData,
                beforeSend: function () {
                    //$('#create_button').attr('value','Creating...');
                },
                cache: false,
                contentType: false,
                processData: false,
                success: function (html) {
                    setBackground(html);
                    if (bg1_toggle == true) {
                        // this is a repeat of the background setting function for when  user uploads a new BG image
                        bg1_toggle = false; // should make the Bg setting a modular function to be called in both cases
                        var number_bg = 2;
                        var target_opacity = 1.0;
                    } else {
                        bg1_toggle = true;
                        var number_bg = 1;
                        var target_opacity = 0.0;
                    }
                    $("#bg2").transition({
                        opacity: target_opacity,
                        duration: 1300, //animation_rm_duration,
                        easing: "linear",
                        complete: function () {
                            $("#options").css("display", "none");
                        },
                    });
                    $("#bg" + number_bg).css(
                        "background-image",
                        "url(" + e.target.result + ")"
                    );
                    $("#form_bg_download").after(
                        "<div class=bg_example><img bgfile='" +
                        html +
                        "' class=bg_example_img src='backgrounds/" +
                        html +
                        "'><img bgfile='" +
                        html +
                        "' class=bg_example_cross src=img/cross.png></div>"
                    );
                },
                error: function (jqXHR, exception) {
                    console.log(exception);
                    console.log(jqXHR);
                },
            });
        };

        reader.readAsDataURL(input.files[0]);
    }
}

function showSwipeButtons() {
    if (
        chat[chat.length - 1].is_system ||
        !swipes ||
        $('.mes:last').attr('mesid') <= 0 ||
        chat[chat.length - 1].is_user ||
        count_view_mes <= 1
    ) { return; }

    //had to add this to make the swipe counter work
    //(copied from the onclick functions for swipe buttons..
    //don't know why the array isn't set for non-swipe messsages in Generate or addOneMessage..)

    if (chat[chat.length - 1]['swipe_id'] === undefined) {              // if there is no swipe-message in the last spot of the chat array
        chat[chat.length - 1]['swipe_id'] = 0;                        // set it to id 0
        chat[chat.length - 1]['swipes'] = [];                         // empty the array
        chat[chat.length - 1]['swipes'][0] = chat[chat.length - 1]['mes'];  //assign swipe array with last message from chat
    }

    const currentMessage = $("#chat").children().filter(`[mesid="${count_view_mes - 1}"]`);
    const swipeId = chat[chat.length - 1].swipe_id;
    var swipesCounterHTML = (`${(swipeId + 1)}/${(chat[chat.length - 1].swipes.length)}`);

    if (swipeId !== undefined && swipeId != 0) {
        currentMessage.children('.swipe_left').css('display', 'flex');
    }
    if (is_send_press === false || chat[chat.length - 1].swipes.length >= swipeId) {     //only show right when generate is off, or when next right swipe would not make a generate happen
        currentMessage.children('.swipe_right').css('display', 'flex');
        currentMessage.children('.swipe_right').css('opacity', '0.3');
    }
    //console.log((chat[chat.length - 1]));
    if ((chat[chat.length - 1].swipes.length - swipeId) === 1) {
        console.log('highlighting R swipe');
        currentMessage.children('.swipe_right').css('opacity', '0.7');
    }
    console.log(swipesCounterHTML);

    $(".swipes-counter").html(swipesCounterHTML);

    //console.log(swipeId);
    //console.log(chat[chat.length - 1].swipes.length);
}

function hideSwipeButtons() {
    //console.log('hideswipebuttons entered');
    $("#chat").children().filter('[mesid="' + (count_view_mes - 1) + '"]').children('.swipe_right').css('display', 'none');
    $("#chat").children().filter('[mesid="' + (count_view_mes - 1) + '"]').children('.swipe_left').css('display', 'none');
}

window["TavernAI"].getContext = function () {
    return {
        chat: chat,
        characters: characters,
        groups: groups,
        worldInfo: world_info_data,
        name1: name1,
        name2: name2,
        characterId: this_chid,
        groupId: selected_group,
        chatId: this_chid && characters[this_chid] && characters[this_chid].chat,
        onlineStatus: online_status,
        addOneMessage: addOneMessage,
        generate: Generate,
        encode: encode,
        extensionPrompts: extension_prompts,
        setExtensionPrompt: setExtensionPrompt,
        saveChat: saveChat,
        sendSystemMessage: sendSystemMessage,
    };
};

$(document).ready(function () {

    $('#swipes-checkbox').change(function () {
        console.log('detected swipes-checkbox changed values')
        swipes = !!$('#swipes-checkbox').prop('checked');
        if (swipes) {
            //console.log('toggle change calling showswipebtns');
            showSwipeButtons();
        } else {
            hideSwipeButtons();
        }
        saveSettingsDebounced();
    });

    ///// SWIPE BUTTON CLICKS ///////

    $(document).on('click', '.swipe_right', function () {               //when we click swipe right button
        const swipe_duration = 120;
        const swipe_range = 700;
        //console.log(swipe_range);
        let run_generate = false;
        let run_swipe_right = false;
        if (chat[chat.length - 1]['swipe_id'] === undefined) {              // if there is no swipe-message in the last spot of the chat array
            chat[chat.length - 1]['swipe_id'] = 0;                        // set it to id 0
            chat[chat.length - 1]['swipes'] = [];                         // empty the array
            chat[chat.length - 1]['swipes'][0] = chat[chat.length - 1]['mes'];  //assign swipe array with last message from chat
        }
        chat[chat.length - 1]['swipe_id']++;                                      //make new slot in array
        //console.log(chat[chat.length-1]['swipes']);
        if (parseInt(chat[chat.length - 1]['swipe_id']) === chat[chat.length - 1]['swipes'].length) { //if swipe id of last message is the same as the length of the 'swipes' array

            run_generate = true;
        } else if (parseInt(chat[chat.length - 1]['swipe_id']) < chat[chat.length - 1]['swipes'].length) { //otherwise, if the id is less than the number of swipes
            chat[chat.length - 1]['mes'] = chat[chat.length - 1]['swipes'][chat[chat.length - 1]['swipe_id']]; //load the last mes box with the latest generation
            run_swipe_right = true; //then prepare to do normal right swipe to show next message


        }

        if (chat[chat.length - 1]['swipe_id'] > chat[chat.length - 1]['swipes'].length) { //if we swipe right while generating (the swipe ID is greater than what we are viewing now)
            chat[chat.length - 1]['swipe_id'] = chat[chat.length - 1]['swipes'].length; //show that message slot (will be '...' while generating)
        }
        if (run_generate) {               //hide swipe arrows while generating
            $(this).css('display', 'none');

        }
        if (run_generate || run_swipe_right) {                // handles animated transitions when swipe right, specifically height transitions between messages

            let this_mes_div = $(this).parent();
            let this_mes_block = $(this).parent().children('.mes_block').children('.mes_text');
            const this_mes_div_height = this_mes_div[0].scrollHeight;
            const this_mes_block_height = this_mes_block[0].scrollHeight;

            this_mes_div.children('.swipe_left').css('display', 'flex');
            this_mes_div.children('.mes_block').transition({        // this moves the div back and forth
                x: '-' + swipe_range,
                duration: swipe_duration,
                easing: animation_rm_easing,
                queue: false,
                complete: function () {

                    const is_animation_scroll = ($('#chat').scrollTop() >= ($('#chat').prop("scrollHeight") - $('#chat').outerHeight()) - 10);
                    //console.log(parseInt(chat[chat.length-1]['swipe_id']));
                    //console.log(chat[chat.length-1]['swipes'].length);
                    if (run_generate && parseInt(chat[chat.length - 1]['swipe_id']) === chat[chat.length - 1]['swipes'].length) {
                        //console.log('showing ""..."');
                        $("#chat").children().filter('[mesid="' + (count_view_mes - 1) + '"]').children('.mes_block').children('.mes_text').html('...');  //shows "..." while generating
                    } else {
                        //console.log('showing previously generated swipe candidate, or "..."');
                        //console.log('onclick right swipe calling addOneMessage');
                        addOneMessage(chat[chat.length - 1], 'swipe');
                    }
                    let new_height = this_mes_div_height - (this_mes_block_height - this_mes_block[0].scrollHeight);
                    if (new_height < 103) new_height = 103;


                    this_mes_div.animate({ height: new_height + 'px' }, {
                        duration: 100,
                        queue: false,
                        progress: function () {
                            // Scroll the chat down as the message expands
                            if (is_animation_scroll) $("#chat").scrollTop($("#chat")[0].scrollHeight);
                        },
                        complete: function () {
                            this_mes_div.css('height', 'auto');
                            // Scroll the chat down to the bottom once the animation is complete
                            if (is_animation_scroll) $("#chat").scrollTop($("#chat")[0].scrollHeight);
                        }
                    });
                    this_mes_div.children('.mes_block').transition({
                        x: swipe_range,
                        duration: 0,
                        easing: animation_rm_easing,
                        queue: false,
                        complete: function () {
                            this_mes_div.children('.mes_block').transition({
                                x: '0px',
                                duration: swipe_duration,
                                easing: animation_rm_easing,
                                queue: false,
                                complete: function () {
                                    if (run_generate && !is_send_press && parseInt(chat[chat.length - 1]['swipe_id']) === chat[chat.length - 1]['swipes'].length) {
                                        console.log('caught here 2');
                                        is_send_press = true;
                                        Generate('swipe');
                                    } else {
                                        if (parseInt(chat[chat.length - 1]['swipe_id']) !== chat[chat.length - 1]['swipes'].length) {
                                            if (selected_group) {
                                                saveGroupChat(selected_group);
                                            } else {
                                                saveChat();
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    });
                }
            });

            $(this).parent().children('.avatar').transition({ // moves avatar aong with swipe
                x: '-' + swipe_range,
                duration: swipe_duration,
                easing: animation_rm_easing,
                queue: false,
                complete: function () {
                    $(this).parent().children('.avatar').transition({
                        x: swipe_range,
                        duration: 0,
                        easing: animation_rm_easing,
                        queue: false,
                        complete: function () {
                            $(this).parent().children('.avatar').transition({
                                x: '0px',
                                duration: swipe_duration,
                                easing: animation_rm_easing,
                                queue: false,
                                complete: function () {

                                }
                            });
                        }
                    });
                }
            });
        }

    });
    $(document).on('click', '.swipe_left', function () {      // when we swipe left..but no generation.
        const swipe_duration = 120;
        const swipe_range = '700px';
        chat[chat.length - 1]['swipe_id']--;
        if (chat[chat.length - 1]['swipe_id'] >= 0) {           // hide the left arrow if we are viewing the first candidate of the last message block
            $(this).parent().children('swipe_right').css('display', 'flex');
            if (chat[chat.length - 1]['swipe_id'] === 0) {
                $(this).css('display', 'none');
            }

            let this_mes_div = $(this).parent();
            let this_mes_block = $(this).parent().children('.mes_block').children('.mes_text');
            const this_mes_div_height = this_mes_div[0].scrollHeight;
            this_mes_div.css('height', this_mes_div_height);
            const this_mes_block_height = this_mes_block[0].scrollHeight;

            chat[chat.length - 1]['mes'] = chat[chat.length - 1]['swipes'][chat[chat.length - 1]['swipe_id']];
            $(this).parent().children('.mes_block').transition({
                x: swipe_range,
                duration: swipe_duration,
                easing: animation_rm_easing,
                queue: false,
                complete: function () {
                    const is_animation_scroll = ($('#chat').scrollTop() >= ($('#chat').prop("scrollHeight") - $('#chat').outerHeight()) - 10);
                    //console.log('on left swipe click calling addOneMessage');
                    addOneMessage(chat[chat.length - 1], 'swipe');
                    let new_height = this_mes_div_height - (this_mes_block_height - this_mes_block[0].scrollHeight);
                    if (new_height < 103) new_height = 103;
                    this_mes_div.animate({ height: new_height + 'px' }, {
                        duration: 100,
                        queue: false,
                        progress: function () {
                            // Scroll the chat down as the message expands

                            if (is_animation_scroll) $("#chat").scrollTop($("#chat")[0].scrollHeight);
                        },
                        complete: function () {
                            this_mes_div.css('height', 'auto');
                            // Scroll the chat down to the bottom once the animation is complete
                            if (is_animation_scroll) $("#chat").scrollTop($("#chat")[0].scrollHeight);
                        }
                    });
                    $(this).parent().children('.mes_block').transition({
                        x: '-' + swipe_range,
                        duration: 0,
                        easing: animation_rm_easing,
                        queue: false,
                        complete: function () {
                            $(this).parent().children('.mes_block').transition({
                                x: '0px',
                                duration: swipe_duration,
                                easing: animation_rm_easing,
                                queue: false,
                                complete: function () {
                                    if (selected_group) {
                                        saveGroupChat(selected_group);
                                    } else {
                                        saveChat();
                                    }
                                }
                            });
                        }
                    });
                }
            });

            $(this).parent().children('.avatar').transition({
                x: swipe_range,
                duration: swipe_duration,
                easing: animation_rm_easing,
                queue: false,
                complete: function () {
                    $(this).parent().children('.avatar').transition({
                        x: '-' + swipe_range,
                        duration: 0,
                        easing: animation_rm_easing,
                        queue: false,
                        complete: function () {
                            $(this).parent().children('.avatar').transition({
                                x: '0px',
                                duration: swipe_duration,
                                easing: animation_rm_easing,
                                queue: false,
                                complete: function () {

                                }
                            });
                        }
                    });
                }
            });
        }
        if (chat[chat.length - 1]['swipe_id'] < 0) {
            chat[chat.length - 1]['swipe_id'] = 0;
        }
    });

    $("#character_search_bar").on("input", function () {
        const selector = ['#rm_print_characters_block .character_select', '#rm_print_characters_block .group_select'].join(',');
        const searchValue = $(this).val().trim().toLowerCase();

        if (!searchValue) {
            $(selector).show();
        } else {
            $(selector).each(function () {
                $(this).children(".ch_name").text().toLowerCase().includes(searchValue)
                    ? $(this).show()
                    : $(this).hide();
            });
        }
    });

    $("#characloud_url").click(function () {
        window.open("https://boosty.to/tavernai", "_blank");
    });
    $("#send_but").click(function () {
        if (is_send_press == false) {
            //hideSwipeButtons();
            is_send_press = true;

            Generate();
        }
    });

    //hotkey to send input with enter (shift+enter generates a new line in the chat input box)
    //this is not ideal for touch device users with virtual keyboards.
    //ideally we would detect if the user is using a virtual keyboard, and disable this shortcut for them.
    //because mobile users' hands are always near the screen, tapping the send button is better for them, and enter should always make a new line.
    //note: CAI seems to have this handled. PC: shift+enter = new line, enter = send. iOS: shift+enter AND enter both make new lines, and only the send button sends.
    //maybe a way to simulate this would be to disable the eventListener for people iOS.

    $("#send_textarea").keydown(function (e) {
        if (!e.shiftKey && !e.ctrlKey && e.key == "Enter" && is_send_press == false) {
            //hideSwipeButtons();
            is_send_press = true;
            e.preventDefault();
            Generate();
        }
    });

    //menu buttons setup

    $("#rm_button_settings").click(function () {
        selected_button = "settings";
        menu_type = "settings";
        selectRightMenuWithAnimation('rm_api_block');
        setRightTabSelectedClass('rm_button_settings');
    });
    $("#rm_button_characters").click(function () {
        selected_button = "characters";
        select_rm_characters();
    });
    $("#rm_button_back").click(function () {
        selected_button = "characters";
        select_rm_characters();
    });
    $("#rm_button_create").click(function () {
        selected_button = "create";
        select_rm_create();
    });
    $("#rm_button_selected_ch").click(function () {
        if (selected_group) {
            select_group_chats(selected_group);
        } else {
            selected_button = "character_edit";
            select_selected_character(this_chid);
        }
    });

    $(document).on("click", ".character_select", function () {
        if (selected_group && is_group_generating) {
            return;
        }

        if (this_chid !== $(this).attr("chid")) {
            //if clicked on a different character from what was currently selected
            if (!is_send_press) {
                resetSelectedGroup();
                this_edit_mes_id = undefined;
                selected_button = "character_edit";
                this_chid = $(this).attr("chid");
                active_character = this_chid;
                clearChat();
                chat.length = 0;
                getChat();

                //console.log('Clicked on '+characters[this_chid].name+' Active_Character set to: '+active_character+' (ChID:'+this_chid+')');
            }
        } else {
            //if clicked on character that was already selected
            selected_button = "character_edit";
            select_selected_character(this_chid);
        }
        $("#character_search_bar").val("").trigger("input");
    });


    $(document).on("input", ".edit_textarea", function () {
        scroll_holder = $("#chat").scrollTop();
        $(this).height(0).height(this.scrollHeight);
        is_use_scroll_holder = true;
    });
    $("#chat").on("scroll", function () {
        if (is_use_scroll_holder) {
            $("#chat").scrollTop(scroll_holder);
            is_use_scroll_holder = false;
        }
    });
    $(document).on("click", ".del_checkbox", function () {
        //when a 'delete message' checkbox is clicked
        $(".del_checkbox").each(function () {
            $(this).prop("checked", false);
            $(this).parent().css("background", css_mes_bg);
        });
        $(this).parent().css("background", "#600"); //sets the bg of the mes selected for deletion
        var i = $(this).parent().attr("mesid"); //checks the message ID in the chat
        this_del_mes = i;
        while (i < chat.length) {
            //as long as the current message ID is less than the total chat length
            $(".mes[mesid='" + i + "']").css("background", "#600"); //sets the bg of the all msgs BELOW the selected .mes
            $(".mes[mesid='" + i + "']")
                .children(".del_checkbox")
                .prop("checked", true);
            i++;
            //console.log(i);
        }
    });
    $(document).on("click", "#user_avatar_block .avatar", function () {
        user_avatar = $(this).attr("imgfile");
        $(".mes").each(function () {
            if ($(this).attr("ch_name") == name1) {
                $(this)
                    .children(".avatar")
                    .children("img")
                    .attr("src", "User Avatars/" + user_avatar);
            }
        });
        saveSettingsDebounced();
        highlightSelectedAvatar();
    });
    $(document).on("click", "#user_avatar_block .avatar_upload", function () {
        $("#avatar_upload_file").click();
    });
    $("#avatar_upload_file").on("change", function (e) {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        const formData = new FormData($("#form_upload_avatar").get(0));

        jQuery.ajax({
            type: "POST",
            url: "/uploaduseravatar",
            data: formData,
            beforeSend: () => { },
            cache: false,
            contentType: false,
            processData: false,
            success: function (data) {
                if (data.path) {
                    appendUserAvatar(data.path);
                }
            },
            error: (jqXHR, exception) => { },
        });

        // Will allow to select the same file twice in a row
        $("#form_upload_avatar").trigger("reset");
    });
    $("#logo_block").click(function (event) {
        if (!bg_menu_toggle) {
            $("#bg_menu_button").transition({
                perspective: "100px",
                rotate3d: "1,1,0,180deg",
            });
            $("#bg_menu_content").transition({
                opacity: 1.0,
                height: "90vh",
                duration: 340,
                easing: "in",
                complete: function () {
                    bg_menu_toggle = true;
                    $("#bg_menu_content").css("overflow-y", "auto");
                },
            });
        } else {
            $("#bg_menu_button").transition({
                perspective: "100px",
                rotate3d: "1,1,0,360deg",
            });
            $("#bg_menu_content").css("overflow-y", "hidden");
            $("#bg_menu_content").transition({
                opacity: 0.0,
                height: "0px",
                duration: 340,
                easing: "in",
                complete: function () {
                    bg_menu_toggle = false;
                },
            });
        }
    });
    $(document).on("click", ".bg_example_img", function () {
        //when user clicks on a BG thumbnail...
        var this_bgfile = $(this).attr("bgfile"); // this_bgfile = whatever they clicked

        if (bg1_toggle == true) {
            //if bg1 is toggled true (initially set as true in first JS vars)
            bg1_toggle = false; // then toggle it false
            var number_bg = 2; // sets a variable for bg2
            var target_opacity = 1.0; // target opacity is 100%
        } else {
            //if bg1 is FALSE
            bg1_toggle = true; // make it true
            var number_bg = 1; // set variable to bg1..
            var target_opacity = 0.0; // set target opacity to 0
        }
        $("#bg2").stop(); // first, stop whatever BG transition was happening before
        $("#bg2").transition({
            // start a new BG transition routine
            opacity: target_opacity, // set opacity to previously set variable
            duration: 1300, //animation_rm_duration,
            easing: "linear",
            complete: function () {
                // why does the BG transition completion make the #options (right nav) invisible?
                $("#options").css("display", "none");
            },
        });
        $("#bg" + number_bg).css(
            "background-image",
            'url("backgrounds/' + this_bgfile + '")'
        );
        setBackground(this_bgfile);
    });
    $(document).on("click", ".bg_example_cross", function () {
        bg_file_for_del = $(this);
        //$(this).parent().remove();
        //delBackground(this_bgfile);
        popup_type = "del_bg";
        callPopup("<h3>Delete the background?</h3>");
    });
    $("#advanced_div").click(function () {
        if (!is_advanced_char_open) {
            is_advanced_char_open = true;
            $("#character_popup").css("display", "grid");
            $("#character_popup").css("opacity", 0.0);
            $("#character_popup").transition({
                opacity: 1.0,
                duration: animation_rm_duration,
                easing: animation_rm_easing,
            });
        } else {
            is_advanced_char_open = false;
            $("#character_popup").css("display", "none");
        }
    });
    $("#character_cross").click(function () {
        is_advanced_char_open = false;
        $("#character_popup").css("display", "none");
    });
    $("#character_popup_ok").click(function () {
        is_advanced_char_open = false;
        $("#character_popup").css("display", "none");
    });
    $("#dialogue_popup_ok").click(function () {
        $("#shadow_popup").css("display", "none");
        $("#shadow_popup").css("opacity:", 0.0);
        if (popup_type == "del_bg") {
            delBackground(bg_file_for_del.attr("bgfile"));
            bg_file_for_del.parent().remove();
        }
        if (popup_type == "del_ch") {
            console.log(
                "Deleting character -- ChID: " +
                this_chid +
                " -- Name: " +
                characters[this_chid].name
            );
            var msg = jQuery("#form_create").serialize(); // ID form
            jQuery.ajax({
                method: "POST",
                url: "/deletecharacter",
                beforeSend: function () {
                    select_rm_info("Character deleted");
                    //$('#create_button').attr('value','Deleting...');
                },
                data: msg,
                cache: false,
                success: function (html) {
                    //RossAscends: New handling of character deletion that avoids page refreshes and should have fixed char corruption due to cache problems.
                    //due to how it is handled with 'popup_type', i couldn't find a way to make my method completely modular, so keeping it in TAI-main.js as a new default.
                    //this allows for dynamic refresh of character list after deleting a character.
                    $("#character_cross").click(); // closes advanced editing popup
                    this_chid = "invalid-safety-id"; // unsets expected chid before reloading (related to getCharacters/printCharacters from using old arrays)
                    characters.length = 0; // resets the characters array, forcing getcharacters to reset
                    name2 = systemUserName; // replaces deleted charcter name with system user since she will be displayed next.
                    chat = [...safetychat]; // sets up system user to tell user about having deleted a character
                    setRightTabSelectedClass() // 'deselects' character's tab panel
                    $(document.getElementById("rm_button_selected_ch"))
                        .children("h2")
                        .text(""); // removes character name from nav tabs
                    clearChat(); // removes deleted char's chat
                    this_chid = undefined; // prevents getCharacters from trying to load an invalid char.
                    getCharacters(); // gets the new list of characters (that doesn't include the deleted one)
                    printMessages(); // prints out system user's 'deleted character' message
                    //console.log("#dialogue_popup_ok(del-char) >>>> saving");
                    saveSettingsDebounced(); // saving settings to keep changes to variables
                    //getCharacters();
                    //$('#create_button_div').html(html);
                },
            });
        }
        if (popup_type === "world_imported") {
            selectImportedWorldInfo();
        }
        if (popup_type === "del_world" && world_info) {
            deleteWorldInfo(world_info);
        }
        if (popup_type === "del_group") {
            const groupId = $("#dialogue_popup").data("group_id");

            if (groupId) {
                deleteGroup(groupId);
            }
        }
        //Make a new chat for selected character
        if (
            popup_type == "new_chat" &&
            this_chid != undefined &&
            menu_type != "create"
        ) {
            //Fix it; New chat doesn't create while open create character menu
            clearChat();
            chat.length = 0;
            characters[this_chid].chat = name2 + " - " + humanizedDateTime(); //RossAscends: added character name to new chat filenames and replaced Date.now() with humanizedDateTime;
            $("#selected_chat_pole").val(characters[this_chid].chat);
            saveCharacterDebounced();
            getChat();
        }
    });
    $("#dialogue_popup_cancel").click(function () {
        $("#shadow_popup").css("display", "none");
        $("#shadow_popup").css("opacity:", 0.0);
        popup_type = "";
    });

    $("#add_bg_button").change(function () {
        read_bg_load(this);
    });

    $("#add_avatar_button").change(function () {
        is_mes_reload_avatar = Date.now();
        read_avatar_load(this);
    });

    $("#form_create").submit(function (e) {
        $("#rm_info_avatar").html("");
        var formData = new FormData($("#form_create").get(0));
        if ($("#form_create").attr("actiontype") == "createcharacter") {
            if ($("#character_name_pole").val().length > 0) {
                //if the character name text area isn't empty (only posible when creating a new character)
                //console.log('/createcharacter entered');
                jQuery.ajax({
                    type: "POST",
                    url: "/createcharacter",
                    data: formData,
                    beforeSend: function () {
                        $("#create_button").attr("disabled", true);
                        $("#create_button").attr("value", "⏳");
                    },
                    cache: false,
                    contentType: false,
                    processData: false,
                    success: async function (html) {
                        $("#character_cross").click(); //closes the advanced character editing popup
                        $("#character_name_pole").val("");
                        create_save_name = "";
                        $("#description_textarea").val("");
                        create_save_description = "";
                        $("#personality_textarea").val("");
                        create_save_personality = "";
                        $("#firstmessage_textarea").val("");
                        create_save_first_message = "";
                        $("#talkativeness_slider").val(talkativeness_default);
                        create_save_talkativeness = talkativeness_default;

                        $("#character_popup_text_h3").text("Create character");

                        $("#scenario_pole").val("");
                        create_save_scenario = "";
                        $("#mes_example_textarea").val("");
                        create_save_mes_example = "";

                        create_save_avatar = "";

                        $("#create_button").removeAttr("disabled");
                        $("#add_avatar_button").replaceWith(
                            $("#add_avatar_button").val("").clone(true)
                        );

                        $("#create_button").attr("value", "✅");
                        if (true) {
                            let oldSelectedChar = null;
                            if (this_chid != undefined && this_chid != "invalid-safety-id") {
                                oldSelectedChar = characters[this_chid].name;
                            }

                            await getCharacters();

                            $("#rm_info_block").transition({ opacity: 0, duration: 0 });
                            var $prev_img = $("#avatar_div_div").clone();
                            $("#rm_info_avatar").append($prev_img);
                            select_rm_info("Character created", oldSelectedChar);

                            $("#rm_info_block").transition({ opacity: 1.0, duration: 2000 });
                        } else {
                            $("#result_info").html(html);
                        }
                    },
                    error: function (jqXHR, exception) {
                        //alert('ERROR: '+xhr.status+ ' Status Text: '+xhr.statusText+' '+xhr.responseText);
                        $("#create_button").removeAttr("disabled");
                    },
                });
            } else {
                $("#result_info").html("Name not entered");
            }
        } else {
            //console.log('/editcharacter -- entered.');
            //console.log('Avatar Button Value:'+$("#add_avatar_button").val());
            jQuery.ajax({
                type: "POST",
                url: "/editcharacter",
                data: formData,
                beforeSend: function () {
                    $("#create_button").attr("disabled", true);
                    $("#create_button").attr("value", "Save");
                },
                cache: false,
                contentType: false,
                processData: false,
                success: function (html) {
                    $(".mes").each(function () {
                        if ($(this).attr("ch_name") != name1) {
                            $(this)
                                .children(".avatar")
                                .children("img")
                                .attr("src", $("#avatar_load_preview").attr("src"));
                        }
                    });
                    if (chat.length === 1) {
                        var this_ch_mes = default_ch_mes;
                        if ($("#firstmessage_textarea").val() != "") {
                            this_ch_mes = $("#firstmessage_textarea").val();
                        }
                        if (
                            this_ch_mes !=
                            $.trim(
                                $("#chat")
                                    .children(".mes")
                                    .children(".mes_block")
                                    .children(".mes_text")
                                    .text()
                            )
                        ) {
                            clearChat();
                            chat.length = 0;
                            chat[0] = {};
                            chat[0]["name"] = name2;
                            chat[0]["is_user"] = false;
                            chat[0]["is_name"] = true;
                            chat[0]["mes"] = this_ch_mes;
                            add_mes_without_animation = true;
                            //console.log('form create submission calling addOneMessage');
                            addOneMessage(chat[0]);
                        }
                    }
                    $("#create_button").removeAttr("disabled");
                    getCharacters();

                    $("#add_avatar_button").replaceWith(
                        $("#add_avatar_button").val("").clone(true)
                    );
                    $("#create_button").attr("value", "Save");
                },
                error: function (jqXHR, exception) {
                    $("#create_button").removeAttr("disabled");
                    $("#result_info").html("<font color=red>Error: no connection</font>");
                },
            });
        }
    });

    $("#delete_button").click(function () {
        popup_type = "del_ch";
        callPopup(
            "<h3>Delete the character?</h3>Your chat will be closed."
        );
    });

    $("#rm_info_button").click(function () {
        $("#rm_info_avatar").html("");
        select_rm_characters();
    });

    //////// OPTIMIZED ALL CHAR CREATION/EDITING TEXTAREA LISTENERS ///////////////

    $("#character_name_pole").on("input", function () {
        if (menu_type == "create") {
            create_save_name = $("#character_name_pole").val();
        }
    });

    $("#description_textarea, #personality_textarea, #scenario_pole, #mes_example_textarea, #firstmessage_textarea")
        .on("input", function () {
            if (menu_type == "create") {
                create_save_description = $("#description_textarea").val();
                create_save_personality = $("#personality_textarea").val();
                create_save_scenario = $("#scenario_pole").val();
                create_save_mes_example = $("#mes_example_textarea").val();
                create_save_first_message = $("#firstmessage_textarea").val();
            } else {
                saveCharacterDebounced();
            }
        });

    $("#talkativeness_slider").on("input", function () {
        if (menu_type == "create") {
            create_save_talkativeness = $("#talkativeness_slider").val();
        } else {
            saveCharacterDebounced();
        }
    });

    ///////////////////////////////////////////////////////////////////////////////////

    $("#api_button").click(function () {
        if ($("#api_url_text").val() != "") {
            $("#api_loading").css("display", "inline-block");
            $("#api_button").css("display", "none");
            api_server = $("#api_url_text").val();
            api_server = $.trim(api_server);
            //console.log("1: "+api_server);
            if (api_server.substr(api_server.length - 1, 1) == "/") {
                api_server = api_server.substr(0, api_server.length - 1);
            }
            if (
                !(
                    api_server.substr(api_server.length - 3, 3) == "api" ||
                    api_server.substr(api_server.length - 4, 4) == "api/"
                )
            ) {
                api_server = api_server + "/api";
            }
            //console.log("2: "+api_server);
            main_api = "kobold";
            saveSettingsDebounced();
            is_get_status = true;
            is_api_button_press = true;
            getStatus();
            clearSoftPromptsList();
            getSoftPromptsList();
        }
    });

    $("#api_button_textgenerationwebui").click(function () {
        if ($("#textgenerationwebui_api_url_text").val() != "") {
            $("#api_loading_textgenerationwebui").css("display", "inline-block");
            $("#api_button_textgenerationwebui").css("display", "none");
            api_server_textgenerationwebui = $(
                "#textgenerationwebui_api_url_text"
            ).val();
            api_server_textgenerationwebui = $.trim(api_server_textgenerationwebui);
            if (
                api_server_textgenerationwebui.substr(
                    api_server_textgenerationwebui.length - 1,
                    1
                ) == "/"
            ) {
                api_server_textgenerationwebui = api_server_textgenerationwebui.substr(
                    0,
                    api_server_textgenerationwebui.length - 1
                );
            }
            //console.log("2: "+api_server_textgenerationwebui);
            main_api = "textgenerationwebui";
            saveSettingsDebounced();
            is_get_status = true;
            is_api_button_press = true;
            getStatus();
        }
    });

    $("body").click(function () {
        if ($("#options").css("opacity") == 1.0) {
            $("#options").transition({
                opacity: 0.0,
                duration: 100, //animation_rm_duration,
                easing: animation_rm_easing,
                complete: function () {
                    $("#options").css("display", "none");
                },
            });
        }
    });

    $("#options_button").click(function () {
        // this is the options button click function, shows the options menu if closed
        if (
            $("#options").css("display") === "none" &&
            $("#options").css("opacity") == 0.0
        ) {
            $("#options").css("display", "block");
            $("#options").transition({
                opacity: 1.0, // the manual setting of CSS via JS is what allows the click-away feature to work
                duration: 100,
                easing: animation_rm_easing,
                complete: function () { },
            });
        }
    });

    ///////////// OPTIMIZED LISTENERS FOR LEFT SIDE OPTIONS POPUP MENU //////////////////////

    $("#options_button [id]").on("click", function () {
        var id = $(this).attr("id");

        if (id == "option_select_chat") {
            if (selected_group) {
                // will open a chat selection screen
                openNavToggle();
                $("#rm_button_characters").trigger("click");
                return;
            }
            if (this_chid != undefined && !is_send_press) {
                getAllCharaChats();
                $("#shadow_select_chat_popup").css("display", "block");
                $("#shadow_select_chat_popup").css("opacity", 0.0);
                $("#shadow_select_chat_popup").transition({
                    opacity: 1.0,
                    duration: animation_rm_duration,
                    easing: animation_rm_easing,
                });
            }
        }

        else if (id == "option_start_new_chat") {
            if (selected_group) {
                // will open a group creation screen
                openNavToggle();
                $("#rm_button_group_chats").trigger("click");
                return;
            }
            if (this_chid != undefined && !is_send_press) {
                popup_type = "new_chat";
                callPopup("<h3>Start new chat?</h3>");
            }
        }

        else if (id == "option_regenerate") {
            if (is_send_press == false) {
                //hideSwipeButtons();

                if (selected_group) {
                    regenerateGroup();
                }
                else {
                    is_send_press = true;
                    Generate("regenerate");
                }
            }
        }

        else if (id == "option_delete_mes") {
            hideSwipeButtons();
            if ((this_chid != undefined && !is_send_press) || (selected_group && !is_group_generating)) {
                $("#dialogue_del_mes").css("display", "block");
                $("#send_form").css("display", "none");
                $(".del_checkbox").each(function () {
                    if ($(this).parent().attr("mesid") != 0) {
                        $(this).css("display", "block");
                        $(this).parent().children(".for_checkbox").css("display", "none");
                    }
                });
            }
        }
    });

    //////////////////////////////////////////////////////////////////////////////////////////////

    //functionality for the cancel delete messages button, reverts to normal display of input form
    $("#dialogue_del_mes_cancel").click(function () {
        $("#dialogue_del_mes").css("display", "none");
        $("#send_form").css("display", css_send_form_display);
        $(".del_checkbox").each(function () {
            $(this).css("display", "none");
            $(this).parent().children(".for_checkbox").css("display", "block");
            $(this).parent().css("background", css_mes_bg);
            $(this).prop("checked", false);
        });
        this_del_mes = 0;
        console.log('canceled del msgs, calling showswipesbtns');
        showSwipeButtons();
    });

    //confirms message delation with the "ok" button
    $("#dialogue_del_mes_ok").click(function () {
        $("#dialogue_del_mes").css("display", "none");
        $("#send_form").css("display", css_send_form_display);
        $(".del_checkbox").each(function () {
            $(this).css("display", "none");
            $(this).parent().children(".for_checkbox").css("display", "block");
            $(this).parent().css("background", css_mes_bg);
            $(this).prop("checked", false);
        });
        if (this_del_mes != 0) {
            $(".mes[mesid='" + this_del_mes + "']")
                .nextAll("div")
                .remove();
            $(".mes[mesid='" + this_del_mes + "']").remove();
            chat.length = this_del_mes;
            count_view_mes = this_del_mes;
            if (selected_group) {
                saveGroupChat(selected_group);
            } else {
                saveChat();
            }
            var $textchat = $("#chat");
            $textchat.scrollTop($textchat[0].scrollHeight);
        }
        this_del_mes = 0;
        $('#chat .mes').last().addClass('last_mes');
        $('#chat .mes').eq(-2).removeClass('last_mes');
        console.log('confirmed del msgs, calling showswipesbtns');
        showSwipeButtons();
    });

    $("#settings_perset").change(function () {
        if ($("#settings_perset").find(":selected").val() != "gui") {
            preset_settings = $("#settings_perset").find(":selected").text();
            const preset = koboldai_settings[koboldai_setting_names[preset_settings]];
            loadKoboldSettings(preset);

            amount_gen = preset.genamt;
            $("#amount_gen").val(amount_gen);
            $("#amount_gen_counter").html(amount_gen);

            max_context = preset.max_length;
            $("#max_context").val(max_context);
            $("#max_context_counter").html(max_context + " Tokens");

            $("#range_block").children().prop("disabled", false);
            $("#range_block").css("opacity", 1.0);
            $("#amount_gen_block").children().prop("disabled", false);
            $("#amount_gen_block").css("opacity", 1.0);
        } else {
            //$('.button').disableSelection();
            preset_settings = "gui";
            $("#range_block").children().prop("disabled", true);
            $("#range_block").css("opacity", 0.5);
            $("#amount_gen_block").children().prop("disabled", true);
            $("#amount_gen_block").css("opacity", 0.45);
        }
        saveSettingsDebounced();
    });

    $("#settings_perset_novel").change(function () {
        preset_settings_novel = $("#settings_perset_novel")
            .find(":selected")
            .text();
        temp_novel =
            novelai_settings[novelai_setting_names[preset_settings_novel]]
                .temperature;
        //amount_gen = koboldai_settings[koboldai_setting_names[preset_settings]].genamt;
        rep_pen_novel =
            novelai_settings[novelai_setting_names[preset_settings_novel]]
                .repetition_penalty;
        rep_pen_size_novel =
            novelai_settings[novelai_setting_names[preset_settings_novel]]
                .repetition_penalty_range;
        $("#temp_novel").val(temp_novel);
        $("#temp_counter_novel").html(temp_novel);

        //$('#amount_gen').val(amount_gen);
        //$('#amount_gen_counter').html(amount_gen);

        $("#rep_pen_novel").val(rep_pen_novel);
        $("#rep_pen_counter_novel").html(rep_pen_novel);

        $("#rep_pen_size_novel").val(rep_pen_size_novel);
        $("#rep_pen_size_counter_novel").html(rep_pen_size_novel + " Tokens");

        //$("#range_block").children().prop("disabled", false);
        //$("#range_block").css('opacity',1.0);
        saveSettingsDebounced();
    });

    $("#main_api").change(function () {
        is_pygmalion = false;
        is_get_status = false;
        is_get_status_novel = false;
        online_status = "no_connection";
        clearSoftPromptsList();
        checkOnlineStatus();
        changeMainAPI();
        saveSettingsDebounced();
    });

    $("#softprompt").change(async function () {
        if (!api_server) {
            return;
        }

        const selected = $("#softprompt").find(":selected").val();
        const response = await fetch("/setsoftprompt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": token,
            },
            body: JSON.stringify({ name: selected, api_server: api_server }),
        });

        if (!response.ok) {
            console.error("Couldn't change soft prompt");
        }
    });



    for (var i of [
        "temp",
        "rep_pen",
        "rep_pen_size",
        "top_k",
        "top_p",
        "typical_p",
        "penalty_alpha",
    ]) {
        $("#" + i + "_textgenerationwebui").attr("x-setting-id", i);
        $(document).on("input", "#" + i + "_textgenerationwebui", function () {
            var i = $(this).attr("x-setting-id");
            var val = $(this).val();
            if (isInt(val)) {
                $("#" + i + "_counter_textgenerationwebui").html($(this).val() + ".00");
            } else {
                $("#" + i + "_counter_textgenerationwebui").html($(this).val());
            }
            textgenerationwebui_settings[i] = parseFloat(val);
            saveSettingsDebounced();
        });
    }

    ////////////////// OPTIMIZED RANGE SLIDER LISTENERS////////////////

    const sliders = [
        {
            sliderId: "#amount_gen",
            counterId: "#amount_gen_counter",
            format: (val) => val,
            setValue: (val) => { amount_gen = Number(val); },
        },
        {
            sliderId: "#max_context",
            counterId: "#max_context_counter",
            format: (val) => val + " Tokens",
            setValue: (val) => { max_context = Number(val); },
        },
        {
            sliderId: "#temp_novel",
            counterId: "#temp_counter_novel",
            format: (val) => isInt(val) ? val + ".00" : val,
            setValue: (val) => { temp_novel = Number(val); },
        },
        {
            sliderId: "#rep_pen_novel",
            counterId: "#rep_pen_counter_novel",
            format: (val) => isInt(val) ? val + ".00" : val,
            setValue: (val) => { rep_pen_novel = Number(val); },
        },
        {
            sliderId: "#rep_pen_size_novel",
            counterId: "#rep_pen_size_counter_novel",
            format: (val) => val + " Tokens",
            setValue: (val) => { rep_pen_size_novel = Number(val); },
        }
    ];

    sliders.forEach(slider => {
        $(document).on("input", slider.sliderId, function () {
            const value = $(this).val();
            const formattedValue = slider.format(value);
            slider.setValue(value);
            $(slider.counterId).html(formattedValue);
            console.log('saving');
            saveSettingsDebounced();
        });
    });

    //////////////////////////////////////////////////////////////


    $("#style_anchor").change(function () {
        style_anchor = !!$("#style_anchor").prop("checked");
        saveSettingsDebounced();
    });

    $("#character_anchor").change(function () {
        character_anchor = !!$("#character_anchor").prop("checked");
        saveSettingsDebounced();
    });

    $("#donation").click(function () {
        $("#shadow_tips_popup").css("display", "block");
        $("#shadow_tips_popup").transition({
            opacity: 1.0,
            duration: 100,
            easing: animation_rm_easing,
            complete: function () { },
        });
    });

    $("#tips_cross").click(function () {
        $("#shadow_tips_popup").transition({
            opacity: 0.0,
            duration: 100,
            easing: animation_rm_easing,
            complete: function () {
                $("#shadow_tips_popup").css("display", "none");
            },
        });
    });

    $("#select_chat_cross").click(function () {
        $("#shadow_select_chat_popup").css("display", "none");
        $("#load_select_chat_div").css("display", "block");
    });

    //********************
    //***Message Editor***
    $(document).on("click", ".mes_edit", function () {
        if (this_chid !== undefined || selected_group) {
            const message = $(this).closest(".mes");

            if (message.data("isSystem")) {
                return;
            }

            let chatScrollPosition = $("#chat").scrollTop();
            if (this_edit_mes_id !== undefined) {
                let mes_edited = $("#chat")
                    .children()
                    .filter('[mesid="' + this_edit_mes_id + '"]')
                    .children(".mes_block")
                    .children(".ch_name")
                    .children(".mes_edit_done");
                if (edit_mes_id == count_view_mes - 1) { //if the generating swipe (...)
                    if (chat[edit_mes_id]['swipe_id'] !== undefined) {
                        if (chat[edit_mes_id]['swipes'].length === chat[edit_mes_id]['swipe_id']) {
                            run_edit = false;
                        }
                    }
                    if (run_edit) {
                        hideSwipeButtons();
                    }
                }
                messageEditDone(mes_edited);
            }
            $(this).parent().parent().children(".mes_text").empty();
            $(this).css("display", "none");
            $(this)
                .parent()
                .children(".mes_edit_done")
                .css("display", "inline-block");
            $(this).parent().children(".mes_edit_done").css("opacity", 0.0);
            $(this)
                .parent()
                .children(".mes_edit_cancel")
                .css("display", "inline-block");
            $(this).parent().children(".mes_edit_cancel").css("opacity", 0.0);
            $(this)
                .parent()
                .children(".mes_edit_done")
                .transition({
                    opacity: 1.0,
                    duration: 600,
                    easing: "",
                    complete: function () { },
                });
            $(this)
                .parent()
                .children(".mes_edit_cancel")
                .transition({
                    opacity: 1.0,
                    duration: 600,
                    easing: "",
                    complete: function () { },
                });
            var edit_mes_id = $(this).parent().parent().parent().attr("mesid");
            this_edit_mes_id = edit_mes_id;

            var text = chat[edit_mes_id]["mes"];
            if (chat[edit_mes_id]["is_user"]) {
                this_edit_mes_chname = name1;
            } else if (chat[edit_mes_id]["forced_avatar"]) {
                this_edit_mes_chname = chat[edit_mes_id]["name"];
            } else {
                this_edit_mes_chname = name2;
            }
            text = text.trim();
            $(this)
                .parent()
                .parent()
                .children(".mes_text")
                .append(
                    '<textarea class=edit_textarea style="max-width:auto; ">' +
                    text +
                    "</textarea>"
                );
            let edit_textarea = $(this)
                .parent()
                .parent()
                .children(".mes_text")
                .children(".edit_textarea");
            edit_textarea.css("opacity", 0.0);
            edit_textarea.transition({
                opacity: 1.0,
                duration: 0,
                easing: "",
                complete: function () { },
            });
            edit_textarea.height(0);
            edit_textarea.height(edit_textarea[0].scrollHeight);
            edit_textarea.focus();
            edit_textarea[0].setSelectionRange(
                edit_textarea.val().length,
                edit_textarea.val().length
            );
            if (this_edit_mes_id == count_view_mes - 1) {
                $("#chat").scrollTop(chatScrollPosition);
            }
        }
    });
    $(document).on("click", ".mes_edit_cancel", function () {
        //var text = $(this).parent().parent().children('.mes_text').children('.edit_textarea').val();
        var text = chat[this_edit_mes_id]["mes"];

        $(this).parent().parent().children(".mes_text").empty();
        $(this).css("display", "none");
        $(this).parent().children(".mes_edit_done").css("display", "none");
        $(this).parent().children(".mes_edit").css("display", "inline-block");
        $(this)
            .parent()
            .parent()
            .children(".mes_text")
            .append(messageFormating(text, this_edit_mes_chname));
        appendImageToMessage(chat[this_edit_mes_id], $(this).closest(".mes"));
        this_edit_mes_id = undefined;
    });
    $(document).on("click", ".mes_edit_done", function () {
        messageEditDone($(this));
    });

    $("#your_name_button").click(function () {
        if (!is_send_press) {
            name1 = $("#your_name").val();
            if (name1 === undefined || name1 == "") name1 = default_user_name;
            console.log(name1);
            saveSettings("change_name");
        }
    });
    //Select chat

    $("#api_button_novel").click(function () {
        if ($("#api_key_novel").val() != "") {
            $("#api_loading_novel").css("display", "inline-block");
            $("#api_button_novel").css("display", "none");
            api_key_novel = $("#api_key_novel").val();
            api_key_novel = $.trim(api_key_novel);
            //console.log("1: "+api_server);
            saveSettingsDebounced();
            is_get_status_novel = true;
            is_api_button_press_novel = true;
        }
    });
    $("#model_novel_select").change(function () {
        model_novel = $("#model_novel_select").find(":selected").val();
        saveSettings();
    });
    $("#anchor_order").change(function () {
        anchor_order = parseInt($("#anchor_order").find(":selected").val());
        saveSettings();
    });

    //**************************CHARACTER IMPORT EXPORT*************************//
    $("#character_import_button").click(function () {
        $("#character_import_file").click();
    });
    $("#character_import_file").on("change", function (e) {
        $("#rm_info_avatar").html("");
        var file = e.target.files[0];
        //console.log(1);
        if (!file) {
            return;
        }
        var ext = file.name.match(/\.(\w+)$/);
        if (
            !ext ||
            (ext[1].toLowerCase() != "json" && ext[1].toLowerCase() != "png")
        ) {
            return;
        }

        var format = ext[1].toLowerCase();
        $("#character_import_file_type").val(format);
        //console.log(format);
        var formData = new FormData($("#form_import").get(0));

        jQuery.ajax({
            type: "POST",
            url: "/importcharacter",
            data: formData,
            beforeSend: function () {
                //$('#create_button').attr('disabled',true);
                //$('#create_button').attr('value','Creating...');
            },
            cache: false,
            contentType: false,
            processData: false,
            success: async function (data) {
                if (data.file_name !== undefined) {
                    $("#rm_info_block").transition({ opacity: 0, duration: 0 });
                    var $prev_img = $("#avatar_div_div").clone();
                    $prev_img
                        .children("img")
                        .attr("src", "characters/" + data.file_name + ".png");
                    $("#rm_info_avatar").append($prev_img);

                    let oldSelectedChar = null;
                    if (this_chid != undefined && this_chid != "invalid-safety-id") {
                        oldSelectedChar = characters[this_chid].name;
                    }

                    await getCharacters();
                    select_rm_info("Character created", oldSelectedChar);
                    $("#rm_info_block").transition({ opacity: 1, duration: 1000 });
                }
            },
            error: function (jqXHR, exception) {
                $("#create_button").removeAttr("disabled");
            },
        });
    });
    $("#export_button").click(function () {
        var link = document.createElement("a");
        link.href = "characters/" + characters[this_chid].avatar;
        link.download = characters[this_chid].avatar;
        document.body.appendChild(link);
        link.click();
    });
    //**************************CHAT IMPORT EXPORT*************************//
    $("#chat_import_button").click(function () {
        $("#chat_import_file").click();
    });

    $("#chat_import_file").on("change", function (e) {
        var file = e.target.files[0];
        //console.log(1);
        if (!file) {
            return;
        }
        var ext = file.name.match(/\.(\w+)$/);
        if (
            !ext ||
            (ext[1].toLowerCase() != "json" && ext[1].toLowerCase() != "jsonl")
        ) {
            return;
        }

        var format = ext[1].toLowerCase();
        $("#chat_import_file_type").val(format);
        //console.log(format);
        var formData = new FormData($("#form_import_chat").get(0));
        //console.log('/importchat entered with: '+formData);
        jQuery.ajax({
            type: "POST",
            url: "/importchat",
            data: formData,
            beforeSend: function () {
                $("#select_chat_div").html("");
                $("#load_select_chat_div").css("display", "block");
                //$('#create_button').attr('value','Creating...');
            },
            cache: false,
            contentType: false,
            processData: false,
            success: function (data) {
                //console.log(data);
                if (data.res) {
                    getAllCharaChats();
                }
            },
            error: function (jqXHR, exception) {
                $("#create_button").removeAttr("disabled");
            },
        });
    });

    $("#rm_button_group_chats").click(function () {
        selected_button = "group_chats";
        select_group_chats();
    });

    $("#rm_button_back_from_group").click(function () {
        selected_button = "characters";
        select_rm_characters();
    });

    $("#rm_button_extensions").click(function () {
        menu_type = 'extennsions';
        selected_button = 'extensions';
        setRightTabSelectedClass('rm_button_extensions');
        selectRightMenuWithAnimation('rm_extensions_block');
    });

    $(document).on("click", ".select_chat_block", function () {
        let file_name = $(this).attr("file_name").replace(".jsonl", "");
        //console.log(characters[this_chid]['chat']);
        characters[this_chid]["chat"] = file_name;
        clearChat();
        chat.length = 0;
        getChat();
        $("#selected_chat_pole").val(file_name);
        $("#create_button").click();
        $("#shadow_select_chat_popup").css("display", "none");
        $("#load_select_chat_div").css("display", "block");
    });

    $('.drawer-toggle').click(function () {
        var icon = $(this).find('.drawer-icon');
        icon.toggleClass('down up');
        $(this).closest('.drawer').find('.drawer-content').slideToggle();
    });
});
