const fileInput = <HTMLInputElement>document.getElementById("audio")
let playah: HTMLAudioElement | undefined;


const playButton = <HTMLButtonElement>document.getElementById("play-button")

const body = <HTMLBodyElement>document.getElementsByTagName("body")[0];

body.onkeydown = (ev) => {
  if(ev.key == " ") {
    ev.preventDefault()
    ev.stopPropagation()
    const time = playah?.currentTime.toFixed(4) ?? "0";

    const mins = Math.round((+time)/60)
    const secs = (+time)%60

    console.log(`${mins}:${secs}`)
  }
}

playButton.onclick = async (ev) => {  

  ev.preventDefault()

  let reader = new FileReader()
  reader.onload = ev => {
    playah = new Audio(ev.target?.result as string)
    playah.play()
  }
  reader.readAsDataURL(fileInput.files?.[0] ?? new Blob())
}
