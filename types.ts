export class Lyrics {
  constructor() {}

  head!: Line;
  tail!: Line;

  *iterator() {
    let currLine: Line | undefined = this.head;

    while(currLine != undefined) {
      let currSyllable: Syllable | undefined = currLine.head;

      while(currSyllable != undefined) {
        yield currSyllable;
        currSyllable = currSyllable.next;
      }

      currLine = currLine.next
    }
  }

  [Symbol.iterator]() {
    return this.iterator()
  }
  
  getLRC = (): string => {
    
    let current: Line | undefined = this.head;

    let res = "";

    while(current != undefined) {
      res += current.getLRC() + "\n"
      current = current.next
    }

    return res
  }

  toString = () => {
    let res = "["
    let cur: Line | undefined = this.head;
    while(cur != undefined) {
      res += `${cur.toString()} =>`
      cur = cur.next
    }
    res += "]"
    return res
  }
}


export class Line {
  head!: Syllable;
  tail!: Syllable;
  prev?: Line;
  next?: Line;

  getLRC = (): string => {

    let current: Syllable | undefined = this.head;

    let res = (current.start && `[${current.start.getFormatted()}]`) || "";

    while(current != undefined) {

      res += current.getLRC()

      current = current.next
    }

    return res

  }

  toString = (): string => {
    let res = "["
    let cur: Syllable | undefined = this.head;
    while(cur != undefined) {
      res += `${cur.toString()} =>`
      cur = cur.next
    }
    res += "]"
    return res
  }
}

export class Syllable {
  text: string = ""
  start?: Timing
  end?: Timing
  next?: Syllable
  prev?: Syllable
  element?: HTMLDivElement

  getLRC = (): string => {
    return ((this.start && `<${this.start.getFormatted()}>`) || "") + `${this.text}` + ((this.end && `<${this.end.getFormatted()}>`) || "")
  }

  toString = (): string => {
    return `start: ${this.start}, text: ${this.text}, end: ${this.end}`
  }
}

export class Timing {
  constructor(public stamp: number){}

  getFormatted = (): string => {
    const mins = Math.floor((+this.stamp)/60)
    const secs = ((+this.stamp)%60).toFixed(2)
    return `${mins}:${secs}`
  }
}
