import { Line, Lyrics, Syllable, Timing } from "./types"

const fileInput = <HTMLInputElement>document.getElementById("audio")
const playButton = <HTMLButtonElement>document.getElementById("play-button")
const copyButton = <HTMLButtonElement>document.getElementById("getlrc-button")
const lyricsButton = <HTMLButtonElement>document.getElementById("enter-lyrics")
const dialog = <HTMLDialogElement>document.getElementById("lyrics-dialog")
const saveLyrics = <HTMLButtonElement>document.getElementById("save-lyrics")
const speedUp = <HTMLButtonElement>document.getElementById("speedup")
const speedDown = <HTMLButtonElement>document.getElementById("speeddown")
const speed = <HTMLButtonElement>document.getElementById("speed")
const pause = <HTMLButtonElement>document.getElementById("pause")
const stopButton = <HTMLButtonElement>document.getElementById("stop")
const timeInput = <HTMLInputElement>document.getElementById("seek")
const curTime = <HTMLParagraphElement>document.getElementById("curTime")
const maxTime = <HTMLParagraphElement>document.getElementById("maxTime")

let playah: HTMLAudioElement | undefined;
let isPlaying = false;
let lyricsDOM: HTMLDivElement[] = [];
let counter = 0;
let lineEnds: number[] = [0]
let lyricsProxy = new Proxy({lyrics: ""}, {
  set: (target, key: string, value) => {
    if(key == "lyrics") {
      target[key] = value
      
      lyricsDisplay.innerHTML = getDisplayHTML(value)

      lyricsDOM = Array.from(<HTMLCollectionOf<HTMLDivElement>>document.getElementsByClassName("line"))
      lyricsDOM.forEach(line => {
        lineEnds.push((lineEnds[lineEnds.length-1] ?? 0) + line.children.length)
      })

      lyricsDOM = lyricsDOM.map(el => {
        return Array.from(<HTMLCollectionOf<HTMLDivElement>>el.children)
      }).flat()

      lyricsDOM[0].classList.add("current")


      let counter = 0;
      for(let i of lrc) {
        i.element = lyricsDOM[counter++]
      }

    }
    return true
  }
})

const lyricsInput = <HTMLTextAreaElement>document.getElementById("lyrics")

const lyricsDisplay = <HTMLDivElement>document.getElementById("lyrics-display")

let lrc = new Lyrics()
let curLine: Line | undefined;
let curSyl: Syllable | undefined;
let dragging = false;

stopButton.onclick = (ev) => {
  playah?.pause()
  playah && (playah.src = playah.src)
}

pause.onclick = () => {
  playah?.pause()
}

window.onkeydown = (ev) => {
  const time = playah?.currentTime ?? 0;

  const mins = Math.floor((time)/60)
  const secs = ((time)%60).toFixed(2)
  if(!isPlaying) {
    return
  }
  if(ev.key == " ") {
    ev.preventDefault()
    ev.stopPropagation()

    curSyl && (curSyl.start = new Timing(time))

    curSyl?.element?.classList.add("past")
    curSyl?.element?.classList.remove("current")

    curSyl = curSyl?.next;

    
    if(curSyl == undefined) {
      curLine = curLine?.next
      curSyl = curLine?.head
      window.scrollBy(0, 30)
    }
    curSyl?.element?.classList.add("current")

    // lyricsDOM[counter]?.classList.add("past")
    // lyricsDOM[counter]?.classList.remove("current")
    // lyricsDOM[++counter]?.classList.add("current")


  }
  else if(ev.key == "Enter") {
    ev.preventDefault()
    ev.stopPropagation()

    curSyl && (curSyl.end = new Timing(time))

    // if(lrc[lrc.length-1] != ">") lrc += `<${mins}:${secs}>`
  }
  else if(ev.key == "Backspace") {
    ev.preventDefault()
    ev.stopPropagation()

    curSyl?.element?.classList.remove("current")

    if(curSyl?.prev == undefined) {
      curLine = curLine?.prev
      if(curLine == undefined) {
        return
      }

      curSyl = curLine.tail
    }
    else {
      curSyl = curSyl.prev
    }

    curSyl.element?.classList.remove("past")
    curSyl.element?.classList.add("current")

    playah && (playah.currentTime = curSyl.prev?.start?.stamp || curLine?.prev?.tail.start?.stamp || 0)

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

  if(fileInput.files?.length) {
    if(playah == undefined) {

      let reader = new FileReader()
      reader.onload = ev => {
        playah = new Audio(ev.target?.result as string)
        playah.preload = "metadata"
        playah.play()

        setTimeout(() => {
          const mins = Math.floor((playah?.duration || 0)/60)
          const secs = ((playah?.duration || 0)%60).toFixed(0)
          timeInput.max = playah?.duration.toString() || ""
          maxTime.innerText = `${mins}:${secs}`
        }, 200)

        
        playah.ontimeupdate = () => {
          const mins = Math.floor((playah?.currentTime || 0)/60)
          const secs = ((playah?.currentTime || 0)%60).toFixed(0)
          curTime.innerText = `${mins}:${secs}`
          !dragging && (timeInput.value = playah?.currentTime.toString() || timeInput.value)
        }
        
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
  const lines = result.split("\n").filter(el => el.length > 0 && el != " ").map((el, index, arr) => {
    const syllables = el.trim().split(" ").map(el => el + " " ).map(el => el.split("/")).flat()

    currLine.head = new Syllable();
    let currSyllable = currLine.head;
    currLine.tail = currSyllable
    for(let i in syllables) {
      currSyllable.text = syllables[i];
      if(syllables.length > +i+1) {
        currSyllable.next = new Syllable()
        currSyllable.next.prev = currSyllable;
        currSyllable = currSyllable.next
        currLine.tail = currSyllable
      }
    }

    if(arr.length > index+1) {
      currLine.next = new Line()
      currLine.next.prev = currLine
      currLine = currLine.next
      lrc.tail = currLine
    }

    return syllables.reduce((prev, cur) => `${prev}<div class="syllable">${cur}</div>`, "")
  })

  curLine = lrc.head
  curSyl = curLine.head

  result = lines.reduce((prev, cur) => `${prev}<div class="line">${cur}</div>`, "")

  for(let i of lrc) {
    console.log(i)
  }

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
