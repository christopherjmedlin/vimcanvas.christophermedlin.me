import VimCanvas from './vim-canvas.js';
import canvasCommands from './canvas-commands.js';
import $ from 'jquery';

function getCanvases_(success) {
    $.ajax({
        url: "https://api.vimcanvas.christophermedlin.me/v1/canvases",
        dataType: 'JSON',
        success: success
    });
}

function getCanvas_(success, id) {
    let url = "https://api.vimcanvas.christophermedlin.me/v1/canvases/" + id;
    $.ajax({
        url: url,
        dataType: 'JSON',
        success: success
    })
}

export function echo(terminal, args) {
    if (args[0] != undefined)
        terminal.output(args[0]);
}

export function ls(terminal, args) {
    getCanvases_(canvases => {
        if (canvases.length) {
            for (var canvas in canvases) {
                terminal.output(canvases[canvas].name);
            }
        }
        else {
            terminal.output("There are currently no active canvases. Create one with 'touch'");
        }
    })
}

export function touch(terminal, args) {
    if (args.length)
        $.ajax({
            url: "https://api.vimcanvas.christophermedlin.me/v1/canvases",
            dataType: 'JSON',
            method: 'POST',
            data: JSON.stringify({
                "title": args[0]
            }),
            success: data => {
                console.log(data);
            }
        });
    else
        terminal.output("No name specified.");
}

export function vim(terminal, args) {
    getCanvases_(canvases => {
        for (var canvas in canvases) {
            if (canvases[canvas].name == args[0]) {
                getCanvas_(canvas => {
                    terminal.hide();
                    let vimCanvas = new VimCanvas(canvas, "mainDiv", terminal, canvasCommands);
                    vimCanvas.init();
                }, canvases[canvas]._id);
            }
        }
    });
    if (!args.length)
        terminal.output("No name specified.");
}

export function help(terminal, args) {
    var win = window.open("about.html", "_blank");
    if (win) {
        win.focus();
    }
    else {
        window.location.href = "about.html";
    }
}

var commands = {
    "echo": echo,
    "ls": ls,
    "touch": touch,
    "vim": vim,
    "help": help
}

export default commands;