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
            return this.next ?? this.line?.next?.head;
        };
        getPrev = () => {
            return this.prev ?? this.line?.prev?.tail;
        };
    }
    exports.Syllable = Syllable;
    class Timing {
        stamp;
        constructor(stamp) {
            this.stamp = stamp;
        }
        manualModification = 0;
        getStamp = () => {
            return this.stamp + this.manualModification;
        };
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
    let makeDialog = (startTime, endTime) => {
        console.log(startTime, endTime);
        let dialog = document.createElement("dialog");
        dialog.innerText = `${startTime} - ${endTime}`;
        dialog.open = true;
        dialog.style.position = "fixed";
        dialog.style.top = "30px";
        dialog.style.display = "flex";
        dialog.style.flexDirection = "column";
        return dialog;
    };
    let makeAdjust = (side, i, dialog) => {
        let adjust = document.createElement("div");
        adjust.style.display = "flex";
        adjust.style.flexDirection = "column";
        let up = document.createElement("button");
        up.type = "button";
        up.onclick = (ev) => { changeTiming(ev, i, dialog, "up", side); };
        up.innerText = "up";
        let down = document.createElement("button");
        down.type = "button";
        down.onclick = (ev) => { changeTiming(ev, i, dialog, "down", side); };
        down.innerText = "down";
        adjust.appendChild(up);
        adjust.appendChild(down);
        return adjust;
    };
    let playSound = (ev, i) => {
        ev.stopPropagation();
        ev.preventDefault();
        if (!i.start || !i.end)
            return;
        if (playah) {
            playah.pause();
            playah.currentTime = i.start.getStamp();
            setTimeout(() => {
                playah?.pause();
            }, (i.end.getStamp() - i.start.getStamp()) * 1000);
            playah.play();
        }
    };
    let changeTiming = (ev, i, dialog, direction, side) => {
        ev.preventDefault();
        ev.stopPropagation();
        let mult = direction == "up" ? 1 : -1;
        if (!i.start)
            return;
        if (!i.end) {
            i.end = new types_1.Timing(i.start.getStamp());
        }
        let selfstart = i.start.getStamp();
        let selfend = i.end.getStamp();
        let beforeend = i.getPrev()?.end?.getStamp() ?? i.getPrev()?.start?.getStamp() ?? 0;
        let afterstart = i.getNext()?.start?.getStamp() ?? Infinity;
        if (side == "end") {
            if (selfstart + 0.01 * mult < selfend && selfstart + 0.01 * mult > beforeend) {
                i.start.manualModification += 0.01 * mult;
            }
        }
        else {
            if (selfend + 0.01 * mult < afterstart && selfend + 0.01 * mult > selfstart) {
                i.end.manualModification += 0.01 * mult;
            }
        }
        let children = Array.from(dialog.children);
        dialog.innerText = `${i.start.getFormatted()} - ${(i.end ? i.end : i.getNext()?.start)?.getFormatted()}`;
        for (let index = 0; index < children.length; index++) {
            dialog.appendChild(children[index]);
        }
        if (playah) {
            playah.pause();
            playah.currentTime = i.start.getStamp();
            setTimeout(() => {
                playah?.pause();
            }, (selfend - selfstart) * 1000);
            playah.play();
        }
    };
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
                        if (i.start?.getFormatted()) {
                            let dialog = makeDialog(i.start?.getFormatted(), i.end?.getFormatted() ?? i.getNext()?.start?.getFormatted() ?? i.start.getFormatted());
                            let syltext = document.createElement("div");
                            syltext.innerText = i.text;
                            dialog.appendChild(syltext);
                            let adjust = document.createElement("div");
                            adjust.style.display = "flex";
                            adjust.style.flexDirection = "row";
                            let adjustStart = makeAdjust("start", i, dialog);
                            let adjustEnd = makeAdjust("end", i, dialog);
                            adjust.appendChild(adjustEnd);
                            adjust.appendChild(adjustStart);
                            dialog.appendChild(adjust);
                            let closeButton = document.createElement("button");
                            closeButton.onclick = () => document.querySelector("body")?.removeChild(dialog);
                            closeButton.innerText = "close";
                            dialog.appendChild(closeButton);
                            document.querySelector("body")?.appendChild(dialog);
                            let movebuttons = document.createElement("div");
                            let prevbutton = document.createElement("button");
                            prevbutton.type = "button";
                            prevbutton.innerText = "prev";
                            prevbutton.onclick = (ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                document.querySelector("body")?.removeChild(dialog);
                                i.getPrev()?.element?.click();
                            };
                            let nextbutton = document.createElement("button");
                            nextbutton.type = "button";
                            nextbutton.innerText = "next";
                            nextbutton.onclick = (ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                document.querySelector("body")?.removeChild(dialog);
                                i.getNext()?.element?.click();
                            };
                            movebuttons.appendChild(prevbutton);
                            movebuttons.appendChild(nextbutton);
                            dialog.appendChild(movebuttons);
                            let playbutton = document.createElement("button");
                            playbutton.type = "button";
                            playbutton.innerText = "play";
                            playbutton.onclick = (ev) => {
                                playSound(ev, i);
                            };
                            dialog.appendChild(playbutton);
                        }
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
        curSyl?.element?.classList.remove("current");
        curLine = lrc.head;
        curSyl = curLine.head;
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
            console.log(curSyl?.next?.start, curSyl?.next?.start?.getStamp(), time);
            if ((curSyl?.prev?.start && curSyl.prev.start.getStamp() > time) || (curSyl?.next?.start && curSyl.next.start.getStamp() > time)) {
                return;
            }
            let delay = 100;
            curSyl && (curSyl.start = new types_1.Timing(Math.max(time - delay / 1000, 0)));
            curSyl && curSyl.getPrev() && (curSyl.getPrev().end = new types_1.Timing(Math.max(time - delay / 1000, 0)));
            curSyl?.element?.classList.add("past");
            curSyl?.element?.classList.remove("current");
            curSyl = curSyl?.next;
            if (curSyl == undefined) {
                curLine = curLine?.next;
                curSyl = curLine?.head;
                window.scrollBy(0, 30);
            }
            curSyl?.element?.classList.add("current");
            console.log(curSyl, curSyl?.getNext());
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
            curSyl.element?.classList.remove("past");
            curSyl.element?.classList.add("current");
            if (curSyl.getPrev() && (curSyl.start?.getStamp() == curSyl.getPrev()?.end?.getStamp())) {
                curSyl.getPrev().end = undefined;
            }
            curSyl.end = undefined;
            curSyl.start = undefined;
            playah && (playah.currentTime = Math.max((((curSyl.prev?.start?.getStamp() ?? curLine?.prev?.tail.start?.getStamp()) ?? 0) - 1), playah.currentTime - 4));
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
                    setInterval(() => {
                        let next = curSyl?.getNext();
                        if (curSyl && next?.start && playah?.currentTime && next.start.getStamp() < playah.currentTime) {
                            curSyl.element?.classList.remove("current");
                            curSyl = curSyl.getNext();
                            curSyl?.element?.classList.add("current");
                        }
                    }, 10);
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
        const lines = result.split("\n").filter(el => el.length > 0 && el != " ").flatMap((el, index, arr) => {
            el = el.trim();
            let sublines = [];
            const words = el.split(" ");
            let sublinelength = el.split("/").join("").length / Math.ceil(el.split("/").join("").length / 30);
            let curline = "";
            console.log(sublinelength);
            for (let word of words) {
                console.log(word);
                if (curline.split("/").join("").length + word.split("/").join("").length <= sublinelength + 5) {
                    curline += word + " ";
                }
                else {
                    sublines.push(curline);
                    curline = word + " ";
                }
            }
            sublines.push(curline);
            let res = [];
            sublines.forEach((el, idx) => {
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
                if (idx + 1 < sublines.length) {
                    console.log(idx, sublines.length);
                    currLine.next = new types_1.Line();
                    currLine.next.prev = currLine;
                    currLine = currLine.next;
                    lrc.tail = currLine;
                }
                res.push(syllables.reduce((prev, cur) => `${prev}<div class="syllable">${cur}</div>`, ""));
            });
            if (arr.length > index + 1) {
                currLine.next = new types_1.Line();
                currLine.next.prev = currLine;
                currLine = currLine.next;
                lrc.tail = currLine;
            }
            return res;
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
