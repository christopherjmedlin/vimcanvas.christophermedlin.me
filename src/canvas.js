import $ from 'jquery';
import CommandRunner from './runner';

class CanvasCommandInput extends CommandRunner {
    constructor(canvas, containerID, terminal, commands) {
        super(commands);
        this.canvas = canvas;
        this.terminal = terminal;
        this.container = document.getElementById(containerID);
    }

    init() {
        this.input = document.createElement('input');
        this.input.className = "commandInput";
        this.input.disabled = true;
        this.container.appendChild(this.input);
        $(this.input).keydown($.proxy(this.keyUp_, this));
    }

    focus() {
        this.input.value = ":";
        this.input.disabled = false;
        this.input.focus();
    }

    tearDown() {
        this.container.removeChild(this.input);
    }

    runCommand() {
        super.runCommand(this.input.value.slice(1));
        this.input.disabled = true;
        this.canvas.focus();
    }

    output(text) {
        this.input.value = text;
    }

    keyUp_(event) {
        switch (event.which) {
            case 8:
                if (this.input.value == ":") {
                    this.input.value = "";
                    this.input.disabled = true;
                    this.canvas.focus();
                }
                break;
            case 13:
                this.runCommand();
                break;
        }
    }
}

export default class VimCanvas {

    constructor(canvasObject, containerID, terminal, commands={}) {
        this.canvasObject = canvasObject;
        this.container = document.getElementById(containerID);
        this.elements = {};
        this.terminal = terminal;
        this.commands = commands;

        this.playerPos = [Math.floor(Math.random() * 101),
                          Math.floor(Math.random() * 101)];
        this.playerPositions = {};
        this.mode = "normal";
        this.translateX = -this.playerPos[0] + 5;
        this.translateY = -this.playerPos[1] + 5;
        this.scale = 1;
        
        this.characterArray = [];
        for (let i = 0; i < 100; i++) {
            this.characterArray[i] = []
            for (let j = 0; j < 100; j++) {
                this.characterArray[i][j] = '##00FF00';
            }
        }
        
        $(window).resize($.proxy(this.resize_, this));
        $(window).resize($.proxy(this.draw, this));
    }
    
    init() {     
        let wrapperDiv = document.createElement('div');
        wrapperDiv.className = "vimCanvas";
        this.container.appendChild(wrapperDiv);
        this.elements['wrapperDiv'] = wrapperDiv;

        this.canvas = document.createElement('canvas');
        this.canvas.tabIndex = 1;
        wrapperDiv.appendChild(this.canvas);

        this.secretInsertInput = document.createElement('input');
        this.secretInsertInput.hidden = true;
        wrapperDiv.appendChild(this.secretInsertInput);

        this.commandInput = new CanvasCommandInput(this, "mainDiv", this.terminal, this.commands);
        this.commandInput.init();

        this.canvas.focus();

        $(this.canvas).keyup($.proxy(this.keyUp_, this));
        $(this.canvas).keypress($.proxy(this.keyPress_, this));

        // horizontal scrollbar appears if i resize once so i do it twice.
        // ¯\_(ツ)_/¯
        this.resize_();
        this.resize_();

        this.draw();
    }

    tearDown() {
        this.container.removeChild(this.elements['wrapperDiv']);
        this.commandInput.tearDown();
    }

    focus() {
        this.canvas.focus();
    }

    draw() {
        let ctx = this.canvas.getContext("2d");
        ctx.save()
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = "15px monospace";
        ctx.fillStyle = "#00FF00";

        ctx.scale(this.scale, this.scale);
        ctx.translate(this.translateX * 15, this.translateY * 15);

        ctx.beginPath();
        for (var line in this.characterArray) {
            for (var character in this.characterArray[line]) {
                this.drawChar_(ctx, line, character);
            }
        }
        ctx.restore();
    }

    drawChar_(ctx, line, character) {
        let invertColors = false;

        if (this.mode == "insert") {
            ctx.strokeStyle = "#0000FF";
        }
        else {
            ctx.strokeStyle = "#FF0000";
        }

        if (this.playerPos[0] == character && this.playerPos[1] == line) {
            invertColors = true;
        }

        for (coord in this.playerPositions) {
            if (this.playerPos[0] == this.playerPositions[coord][0] &&
                this.playerPos[1] == this.playerPositions[coord][1]) {
                invertColors = true;
            }
        }

        if (invertColors) {
            // draw a rectangle to highlight cursor
            let x = character * 15 - 2;
            let y = line * 15 + 2;
            ctx.beginPath();
            ctx.rect(x, y, 13, 15);
            ctx.stroke();
        }

        ctx.fillStyle = this.characterArray[line][character].slice(1);
        ctx.fillText(
            this.characterArray[line][character][0],
            character * 15,
            (line * 15) + 15
        );     
    }

    resize_() {
        this.canvas.width = $(this.container).width();
        // subtract 25 to make up for the input
        this.canvas.height = $(this.container).height() - 25;
    }

    keyPress_(event) {
        if (event.which == 58 && // : 
            event.shiftKey && 
            this.mode == "normal") {
            event.preventDefault();
            this.commandInput.focus();
        }
    }

    keyUp_(event) {   
        if (this.mode == "normal") {
            this.keyUpNormalMode_(event);
        }
        else if (this.mode == "insert") {
            this.keyUpInsertMode_(event);
        }

        this.draw();
    }

    keyUpNormalMode_(event) {
        switch (event.which) {
            case 72: // h
                this.playerPos[0] -= 1;
                break;
            case 74: // j
                this.playerPos[1] += 1;
                break;
            case 75: // k
                this.playerPos[1] -= 1;
                break;
            case 76: // l
                this.playerPos[0] += 1;
                break;
            case 73: // i
            case 65: // a
                if (this.mode == "normal") {
                    this.mode = "insert";
                    console.log(this.mode);
                }
                break;
            case 37: // left arrow
                this.translateX += 4;
                break;
            case 38: // up arrow
                this.translateY += 4;
                break;
            case 39: // right arrow
                this.translateX -= 4;
                break;
            case 40: // down arrow
                this.translateY -= 4;
                break;
            case 189: // dash
                this.scale /= 2;
                break;
            case 187: // plus
                this.scale *= 2;
                break;
        }
    }

    keyUpInsertMode_(event) {
        switch (event.which) {
            case 27: // escape
                if (this.mode == "insert") {
                    this.mode = "normal";
                }
                break;
        }
    }
}