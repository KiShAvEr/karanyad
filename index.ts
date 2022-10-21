const fileInput = <HTMLInputElement>document.getElementById("audio")
let playah: HTMLAudioElement | undefined;
const playButton = <HTMLButtonElement>document.getElementById("play-button")
const copyButton = <HTMLButtonElement>document.getElementById("getlrc-button")

const lyricsButton = <HTMLButtonElement>document.getElementById("enter-lyrics")
const dialog = <HTMLDialogElement>document.getElementById("lyrics-dialog")
const saveLyrics = <HTMLButtonElement>document.getElementById("save-lyrics")

let isPlaying = false;
let fasz: HTMLDivElement[] = [];
let counter = 0;
let lineEnds: number[] = [0]
let lyricsProxy = new Proxy({lyrics: ""}, {
  set: (target, key: string, value) => {
    if(key == "lyrics") {
      target[key] = value
      
      lyricsDisplay.innerHTML = getDisplayHTML(value)

      fasz = Array.from(<HTMLCollectionOf<HTMLDivElement>>document.getElementsByClassName("line"))
      fasz.forEach(line => {
        lineEnds.push((lineEnds[lineEnds.length-1] ?? 0) + line.children.length)
      })

      fasz = fasz.map(el => {
        return Array.from(<HTMLCollectionOf<HTMLDivElement>>el.children)
      }).flat()

      fasz[0].classList.add("current")

      counter = 0;
    }
    return true
  }
})

const lyricsInput = <HTMLTextAreaElement>document.getElementById("lyrics")

const lyricsDisplay = <HTMLDivElement>document.getElementById("lyrics-display")

let lrc = ""

window.onkeydown = (ev) => {
  const time = playah?.currentTime ?? "0";

  const mins = Math.round((+time)/60)
  const secs = ((+time)%60).toFixed(2)
  if(ev.key == " " && isPlaying) {
    ev.preventDefault()
    ev.stopPropagation()

    console.log(`${mins}:${secs}`)

    if(lineEnds.includes(counter)) {
      window.scrollBy(0, 30)
      lrc += `\n [${mins}:${secs}]`
    }

    lrc += `<${mins}:${secs}>${fasz[counter].innerText}`

    fasz[counter]?.classList.add("past")
    fasz[counter]?.classList.remove("current")
    fasz[++counter]?.classList.add("current")    


    console.log(lrc)
  }
  else if(ev.key == "Enter" && isPlaying) {
    ev.preventDefault()
    ev.stopPropagation()

    if(lrc[lrc.length-1] != ">") lrc += `<${mins}:${secs}>`
  }
}

lyricsButton.onclick = (ev) => {
  dialog.open = !dialog.open
  lyricsInput.value = lyricsProxy.lyrics
}

playButton.onclick = async (ev) => {  

  ev.preventDefault()

  if(fileInput.files?.length) {
    let reader = new FileReader()
    reader.onload = ev => {
      playah = new Audio(ev.target?.result as string)
      playah.play()
    }
    reader.readAsDataURL(fileInput.files?.[0] ?? new Blob())
    isPlaying = true;
  } else {
    alert("You must select an audio file")
  }
}

const getDisplayHTML = (lyricsRaw: string): string => {

  let result = lyricsRaw  
  const lines = result.split("\n").filter(el => el.length > 0 && el != " ").map(el => {
    const syllables = el.trim().split(" ").map(el => el + " " ).map(el => el.split("/")).flat()

    return syllables.reduce((prev, cur) => `${prev}<div class="syllable">${cur}</div>`, "")
  })

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

copyButton.onclick = () => navigator.clipboard.writeText(lrc)