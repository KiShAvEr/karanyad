import { Line, Lyrics, Syllable, Timing } from "./types"

let makeDialog = (startTime: string, endTime?: string) => {
  console.log(startTime, endTime)
  let dialog = document.createElement("dialog")
  dialog.innerText = `${startTime} - ${endTime}`
  dialog.open = true
  dialog.style.position = "fixed"
  dialog.style.top = "30px"
  dialog.style.display = "flex"
  dialog.style.flexDirection = "column"

  return dialog
}

let makeAdjust = (side: "end" | "start", i: Syllable, dialog: HTMLDialogElement) => {
  let adjust = document.createElement("div")
  adjust.style.display = "flex"
  adjust.style.flexDirection = "column"

  let up = document.createElement("button")
  up.type = "button"
  up.onclick = (ev) => {changeTiming(ev, i, dialog, "up", side)}
  up.innerText = "up"
  let down = document.createElement("button")
  down.type = "button"
  down.onclick = (ev) => {changeTiming(ev, i, dialog, "down", side)}
  down.innerText = "down"

  adjust.appendChild(up)
  adjust.appendChild(down)
  
  return adjust
}

let playSound = (ev: MouseEvent, i: Syllable) => {
  ev.stopPropagation()
  ev.preventDefault()

  if(!i.start || !i.end) return

  if(playah) {
    playah.pause()
    playah.currentTime = i.start.getStamp()
    setTimeout(() => {
      playah?.pause()
    }, (i.end.getStamp()-i.start.getStamp()) * 1000)

    playah.play()

  }

}

let changeTiming = (ev: MouseEvent, i: Syllable, dialog: HTMLDialogElement, direction: "up" | "down", side: "end" | "start") => {
  ev.preventDefault()
  ev.stopPropagation()

  let mult = direction == "up"? 1: -1
  if(!i.start) return
  if(!i.end) {
    i.end = new Timing(i.start.getStamp());
  }
  let selfstart = i.start.getStamp()
  let selfend = i.end.getStamp()
  let beforeend = i.getPrev()?.end?.getStamp() ?? i.getPrev()?.start?.getStamp() ?? 0
  let afterstart = i.getNext()?.start?.getStamp() ?? Infinity

  if(side == "end") {
    if(selfstart + 0.01 * mult < selfend && selfstart + 0.01 * mult > beforeend) {
      i.start.manualModification += 0.01 * mult
    }
  } else {
    if(selfend + 0.01 * mult < afterstart && selfend + 0.01 * mult > selfstart) {
      i.end.manualModification += 0.01 * mult
    }
  }
  
  
  
  let children = Array.from(dialog.children)
  dialog.innerText = `${i.start.getFormatted()} - ${(i.end? i.end: i.getNext()?.start)?.getFormatted()}`
  for(let index = 0; index < children.length; index++) {
    dialog.appendChild(children[index])
  }
  if(playah) {
    playah.pause()
    playah.currentTime = i.start.getStamp()
    setTimeout(() => {
      playah?.pause()
    }, (selfend-selfstart) * 1000)

    playah.play()

  }
}

let timingsShowing = false;
let playah: HTMLAudioElement | undefined;
let isPlaying = false;
let lyricsDOM: HTMLDivElement[] = [];
let lineEnds: number[] = [0]
let lyricsProxy = new Proxy({ lyrics: "" }, {
  set: (target, key: string, value) => {
    if (key == "lyrics") {
      target[key] = value

      lyricsDisplay.innerHTML = getDisplayHTML(value)

      lyricsDOM = Array.from(<HTMLCollectionOf<HTMLDivElement>>document.getElementsByClassName("line"))
      lyricsDOM.forEach(line => {
        lineEnds.push((lineEnds[lineEnds.length - 1] ?? 0) + line.children.length)
      })

      lyricsDOM = lyricsDOM.map(el => {
        return Array.from(<HTMLCollectionOf<HTMLDivElement>>el.children)
      }).flat()

      lyricsDOM[0].classList.add("current")


      let counter = 0;
      for (let i of lrc) {
        i.element = lyricsDOM[counter++]
        i.element.onclick = () => {
          if (i.start?.getFormatted()) {
            
            let dialog = makeDialog(i.start?.getFormatted(), i.end?.getFormatted() ?? i.getNext()?.start?.getFormatted() ?? i.start.getFormatted())

            let syltext = document.createElement("div")
            syltext.innerText = i.text
            dialog.appendChild(syltext)

            let adjust = document.createElement("div")
            adjust.style.display = "flex"
            adjust.style.flexDirection = "row"

            let adjustStart = makeAdjust("start", i, dialog)
            let adjustEnd = makeAdjust("end", i, dialog)
            
            adjust.appendChild(adjustEnd)
            adjust.appendChild(adjustStart)
            
            dialog.appendChild(adjust)

            let closeButton = document.createElement("button")

            closeButton.onclick = () => document.querySelector("body")?.removeChild(dialog)

            closeButton.innerText = "close"

            dialog.appendChild(closeButton)

            document.querySelector("body")?.appendChild(dialog)

            let movebuttons = document.createElement("div")
            let prevbutton = document.createElement("button")
            prevbutton.type = "button"
            prevbutton.innerText = "prev"
            prevbutton.onclick = (ev) => {
              ev.preventDefault()
              ev.stopPropagation()
              document.querySelector("body")?.removeChild(dialog)
              i.getPrev()?.element?.click()
            }
            let nextbutton = document.createElement("button")
            nextbutton.type = "button"
            nextbutton.innerText = "next"
            nextbutton.onclick = (ev) => {
              ev.preventDefault()
              ev.stopPropagation()
              document.querySelector("body")?.removeChild(dialog)
              i.getNext()?.element?.click()
            }

            movebuttons.appendChild(prevbutton)
            movebuttons.appendChild(nextbutton)

            dialog.appendChild(movebuttons)

            let playbutton = document.createElement("button")
            playbutton.type = "button"
            playbutton.innerText = "play"
            playbutton.onclick = (ev) => {
              playSound(ev, i)
            }

            dialog.appendChild(playbutton)

          }
        }
      }

    }
    return true
  }
})

