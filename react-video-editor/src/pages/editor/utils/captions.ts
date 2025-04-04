import { generateId } from "@designcombo/timeline";
import { ICaption } from "@designcombo/types";

interface Word {
  start: number;
  end: number;
  word: string;
}

interface Segment {
  start: number;
  end: number;
  text: string;
  words: Word[];
}

interface Input {
  segments: Segment[];
}

interface ICaptionLines {
  lines: Line[];
}

interface Line {
  text: string;
  words: Word[];
  width: number;
  start: number;
  end: number;
}

export function getCaptionLines(
  input: Input,
  fontSize: number,
  fontFamily: string,
  maxWidth: number,
  from: number,
): ICaptionLines {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  context.font = `${fontSize}px ${fontFamily}`;

  const captionLines: ICaptionLines = { lines: [] };
  input.segments.forEach((segment) => {
    // Ensure segment times are valid
    const segmentStart = Math.max(0, segment.start + from);
    const segmentEnd = Math.max(segmentStart, segment.end + from);

    let currentLine: Line = {
      text: "",
      words: [],
      width: 0,
      start: segmentStart,
      end: segmentEnd,
    };

    segment.words.forEach((wordObj, index) => {
      const wordWidth = context.measureText(wordObj.word).width;

      // Check if adding this word exceeds the max width
      if (currentLine.width + wordWidth > maxWidth) {
        // Ensure end time is always greater than start time
        currentLine.end = Math.max(currentLine.start, currentLine.end);
        captionLines.lines.push(currentLine);

        const wordStart = Math.max(0, wordObj.start + from);
        const wordEnd = Math.max(wordStart, wordObj.end + from);

        currentLine = {
          text: "",
          words: [],
          width: 0,
          start: wordStart,
          end: wordEnd,
        };
      }

      // Add the word to the current line
      currentLine.text += (currentLine.text ? " " : "") + wordObj.word;
      currentLine.words.push({
        ...wordObj,
        start: Math.max(0, wordObj.start + from),
        end: Math.max(Math.max(0, wordObj.start + from), wordObj.end + from)
      });
      currentLine.width += wordWidth;

      // Update line end time ensuring it's always greater than start time
      currentLine.end = Math.max(currentLine.start, wordObj.end + from);

      // Push the last line when the iteration ends
      if (index === segment.words.length - 1) {
        captionLines.lines.push(currentLine);
      }
    });
  });

  // Final validation of all lines
  captionLines.lines = captionLines.lines.filter(line => line.end > line.start);

  return captionLines;
}

export const getCaptions = (
  captionLines: ICaptionLines,
): Partial<ICaption>[] => {
  const captions = captionLines.lines.map((line) => {
    return {
      id: generateId(),
      type: "caption",
      name: "Caption",
      display: {
        from: line.start,
        to: line.end,
      },
      metadata: {},
      details: {
        top: 400,
        text: line.text,
        fontSize: 64,
        width: 800,
        fontFamily: "Bangers",
        fontUrl: "https://fonts.gstatic.com/s/bangers/v13/FeVQS0BTqb0h60ACL5la2bxii28.ttf",
        color: "#fff",
        textAlign: "center",
        words: line.words,
      },
    };
  });
  return captions as unknown as Partial<ICaption>[];
};
