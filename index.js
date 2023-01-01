"use strict";
const fileInput = document.querySelector("#audio");
const playButton = document.querySelector("#play-button");
const copyButton = document.querySelector("#getlrc-button");
const lyricsButton = document.querySelector("#enter-lyrics");
const dialog = document.querySelector("#lyrics-dialog");
const saveLyrics = document.querySelector("#save-lyrics");
const speedUp = document.querySelector("#speedup");
const speedDown = document.querySelector("#speeddown");
const speed = document.querySelector("#speed");
const pause = document.querySelector("#pause");
const stopButton = document.querySelector("#stop");
const timeInput = document.querySelector("#seek");
const curTime = document.querySelector("#curTime");
const maxTime = document.querySelector("#maxTime");
const lyricsInput = document.querySelector("#lyrics");
const lyricsDisplay = document.querySelector("#lyrics-display");
define("types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Timing = exports.Syllable = exports.Line = exports.Lyrics = void 0;
    class Lyrics {
        constructor() { }
        head;
        tail;
        *iterator() {
            let currLine = this.head;
            while (currLine != undefined) {
                let currSyllable = currLine.head;
                while (currSyllable != undefined) {
                    yield currSyllable;
                    currSyllable = currSyllable.next;
                }
                currLine = currLine.next;
            }
        }
        [Symbol.iterator]() {
            return this.iterator();
        }
        getLRC = () => {
            let current = this.head;
            let res = "";
            while (current != undefined) {
                res += current.getLRC() + "\n";
                current = current.next;
            }
            return res;
        };
        toString = () => {
            let res = "[";
            let cur = this.head;
            while (cur != undefined) {
                res += `${cur.toString()} =>`;
                cur = cur.next;
            }
            res += "]";
            return res;
        };
    }
    exports.Lyrics = Lyrics;
    class Line {
        head;
        tail;
        prev;
        next;
        getLRC = () => {
            let current = this.head;
            let res = (current.start && `[${current.start.getFormatted()}]`) || "";
            while (current != undefined) {
                res += current.getLRC();
                current = current.next;
            }
            return res;
        };
        toString = () => {
            let res = "[";
            let cur = this.head;
            while (cur != undefined) {
                res += `${cur.toString()} =>`;
                cur = cur.next;
            }
            res += "] ";
            return res;
        };
    }
    exports.Line = Line;
    class Syllable {
        line;
        text = "";
        start;
        end;
        next;
        prev;
        element;
        constructor(line = undefined) {
            this.line = line;
        }
        getLRC = () => {
            return ((this.start && `<${this.start.getFormatted()}>`) || "") + `${this.text}` + ((this.end && `<${this.end.getFormatted()}>`) || "");
        };
        toString = () => {
            return `start: ${this.start}, text: ${this.text}, end: ${this.end}`;
        };
        getNext = () => {
            return this.next || this.line?.next?.head;
        };
    }
    exports.Syllable = Syllable;
    class Timing {
        stamp;
        constructor(stamp) {
            this.stamp = stamp;
        }
        manualModification = 0;
        getFormatted = () => {
            const mins = Math.floor((+this.stamp + this.manualModification) / 60).toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                maximumFractionDigits: 0,
            });
            const secs = ((+this.stamp + this.manualModification) % 60).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                minimumIntegerDigits: 2,
                maximumFractionDigits: 2
            });
            return `${mins}:${secs}`;
        };
    }
    exports.Timing = Timing;
});
define("index", ["require", "exports", "types"], function (require, exports, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let timingsShowing = false;
    let playah;
    let isPlaying = false;
    let lyricsDOM = [];
    let lineEnds = [0];
    let lyricsProxy = new Proxy({ lyrics: "" }, {
        set: (target, key, value) => {
            if (key == "lyrics") {
                target[key] = value;
                lyricsDisplay.innerHTML = getDisplayHTML(value);
                lyricsDOM = Array.from(document.getElementsByClassName("line"));
                lyricsDOM.forEach(line => {
                    lineEnds.push((lineEnds[lineEnds.length - 1] ?? 0) + line.children.length);
                });
                lyricsDOM = lyricsDOM.map(el => {
                    return Array.from(el.children);
                }).flat();
                lyricsDOM[0].classList.add("current");
                let counter = 0;
                for (let i of lrc) {
                    i.element = lyricsDOM[counter++];
                    i.element.onclick = () => {
                        console.log(i.start?.getFormatted(), i.end?.getFormatted() ?? i.getNext()?.start?.getFormatted());
                    };
                }
            }
            return true;
        }
    });
    let lrc = new types_1.Lyrics();
    let curLine;
    let curSyl;
    let dragging = false;
    stopButton.onclick = (ev) => {
        playah?.pause();
        playah && (playah.src = playah.src);
    };
    pause.onclick = () => {
        playah?.pause();
    };
    window.onkeydown = (ev) => {
        const time = playah?.currentTime ?? 0;
        if (ev.key == "Escape")
            dialog.open = false;
        if (!isPlaying) {
            return;
        }
        if (ev.key == " ") {
            ev.preventDefault();
            ev.stopPropagation();
            if (curSyl?.prev?.start && curSyl.prev.start.stamp > time) {
                return;
            }
            curSyl && (curSyl.start = new types_1.Timing(time));
            curSyl?.element?.classList.add("past");
            curSyl?.element?.classList.remove("current");
            curSyl = curSyl?.next;
            if (curSyl == undefined) {
                curLine = curLine?.next;
                curSyl = curLine?.head;
                window.scrollBy(0, 30);
            }
            curSyl?.element?.classList.add("current");
        }
        else if (ev.key == "Enter") {
            ev.preventDefault();
            ev.stopPropagation();
            if (curSyl?.prev) {
                curSyl.prev.end = new types_1.Timing(time);
            }
            else if (curLine?.prev?.tail) {
                curLine.prev.tail.end = new types_1.Timing(time);
            }
        }
        else if (ev.key == "Backspace" && curSyl) {
            ev.preventDefault();
            ev.stopPropagation();
            if (curSyl.prev == undefined && curLine?.prev?.tail == undefined)
                return;
            (curSyl.prev || curLine?.prev?.tail) && curSyl.element?.classList.remove("current");
            curSyl.start = undefined;
            curSyl.end = undefined;
            if (curSyl.prev == undefined) {
                curLine = curLine?.prev;
                if (curLine == undefined) {
                    return;
                }
                window.scrollBy(0, -30);
                curSyl = curLine.tail;
            }
            else {
                curSyl = curSyl.prev;
            }
            curSyl.end = undefined;
            curSyl.element?.classList.remove("past");
            curSyl.element?.classList.add("current");
            playah && (playah.currentTime = Math.max((((curSyl.prev?.start?.stamp ?? curLine?.prev?.tail.start?.stamp) ?? 0) - 1), playah.currentTime - 4));
        }
    };
    speedUp.onclick = () => {
        playah && (playah.playbackRate += 0.1);
        speed.innerText = playah?.playbackRate.toFixed(1) || "";
    };
    speedDown.onclick = () => {
        playah && (playah.playbackRate -= 0.1);
        speed.innerText = playah?.playbackRate.toFixed(1) || "";
    };
    lyricsButton.onclick = (ev) => {
        dialog.open = !dialog.open;
        lyricsInput.value = lyricsProxy.lyrics;
    };
    playButton.onclick = async (ev) => {
        ev.preventDefault();
        if (fileInput.files?.length) {
            if (playah == undefined) {
                let reader = new FileReader();
                reader.onload = ev => {
                    playah = new Audio(ev.target?.result);
                    playah.preload = "metadata";
                    playah.onplaying = () => {
                        const mins = Math.floor((playah?.duration || 0) / 60);
                        const secs = ((playah?.duration || 0) % 60).toLocaleString('nl-NL', {
                            minimumIntegerDigits: 2,
                            useGrouping: false,
                            maximumFractionDigits: 0
                        });
                        timeInput.max = playah?.duration.toString() || "";
                        maxTime.innerText = `${mins}:${secs}`;
                    };
                    playah.play();
                    playah.ontimeupdate = () => {
                        const mins = Math.floor((playah?.currentTime || 0) / 60);
                        const secs = ((playah?.currentTime || 0) % 60).toLocaleString('nl-NL', {
                            minimumIntegerDigits: 2,
                            useGrouping: false,
                            maximumFractionDigits: 0
                        });
                        curTime.innerText = `${mins}:${secs}`;
                        !dragging && (timeInput.value = playah?.currentTime.toString() || timeInput.value);
                    };
                };
                reader.readAsDataURL(fileInput.files?.[0] ?? new Blob());
                isPlaying = true;
            }
            else {
                playah.play();
            }
        }
        else {
            alert("You must select an audio file");
        }
    };
    const getDisplayHTML = (lyricsRaw) => {
        let result = lyricsRaw;
        lrc.head = new types_1.Line();
        let currLine = lrc.head;
        lrc.tail = currLine;
        const lines = result.split("\n").filter(el => el.length > 0 && el != " ").map((el, index, arr) => {
            const syllables = el.trim().split(" ").map(el => el + " ").map(el => el.split("/")).flat();
            currLine.head = new types_1.Syllable(currLine);
            let currSyllable = currLine.head;
            currLine.tail = currSyllable;
            for (let i in syllables) {
                currSyllable.text = syllables[i];
                if (syllables.length > +i + 1) {
                    currSyllable.next = new types_1.Syllable(currLine);
                    currSyllable.next.prev = currSyllable;
                    currSyllable = currSyllable.next;
                    currLine.tail = currSyllable;
                }
            }
            if (arr.length > index + 1) {
                currLine.next = new types_1.Line();
                currLine.next.prev = currLine;
                currLine = currLine.next;
                lrc.tail = currLine;
            }
            return syllables.reduce((prev, cur) => `${prev}<div class="syllable">${cur}</div>`, "");
        });
        curLine = lrc.head;
        curSyl = curLine.head;
        result = lines.reduce((prev, cur) => `${prev}<div class="line">${cur}</div>`, "");
        return result;
    };
    saveLyrics.onclick = (ev) => {
        lyricsProxy.lyrics = lyricsInput.value;
        dialog.close();
    };
    lyricsInput.placeholder = lyricsProxy.lyrics;
    lyricsInput.onkeydown = (ev) => {
        ev.stopPropagation();
    };
    copyButton.onclick = () => navigator.clipboard.writeText(lrc.getLRC());
    timeInput.onchange = () => {
        dragging = false;
        playah && (playah.currentTime = +timeInput.value);
    };
    timeInput.oninput = (ev) => {
        dragging = true;
    };
});