let lrc = new Lyrics()
let curLine: Line | undefined;
let curSyl: Syllable | undefined;
let dragging = false;

stopButton.onclick = (ev) => {
  playah?.pause()
  playah && (playah.src = playah.src)
  curSyl?.element?.classList.remove("current")
  curLine = lrc.head
  curSyl = curLine.head
}

pause.onclick = () => {
  playah?.pause()
}

window.onkeydown = (ev) => {
  const time = playah?.currentTime ?? 0;

  if (ev.key == "Escape")
    dialog.open = false;

  if (!isPlaying) {
    return
  }
  if (ev.key == " ") {
    ev.preventDefault()
    ev.stopPropagation()

    console.log(curSyl?.next?.start, curSyl?.next?.start?.getStamp(), time)

    if ((curSyl?.prev?.start && curSyl.prev.start.getStamp() > time) || (curSyl?.next?.start && curSyl.next.start.getStamp() > time)) {
      return
    }

    let delay = 100

    curSyl && (curSyl.start = new Timing(Math.max(time - delay / 1000, 0)))

    curSyl && curSyl.getPrev() && ((curSyl.getPrev() as Syllable).end = new Timing(Math.max(time - delay / 1000, 0)))

    curSyl?.element?.classList.add("past")
    curSyl?.element?.classList.remove("current")

    curSyl = curSyl?.next;


    if (curSyl == undefined) {
      curLine = curLine?.next
      curSyl = curLine?.head
      window.scrollBy(0, 30)
    }
    curSyl?.element?.classList.add("current")

    console.log(curSyl, curSyl?.getNext())

  }
  else if (ev.key == "Enter") {
    ev.preventDefault()
    ev.stopPropagation()

    if (curSyl?.prev) {
      curSyl.prev.end = new Timing(time)
    }
    else if (curLine?.prev?.tail) {
      curLine.prev.tail.end = new Timing(time)
    }

  }
  else if (ev.key == "Backspace" && curSyl) {
    ev.preventDefault();
    ev.stopPropagation();

    if (curSyl.prev == undefined && curLine?.prev?.tail == undefined) return

    (curSyl.prev || curLine?.prev?.tail) && curSyl.element?.classList.remove("current")

    curSyl.start = undefined;
    curSyl.end = undefined

    if (curSyl.prev == undefined) {
      curLine = curLine?.prev
      if (curLine == undefined) {
        return
      }
      window.scrollBy(0, -30)
      curSyl = curLine.tail
    }
    else {
      curSyl = curSyl.prev
    }

    
    curSyl.element?.classList.remove("past")
    curSyl.element?.classList.add("current")
    
    if(curSyl.getPrev() && (curSyl.start?.getStamp() == curSyl.getPrev()?.end?.getStamp())) {
      (curSyl.getPrev() as Syllable).end = undefined
    }

    curSyl.end = undefined
    curSyl.start = undefined

    playah && (playah.currentTime = Math.max((((curSyl.prev?.start?.getStamp() ?? curLine?.prev?.tail.start?.getStamp()) ?? 0) - 1), playah.currentTime - 4))

  }
}

speedUp.onclick = () => {
  playah && (playah.playbackRate += 0.1)
  speed.innerText = playah?.playbackRate.toFixed(1) || ""
}

speedDown.onclick = () => {
  playah && (playah.playbackRate -= 0.1)
  speed.innerText = playah?.playbackRate.toFixed(1) || ""
}

lyricsButton.onclick = (ev) => {
  dialog.open = !dialog.open
  lyricsInput.value = lyricsProxy.lyrics
}

playButton.onclick = async (ev) => {

  ev.preventDefault()

  if (fileInput.files?.length) {
    if (playah == undefined) {

      let reader = new FileReader()
      reader.onload = ev => {
        playah = new Audio(ev.target?.result as string)
        playah.preload = "metadata"
        playah.onplaying = () => {
          const mins = Math.floor((playah?.duration || 0) / 60)
          const secs = ((playah?.duration || 0) % 60).toLocaleString('nl-NL', {
            minimumIntegerDigits: 2,
            useGrouping: false,
            maximumFractionDigits: 0
          })
          timeInput.max = playah?.duration.toString() || ""
          maxTime.innerText = `${mins}:${secs}`
        }

        playah.play()

        playah.ontimeupdate = () => {
          const mins = Math.floor((playah?.currentTime || 0) / 60)
          const secs = ((playah?.currentTime || 0) % 60).toLocaleString('nl-NL', {
            minimumIntegerDigits: 2,
            useGrouping: false,
            maximumFractionDigits: 0
          })
          curTime.innerText = `${mins}:${secs}`
          !dragging && (timeInput.value = playah?.currentTime.toString() || timeInput.value)

        }

        setInterval(() => {
          let next = curSyl?.getNext()
          if (curSyl && next?.start && playah?.currentTime && next.start.getStamp() < playah.currentTime) {
            curSyl.element?.classList.remove("current")
            curSyl = curSyl.getNext()
            curSyl?.element?.classList.add("current")
          }
        }, 10)


      }
      reader.readAsDataURL(fileInput.files?.[0] ?? new Blob())
      isPlaying = true;
    }
    else {
      playah.play()
    }


  } else {
    alert("You must select an audio file")
  }
}

const getDisplayHTML = (lyricsRaw: string): string => {

  let result = lyricsRaw
  lrc.head = new Line()
  let currLine = lrc.head;
  lrc.tail = currLine;
  const lines = result.split("\n").filter(el => el.length > 0 && el != " ").flatMap((el, index, arr) => {

    el = el.trim();

    let sublines: string[] = [];
    const words = el.split(" ");
   
    let sublinelength = el.split("/").join("").length/Math.ceil(el.split("/").join("").length/30)

    let curline = ""

    console.log(sublinelength)

    for(let word of words) {
      console.log(word)
      if(curline.split("/").join("").length + word.split("/").join("").length <= sublinelength+5) {
        curline += word + " "
      } else {
        sublines.push(curline)
        curline = word + " "
      }
    }

    sublines.push(curline)
    
    let res: string[] = []

    sublines.forEach((el, idx) => {
      const syllables = el.trim().split(" ").map(el => el + " ").map(el => el.split("/")).flat()
  
      currLine.head = new Syllable(currLine);
      let currSyllable = currLine.head;
      currLine.tail = currSyllable
      for (let i in syllables) {
        currSyllable.text = syllables[i];
        if (syllables.length > +i + 1) {
          currSyllable.next = new Syllable(currLine)
          currSyllable.next.prev = currSyllable;
          currSyllable = currSyllable.next
          currLine.tail = currSyllable
        }
      }

      if(idx + 1 < sublines.length) {
        console.log(idx, sublines.length)
        currLine.next = new Line()
        currLine.next.prev = currLine
        currLine = currLine.next
        lrc.tail = currLine
      }
  
  
      res.push(syllables.reduce((prev, cur) => `${prev}<div class="syllable">${cur}</div>`, ""))
    })

    if (arr.length > index + 1) {
      currLine.next = new Line()
      currLine.next.prev = currLine
      currLine = currLine.next
      lrc.tail = currLine
    }

    return res
    
  })

  curLine = lrc.head
  curSyl = curLine.head

  result = lines.reduce((prev, cur) => `${prev}<div class="line">${cur}</div>`, "")

  return result
}

saveLyrics.onclick = (ev) => {
  lyricsProxy.lyrics = lyricsInput.value
  dialog.close()
}

lyricsInput.placeholder = lyricsProxy.lyrics
lyricsInput.onkeydown = (ev) => {
  ev.stopPropagation()
}

copyButton.onclick = () => navigator.clipboard.writeText(lrc.getLRC())

timeInput.onchange = () => {
  dragging = false
  playah && (playah.currentTime = +timeInput.value)
}

timeInput.oninput = (ev) => {
  dragging = true
};

